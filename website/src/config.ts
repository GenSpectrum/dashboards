import { z, ZodError } from 'zod';
import fs from 'fs';
import path from 'path';
import { allOrganisms, type Organism } from './routes/View.ts';
import YAML from 'yaml';

const lapisConfigSchema = z.object({
    url: z.string(),
    mainDateField: z.string(),
    locationFields: z.array(z.string()),
    lineageField: z.string(),
    hostField: z.string(),
    authorsField: z.optional(z.string()),
    authorAffiliationsField: z.optional(z.string()),
    originatingLabField: z.optional(z.string()),
    submittingLabField: z.optional(z.string()),
});

const organismConfigSchema = z.object({ lapis: lapisConfigSchema });
export type OrganismConfig = z.infer<typeof organismConfigSchema>;

const organismsConfigSchema = z.object(
    allOrganisms.reduce(
        (acc, organism) => ({
            ...acc,
            [organism]: organismConfigSchema,
        }),
        {} as { [organism in Organism]: typeof organismConfigSchema },
    ),
);
export type OrganismsConfig = z.infer<typeof organismsConfigSchema>;

const dashboardsConfigSchema = z.object({
    dashboards: z.object({
        organisms: organismsConfigSchema,
        auth: z.object({
            github: z.object({
                /**
                 * The client id of the GitHub App used for authentication.
                 * https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-a-login-with-github-button-with-a-github-app#store-the-client-id-and-client-secret
                 */
                clientId: z.string(),
            }),
        }),
    }),
});
export type DashboardsConfig = z.infer<typeof dashboardsConfigSchema>;

const environmentSchema = z.union([
    z.literal('dashboards-dev'),
    z.literal('dashboards-staging'),
    z.literal('dashboards-prod'),
]);

let dashboardsConfig: DashboardsConfig | null = null;

export function getDashboardsConfig(): DashboardsConfig {
    if (dashboardsConfig === null) {
        const environment = getEnvironment();
        dashboardsConfig = readTypedConfigFile(`application-${environment}.yaml`, dashboardsConfigSchema);
    }
    return dashboardsConfig;
}

export function getOrganismConfig(organism: Organism): OrganismConfig {
    return getDashboardsConfig().dashboards.organisms[organism];
}

export function getLapisUrl(organism: Organism): string {
    return getOrganismConfig(organism).lapis.url;
}

let backendHost: string | null = null;

export function getBackendHost(): string {
    if (backendHost === null) {
        backendHost = processEnvOrMetaEnv('BACKEND_URL', z.string().min(1));
    }
    return backendHost;
}

export function getGitHubClientId(): string {
    return (
        processEnvOrMetaEnv('GITHUB_CLIENT_ID', z.string().optional()) ||
        getDashboardsConfig().dashboards.auth.github.clientId
    );
}

export function getGitHubClientSecret(): string {
    return processEnvOrMetaEnv('GITHUB_CLIENT_SECRET', z.string().min(1));
}

function getConfigDir(): string {
    const configDir = import.meta.env.CONFIG_DIR;
    if (typeof configDir !== 'string' || configDir === '') {
        throw new Error(`CONFIG_DIR environment variable was not set during build time, is '${configDir}'`);
    }
    return configDir;
}

function getEnvironment() {
    return processEnvOrMetaEnv('DASHBOARDS_ENVIRONMENT', environmentSchema);
}

function processEnvOrMetaEnv<T>(key: string, schema: z.ZodType<T>) {
    const envValue = process.env[key] || import.meta.env[key];
    const parsedValue = schema.safeParse(envValue);
    if (parsedValue.success) {
        return parsedValue.data;
    }
    throw new Error(
        `Environment variable ${key} (value '${envValue}') is not of the expected type: ${parsedValue.error.message}`,
    );
}

function readTypedConfigFile<T>(fileName: string, schema: z.ZodType<T>) {
    const configFilePath = path.join(getConfigDir(), fileName);
    const yaml = YAML.parse(fs.readFileSync(configFilePath, 'utf8'));
    try {
        return schema.parse(yaml);
    } catch (e) {
        const zodError = e as ZodError;
        throw new Error(`Type error reading ${configFilePath}: ${zodError.message}`);
    }
}
