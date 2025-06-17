# Terraform template for Vibe-Based Product Recommender (Hackathon)

provider "aws" {
  region = "us-east-1"
}

##############################
# 1. S3 Bucket for Image Upload
##############################
resource "aws_s3_bucket" "upload_bucket" {
  bucket = "vibe-recommender-upload"
  force_destroy = true

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

##############################
# 2. IAM Role for ECS Task
##############################
data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task_role" {
  name               = "vibe-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "bedrock_access" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "opensearch_access" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonOpenSearchServiceFullAccess"
}

##############################
# 3. OpenSearch Domain
##############################
resource "aws_opensearch_domain" "vibe_search" {
  domain_name    = "vibe-products"
  engine_version = "OpenSearch_2.11"

  cluster_config {
    instance_type  = "t3.small.search"
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 10
  }

  node_to_node_encryption {
    enabled = true
  }

  encrypt_at_rest {
    enabled = true
  }

  advanced_security_options {
    enabled                        = false
    internal_user_database_enabled = false
  }
}

##############################
# 4. ECS Cluster (No Fargate yet)
##############################
resource "aws_ecs_cluster" "vibe_cluster" {
  name = "vibe-cluster"
}

# NOTE: For a complete ECS Fargate setup, you'd also need:
# - aws_ecs_task_definition
# - aws_ecs_service
# - aws_lb / aws_lb_target_group (if using load balancer)
# - VPC, subnets, security groups
# These can be added based on how you deploy your FastAPI app.
