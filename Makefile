COMPOSE := docker compose

.DEFAULT_GOAL := help
.PHONY: help start stop restart logs status

help: ## list these targets
	@awk -F':.*##' '/^[a-z][a-z-]*:.*##/ { printf "  make %-9s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

start: ## start the board editor at http://localhost:5173
	$(COMPOSE) up -d

stop: ## stop and remove the containers (the npm cache volume survives)
	$(COMPOSE) down

restart: ## stop then start, so it works from any state
	@$(MAKE) --no-print-directory stop
	@$(MAKE) --no-print-directory start

logs: ## follow the logs
	$(COMPOSE) logs -f

status: ## show what is running and whether it is healthy
	$(COMPOSE) ps
