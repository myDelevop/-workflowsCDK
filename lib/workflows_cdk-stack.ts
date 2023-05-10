import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export class WorkflowsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const myTable = new ddb.Table(this, 'MyTable', 
      {partitionKey: {
        name: "RequestId", type: ddb.AttributeType.STRING,
      }});

    const submitLambda = new lambda.Function(this, 'SubmitLambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.main',
      code: lambda.Code.fromInline('def main(event, context):\n\treturn(event)')
    });


    const getStatusLamba = new lambda.Function(this, 'StatusLambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.main',
      code: lambda.Code.fromInline('def main(event, context):\n\treturn("SUCCEEDED")')
    });

  // use the output of fn as input
  const submitJob = new tasks.LambdaInvoke(this, 'Submit Job', {
    lambdaFunction: submitLambda,
    payload: sfn.TaskInput.fromJsonPathAt('$'),
    resultPath: "$.guid",
  });

  // use the output of fn as input
  const getStatus = new tasks.LambdaInvoke(this, 'Get Job Status', {
    lambdaFunction: getStatusLamba,
    payload: sfn.TaskInput.fromJsonPathAt('$'),
    resultPath: "$.status",
  });

  const waitX = new sfn.Wait(this, 'Wait X seconds', {
    time: sfn.WaitTime.secondsPath('$.waitSeconds')
  });

  const jobFailed = new sfn.Fail(this, 'ROCL: Job Failed No worries', {
    cause: 'Job Failed from Code don\'t worry',
    error: 'From Code Fail never mind'
  });

  const finalStatus = new tasks.LambdaInvoke(this, 'Get Final Job Status', {
    lambdaFunction: getStatusLamba,
    payload: sfn.TaskInput.fromJsonPathAt('$'),
    inputPath: "$.guid",
    resultPath: "$.status.Payload",
  });

  const putItemInTable = new tasks.DynamoPutItem(this, 'Write to DDB', {
    item: {
      "RequestId": tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.guid.SdkHttpMetadata.HttpHeaders.x-amzn-RequestId')),
      "TraceID": tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.guid.SdkHttpMetadata.HttpHeaders.X-Amzn-Trace-Id')),
      "Status": tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.status.Payload'))
    },
    table: myTable,
    inputPath: '$',
    resultPath: '$.ddb',
  });

  putItemInTable.next(finalStatus);

  const definition = submitJob
    .next(waitX)
    .next(getStatus)
    .next(new sfn.Choice(this, 'Job Complete?')
      .when(sfn.Condition.stringEquals('$.status.Payload','FAILED'), jobFailed)
      .when(sfn.Condition.stringEquals('$.status.Payload','SUCCEEDED'), putItemInTable)
      .otherwise(waitX));

  new sfn.StateMachine(this, 'StateMachine', {
    definition,
    timeout: cdk.Duration.minutes(5)
  });

/*
    const submitJob = tasks.LambdaInvoke(self, "Get Job Status",
      lambda_function="ss",
      inputPath="$.guid", 
      outputPath="$.status");
    const queue = new sqs.Queue(this, 'WorkflowsCdkQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'WorkflowsCdkTopic');

    topic.addSubscription(new subs.SqsSubscription(queue));*/
  }
}
