terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "reactcicdtfstate"
    container_name       = "tfstate"
    key                  = "clarity.tfstate"
  }
}
