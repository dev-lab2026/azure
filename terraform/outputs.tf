output "resource_group_name" {
  description = "Resource group name."
  value       = azurerm_resource_group.this.name
}

output "vm_public_ip" {
  description = "Public IP address used by Ansible and HTTP."
  value       = azurerm_public_ip.vm.ip_address
}

output "vm_private_ip" {
  description = "Private IP address of the VM."
  value       = azurerm_network_interface.vm.private_ip_address
}

output "application_url" {
  description = "HTTP URL of the React application."
  value       = "http://${azurerm_public_ip.vm.ip_address}"
}

output "vm_name" {
  description = "Azure VM name."
  value       = azurerm_linux_virtual_machine.this.name
}
