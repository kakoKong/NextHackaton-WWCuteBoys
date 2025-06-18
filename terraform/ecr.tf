resource "aws_ecr_repository" "backend_repo" {
  name = "${var.app_name}-repo"
}
