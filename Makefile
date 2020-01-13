.DEFAULT_GOAL := help
DOCKER_PREFIX ?= halkeye
DOCKER_IMAGE ?= jenkins-wiki-exporter
CONFLUENCE_USERNAME ?= $(shell bash -c 'read -s -p "Jenkins Wiki Username: " username; echo $$username')
CONFLUENCE_PASSWORD ?= $(shell bash -c 'read -s -p "Jenkins Wiki Password: " pwd; echo $$pwd')

dev: ## run the dev server
	npm run dev

build: ## build the docker version
	docker build -t $(DOCKER_PREFIX)/$(DOCKER_IMAGE) .

run: ## run the latest docker build
	docker run --rm -it -e CONFLUENCE_USERNAME -e CONFLUENCE_PASSWORD --name $(DOCKER_IMAGE) -p 3000:3000 -t $(DOCKER_PREFIX)/$(DOCKER_IMAGE)

push: ## push to docker registry
	docker push $(DOCKER_PREFIX)/$(DOCKER_IMAGE)

release: ## bump the version and push a release
	np

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
