-- Per-tab user customization: emoji icon override and cover gradient/pattern overrides.
-- Both columns are nullable — NULL means "use the auto-generated value".
ALTER TABLE user_tabs
    ADD COLUMN custom_icon   TEXT,
    ADD COLUMN custom_cover  TEXT;
