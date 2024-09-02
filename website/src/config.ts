import { z, ZodError } from 'zod';
import fs from 'fs';
import path from 'path';
import { allOrganisms, type Organism } from './routes/View.ts';

const DASHBOARDS_CONFIG_FILE = 'dashboards_config.json';
const SECRETS_FILE = 'secrets.json';

const lapisInstanceConfigSchema = z.object({ lapisUrl: z.string() });
export type LapisInstanceConfig = z.infer<typeof lapisInstanceConfigSchema>;

const dashboardsConfigSchema = z
    .object(
        allOrganisms.reduce(
            (acc, organism) => ({
                ...acc,
                [organism]: lapisInstanceConfigSchema,
            }),
            {} as { [organism in Organism]: typeof lapisInstanceConfigSchema },
        ),
    )
    .extend({
        auth: z.object({
            github: z.object({
                /**
                 * The client id of the GitHub App used for authentication.
                 * https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-a-login-with-github-button-with-a-github-app#store-the-client-id-and-client-secret
                 */
                clientId: z.string(),
            }),
        }),
        backend: z.object({
            url: z.string(),
        }),
    });

export type DashboardsConfig = z.infer<typeof dashboardsConfigSchema>;

const secretsConfigSchema = z.object({
    github: z.object({
        /**
         * The client secret of the GitHub App used for authentication.
         * https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-a-login-with-github-button-with-a-github-app#store-the-client-id-and-client-secret
         */
        clientSecret: z.string(),
    }),
});
export type SecretsConfig = z.infer<typeof secretsConfigSchema>;

let dashboardsConfig: DashboardsConfig | null = null;
let secretsConfig: SecretsConfig | null = null;

export function getDashboardsConfig(): DashboardsConfig {
    if (dashboardsConfig === null) {
        dashboardsConfig = readTypedConfigFile(DASHBOARDS_CONFIG_FILE, dashboardsConfigSchema);
    }
    return dashboardsConfig;
}

export function getLapisUrl(organism: Organism): string {
    return getDashboardsConfig()[organism].lapisUrl;
}

export function getSecretsConfig(): SecretsConfig {
    if (secretsConfig === null) {
        secretsConfig = readTypedConfigFile(SECRETS_FILE, secretsConfigSchema);
    }
    return secretsConfig;
}

function getConfigDir(): string {
    const configDir = import.meta.env.CONFIG_DIR;
    if (typeof configDir !== 'string' || configDir === '') {
        throw new Error(`CONFIG_DIR environment variable was not set during build time, is '${configDir}'`);
    }
    return configDir;
}

function readTypedConfigFile<T>(fileName: string, schema: z.ZodType<T>) {
    const configFilePath = path.join(getConfigDir(), fileName);
    const json = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    try {
        return schema.parse(json);
    } catch (e) {
        const zodError = e as ZodError;
        throw new Error(`Type error reading ${configFilePath}: ${zodError.message}`);
    }
}
