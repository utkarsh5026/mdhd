.PHONY: install dev build preview lint format format-check typecheck pre-commit clean help


.DEFAULT_GOAL := help

help install dev build preview lint format format-check typecheck pre-commit clean:
	@node makefile.mjs $@
