export type ShoppingCartDomainEvent =
  | ShoppingCartCreated
  | ShoppingCartItemAdded

type ShoppingCartCreated = {
  shoppingCartId: string
  timestamp: Date
  ownerId: string
  type: 'ShoppingCartCreated'
}

type ShoppingCartItemAdded = {
  shoppingCartId: string
  timestamp: Date
  productId: string
  quantity: number
  type: 'ShoppingCartItemAdded'
}

class ShoppingCartItem {
  constructor(readonly productId: string, readonly quantity: number) {}
}

class IllegalActionError extends Error {
  constructor(message: string) {
    super(message)
  }
}
export type ShoppingCartId = string
export class ShoppingCart {
  private _pendingEvent?: ShoppingCartDomainEvent = undefined
  private _id?: ShoppingCartId = undefined
  private _creationDate?: Date = undefined
  private _ownerId?: string = undefined
  private _items: ShoppingCartItem[] = []

  private constructor() {}

  static create(id: string, creationDate: Date, userId: string) {
    const shoppingCart = new ShoppingCart()
    shoppingCart._pendingEvent = {
      shoppingCartId: id,
      timestamp: creationDate!,
      ownerId: userId!,
      type: 'ShoppingCartCreated',
    }
    return shoppingCart
  }

  addItem(userId: string, productId: string, quantity: number, addedOn: Date) {
    if (userId !== this._ownerId) {
      throw new IllegalActionError(
        `User ${userId} is not the shoppingCartOwner`
      )
    }
    this._pendingEvent = {
      shoppingCartId: this._id!,
      productId,
      quantity,
      timestamp: addedOn,
      type: 'ShoppingCartItemAdded',
    }
  }

  get pendingEvent() {
    return this._pendingEvent
  }

  static load(events: ShoppingCartDomainEvent[]) {
    const shoppingCart = new ShoppingCart()
    for (const event of events) {
      switch (event.type) {
        case 'ShoppingCartCreated':
          shoppingCart.applyShoppingCartCreated(event)
          break
        case 'ShoppingCartItemAdded':
          shoppingCart.applyShoppingCartItemAdded(event)
          break
      }
    }
    return shoppingCart
  }

  private applyShoppingCartCreated(event: ShoppingCartCreated) {
    this._id = event.shoppingCartId
    this._ownerId = event.ownerId
    this._creationDate = event.timestamp
    this._items = []
  }

  private applyShoppingCartItemAdded(event: ShoppingCartItemAdded) {
    this._items.push(new ShoppingCartItem(event.productId, event.quantity))
  }
}
