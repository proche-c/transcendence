# Colors

RED := $(shell tput -Txterm setaf 1)
GREEN := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET := $(shell tput -Txterm sgr0)


# Docker Image Name
IMAGE_NAME = fastify-sqlite

# Path to the SQLite database
DB_PATH = $(DB_DIR)/database.sqlite

# Directory for the SQLite database
DB_DIR = /home/$(USER)/fastify-sqlite

# Port used for the app
PORT = 8000


# start the container
run:
# Create the database file if it doesn't exist
	[ -f $(DB_PATH) ] || touch $(DB_PATH)

# Set proper permissions on the SQLite file
	chmod 666 $(DB_PATH)

# Run the container
	docker network create --driver bridge custom_network
	docker run --rm -it --network custom_network -p $(PORT):$(PORT) -v $(DB_PATH):/app/database.sqlite $(IMAGE_NAME)

# Default variables
DOCKER_COMPOSE := docker-compose
DOCKER_COMPOSE_FILE := compose.yaml

.PHONY: start stop clean

start:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d $(c)

stop:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) stop $(c)

clean: confirm
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --remove-orphans

confirm:
	@( read -p "$(YELLOW)Are you sure you want to clean all data? [y/N]$(RESET): " sure && case "$$sure" in [yY]) true;; *) false;; esac)

# build the docker image
build:
	docker compose up --build

# Print the logs of the container
logs:
	docker-compose logs -f

# List all the containers
list:
	docker ps -a

# clean the container and the used images
reclean:
	docker system prune -f

# fclean command to remove the database.sqlite file
fclean: stop clean
	@read -p "Are you sure you want to delete the database.sqlite file and its contents? (y/n): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		rm -f $(DB_PATH); \
		echo "Database file deleted."; \
	else \
		echo "Operation canceled."; \
	fi



# disponible commands
help:
	@echo "Available commands:"
	@echo "  make build         → Build the Docker Image"
	@echo "  make run           → Execute the Docker container"
	@echo "  make compose-up    → Start with Docker-compose"
	@echo "  make compose-down  → Stop with Docker-compose"
	@echo "  make clean         → Clean the used containers"
	@echo "  make logs          → Print the logs"
	@echo "  make remove        → Delete the Docker Image"
	@echo "  make re            → Full reload"
	@echo "  make list          → List of the Images"