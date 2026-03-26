-- Collections table
create table collections_table (
    id bigserial primary key,
    name text not null,
    owned_by varchar(255) not null,
    organism varchar(255) not null,
    description text
);

-- Variants table with polymorphic data storage
create table variants_table (
    id bigserial primary key,
    collection_id bigint not null,
    variant_type varchar(50) not null,
    name text not null,
    description text,
    -- Query variant columns (nullable, only used when variant_type='query')
    count_query text,
    coverage_query text,
    -- FilterObject variant column (nullable, only used when variant_type='filterObject')
    filter_object jsonb,
    -- Constraints
    constraint fk_collection foreign key (collection_id) references collections_table(id) on delete cascade,
    constraint chk_variant_type check (variant_type in ('query', 'filterObject')),
    -- Ensure correct columns are populated based on type
    constraint chk_query_columns check (
        (variant_type = 'query' and count_query is not null and filter_object is null) or
        (variant_type = 'filterObject' and filter_object is not null and count_query is null and coverage_query is null)
    )
);

create index idx_collections_owned_by on collections_table(owned_by);
create index idx_collections_organism on collections_table(organism);
create index idx_variants_collection_id on variants_table(collection_id);
