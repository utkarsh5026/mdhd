TASKS := help \
         dev prod prod-watch setup containers \
         build build-release \
         test test-connections sqlx-check sqlx-prepare \
         lint fmt fmt-check pre-commit validate

.PHONY: $(TASKS)

.DEFAULT_GOAL := help

$(TASKS):
	@node makefile.mjs $@ $(filter-out $@,$(MAKECMDGOALS))

# Swallow extra arguments so `make server-migrate-add create_posts` works
%:
	@:
