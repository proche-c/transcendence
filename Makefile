# Colors (opcional para mensajes)
RED := $(shell tput -Txterm setaf 1)
GREEN := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET := $(shell tput -Txterm sgr0)

DOCKER_COMPOSE := docker-compose
DOCKER_COMPOSE_FILE := compose.yaml

start:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

down:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

clean:
	@docker stop $$(docker ps -qa) || true; \
	docker rm $$(docker ps -qa) || true; \
	docker rmi -f $$(docker images -qa) || true; \
	docker volume rm $$(docker volume ls -q) || true; \
	docker network rm $$(docker network ls -q) 2>/dev/null || true;

fclean: clean
	@docker system prune -af

help:
	@echo "Available commands:"
	@echo "  make start → Levanta los contenedores"
	@echo "  make stop  → Detiene los contenedores"
	@echo "  make clean → Elimina los contenedores"
	@echo "  make help  → Muestra este mensaje"

.PHONY: start stop clean help
