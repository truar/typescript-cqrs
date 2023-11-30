import { ShoppingCart, ShoppingCartId } from '../domain/shopping-cart'
import { v4 as uuid } from 'uuid'
import { ShoppingCartRepository } from '../domain/shopping-cart.repository'

interface CreateShoppingCartCommand {
  requesterId: string
}

interface AddShoppingCartItemCommand {
  shoppingCartId: ShoppingCartId
  requesterId: string
  productId: string
  quantity: number
}

export class ShoppingCartService {
  constructor(
    private readonly shoppingCartRepository: ShoppingCartRepository
  ) {}

  async create(command: CreateShoppingCartCommand): Promise<ShoppingCartId> {
    const shoppingCartId = uuid()
    const creationDate = new Date()

    const shoppingCart = ShoppingCart.create(
      shoppingCartId,
      creationDate,
      command.requesterId
    )

    await this.shoppingCartRepository.save(shoppingCart)

    return shoppingCartId
  }

  async addItem(command: AddShoppingCartItemCommand): Promise<void> {
    const shoppingCart = await this.shoppingCartRepository.findById(
      command.shoppingCartId
    )

    if (!shoppingCart) {
      throw new Error('Shopping cart not found')
    }

    const addedOn = new Date()

    shoppingCart.addItem(
      command.requesterId,
      command.productId,
      command.quantity,
      addedOn
    )

    await this.shoppingCartRepository.save(shoppingCart)
  }

  async getById(shoppingCartId: ShoppingCartId) {
    return this.shoppingCartRepository.findById(shoppingCartId)
  }
}
