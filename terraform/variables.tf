variable "project_name" {
  description = "Short project name used in Azure resource names."
  type        = string
  default     = "reactcicd"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Azure region."
  type        = string
  default     = "West Europe"
}

variable "resource_group_name" {
  description = "Azure Resource Group name."
  type        = string
  default     = ""
}

variable "vnet_address_space" {
  description = "VNet CIDR."
  type        = list(string)
  default     = ["10.20.0.0/16"]
}

variable "subnet_address_prefixes" {
  description = "Application subnet CIDR."
  type        = list(string)
  default     = ["10.20.1.0/24"]
}

variable "vm_size" {
  description = "Azure VM SKU."
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "Linux administrator username."
  type        = string
  default     = "azureadmin"
}

variable "ssh_public_key" {
  description = "OpenSSH public key installed on the VM."
  type        = string
  sensitive   = true
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to reach SSH. Prefer a corporate/VPN IP instead of 0.0.0.0/0."
  type        = string
  default     = "0.0.0.0/0"
}

variable "tags" {
  description = "Common Azure resource tags."
  type        = map(string)
  default = {
    managed_by = "terraform"
    workload   = "react-cicd"
  }
}
