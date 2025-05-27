# Colors (opcional para mensajes)
RED := $(shell tput -Txterm setaf 1)
GREEN := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET := $(shell tput -Txterm sgr0)

DOCKER_COMPOSE := docker-compose
DOCKER_COMPOSE_FILE := compose.yaml

NGROK_API := http://localhost:4040/api/tunnels
NGROK_ENV := ./backend/.env.shared


start: prepare-env up-ngrok wait-ngrok-url up-rest

prepare-env:
	@touch $(NGROK_ENV)

up-ngrok:
	@echo "$(YELLOW)[INFO] Starting nginx and ngrok$(RESET)"
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d nginx ngrok

wait-ngrok-url:
	@echo "$(YELLOW)[INFO] Waiting for the ngrok Url...$(RESET)"
	@until curl -s $(NGROK_API) | grep -q "public_url"; do sleep 1; done
	@NGROK_URL=$$(curl -s $(NGROK_API) | grep -o "https://[a-zA-Z0-9.-]*\.ngrok-free\.app" | head -n 1); \
	echo "NGROK_URL=$$NGROK_URL" > $(NGROK_ENV); \
	echo "$(GREEN)[OK] Ngrok URL catched : $$NGROK_URL$(RESET)"

up-rest:
	@echo "$(YELLOW)[INFO] Starting backend and frontend...$(RESET)"
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d backend frontend
	@echo "$(GREEN)[OK] Ngrok URL catched : $$NGROK_URL$(RESET)"

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

sleep:
	sleep 3

re: fclean sleep start

url:
	@grep NGROK_URL $(NGROK_ENV) || echo "Not yet generated."

help:
	@echo "Available commands:"
	@echo "  make start → Mount the containers"
	@echo "  make stop  → Stop the containers"
	@echo "  make clean → Delete the containers and images"
	@echo "  make help  → Show this help message"
	@echo "  make fclean → Delete the containers and images, and remove volumes"
	@echo "  make re    → Delete the containers and images, and remove volumes, then mount the containers"
	@echo "  make down  → Stop and remove the containers"
	@echo "  make url   → Show the current ngrok URL"

.PHONY: start stop clean help re fclean down url up-ngrok wait-ngrok-url up-rest prepare-env sleep