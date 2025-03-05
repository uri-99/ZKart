.PHONY: anvil_deploy clean

clean:
	rm -rf script/output/devnet/*

anvil_deploy: clean
	@echo "Deploying Contract in Anvil..."
	@bash contracts/script/anvil/deploy_contracts.sh

anvil_start:
	anvil --load-state contracts/script/anvil/state/deployed-anvil-state.json --block-time 6

holesky_deploy:
	@echo "Deploying Contract in Holesky"
	@. contracts/.env && . contracts/script/holesky/deploy_contracts.sh

explorer_start:
	@echo "Starting Explorer..."
	@cd explorer && pnpm start