create table subscriptions_table (
    id VARCHAR(255) primary key,
    name text not null,
    interval VARCHAR(255) not null,
    active boolean not null,
    conditions_met boolean not null,
    organism VARCHAR(255) not null,
    date_window VARCHAR(255) not null,
    filter JSONB not null,
    trigger JSONB not null
);
