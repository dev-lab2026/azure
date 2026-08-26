# AzureRM provider configuration.
# Authentication is intentionally not hard-coded: Terraform reads ARM_* variables
# populated by GitHub Actions / Azure CLI.

provider "azurerm" {
  features {}
}
