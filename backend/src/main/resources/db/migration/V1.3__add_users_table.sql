create table users_table (
    id bigserial primary key,
    github_id varchar(255) unique,
    name varchar(255) not null,
    email varchar(255),
    created_at timestamp without time zone not null default date_trunc('milliseconds', timezone('UTC', current_timestamp)),
    updated_at timestamp without time zone not null default date_trunc('milliseconds', timezone('UTC', current_timestamp))
);

create index idx_users_github_id on users_table(github_id);

-- Backfill users from existing collections
insert into users_table (github_id, name)
select distinct owned_by, owned_by
from collections_table
on conflict (github_id) do nothing;

-- Backfill users from existing subscriptions
insert into users_table (github_id, name)
select distinct user_id, user_id
from subscriptions_table
on conflict (github_id) do nothing;

-- Migrate collections_table.owned_by to bigint FK
alter table collections_table add column owned_by_id bigint;
update collections_table c set owned_by_id = u.id from users_table u where u.github_id = c.owned_by;
alter table collections_table alter column owned_by_id set not null;
alter table collections_table add constraint fk_collections_user foreign key (owned_by_id) references users_table(id);
alter table collections_table drop column owned_by;
alter table collections_table rename column owned_by_id to owned_by;

-- Migrate subscriptions_table.user_id to bigint FK
alter table subscriptions_table add column user_id_new bigint;
update subscriptions_table s set user_id_new = u.id from users_table u where u.github_id = s.user_id;
alter table subscriptions_table alter column user_id_new set not null;
alter table subscriptions_table add constraint fk_subscriptions_user foreign key (user_id_new) references users_table(id);
alter table subscriptions_table drop column user_id;
alter table subscriptions_table rename column user_id_new to user_id;
