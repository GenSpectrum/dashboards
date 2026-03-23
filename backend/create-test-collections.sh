#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
USER_ID="foobar"

create_collection() {
    local name="$1"
    local body="$2"
    local body_out http_code
    local tmp
    tmp=$(mktemp)
    http_code=$(curl -s -o "$tmp" -w "%{http_code}" -X POST \
        "${BASE_URL}/collections?userId=${USER_ID}" \
        -H "Content-Type: application/json" \
        -d "$body")
    body_out=$(cat "$tmp")
    rm -f "$tmp"
    if [ "$http_code" = "201" ]; then
        local id
        id=$(echo "$body_out" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
        echo "  OK  id=$id  $name"
    else
        echo "  FAIL  ($http_code)  $name: $body_out"
    fi
}

echo "Creating test collections against $BASE_URL as user '$USER_ID'..."
echo

create_collection "Alpha & Beta comparison" '{
  "name": "Alpha & Beta comparison",
  "organism": "covid",
  "description": "Comparing Alpha and Beta variant trajectories",
  "variants": [
    {
      "type": "query",
      "name": "Alpha (B.1.1.7)",
      "description": "Alpha lineage globally",
      "countQuery": "pangoLineage=B.1.1.7*"
    },
    {
      "type": "query",
      "name": "Beta (B.1.351)",
      "description": "Beta lineage globally",
      "countQuery": "pangoLineage=B.1.351*"
    }
  ]
}'

create_collection "Omicron sublineages" '{
  "name": "Omicron sublineages",
  "organism": "covid",
  "description": "Key Omicron BA.x sublineages",
  "variants": [
    {"type": "query", "name": "BA.1", "countQuery": "pangoLineage=BA.1*"},
    {"type": "query", "name": "BA.2", "countQuery": "pangoLineage=BA.2*"},
    {"type": "query", "name": "BA.4", "countQuery": "pangoLineage=BA.4*"},
    {"type": "query", "name": "BA.5", "countQuery": "pangoLineage=BA.5*"}
  ]
}'

create_collection "Spike mutations of interest" '{
  "name": "Spike mutations of interest",
  "organism": "covid",
  "description": "Variants defined by notable Spike protein mutations",
  "variants": [
    {
      "type": "filterObject",
      "name": "E484K carriers",
      "description": "Sequences with the immune-escape E484K mutation",
      "filterObject": {"aminoAcidMutations": ["S:E484K"]}
    },
    {
      "type": "filterObject",
      "name": "N501Y carriers",
      "description": "Sequences with the ACE2-affinity N501Y mutation",
      "filterObject": {"aminoAcidMutations": ["S:N501Y"]}
    },
    {
      "type": "filterObject",
      "name": "L452R carriers",
      "filterObject": {"aminoAcidMutations": ["S:L452R"]}
    }
  ]
}'


create_collection "Recombinants" '{
  "name": "Recombinants",
  "organism": "covid",
  "description": "XBB and XBF recombinant lineages",
  "variants": [
    {"type": "query", "name": "XBB", "countQuery": "pangoLineage=XBB*"},
    {"type": "query", "name": "XBF", "countQuery": "pangoLineage=XBF*"},
    {"type": "query", "name": "XBC", "countQuery": "pangoLineage=XBC*"}
  ]
}'

create_collection "Insertion signatures" '{
  "name": "Insertion signatures",
  "organism": "covid",
  "description": "Sequences carrying notable nucleotide insertions",
  "variants": [
    {
      "type": "filterObject",
      "name": "ins_22204:GAG",
      "description": "Omicron ORF1a insertion",
      "filterObject": {"nucleotideInsertions": ["ins_22204:GAG"]}
    }
  ]
}'

create_collection "Mixed variant types" '{
  "name": "Mixed variant types",
  "organism": "covid",
  "description": "One query variant and one filterObject variant side by side",
  "variants": [
    {
      "type": "query",
      "name": "Delta globally",
      "countQuery": "pangoLineage=B.1.617.2*"
    },
    {
      "type": "filterObject",
      "name": "Delta spike mutations",
      "filterObject": {"aminoAcidMutations": ["S:L452R", "S:T478K", "S:P681R"]}
    }
  ]
}'

create_collection "Early variants 2020" '{
  "name": "Early variants 2020",
  "organism": "covid",
  "description": "The original D614G wave and early diversification",
  "variants": [
    {
      "type": "filterObject",
      "name": "D614G",
      "description": "The first globally dominant mutation",
      "filterObject": {"aminoAcidMutations": ["S:D614G"]}
    }
  ]
}'

create_collection "Empty placeholder" '{
  "name": "Empty placeholder",
  "organism": "covid",
  "description": "Placeholder collection with no variants yet",
  "variants": []
}'

echo
echo "Done."
