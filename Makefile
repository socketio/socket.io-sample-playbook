.PHONY: help ping install

help: ## print this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

ping: ## ping the hosts in the given inventory (example: `make I=local ping`)
	ansible -m ping -i ${I} all

install: ## apply the given playbook (example: `make I=prod install`)
	ansible-playbook -i ${I} install.yml
