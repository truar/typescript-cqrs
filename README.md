# typescript-cqrs

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build typescript-cqrs` to build the library.

## Running unit tests

Run `nx test typescript-cqrs` to execute the unit tests via [Jest](https://jestjs.io).


## Dependencies to install
```shell
yarn add uuid @types/uuid @nestjs/config
yarn add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
yarn add @types/aws-lambda @aws-sdk/client-sns
```

# TODO
* Add unique eventId when creating Domain event (no need it seems)
* Add read-model that reads event from SNS topic


# Resources
* https://github.com/gregoryyoung/m-r/blob/master/SimpleCQRS/Domain.csa
* https://www.youtube.com/watch?v=5pc7abhle_Q
* https://github.com/xolvio/typescript-event-sourcing/tree/master
* https://docs.nestjs.com/recipes/cqrs

# Scenario

## Chapter 1 - Quick Domain discovery and setup live coding (15')
* 
* Ask for the domain to implement
* Create the repository
```shell
npx create-nx-workspace@latest <name> --appName=<name>
  --preset=nest \
  --docker=false \
  --e2eTestRunner=none \
  --framework=nest \
  --nxCloud=false \
  --packageManager=pnpm \
  --workspaceType=integrated \
  --interactive=false
```
* In the meantime, brainstorm with the eventStorming to get some events
* Open project
  * Add missing dependencies
```shell
pnpm add add uuid @types/uuid @nestjs/config @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

## Chapter 2 - Implementing domain (30')

* Move generated code in adequate folder
* Add `strict:true` to tsconfig.base.json
* domain & application

## Chapter 3 - Setting up and Implementing infrastructure (25')
* Log in to AWS by exporting variable (okta > AWS > Sandbox > Admin > Command line or programmatic access)
* Create template.yaml file at the root of the folder
* Only create dynamoDB table with stream enabled for now (we will create lambda and SNS topic later)
* Deploy using SAM CLI and guided Mode (easier)
```shell
sam deploy --guided
```
* ... Takes a while
* Go back to code
  * infra & controller
* Execute request with POSTMan to see it working
* Query dynamoDB table to see the event added to the database
```shell
aws dynamodb scan --region eu-west-3 --table-name test-tibo-20231125-3-dynamo-table
```

## Chapter 4 - EDA and Eventual consistency (25')
* Generate new simple ts app that contains lambda code to listen to stream event
```shell
nx g @nx/node:application lambda-stream-to-sns \
  --interactive=false \
  --e2eTestRunner=none \
  --bundler=esbuild \
  --framework=none
```
* Copy code from templates, and explain it (generic code to push all stream dynamo to SNS topic, no intelligence here)
* Add missing dependencies (lambda types to ts and sns client)
```shell
pnpm add @types/aws-lambda @aws-sdk/client-sns
```
* build lambda
```shell
nx build lambda-stream-to-sns
```
* Update infra SAM to add lambda, topic and queue
* Add `CAPABILITY_NAMED_IAM` to `samconfig.toml`
* Deploy new infra (explain no need to build as we are already using esbuild to build the image)
```shell
sam build
sam deploy
```

* Get event from fake queue created
```shell
while sleep 1; do aws sqs receive-message --queue-url https://sqs.eu-west-3.amazonaws.com/909133997228/test-tibo-20231125-3-fake-listener.fifo --region eu-west-3; done
```
