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
  default     = "swedencentral"
}

variable "resource_group_name" {
  description = "Azure Resource Group name. Leave empty to generate automatically."
  type        = string
  default     = ""
}

variable "vm_size" {
  description = "Azure VM SKU."
  type        = string
  default     = "Standard_D2s_v5"
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
  description = "CIDR allowed to reach SSH."
  type        = string
  default     = "203.0.113.10/32"
}

variable "tags" {
  description = "Common Azure resource tags."
  type        = map(string)

  default = {
    managed_by = "terraform"
    workload   = "react-cicd"
  }
}
