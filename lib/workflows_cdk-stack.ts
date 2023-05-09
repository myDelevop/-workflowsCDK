import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { DynamoDbDataSource } from 'aws-cdk-lib/aws-appsync';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class WorkflowsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const myTablr = new ddb.Table(this, 'MyTable', 
      {partitionKey: {name: "RequestId", type: ddb.AttributeType.STRING}});


/*const queue = new sqs.Queue(this, 'WorkflowsCdkQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'WorkflowsCdkTopic');

    topic.addSubscription(new subs.SqsSubscription(queue));*/
  }
}
