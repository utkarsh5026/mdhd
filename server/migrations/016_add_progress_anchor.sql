-- Sub-section anchor for cross-device resume.
--
-- Stored alongside section_index/scroll_pct so resume can land on the exact
-- block the user was reading even when fonts, window width, or content edits
-- shift pixel positions. Resolution cascade tries (path + offset + tag + hash)
-- first and degrades step by step, with scroll_pct as the ultimate fallback.
--
-- All columns are nullable: card mode never sets them, and pre-existing rows
-- continue to resume via scroll_pct alone.
ALTER TABLE reading_progress
    ADD COLUMN anchor_heading_path TEXT[],
    ADD COLUMN anchor_block_offset INTEGER,
    ADD COLUMN anchor_block_tag    TEXT,
    ADD COLUMN anchor_block_hash   TEXT;

ALTER TABLE reading_progress
    ADD CONSTRAINT reading_progress_anchor_offset_nonneg
        CHECK (anchor_block_offset IS NULL OR anchor_block_offset >= 0),
    ADD CONSTRAINT reading_progress_anchor_tag_len
        CHECK (anchor_block_tag IS NULL OR char_length(anchor_block_tag) <= 16),
    ADD CONSTRAINT reading_progress_anchor_hash_len
        CHECK (anchor_block_hash IS NULL OR char_length(anchor_block_hash) <= 16);
