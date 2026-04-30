#!/usr/bin/env node
// Seeds example collections into the backend.
// Idempotent: skips any collection whose name already exists for the seed user.
//
// Run with --help for usage.

import { parseArgs } from 'node:util';

const HELP = `\
Usage: node seed.mjs [options]

Options:
  -u, --url <url>              Backend base URL (default: $BACKEND_URL or http://localhost:8080)
      --user-id <id>           User ID for direct backend access (default: $SEED_USER_ID or example-data-seeder)
  -t, --session-token <token>  Session token for staging/prod (uses website proxy, injects user from session)
      --wait                   Retry until backend is ready (auto-enabled when no TTY)
  -h, --help                   Show this help

Examples:
  # Local backend running on :8080
  node seed.mjs

  # Local backend on a different port
  node seed.mjs --url http://localhost:9021

  # Staging via session token (grab __Secure-authjs.session-token from browser DevTools → Application → Cookies)
  node seed.mjs --url https://staging.genspectrum.org --session-token eyJhbG...

  # Prod
  node seed.mjs --url https://genspectrum.org --session-token eyJhbG...
`;

let parsedArgs;
try {
    parsedArgs = parseArgs({
        options: {
            url:            { type: 'string',  short: 'u' },
            'user-id':      { type: 'string' },
            'session-token':{ type: 'string',  short: 't' },
            wait:           { type: 'boolean' },
            help:           { type: 'boolean', short: 'h' },
        },
    });
} catch (err) {
    console.error(`Error: ${err.message}\n`);
    console.error(HELP);
    process.exit(1);
}

const { values } = parsedArgs;

if (values.help) {
    console.log(HELP);
    process.exit(0);
}

const BACKEND_URL   = values.url            ?? process.env.BACKEND_URL   ?? 'http://localhost:8080';
const SEED_USER_ID  = values['user-id']     ?? process.env.SEED_USER_ID  ?? 'example-data-seeder';
const SESSION_TOKEN = values['session-token'] ?? null;
// Auto-enable wait when there's no TTY (e.g. running inside Docker).
const WAIT          = values.wait ?? !process.stdout.isTTY;

const RETRY_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

// When a session token is provided we go through the website proxy at /api/collections,
// which resolves the user from the session. The cookie name differs by scheme.
const USE_SESSION_AUTH = SESSION_TOKEN !== null;
const COLLECTIONS_BASE = USE_SESSION_AUTH
    ? `${BACKEND_URL}/api/collections`
    : `${BACKEND_URL}/collections`;

function authHeaders() {
    if (!USE_SESSION_AUTH) return {};
    const cookieName = BACKEND_URL.startsWith('https://')
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token';
    return { Cookie: `${cookieName}=${SESSION_TOKEN}` };
}

// Converts a genomic mutation code to a mature protein name with the given offset.
// e.g. matureName("ORF1a:T3284I", "3CLpro", -3263) => "3CLpro:T21I"
function matureName(mutation, setName, offset) {
    const mutationPart = mutation.slice(mutation.indexOf(':') + 1);
    const originalBase = mutationPart[0];
    const newBase = mutationPart[mutationPart.length - 1];
    const position = parseInt(mutationPart.match(/\d+/)[0], 10);
    return `${setName}:${originalBase}${position + offset}${newBase}`;
}

function buildVariants(mutations, setName, offset) {
    return mutations.map((mutation) => ({
        type: 'filterObject',
        name: matureName(mutation, setName, offset),
        filterObject: { aminoAcidMutations: [mutation] },
    }));
}

// --- Collection definitions ---

const CLPRO_MUTATIONS = [
    'ORF1a:T3284I', 'ORF1a:T3288A', 'ORF1a:T3288N', 'ORF1a:T3308I', 'ORF1a:D3311Y',
    'ORF1a:M3312I', 'ORF1a:M3312L', 'ORF1a:M3312T', 'ORF1a:M3312-', 'ORF1a:L3313F',
    'ORF1a:G3401S', 'ORF1a:F3403L', 'ORF1a:F3403S', 'ORF1a:N3405D', 'ORF1a:N3405L',
    'ORF1a:N3405S', 'ORF1a:G3406S', 'ORF1a:S3407A', 'ORF1a:S3407E', 'ORF1a:S3407L',
    'ORF1a:S3407P', 'ORF1a:C3423F', 'ORF1a:M3428R', 'ORF1a:M3428T', 'ORF1a:E3429A',
    'ORF1a:E3429G', 'ORF1a:E3429K', 'ORF1a:E3429Q', 'ORF1a:E3429V', 'ORF1a:L3430F',
    'ORF1a:P3431-', 'ORF1a:T3432I', 'ORF1a:H3435L', 'ORF1a:H3435N', 'ORF1a:H3435Q',
    'ORF1a:H3435Y', 'ORF1a:A3436T', 'ORF1a:A3436V', 'ORF1a:V3449A', 'ORF1a:R3451G',
    'ORF1a:R3451S', 'ORF1a:Q3452I', 'ORF1a:Q3452K', 'ORF1a:T3453I', 'ORF1a:A3454T',
    'ORF1a:A3454V', 'ORF1a:Q3455A', 'ORF1a:Q3455C', 'ORF1a:Q3455D', 'ORF1a:Q3455E',
    'ORF1a:Q3455F', 'ORF1a:Q3455G', 'ORF1a:Q3455H', 'ORF1a:Q3455I', 'ORF1a:Q3455K',
    'ORF1a:Q3455L', 'ORF1a:Q3455N', 'ORF1a:Q3455P', 'ORF1a:Q3455R', 'ORF1a:Q3455S',
    'ORF1a:Q3455T', 'ORF1a:Q3455V', 'ORF1a:Q3455W', 'ORF1a:Q3455Y', 'ORF1a:A3456P',
    'ORF1a:A3457S', 'ORF1a:P3515L', 'ORF1a:V3560A', 'ORF1a:S3564P', 'ORF1a:T3567I',
    'ORF1a:F3568L',
];

const RDRP_MUTATIONS = [
    'ORF1b:V157A', 'ORF1b:V157L', 'ORF1b:N189S', 'ORF1b:R276C', 'ORF1b:A367V',
    'ORF1b:A440V', 'ORF1b:F471L', 'ORF1b:D475Y', 'ORF1b:A517V', 'ORF1b:V548L',
    'ORF1b:G662S', 'ORF1b:S750A', 'ORF1b:V783I', 'ORF1b:E787G', 'ORF1b:C790F',
    'ORF1b:C790R', 'ORF1b:E793A', 'ORF1b:E793D', 'ORF1b:M915R',
];

const SPIKE_MUTATIONS = [
    'S:P337H', 'S:P337L', 'S:P337R', 'S:P337S', 'S:P337T',
    'S:E340A', 'S:E340D', 'S:E340G', 'S:E340K', 'S:E340Q', 'S:E340V',
    'S:T345P',
    'S:R346G', 'S:R346I', 'S:R346K', 'S:R346S', 'S:R346T',
    'S:K356Q', 'S:K356T',
    'S:S371F', 'S:S371L',
    'S:D405E', 'S:D405N', 'S:E406D',
    'S:K417E', 'S:K417H', 'S:K417I', 'S:K417M', 'S:K417N', 'S:K417R', 'S:K417S', 'S:K417T',
    'S:D420A', 'S:D420N',
    'S:N439K',
    'S:N440D', 'S:N440E', 'S:N440I', 'S:N440K', 'S:N440R', 'S:N440T', 'S:N440Y',
    'S:S443Y',
    'S:K444E', 'S:K444F', 'S:K444I', 'S:K444L', 'S:K444M', 'S:K444N', 'S:K444R', 'S:K444T',
    'S:V445A', 'S:V445D', 'S:V445F', 'S:V445I', 'S:V445L',
    'S:G446A', 'S:G446D', 'S:G446I', 'S:G446N', 'S:G446R', 'S:G446S', 'S:G446T', 'S:G446V',
    'S:G447C', 'S:G447D', 'S:G447F', 'S:G447S', 'S:G447V',
    'S:N448D', 'S:N448K', 'S:N448T', 'S:N448Y',
    'S:Y449D',
    'S:N450D', 'S:N450K',
    'S:L452M', 'S:L452Q', 'S:L452R', 'S:L452W',
    'S:Y453F', 'S:Y453H',
    'S:L455F', 'S:L455M', 'S:L455S', 'S:L455W',
    'S:F456C', 'S:F456L', 'S:F456V',
    'S:S459P',
    'S:N460D', 'S:N460H', 'S:N460I', 'S:N460K', 'S:N460S', 'S:N460T', 'S:N460Y',
    'S:A475D', 'S:A475V',
    'S:G476D', 'S:G476R', 'S:G476T',
    'S:V483A',
    'S:E484A', 'S:E484D', 'S:E484G', 'S:E484K', 'S:E484P', 'S:E484Q', 'S:E484R', 'S:E484S', 'S:E484T', 'S:E484V',
    'S:G485D', 'S:G485R',
    'S:F486D', 'S:F486I', 'S:F486L', 'S:F486N', 'S:F486P', 'S:F486S', 'S:F486T', 'S:F486V',
    'S:N487D', 'S:N487H', 'S:N487S',
    'S:Y489H', 'S:Y489W',
    'S:F490G', 'S:F490I', 'S:F490L', 'S:F490R', 'S:F490S', 'S:F490V', 'S:F490Y',
    'S:Q493D', 'S:Q493E', 'S:Q493H', 'S:Q493K', 'S:Q493L', 'S:Q493R', 'S:Q493V',
    'S:S494P', 'S:S494R',
    'S:G496S',
    'S:Q498H',
    'S:P499H', 'S:P499R', 'S:P499S', 'S:P499T',
    'S:N501T', 'S:N501Y',
    'S:G504C', 'S:G504D', 'S:G504I', 'S:G504L', 'S:G504N', 'S:G504R', 'S:G504V',
    'S:P507A',
    'S:N856K', 'S:N969K', 'S:E990A', 'S:T1009I',
];

const COLLECTIONS = [
    {
        name: '3CLpro resistance mutations',
        organism: 'covid',
        description:
            'SARS-CoV-2 3C-like protease (3CLpro/Mpro) inhibitor resistance mutations as per Stanford Coronavirus Antiviral & Resistance database (last updated 21 August 2024).',
        variants: buildVariants(CLPRO_MUTATIONS, '3CLpro', -3263),
    },
    {
        name: 'RdRp resistance mutations',
        organism: 'covid',
        description:
            'SARS-CoV-2 RNA-dependent RNA polymerase (RdRp) inhibitor resistance mutations as per Stanford Coronavirus Antiviral & Resistance database (last updated 21 August 2024).',
        variants: buildVariants(RDRP_MUTATIONS, 'RdRp', 9),
    },
    {
        name: 'Spike mAb resistance mutations',
        organism: 'covid',
        description:
            'SARS-CoV-2 Spike monoclonal antibody (mAb) resistance mutations as per Stanford Coronavirus Antiviral & Resistance database (last updated 21 August 2024).',
        variants: buildVariants(SPIKE_MUTATIONS, 'Spike', 0),
    },
];

// --- API helpers ---

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBackend() {
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
            const response = await fetch(
                `${BACKEND_URL}/collections?userId=${SEED_USER_ID}&organism=covid`,
                { headers: authHeaders() },
            );
            if (response.ok || response.status === 404) return;
        } catch {
            // backend not ready yet
        }
        console.log(`Waiting for backend... (attempt ${attempt}/${RETRY_ATTEMPTS})`);
        await sleep(RETRY_DELAY_MS);
    }
    console.error(`Backend at ${BACKEND_URL} did not become ready after ${RETRY_ATTEMPTS} attempts.`);
    process.exit(1);
}

async function fetchExistingCollections(organism) {
    const url = USE_SESSION_AUTH
        ? `${COLLECTIONS_BASE}?organism=${encodeURIComponent(organism)}`
        : `${COLLECTIONS_BASE}?userId=${encodeURIComponent(SEED_USER_ID)}&organism=${encodeURIComponent(organism)}`;
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) {
        throw new Error(`GET /collections failed: ${response.status} ${await response.text()}`);
    }
    return response.json();
}

async function createCollection(collection) {
    const url = USE_SESSION_AUTH
        ? COLLECTIONS_BASE
        : `${COLLECTIONS_BASE}?userId=${encodeURIComponent(SEED_USER_ID)}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(collection),
    });
    if (response.status !== 201) {
        throw new Error(`POST /collections failed: ${response.status} ${await response.text()}`);
    }
    const created = await response.json();
    return created.id;
}

// --- Main ---

async function main() {
    if (USE_SESSION_AUTH) {
        console.log(`Seeding example data against ${BACKEND_URL} using session token...`);
    } else {
        console.log(`Seeding example data against ${BACKEND_URL} as user '${SEED_USER_ID}'...`);
    }

    if (WAIT) {
        await waitForBackend();
    }

    // Group collections by organism to minimise GET requests
    const byOrganism = {};
    for (const collection of COLLECTIONS) {
        (byOrganism[collection.organism] ??= []).push(collection);
    }

    let created = 0;
    let skipped = 0;

    for (const [organism, collections] of Object.entries(byOrganism)) {
        const existing = await fetchExistingCollections(organism);
        const existingNames = new Set(existing.map((c) => c.name));

        for (const collection of collections) {
            if (existingNames.has(collection.name)) {
                console.log(`  SKIP  ${collection.name}`);
                skipped++;
            } else {
                const id = await createCollection(collection);
                console.log(`  OK    id=${id}  ${collection.name}`);
                created++;
            }
        }
    }

    console.log(`\nDone. Created: ${created}, skipped (already exist): ${skipped}.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
