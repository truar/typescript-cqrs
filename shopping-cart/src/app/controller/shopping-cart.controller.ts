import { Body, Controller, Param, Post } from '@nestjs/common'
import { ShoppingCartId } from '../domain/shopping-cart'
import { ShoppingCartService } from '../application/shopping-cart.service'

interface CreateShoppingCartRequest {
  requesterId: string // could be retrieved from request header for instance
}

interface AddItemToShoppingCartRequest {
  requesterId: string
  productId: string
  quantity: number
}

@Controller({ path: 'shopping-cart' })
export class ShoppingCartController {
  constructor(private readonly shoppingCartService: ShoppingCartService) {}

  @Post()
  async createShoppingCart(
    @Body() payload: CreateShoppingCartRequest
  ): Promise<{ shoppingCartId: ShoppingCartId }> {
    const shoppingCartId = await this.shoppingCartService.create({
      requesterId: payload.requesterId,
    })
    return { shoppingCartId }
  }

  @Post('/:shoppingCartId/add-item')
  async addItemToShoppingCart(
    @Param('shoppingCartId') shoppingCartId: ShoppingCartId,
    @Body() payload: AddItemToShoppingCartRequest
  ): Promise<void> {
    await this.shoppingCartService.addItem({
      shoppingCartId,
      requesterId: payload.requesterId,
      productId: payload.productId,
      quantity: payload.quantity,
    })
  }
}
