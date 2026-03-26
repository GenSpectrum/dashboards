-- Collections
ALTER TABLE collections_table
    ADD COLUMN created_at timestamp without time zone NOT NULL DEFAULT timezone('UTC', CURRENT_TIMESTAMP),
    ADD COLUMN updated_at timestamp without time zone NOT NULL DEFAULT timezone('UTC', CURRENT_TIMESTAMP);

-- Variants
ALTER TABLE variants_table
    ADD COLUMN created_at timestamp without time zone NOT NULL DEFAULT timezone('UTC', CURRENT_TIMESTAMP),
    ADD COLUMN updated_at timestamp without time zone NOT NULL DEFAULT timezone('UTC', CURRENT_TIMESTAMP);
