terraform {
  backend "azurerm" {
    resource_group_name  = "reactcicd-prod-rg"
    storage_account_name = "reactcicdtfstate"
    container_name       = "tfstate"
    key                  = "interflow.tfstate"
  }
}
