import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { ShoppingCartRepository } from '../domain/shopping-cart.repository'
import {
  ShoppingCart,
  ShoppingCartDomainEvent,
  ShoppingCartId,
} from '../domain/shopping-cart'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'

type DynamoItem = Omit<ShoppingCartDomainEvent, 'timestamp'> & {
  timestamp: string
}

const toDynamoItem = (event: ShoppingCartDomainEvent): DynamoItem => ({
  ...event,
  timestamp: event.timestamp.toISOString(),
})

function toEvent(items: DynamoItem[]): ShoppingCartDomainEvent[] {
  return items.map(
    (item) =>
      ({
        ...item,
        timestamp: new Date(item.timestamp),
      } as any)
  )
}

@Injectable()
export class DynamoDbShoppingCartRepository implements ShoppingCartRepository {
  private readonly tableName: string

  constructor(
    private readonly dynamoDocumentClient: DynamoDBDocumentClient,
    configService: ConfigService
  ) {
    this.tableName = configService.getOrThrow<string>(
      'AWS_DYNAMODB_SHOPPING_CART_EVENTS_TABLE_NAME'
    )
  }

  async findById(
    shoppingCartId: ShoppingCartId
  ): Promise<ShoppingCart | undefined> {
    const queryResult = await this.dynamoDocumentClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'shoppingCartId = :shoppingCartId',
        ExpressionAttributeValues: {
          ':shoppingCartId': shoppingCartId,
        },
      })
    )
    const items = queryResult.Items as DynamoItem[]
    const events = toEvent(items)
    return ShoppingCart.load(events)
  }

  async save(shoppingCart: ShoppingCart): Promise<void> {
    const event = shoppingCart.pendingEvent
    if (!event) {
      return
    }
    const dynamoItem = toDynamoItem(event)
    await this.dynamoDocumentClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: dynamoItem,
      })
    )
  }
}
