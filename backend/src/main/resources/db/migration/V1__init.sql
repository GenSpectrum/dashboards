create table subscriptions_table (
    id uuid primary key,
    name text not null,
    interval VARCHAR(255) not null,
    active boolean not null,
    organism VARCHAR(255) not null,
    date_window VARCHAR(255) not null,
    trigger JSONB not null,
    user_id VARCHAR(255) not null
);

create index idx_user_id on subscriptions_table(user_id);
create index idx_organism on subscriptions_table(organism);
