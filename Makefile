# Colors
RED := $(shell tput -Txterm setaf 1)
GREEN := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET := $(shell tput -Txterm sgr0)

# Docker Image Name
IMAGE_NAME = fastify-sqlite

# Directory & Path for SQLite Database
DB_DIR = ./sqlite_data
DB_PATH = $(DB_DIR)/database.sqlite

# Port used for the app
PORT = 8000

# Docker Compose settings
DOCKER_COMPOSE := docker-compose
DOCKER_COMPOSE_FILE := compose.yaml

# Ensure SQLite database file exists with correct permissions
prepare-db:
	@echo "$(YELLOW)Checking SQLite database file...$(RESET)"
	@mkdir -p $(DB_DIR)
	@if [ "$(USER)" = "alex" ]; then \
        sudo chmod 777 $(DB_DIR); \
	else \
        chmod 777 $(DB_DIR); \
	fi	

	@[ -f $(DB_PATH) ] || touch $(DB_PATH)
	@chmod 666 $(DB_PATH)
	@if [ "$(USER)" = "alex" ]; then \
        chown $(shell whoami):$(shell whoami) $(DB_PATH); \
	else \
		chmod 777 $(DB_DIR); \
	fi

	@if [ "$(USER)" = "ageiser" ] || [ "$(shell id -gn)" = "2022_barcelona" ]; then \
        echo "$(YELLOW)Using SQLite via Docker (School Mode)$(RESET)"; \
        docker run --rm -v $(PWD)/$(DB_DIR):/app/sqlite_data $(IMAGE_NAME) || true; \
	else \
        echo "$(YELLOW)Using local SQLite (Normal Mode)$(RESET)"; \
        sqlite3 $(DB_PATH) < backend/init.sql; \
	fi
	@echo "$(GREEN)SQLite database is ready!$(RESET)"

# Start the container with database setup
run: prepare-db
	docker network create --driver bridge custom_network || true
	docker run --rm -it --network custom_network -p $(PORT):$(PORT) -v $(PWD)/$(DB_DIR):/app/sqlite_data $(IMAGE_NAME)

start: prepare-db
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d $(c)

stop:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) stop $(c)

clean: confirm
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --remove-orphans

confirm:
	@( read -p "$(YELLOW)Are you sure you want to clean all data? [y/N]$(RESET): " sure && case "$$sure" in [yY]) true;; *) false;; esac)

# Build and restart containers
build: prepare-db
	docker compose up --build

# Print container logs
logs:
	docker-compose logs -f

# List all containers
list:
	docker ps -a

# Clean Docker system
reclean: fclean
	docker system prune -f
	@if [ -n "$$(docker ps -q)" ]; then \
        docker stop $$(docker ps -q); \
        docker rm $$(docker ps -aq); \
    fi
	@if [ -n "$$(docker images -q)" ]; then \
        docker rmi $$(docker images -q) --force; \
	fi
	docker system prune -a --volumes --force

# Delete the SQLite database file
fclean: stop clean
	@read -p "Are you sure you want to delete the database.sqlite file and its contents? (y/n): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		rm -f $(DB_PATH); \
		echo "Database file deleted."; \
	else \
		echo "Operation canceled."; \
	fi

# Display available commands
help:
	@echo "Available commands:"
	@echo "  make build         → Build and start Docker containers"
	@echo "  make run           → Run the container manually"
	@echo "  make start         → Start with Docker-compose"
	@echo "  make stop          → Stop with Docker-compose"
	@echo "  make clean         → Clean the used containers"
	@echo "  make logs          → Print the logs"
	@echo "  make list          → List running containers"
	@echo "  make fclean        → Delete the SQLite database file"
	@echo "  make reclean       → Clean Docker system"
	@echo "  make help          → Display this help message"

.PHONY: run start stop clean logs list fclean reclean help