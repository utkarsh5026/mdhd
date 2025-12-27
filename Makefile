.PHONY: install dev build preview lint clean help

# Colors
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
MAGENTA := \033[35m
RESET := \033[0m
BOLD := \033[1m
DIM := \033[2m

# Default target
help:
	@echo ""
	@echo ""
	@echo "  $(BOLD)$(YELLOW)Development$(RESET)"
	@echo "  $(DIM)─────────────────────────────────────$(RESET)"
	@echo "  $(GREEN)make dev$(RESET)       Start development server"
	@echo "  $(GREEN)make install$(RESET)   Install dependencies"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)Build$(RESET)"
	@echo "  $(DIM)─────────────────────────────────────$(RESET)"
	@echo "  $(GREEN)make build$(RESET)     Build for production"
	@echo "  $(GREEN)make preview$(RESET)   Preview production build"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)Quality$(RESET)"
	@echo "  $(DIM)─────────────────────────────────────$(RESET)"
	@echo "  $(GREEN)make lint$(RESET)      Run ESLint"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)Maintenance$(RESET)"
	@echo "  $(DIM)─────────────────────────────────────$(RESET)"
	@echo "  $(GREEN)make clean$(RESET)     Remove node_modules and dist"
	@echo ""

install:
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	cd app && npm install

dev:
	@echo "$(CYAN)Starting development server...$(RESET)"
	cd app && npm run dev

build:
	@echo "$(CYAN)Building for production...$(RESET)"
	cd app && npm run build

preview:
	@echo "$(CYAN)Starting preview server...$(RESET)"
	cd app && npm run preview

lint:
	@echo "$(CYAN)Running ESLint...$(RESET)"
	cd app && npm run lint

clean:
	@echo "$(CYAN)Cleaning up...$(RESET)"
	rm -rf app/node_modules app/dist
	@echo "$(GREEN)Done!$(RESET)"
