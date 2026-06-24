create table collection_tags (
    collection_id bigint not null,
    tag text not null,
    primary key (collection_id, tag),
    constraint fk_collection_tags_collection foreign key (collection_id) references collections_table(id) on delete cascade,
    constraint chk_tag_lowercase check (tag = lower(tag))
);

create index idx_collection_tags_tag on collection_tags(tag);
