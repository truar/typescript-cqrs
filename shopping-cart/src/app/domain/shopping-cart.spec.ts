import { ShoppingCart } from './shopping-cart'
import { v4 as uuid } from 'uuid'

describe('Shopping cart', () => {
  test('create a ShoppingCart', async () => {
    const id: string = uuid()
    const creationDate = new Date()
    const userId: string = uuid()

    const shoppingCart = ShoppingCart.create(id, creationDate, userId)
    const event = shoppingCart.pendingEvent

    expect(event).toEqual({
      shoppingCartId: id,
      timestamp: creationDate,
      ownerId: userId,
      type: 'ShoppingCartCreated',
    })
  })

  test('add item to a Shopping Cart', async () => {
    const id = uuid()
    const creationDate = new Date()
    const ownerId = uuid()
    const shoppingCart = ShoppingCart.hydrate({
      events: [
        {
          shoppingCartId: id,
          timestamp: creationDate,
          ownerId,
          type: 'ShoppingCartCreated',
        },
      ],
    })

    const addedOn = new Date()
    const productId = uuid()
    const quantity = 1
    shoppingCart.addItem(ownerId, productId, quantity, addedOn)
    const event = shoppingCart.pendingEvent

    expect(event).toEqual({
      shoppingCartId: id,
      timestamp: addedOn,
      productId,
      quantity,
      type: 'ShoppingCartItemAdded',
    })
  })

  test('only owner can add an item to the shoppingCart', async () => {
    const id = uuid()
    const creationDate = new Date()
    const ownerId = uuid()
    const shoppingCart = ShoppingCart.hydrate({
      events: [
        {
          shoppingCartId: id,
          timestamp: creationDate,
          ownerId,
          type: 'ShoppingCartCreated',
        },
      ],
    })

    const addedOn = new Date()
    const productId = uuid()
    const quantity = 1
    expect(() =>
      shoppingCart.addItem(uuid(), productId, quantity, addedOn)
    ).toThrow()
  })
})
