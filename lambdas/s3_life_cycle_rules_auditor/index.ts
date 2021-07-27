import {S3, SNS} from 'aws-sdk';

const s3Client = new S3();
const snsClient = new SNS();

export const handler = function(event: any) {

    const bucketName: string = event.Records[0].s3.bucket.name;
    const key: string = event.Records[0].s3.object.key;

    const lifeCycleRulesPromise = s3Client.getBucketLifecycleConfiguration({
        Bucket: bucketName
    }).promise();

    var found = false;

    lifeCycleRulesPromise.then(
        function(lifeCycleRulesResponse) {
            lifeCycleRulesResponse.Rules?.map(rule => {
                console.debug(`testing if ${key} matches lifecycle rule for ${rule.Prefix}`);
                if (key.match(`^${rule.Prefix}`)) {
                    console.info(`${key} matches lifecycle rule for ${rule.Prefix}`);
                    found = true;
                    return;
                }
            })
        }
    ).catch(
        function(err) {
            console.error(err, err.stack);
        }
    );

    if (!found) {
        console.info(`no lifecycle rule match for ${key}`);
        snsClient.publish({
            Subject: "Lifecycle rules needs configuring for ${bucketName}",
            Message: "Lifecycle rules needs configuring for ${bucketName}: upload for object ${key} did not match any lifecycle rules.",
            TopicArn: process.env.topic_arn
        })
    }

};