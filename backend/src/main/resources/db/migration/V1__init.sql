create table subscriptions_table (
    id VARCHAR(255) primary key,
    name text not null,
    interval VARCHAR(255) not null,
    active boolean not null,
    conditionsMet boolean not null,
    organism VARCHAR(255) not null,
    dateWindow VARCHAR(255) not null,
    filter JSONB not null,
    triggerType VARCHAR(255) not null,
    triggerValue VARCHAR(255) not null
);
