# Resource Group is the lifecycle boundary for the platform.

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  rg_name     = var.resource_group_name != "" ? var.resource_group_name : "${local.name_prefix}-rg"

  common_tags = merge(var.tags, {
    project     = var.project_name
    environment = var.environment
  })
}

resource "azurerm_resource_group" "this" {
  name     = local.rg_name
  location = var.location
  tags     = local.common_tags
}
