#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
USER_ID="foobar"
ORGANISM_FILTER="${1:-}"

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

run_organism() {
    local organism="$1"
    if [ -n "$ORGANISM_FILTER" ] && [ "$ORGANISM_FILTER" != "$organism" ]; then
        return
    fi
    echo "--- $organism ---"
    "create_collections_${organism}"
    echo
}

create_collections_covid() {

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

create_collection "Long descriptions" '{
  "name": "Long descriptions",
  "organism": "covid",
  "description": "Collection for testing rendering of variants with very long descriptions",
  "variants": [
    {
      "type": "query",
      "name": "Delta (B.1.617.2)",
      "description": "Delta was first identified in India in late 2020 and rapidly became the dominant variant worldwide by mid-2021. It carried a combination of mutations in the spike protein — including L452R, T478K, and P681R — that significantly increased transmissibility compared to earlier lineages. The P681R substitution at the furin cleavage site was thought to enhance viral entry into cells. Delta caused devastating waves in South Asia and subsequently swept through Europe, the Americas, and Africa before being displaced by Omicron in late 2021 and early 2022.",
      "countQuery": "pangoLineage=B.1.617.2*"
    },
    {
      "type": "query",
      "name": "Omicron (BA.1)",
      "description": "Omicron BA.1 emerged in southern Africa in November 2021 and within weeks had spread to every corner of the globe, achieving a speed of international dissemination unprecedented in the pandemic. It harboured over 30 mutations in the spike protein relative to the ancestral Wuhan-Hu-1 sequence, including 15 in the receptor-binding domain, which collectively conferred substantial immune evasion against both vaccine-elicited and infection-induced antibodies. Despite causing milder average disease than Delta — partly attributed to preferential replication in the upper rather than lower respiratory tract — its sheer transmissibility led to record case counts, hospitalisations, and deaths in absolute terms across many countries.",
      "countQuery": "pangoLineage=BA.1*"
    }
  ]
}'

create_collection "Empty placeholder" '{
  "name": "Empty placeholder",
  "organism": "covid",
  "description": "Placeholder collection with no variants yet",
  "variants": []
}'

}

create_collections_h5n1() {

create_collection "H5N1 clades overview" '{
  "name": "H5N1 clades overview",
  "organism": "h5n1",
  "description": "Major H5N1 clades",
  "variants": [
    {"type": "query", "name": "2.3.4.4", "countQuery": "clade=2.3.4.4"},
    {"type": "query", "name": "2.3.4.4b", "countQuery": "clade=2.3.4.4b"},
    {"type": "query", "name": "2.3.4.3", "countQuery": "clade=2.3.4.3"},
    {"type": "query", "name": "2.1.3.3", "countQuery": "clade=2.1.3.3"},
    {"type": "query", "name": "2.1.3.4", "countQuery": "clade=2.1.3.4"},
    {"type": "query", "name": "7.2", "countQuery": "clade=7.2"}
  ]
}'

create_collection "Am-nonGsGD vs EA-nonGsGD" '{
  "name": "Am-nonGsGD vs EA-nonGsGD",
  "organism": "h5n1",
  "description": "Non-Gs/GD lineages from the Americas and Eurasia",
  "variants": [
    {"type": "query", "name": "Am-nonGsGD", "countQuery": "clade=Am-nonGsGD"},
    {"type": "query", "name": "EA-nonGsGD", "countQuery": "clade=EA-nonGsGD"}
  ]
}'

create_collection "2.3.4.4 subclades" '{
  "name": "2.3.4.4 subclades",
  "organism": "h5n1",
  "description": "Subclades within the 2.3.4.4 group",
  "variants": [
    {"type": "query", "name": "2.3.4.4", "countQuery": "clade=2.3.4.4"},
    {"type": "query", "name": "2.3.4.4b", "countQuery": "clade=2.3.4.4b"}
  ]
}'

create_collection "HA mutations of interest" '{
  "name": "HA mutations of interest",
  "organism": "h5n1",
  "description": "Variants defined by notable HA protein mutations",
  "variants": [
    {
      "type": "filterObject",
      "name": "T160A carriers",
      "description": "Loss of glycosylation site associated with increased virulence",
      "filterObject": {"aminoAcidMutations": ["HA:T160A"]}
    },
    {
      "type": "filterObject",
      "name": "D94N carriers",
      "filterObject": {"aminoAcidMutations": ["HA:D94N"]}
    }
  ]
}'

create_collection "Mixed variant types" '{
  "name": "Mixed variant types",
  "organism": "h5n1",
  "description": "One query variant and one filterObject variant side by side",
  "variants": [
    {
      "type": "query",
      "name": "2.3.4.4b",
      "countQuery": "clade=2.3.4.4b"
    },
    {
      "type": "filterObject",
      "name": "HA T160A",
      "filterObject": {"aminoAcidMutations": ["HA:T160A"]}
    }
  ]
}'

create_collection "Long descriptions" '{
  "name": "Long descriptions",
  "organism": "h5n1",
  "description": "Collection for testing rendering of variants with very long descriptions",
  "variants": [
    {
      "type": "query",
      "name": "2.3.4.4b",
      "description": "Clade 2.3.4.4b is currently the most widely circulating H5N1 clade globally and has caused unprecedented spread into wild bird and mammal populations across multiple continents. First detected in Europe and subsequently spreading across the Atlantic into North and South America, it has caused mass mortality events in seabirds, shorebirds, and colonial waterbirds on a scale not previously observed. Of particular public health concern is its repeated spillover into mammals including mink, sea lions, foxes, and dairy cattle in the United States — the latter representing the first known sustained transmission of H5N1 in a livestock species — raising concerns about the potential for further adaptation to mammalian hosts.",
      "countQuery": "clade=2.3.4.4b"
    },
    {
      "type": "query",
      "name": "Am-nonGsGD",
      "description": "The Am-nonGsGD (Americas non-Gs/GD) lineage represents H5N1 viruses circulating in the Americas that are phylogenetically distinct from the Gs/GD lineage which has dominated globally since 1996. These viruses have been detected primarily in wild waterfowl across North and South America and represent a separate evolutionary trajectory with different antigenic properties. Surveillance of this lineage is important for understanding the full diversity of H5N1 circulating in the Western Hemisphere and for assessing whether co-circulation with 2.3.4.4b could lead to reassortment events generating novel genotypes with unpredictable biological properties.",
      "countQuery": "clade=Am-nonGsGD"
    }
  ]
}'

create_collection "Empty placeholder" '{
  "name": "Empty placeholder",
  "organism": "h5n1",
  "description": "Placeholder collection with no variants yet",
  "variants": []
}'

}

run_organism covid
run_organism h5n1

echo "Done."
