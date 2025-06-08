# Colors (opcional para mensajes)
RED := $(shell tput -Txterm setaf 1)
GREEN := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET := $(shell tput -Txterm sgr0)

DOCKER_COMPOSE := docker-compose
DOCKER_COMPOSE_FILE := compose.yaml

start: setup_ip
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

setup_ip:
	@echo "$(GREEN)Executant setup_ip.sh...$(RESET)"
	@chmod +x setup_ip.sh
	./setup_ip.sh

down:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

clean:
	@docker stop $$(docker ps -qa) || true; \
	docker rm $$(docker ps -qa) || true; \
	docker rmi -f $$(docker images -qa) || true; \
	docker volume rm $$(docker volume ls -q) || true; \
	docker network rm $$(docker network ls -q) 2>/dev/null || true;
	rm frontend/app/config.js || true; \
	rm frontend/app/config.ts || true; \
	rm backend/config.js || true;

fclean: clean
	@docker system prune -af

sleep:
	sleep 3

re: fclean sleep start

help:
	@echo "Available commands:"
	@echo "  make start → Mount the containers"
	@echo "  make stop  → Stop the containers"
	@echo "  make clean → Delete the containers and images"
	@echo "  make help  → Show this help message"
	@echo "  make fclean → Delete the containers and images, and remove volumes"
	@echo "  make re    → Delete the containers and images, and remove volumes, then mount the containers"
	@echo "  make down  → Stop and remove the containers"

.PHONY: start stop clean help re fclean down