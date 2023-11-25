import { AttributeValue, DynamoDBRecord, Handler } from 'aws-lambda'
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { v4 } from 'uuid'
const snsClient = new SNSClient()
export const handler: Handler = async (event, context, callback) => {
  event.Records.forEach((record: DynamoDBRecord) => {
    if (record.eventName == 'INSERT') {
      const newImage = record.dynamodb?.NewImage
      const event: { [key: string]: string | undefined } = {}
      for (const key in newImage) {
        const valueWithType: AttributeValue = newImage[key]
        // handle only S value
        const value = valueWithType['S']
        event[key] = value
      }
      snsClient
        .send(
          new PublishCommand({
            TopicArn: process.env.AWS_SNS_TOPIC_ARN,
            MessageGroupId: event['shoppingCartId'],
            MessageDeduplicationId: v4(),
            Message: JSON.stringify(event),
          })
        )
        .then(() => console.log('message sent'))
    }
  })
  callback(null, `Successfully processed ${event.Records.length} records.`)
}
