import { ShoppingCartRepository } from '../domain/shopping-cart.repository'
import { Injectable } from '@nestjs/common'
import {
  ShoppingCart,
  ShoppingCartCreated,
  ShoppingCartDomainEvent,
  ShoppingCartId,
  ShoppingCartItemAdded,
} from '../domain/shopping-cart'
import {
  DomainListEnum,
  ScopeListEnum,
  StorageHubBaseEvent,
  StorageHubBasePayloadEvent,
  StorageHubEventStoreAPIClientV2,
  StorageHubSchemaRegistry,
} from '@payfit/storage-hub-event-store-client'
import { IsDefined, IsNumber, IsString } from 'class-validator'
import { JSONSchema } from 'class-validator-jsonschema'

export enum ShoppingCartEventEnum {
  SHOPPING_CART_CREATED = 'epc.shopping-cart.created',
  SHOPPING_CART_ITEM_ADDED = 'epc.shopping-cart.item.added',
}

@StorageHubSchemaRegistry({
  majorVersion: 1,
  domain: DomainListEnum.STORAGE_HUB,
  scope: ScopeListEnum.PRIVATE_STORAGE_HUB,
  schemaCustomName: 'ShoppingCartCreatedPayload',
})
@JSONSchema({ description: 'Event for a new service registered in the BFF' })
export class ShoppingCartCreatedPayload extends StorageHubBasePayloadEvent {
  @IsDefined()
  @IsString()
  shoppingCartId: string

  @IsDefined()
  timestamp: Date

  @IsDefined()
  ownerId: string

  constructor(data: ShoppingCartCreated) {
    super()
    this.shoppingCartId = data.shoppingCartId
    this.timestamp = data.timestamp
    this.ownerId = data.ownerId
  }
}

class ShoppingCartCreatedEvent extends StorageHubBaseEvent<ShoppingCartCreatedPayload> {
  constructor(subjectId: string, payload: ShoppingCartCreatedPayload) {
    super({
      eventType: ShoppingCartEventEnum.SHOPPING_CART_CREATED,
      eventDomain: DomainListEnum.STORAGE_HUB,
      eventScope: ScopeListEnum.PRIVATE_STORAGE_HUB,
      subjectId,
      subjectType: 'shopping-cart',
      payload,
    })
  }
}

@StorageHubSchemaRegistry({
  majorVersion: 1,
  domain: DomainListEnum.STORAGE_HUB,
  scope: ScopeListEnum.PRIVATE_STORAGE_HUB,
  schemaCustomName: 'ShoppingCartItemAddedPayload',
})
@JSONSchema({ description: 'Event for a new service registered in the BFF' })
export class ShoppingCartItemAddedPayload extends StorageHubBasePayloadEvent {
  @IsDefined()
  @IsString()
  shoppingCartId: string

  @IsDefined()
  timestamp: Date

  @IsDefined()
  productId: string

  @IsDefined()
  @IsNumber()
  quantity: number

  constructor(data: ShoppingCartItemAdded) {
    super()
    this.shoppingCartId = data.shoppingCartId
    this.timestamp = data.timestamp
    this.productId = data.productId
    this.quantity = data.quantity
  }
}

class ShoppingCartItemAddedEvent extends StorageHubBaseEvent<ShoppingCartItemAddedPayload> {
  constructor(subjectId: string, payload: ShoppingCartItemAddedPayload) {
    super({
      eventType: ShoppingCartEventEnum.SHOPPING_CART_ITEM_ADDED,
      eventDomain: DomainListEnum.STORAGE_HUB,
      eventScope: ScopeListEnum.PRIVATE_STORAGE_HUB,
      subjectId,
      subjectType: 'shopping-cart',
      payload,
    })
  }
}

function toDomainEvent(
  storageHubEvent: StorageHubBaseEvent<StorageHubBasePayloadEvent>
) {
  const eventType = storageHubEvent.eventType as ShoppingCartEventEnum

  let domainEvent: ShoppingCartDomainEvent
  if (eventType === ShoppingCartEventEnum.SHOPPING_CART_CREATED) {
    const payload = storageHubEvent.payload as ShoppingCartCreatedPayload
    domainEvent = {
      shoppingCartId: payload.shoppingCartId,
      timestamp: payload.timestamp,
      ownerId: payload.ownerId,
      type: 'ShoppingCartCreated',
    }
  } else {
    const payload = storageHubEvent.payload as ShoppingCartItemAddedPayload
    domainEvent = {
      shoppingCartId: payload.shoppingCartId,
      timestamp: payload.timestamp,
      productId: payload.productId,
      quantity: payload.quantity,
      type: 'ShoppingCartItemAdded',
    }
  }

  return domainEvent
}

@Injectable()
export class StorageHubShoppingCartRepository
  implements ShoppingCartRepository
{
  constructor(
    private readonly storageHubEventStoreClient: StorageHubEventStoreAPIClientV2
  ) {}

  async findById(
    shoppingCartId: ShoppingCartId
  ): Promise<ShoppingCart | undefined> {
    const storageHubEventQueryResult =
      await this.storageHubEventStoreClient.queryEvent({
        keyFilter: {
          subjectId: shoppingCartId,
        },
      })
    const events = storageHubEventQueryResult.events.map((storageHubEvent) =>
      toDomainEvent(storageHubEvent)
    )
    return ShoppingCart.load(events)
  }

  async save(shoppingCart: ShoppingCart): Promise<void> {
    const event = shoppingCart.pendingEvent
    if (!event) return Promise.resolve()

    let storageHubEvent
    if (event.type === 'ShoppingCartCreated') {
      storageHubEvent = new ShoppingCartCreatedEvent(
        event.shoppingCartId,
        new ShoppingCartCreatedPayload(event)
      )
    } else {
      storageHubEvent = new ShoppingCartItemAddedEvent(
        event.shoppingCartId,
        new ShoppingCartItemAddedPayload(event)
      )
    }
    await this.storageHubEventStoreClient.sendEvent(storageHubEvent)
  }
}
