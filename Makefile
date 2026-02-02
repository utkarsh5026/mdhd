.PHONY: install setup dev build preview lint format format-check typecheck pre-commit test test\:watch test\:ui test\:coverage test\:e2e test\:all security knip validate lighthouse lighthouse\:ci clean help


.DEFAULT_GOAL := help

help install setup dev build preview lint format format-check typecheck pre-commit test test\:watch test\:ui test\:coverage test\:e2e test\:all security knip validate lighthouse lighthouse\:ci clean:
	@node makefile.mjs $@
