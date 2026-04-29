#!/usr/bin/env bash
set -euo pipefail

# This script creates resistance mutation collections.
# By default, it's running against a locally ran backend (localhost:8080), and you should
# set the USER_ID env var, which is then used as the user ID for creating the collections locally.
# You can also set a SESSION_TOKEN which you can take out of the cookie storage of the GenSpectrum
# website when you're logged in (__Secure-authjs.session-token). With this, you can create collections
# on staging or prod.
#
# Example calls:
#
# Local (backend running on :8080):
#   USER_ID=myuser ./create-resistance-mutation-collections.sh
#
# Staging (grab __Secure-authjs.session-token from browser DevTools → Application → Cookies):
#   BASE_URL=https://staging.genspectrum.org SESSION_TOKEN=eyJhbG... ./create-resistance-mutation-collections.sh

BASE_URL="${BASE_URL:-http://localhost:8080}"
USER_ID="${1:-testuser}"
# When SESSION_TOKEN is set, the website proxy injects the user ID — do not set it manually.
# Optional: set SESSION_TOKEN to authenticate against a deployed instance.
# The cookie name must match what the server expects (e.g. __Secure-authjs.session-token for HTTPS).
SESSION_TOKEN="${SESSION_TOKEN:-}"

# TODO: We need to be able to _update_ a collection with this script. but maybe this can be a follow up issue as well.
# (I.e. we should be able to accept a collection ID which we then update instead of creating new ones all the time)

create_collection() {
    local name="$1"
    local body="$2"
    local body_out http_code
    local tmp
    tmp=$(mktemp)

    local cookie_args=()
    if [ -n "$SESSION_TOKEN" ]; then
        if [[ "$BASE_URL" == https://* ]]; then
            cookie_args=(-b "__Secure-authjs.session-token=${SESSION_TOKEN}")
        else
            cookie_args=(-b "authjs.session-token=${SESSION_TOKEN}")
        fi
    fi

    if [ -n "$SESSION_TOKEN" ]; then
        local url="${BASE_URL}/api/collections"
    else
        local url="${BASE_URL}/collections?userId=${USER_ID}"
    fi

    http_code=$(curl -s -o "$tmp" -w "%{http_code}" -X POST \
        "${cookie_args[@]}" \
        "$url" \
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
        exit 1
    fi
}

# Converts a genomic mutation code to a mature protein name with the given offset.
# E.g. mature_name "ORF1a:T3284I" "3CLpro" -3263  =>  "3CLpro:T21I"
mature_name() {
    local mutation="$1" set_name="$2" offset="$3"
    local mutation_part="${mutation#*:}"
    local original_base="${mutation_part:0:1}"
    local new_base="${mutation_part: -1}"
    local position
    position=$(echo "$mutation_part" | grep -o '[0-9]*')
    echo "${set_name}:${original_base}$((position + offset))${new_base}"
}

# Build a JSON variants array from mutation strings passed as arguments.
# Usage: build_variants_json <set_name> <offset> <mutation> [<mutation> ...]
# Each mutation becomes one filterObject variant whose display name uses the
# mature protein coordinate (set_name + position adjusted by offset).
build_variants_json() {
    local set_name="$1" offset="$2"
    shift 2
    local variants="[]"
    for mutation in "$@"; do
        local display_name
        display_name=$(mature_name "$mutation" "$set_name" "$offset")
        variants=$(jq -n \
            --argjson existing "$variants" \
            --arg name "$display_name" \
            --arg mutation "$mutation" \
            '$existing + [{"type": "filterObject", "name": $name, "filterObject": {"aminoAcidMutations": [$mutation]}}]')
    done
    echo "$variants"
}

if [ -n "$SESSION_TOKEN" ]; then
    echo "Creating resistance mutation collections against $BASE_URL using session token..."
else
    echo "Creating resistance mutation collections against $BASE_URL as user '$USER_ID'..."
fi
echo

# --- 3CLpro ---
CLPRO_MUTATIONS=(
    "ORF1a:T3284I" "ORF1a:T3288A" "ORF1a:T3288N" "ORF1a:T3308I" "ORF1a:D3311Y"
    "ORF1a:M3312I" "ORF1a:M3312L" "ORF1a:M3312T" "ORF1a:M3312-" "ORF1a:L3313F"
    "ORF1a:G3401S" "ORF1a:F3403L" "ORF1a:F3403S" "ORF1a:N3405D" "ORF1a:N3405L"
    "ORF1a:N3405S" "ORF1a:G3406S" "ORF1a:S3407A" "ORF1a:S3407E" "ORF1a:S3407L"
    "ORF1a:S3407P" "ORF1a:C3423F" "ORF1a:M3428R" "ORF1a:M3428T" "ORF1a:E3429A"
    "ORF1a:E3429G" "ORF1a:E3429K" "ORF1a:E3429Q" "ORF1a:E3429V" "ORF1a:L3430F"
    "ORF1a:P3431-" "ORF1a:T3432I" "ORF1a:H3435L" "ORF1a:H3435N" "ORF1a:H3435Q"
    "ORF1a:H3435Y" "ORF1a:A3436T" "ORF1a:A3436V" "ORF1a:V3449A" "ORF1a:R3451G"
    "ORF1a:R3451S" "ORF1a:Q3452I" "ORF1a:Q3452K" "ORF1a:T3453I" "ORF1a:A3454T"
    "ORF1a:A3454V" "ORF1a:Q3455A" "ORF1a:Q3455C" "ORF1a:Q3455D" "ORF1a:Q3455E"
    "ORF1a:Q3455F" "ORF1a:Q3455G" "ORF1a:Q3455H" "ORF1a:Q3455I" "ORF1a:Q3455K"
    "ORF1a:Q3455L" "ORF1a:Q3455N" "ORF1a:Q3455P" "ORF1a:Q3455R" "ORF1a:Q3455S"
    "ORF1a:Q3455T" "ORF1a:Q3455V" "ORF1a:Q3455W" "ORF1a:Q3455Y" "ORF1a:A3456P"
    "ORF1a:A3457S" "ORF1a:P3515L" "ORF1a:V3560A" "ORF1a:S3564P" "ORF1a:T3567I"
    "ORF1a:F3568L"
)
variants_json=$(build_variants_json "3CLpro" -3263 "${CLPRO_MUTATIONS[@]}")
body=$(jq -n \
    --argjson variants "$variants_json" \
    '{
        "name": "3CLpro resistance mutations",
        "organism": "covid",
        "description": "SARS-CoV-2 3C-like protease (3CLpro/Mpro) inhibitor resistance mutations as per Stanford Coronavirus Antiviral & Resistance database (last updated 21 August 2024).",
        "variants": $variants
    }')
create_collection "3CLpro resistance mutations" "$body"

# --- RdRp ---
RDRP_MUTATIONS=(
    "ORF1b:V157A" "ORF1b:V157L" "ORF1b:N189S" "ORF1b:R276C" "ORF1b:A367V"
    "ORF1b:A440V" "ORF1b:F471L" "ORF1b:D475Y" "ORF1b:A517V" "ORF1b:V548L"
    "ORF1b:G662S" "ORF1b:S750A" "ORF1b:V783I" "ORF1b:E787G" "ORF1b:C790F"
    "ORF1b:C790R" "ORF1b:E793A" "ORF1b:E793D" "ORF1b:M915R"
)
variants_json=$(build_variants_json "RdRp" 9 "${RDRP_MUTATIONS[@]}")
body=$(jq -n \
    --argjson variants "$variants_json" \
    '{
        "name": "RdRp resistance mutations",
        "organism": "covid",
        "description": "SARS-CoV-2 RNA-dependent RNA polymerase (RdRp) inhibitor resistance mutations as per Stanford Coronavirus Antiviral & Resistance database (last updated 21 August 2024).",
        "variants": $variants
    }')
create_collection "RdRp resistance mutations" "$body"

# --- Spike ---
SPIKE_MUTATIONS=(
    "S:P337H" "S:P337L" "S:P337R" "S:P337S" "S:P337T"
    "S:E340A" "S:E340D" "S:E340G" "S:E340K" "S:E340Q" "S:E340V"
    "S:T345P"
    "S:R346G" "S:R346I" "S:R346K" "S:R346S" "S:R346T"
    "S:K356Q" "S:K356T"
    "S:S371F" "S:S371L"
    "S:D405E" "S:D405N" "S:E406D"
    "S:K417E" "S:K417H" "S:K417I" "S:K417M" "S:K417N" "S:K417R" "S:K417S" "S:K417T"
    "S:D420A" "S:D420N"
    "S:N439K"
    "S:N440D" "S:N440E" "S:N440I" "S:N440K" "S:N440R" "S:N440T" "S:N440Y"
    "S:S443Y"
    "S:K444E" "S:K444F" "S:K444I" "S:K444L" "S:K444M" "S:K444N" "S:K444R" "S:K444T"
    "S:V445A" "S:V445D" "S:V445F" "S:V445I" "S:V445L"
    "S:G446A" "S:G446D" "S:G446I" "S:G446N" "S:G446R" "S:G446S" "S:G446T" "S:G446V"
    "S:G447C" "S:G447D" "S:G447F" "S:G447S" "S:G447V"
    "S:N448D" "S:N448K" "S:N448T" "S:N448Y"
    "S:Y449D"
    "S:N450D" "S:N450K"
    "S:L452M" "S:L452Q" "S:L452R" "S:L452W"
    "S:Y453F" "S:Y453H"
    "S:L455F" "S:L455M" "S:L455S" "S:L455W"
    "S:F456C" "S:F456L" "S:F456V"
    "S:S459P"
    "S:N460D" "S:N460H" "S:N460I" "S:N460K" "S:N460S" "S:N460T" "S:N460Y"
    "S:A475D" "S:A475V"
    "S:G476D" "S:G476R" "S:G476T"
    "S:V483A"
    "S:E484A" "S:E484D" "S:E484G" "S:E484K" "S:E484P" "S:E484Q" "S:E484R" "S:E484S" "S:E484T" "S:E484V"
    "S:G485D" "S:G485R"
    "S:F486D" "S:F486I" "S:F486L" "S:F486N" "S:F486P" "S:F486S" "S:F486T" "S:F486V"
    "S:N487D" "S:N487H" "S:N487S"
    "S:Y489H" "S:Y489W"
    "S:F490G" "S:F490I" "S:F490L" "S:F490R" "S:F490S" "S:F490V" "S:F490Y"
    "S:Q493D" "S:Q493E" "S:Q493H" "S:Q493K" "S:Q493L" "S:Q493R" "S:Q493V"
    "S:S494P" "S:S494R"
    "S:G496S"
    "S:Q498H"
    "S:P499H" "S:P499R" "S:P499S" "S:P499T"
    "S:N501T" "S:N501Y"
    "S:G504C" "S:G504D" "S:G504I" "S:G504L" "S:G504N" "S:G504R" "S:G504V"
    "S:P507A"
    "S:N856K" "S:N969K" "S:E990A" "S:T1009I"
)
variants_json=$(build_variants_json "Spike" 0 "${SPIKE_MUTATIONS[@]}")
body=$(jq -n \
    --argjson variants "$variants_json" \
    '{
        "name": "Spike mAb resistance mutations",
        "organism": "covid",
        "description": "SARS-CoV-2 Spike monoclonal antibody (mAb) resistance mutations as per Stanford Coronavirus Antiviral & Resistance database (last updated 21 August 2024).",
        "variants": $variants
    }')
create_collection "Spike mAb resistance mutations" "$body"

echo
echo "Done."
