variable "project_id" {
  description = "ID проекта Google Cloud"
  type        = string
}

variable "region" {
  description = "Регион для развертывания ресурсов"
  default     = "europe-west1"
  type        = string
}

variable "db_name" {
  description = "Имя базы данных"
  default     = "mysemey_production"
  type        = string
}

variable "db_user" {
  description = "Имя пользователя базы данных"
  default     = "mysemey_user"
  type        = string
}

variable "db_password" {
  description = "Пароль для пользователя базы данных (ОБЯЗАТЕЛЬНО ИЗМЕНИТЬ)"
  default     = "SuperSecurePassword123"
  type        = string
  sensitive   = true
}