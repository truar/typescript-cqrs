import { Module } from '@nestjs/common'
import { ShoppingCartService } from './application/shopping-cart.service'
import { ShoppingCartRepository } from './domain/shopping-cart.repository'
import { DynamoDbShoppingCartRepository } from './infrastructure/dynamo-db-shopping-cart.repository'
import { ShoppingCartController } from './controller/shopping-cart.controller'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

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
      useClass: DynamoDbShoppingCartRepository,
    },
    {
      provide: DynamoDBDocumentClient,
      useFactory: (configService: ConfigService) => {
        const client = new DynamoDBClient({
          apiVersion: '2012-08-10',
          region: configService.getOrThrow('AWS_REGION'),
        })
        return DynamoDBDocumentClient.from(client)
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
