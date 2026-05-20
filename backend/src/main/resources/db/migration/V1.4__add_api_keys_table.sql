create table api_keys_table (
    id uuid primary key default gen_random_uuid(),
    user_id bigint not null unique references users_table(id),
    key_hash varchar(64) not null,
    created_at timestamp without time zone not null default date_trunc('milliseconds', timezone('UTC', current_timestamp)),
    last_used_at timestamp without time zone
);

create index on api_keys_table (key_hash);
