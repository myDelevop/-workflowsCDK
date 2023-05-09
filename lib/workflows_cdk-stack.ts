import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class WorkflowsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const myTable = new ddb.Table(this, 'MyTable', 
      {partitionKey: {name: "RequestId", type: ddb.AttributeType.STRING}});

    const submitLambda = new lambda.Function(this, 'submitLambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.main',
      code: lambda.Code.fromInline('def main(event, context):\n\treturn(event)')
    });


/*const queue = new sqs.Queue(this, 'WorkflowsCdkQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'WorkflowsCdkTopic');

    topic.addSubscription(new subs.SqsSubscription(queue));*/
  }
}
