.DEFAULT_GOAL := help

dev: ## run the dev server
	 npm run dev

docker: ## build the docker version
	docker build -t halkeye/confluence-to-md-web .

release: ## bump the version and push a release
	np

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
