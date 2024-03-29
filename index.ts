import { Bucket, StorageClass, EventType } from '@aws-cdk/aws-s3';
import { AssetCode, Function, Runtime } from '@aws-cdk/aws-lambda';
import { App, Construct, StackProps, Stack, Duration, CfnOutput } from '@aws-cdk/core';
import { LambdaDestination } from '@aws-cdk/aws-s3-notifications';
import { Topic } from '@aws-cdk/aws-sns';
import { EmailSubscription } from '@aws-cdk/aws-sns-subscriptions';
import { PolicyStatement } from '@aws-cdk/aws-iam';

export class S3LifeCycleRulesAuditorStack extends Stack {
    constructor(scope: Construct, id: string, emailAddress: string, props?: StackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, "Bucket");

        bucket.addLifecycleRule({
            enabled: true,
            prefix: '/foo',
            transitions: [
                {
                    storageClass: StorageClass.GLACIER,
                    transitionAfter: Duration.days(7),
                }
            ]
        });

        bucket.addLifecycleRule({
            enabled: true,
            prefix: '/bar',
            transitions: [
                {
                    storageClass: StorageClass.GLACIER,
                    transitionAfter: Duration.days(14)
                }
            ]
        });

        const topic = new Topic(this, 'LifeCycleAuditTopic');

        topic.addSubscription(new EmailSubscription(emailAddress));

        const lambda = new Function(this, 'LifeCycleAuditor', {
            runtime: Runtime.NODEJS_10_X,
            handler: 'index.handler',
            code: new AssetCode('lambdas/s3_life_cycle_rules_auditor'),
            environment: {
                topic_arn: topic.topicArn
            },
            initialPolicy: [
                new PolicyStatement({
                    actions: ["sns:Publish"],
                    resources: [topic.topicArn]
                }),
                new PolicyStatement({
                    actions: [
                        "s3:ListBucket",
                        "s3:GetLifecycleConfiguration"
                    ],
                    resources: [bucket.bucketArn]
                })
            ]
        });

        bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(lambda));

        new CfnOutput(this, "bucketName", {
            value: bucket.bucketName
        });

    }
}

const app = new App();
new S3LifeCycleRulesAuditorStack(app, 'S3LifeCycleRulesAuditorStack', app.node.tryGetContext('email_address'));
