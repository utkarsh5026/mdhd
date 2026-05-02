TASKS := help setup dev build build-release \
         up down nuke ps logs \
         migrate migrate-add db-reset db-shell \
         test test-watch \
         lint fmt fmt-check pre-commit validate \
         clean

.PHONY: $(TASKS)

.DEFAULT_GOAL := help

$(TASKS):
	@node makefile.mjs $@ $(filter-out $@,$(MAKECMDGOALS))

# Swallow extra arguments so `make migrate-add create_posts` works
%:
	@:
