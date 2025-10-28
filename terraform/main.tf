# Указывает Google Cloud в качестве провайдера
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Настройки провайдера
provider "google" {
  project = var.project_id
  region  = var.region
}

# -----------------
# 1. Cloud SQL (PostgreSQL)
# -----------------

resource "google_sql_database_instance" "sql_instance" {
  database_version = "POSTGRES_14"
  project          = var.project_id
  region           = var.region
  name             = "mysemey-sql"
  settings {
    tier = "db-f1-micro" # Самый маленький доступный для теста
  }
  deletion_protection  = false
}

resource "google_sql_database" "database" {
  name     = var.db_name
  instance = google_sql_database_instance.sql_instance.name
  project  = var.project_id
}

resource "google_sql_user" "user" {
  name     = var.db_user
  instance = google_sql_database_instance.sql_instance.name
  password = var.db_password
  project  = var.project_id
}

# -----------------
# 2. VPC Access Connector (для Cloud Run)
# -----------------

resource "google_vpc_access_connector" "vpc_connector" {
  name          = "mysemey-vpc-connector"
  region        = var.region
  network       = "default"
  ipcidr_range  = "10.8.0.0/28" # Внутренний диапазон IP для коннектора
  project       = var.project_id
}

# -----------------
# 3. Memorystore (Redis)
# -----------------

resource "google_redis_instance" "redis_cache" {
  name            = "mysemey-redis"
  tier            = "BASIC"
  memory_size_gb  = 1
  location_id     = "europe-west1-a" # Зона в регионе (убедитесь, что это ваш регион!)
  project         = var.project_id
  authorized_network = "default"
}

# -----------------
# OUTPUTS (Обязательно для Cloud Run)
# -----------------

output "sql_connection_name" {
  value = google_sql_database_instance.sql_instance.connection_name
  description = "Connection name for Cloud SQL (used by Cloud Run /cloudsql/)"
}

output "redis_host" {
  value = google_redis_instance.redis_cache.host
  description = "Internal IP address for the Redis instance (used by Cloud Run via VPC Connector)"
}