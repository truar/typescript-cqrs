provider "aws" {
  region = "eu-west-3"
}

resource "aws_dynamodb_table" "dynamo_table" {
  name             = "terraform-shopping-cart-events-table"
  billing_mode     = "PAY_PER_REQUEST"
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  hash_key         = "shoppingCartId"
  range_key        = "timestamp"

  attribute {
    name = "shoppingCartId"
    type = "S"
  }
  attribute {
    name = "timestamp"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_sns_topic" "sns_topic" {
  fifo_topic = true
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "cloud_watch_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "lambda_role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_dynamo_stream_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_dynamo_stream.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sns_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_sns.arn
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "../../dist/esbuild-shopping-cart-lambda-stream-to-sns/index.js"
  output_path = "lambda_function.zip"
}

resource "aws_lambda_function" "lambda_stream_to_sns" {
  function_name = "terraform_lambda_stream_to_sns"
  filename      = "lambda_function.zip"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  timeout       = 30
  memory_size   = 128
  runtime       = "nodejs18.x"
  architectures = ["x86_64"]
  environment {
    variables = {
      AWS_SNS_TOPIC_ARN : aws_sns_topic.sns_topic.arn
    }
  }
  depends_on = [
    aws_iam_role.lambda_role,
    aws_iam_role_policy_attachment.lambda_dynamo_stream_attachment,
    aws_iam_role_policy_attachment.lambda_logs,
    aws_iam_role_policy_attachment.lambda_sns_attachment
  ]
}

resource "aws_lambda_event_source_mapping" "lamdba_stream_to_lambda" {
  function_name     = aws_lambda_function.lambda_stream_to_sns.function_name
  batch_size        = 1
  enabled           = true
  event_source_arn  = aws_dynamodb_table.dynamo_table.stream_arn
  starting_position = "TRIM_HORIZON"
  depends_on = [
    aws_lambda_function.lambda_stream_to_sns
  ]
}

resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda_logging"
  path        = "/"
  description = "IAM policy for logging from a lambda"
  policy      = data.aws_iam_policy_document.lambda_logging.json
}

data "aws_iam_policy_document" "lambda_logging" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = ["arn:aws:logs:eu-west-3:909133997228:*"]
  }
}

resource "aws_iam_policy" "lambda_dynamo_stream" {
  name        = "lambda_dynamo"
  path        = "/"
  description = "IAM policy for dynamo stream from a lambda"
  policy      = data.aws_iam_policy_document.lambda_dynamo_stream.json
}

data "aws_iam_policy_document" "lambda_dynamo_stream" {
  statement {
    effect = "Allow"

    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams",
    ]

    resources = [aws_dynamodb_table.dynamo_table.stream_arn]
  }
}

resource "aws_iam_policy" "lambda_sns" {
  name        = "lambda_sns"
  path        = "/"
  description = "IAM policy for sns from a lambda"
  policy      = data.aws_iam_policy_document.lambda_sns.json
}

data "aws_iam_policy_document" "lambda_sns" {
  statement {
    effect = "Allow"

    actions = [
      "sns:Publish",
    ]

    resources = [aws_sns_topic.sns_topic.arn]
  }
}


