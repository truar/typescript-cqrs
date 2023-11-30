import { ShoppingCart, ShoppingCartId } from './shopping-cart'

export interface ShoppingCartRepository {
  save(shoppingCart: ShoppingCart): Promise<void>
  findById(shoppingCartId: ShoppingCartId): Promise<ShoppingCart | undefined>
}

export const ShoppingCartRepository = Symbol('ShoppingCartRepository')
