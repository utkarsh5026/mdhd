-- Add full-text search columns to the files table.
-- content_text stores the raw markdown for ts_headline snippet generation.
-- search_content stores the precomputed tsvector for fast full-text queries.

ALTER TABLE files ADD COLUMN content_text TEXT NOT NULL DEFAULT '';
ALTER TABLE files ADD COLUMN search_content tsvector NOT NULL DEFAULT ''::tsvector;

CREATE INDEX idx_files_search ON files USING GIN (search_content);
