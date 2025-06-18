variable "region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Name of the application (used for resource naming)"
  type        = string
}

variable "container_port" {
  description = "Port that the container exposes"
  type        = number
  default     = 80
}