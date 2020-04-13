# S3LifeCycleRulesAuditor
Lambda function for auditing S3 lifecycle rules / ensuring all objects in a given bucket have a lifecycle rule configured

# to deploy to your AWS environment

1. install the CDK

```shell
npm install -g aws-cdk
```

2. Install project dependencies

```shell
npm install
```

3. Ensure you have an AWS profile set up that points to your desired AWS account and region

4. deploy the CDK project. Be sure to include your email address you want to receive notifications on.

```shell
cdk deploy --context email_address=me@example.com --profile <PROFILE_NAME>
```
