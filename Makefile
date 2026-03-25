TASKS := help \
         dev setup \
         build build-release \
         client-dev client-build client-lint client-fmt client-fmt-check client-test client-test-run \
         server-dev server-dev-prod server-watch \
         server-build server-build-release \
         server-up server-down server-nuke server-ps server-logs \
         server-migrate server-migrate-add server-db-reset server-db-shell \
         server-test server-test-watch \
         server-lint server-fmt server-fmt-check server-clean \
         lint fmt fmt-check pre-commit validate

.PHONY: $(TASKS)

.DEFAULT_GOAL := help

$(TASKS):
	@node makefile.mjs $@ $(filter-out $@,$(MAKECMDGOALS))

# Swallow extra arguments so `make server-migrate-add create_posts` works
%:
	@:
