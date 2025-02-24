# Colors

RED := $(shell tput -Txterm setaf 1)
GREEN := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET := $(shell tput -Txterm sgr0)

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
