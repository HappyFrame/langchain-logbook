# Makefile for langchain-logbook

# Variables
PYTHON := python3
PIP := $(PYTHON) -m pip
UV := $(shell command -v uv 2> /dev/null)
VENV_DIR := .venv
PROJECT_NAME := langchain-logbook

# Default target
.DEFAULT_GOAL := help

.PHONY: help
help: ## Display this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

.PHONY: check-python
check-python: ## Check if Python is installed
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo >&2 "Python 3 is required but not installed. Aborting."; exit 1; }
	@echo "Python 3 is installed: $$($(PYTHON) --version)"

.PHONY: install-uv
install-uv: ## Install uv package manager
	@if [ -z "$(UV)" ]; then \
		echo "uv is not installed. Installing it now..."; \
		curl -LsSf https://astral.sh/uv/install.sh | sh; \
		echo "Please restart your terminal or run 'source \$$HOME/.cargo/env' to use 'uv'."; \
	else \
		echo "uv is already installed: $$($(UV) --version)"; \
	fi

.PHONY: setup
setup: check-python ## Initialize the project environment (venv + .env)
	@if [ ! -f .env ]; then \
		cp .env.example .env 2>/dev/null || touch .env; \
		echo "Created .env file. Please edit it with your API keys."; \
	fi
	@if [ -z "$(UV)" ]; then \
		echo "uv not found, using standard venv..."; \
		$(PYTHON) -m venv $(VENV_DIR); \
		$(VENV_DIR)/bin/python -m pip install --upgrade pip; \
	else \
		echo "Using uv for environment setup..."; \
		uv venv $(VENV_DIR); \
	fi
	@echo "Setup complete. Run 'make install' to install dependencies."

.PHONY: install
install: ## Install project dependencies
	@if [ ! -d "$(VENV_DIR)" ]; then \
		make setup; \
	fi
	@if [ -z "$(UV)" ]; then \
		echo "Installing with pip..."; \
		$(VENV_DIR)/bin/python -m pip install -e .; \
	else \
		echo "Installing with uv..."; \
		uv pip install -e .; \
	fi
	@echo "Dependencies installed."

.PHONY: notebook
notebook: ## Launch Jupyter Notebook
	@if [ ! -d "$(VENV_DIR)" ]; then \
		make install; \
	fi
	@echo "Launching Jupyter Notebook..."
	@$(VENV_DIR)/bin/jupyter notebook --notebook-dir=tutorials

.PHONY: lab
lab: ## Launch Jupyter Lab
	@if [ ! -d "$(VENV_DIR)" ]; then \
		make install; \
	fi
	@echo "Launching Jupyter Lab..."
	@$(VENV_DIR)/bin/jupyter lab --notebook-dir=tutorials

.PHONY: clean
clean: ## Clean up temporary files
	@rm -rf $(VENV_DIR)
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name ".ipynb_checkpoints" -exec rm -rf {} +
	@echo "Cleanup complete."

.PHONY: test
test: ## Run tests (if any)
	@if [ -f "pytest" ]; then \
		$(VENV_DIR)/bin/pytest; \
	else \
		echo "No tests configured yet."; \
	fi
