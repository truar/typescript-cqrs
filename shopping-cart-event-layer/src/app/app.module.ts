import { Module, OnModuleInit } from '@nestjs/common'
import { ShoppingCartService } from './application/shopping-cart.service'
import { ShoppingCartRepository } from './domain/shopping-cart.repository'
import { StorageHubShoppingCartRepository } from './infrastructure/storage-hub-shopping-cart-repository.service'
import { ShoppingCartController } from './controller/shopping-cart.controller'
import { ConfigModule, ConfigService } from '@nestjs/config'
import {
  StorageHubEventStoreAPIClientV2,
  StorageHubSchemaRegistryClient,
} from '@payfit/storage-hub-event-store-client'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [ShoppingCartController],
  providers: [
    {
      provide: ShoppingCartService,
      useFactory: (shoppingCartRepository: ShoppingCartRepository) => {
        return new ShoppingCartService(shoppingCartRepository)
      },
      inject: [ShoppingCartRepository],
    },
    {
      provide: ShoppingCartRepository,
      useClass: StorageHubShoppingCartRepository,
    },
    {
      provide: StorageHubEventStoreAPIClientV2,
      useFactory: (
        configService: ConfigService
      ): StorageHubEventStoreAPIClientV2 => {
        const baseUrl = configService.getOrThrow<string>(
          'STORAGE_HUB_EVENT_STORE_BASE_URL'
        )
        return new StorageHubEventStoreAPIClientV2({ baseUrl })
      },
      inject: [ConfigService],
    },
    {
      provide: StorageHubSchemaRegistryClient,
      useFactory: (
        configService: ConfigService
      ): StorageHubSchemaRegistryClient => {
        const baseUrl = configService.getOrThrow<string>(
          'STORAGE_HUB_EVENT_STORE_BASE_URL'
        )
        return new StorageHubSchemaRegistryClient({ baseUrl })
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly client: StorageHubSchemaRegistryClient,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const registerSchema = this.configService.getOrThrow<string>(
      'STORAGE_HUB_REGISTER_SCHEMAS'
    )
    if (registerSchema) {
      await this.client.registerSchemas_v2()
    }
  }
}
