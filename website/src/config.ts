import { z, ZodError } from 'zod';
import fs from 'fs';
import path from 'path';
import { allOrganisms, type Organism } from './routes/View.ts';

const DASHBOARDS_CONFIG_FILE = 'dashboards_config.json';

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
            /**
             * The URL of the OIDC issuer, e.g. `https://keycloak.example.com/realms/myrealm`
             */
            issuer: z.string(),
            /**
             * The client ID for the OIDC client
             */
            clientId: z.string(),
            /**
             * The client secret for the OIDC client
             */
            clientSecret: z.string(),
        }),
    });
export type DashboardsConfig = z.infer<typeof dashboardsConfigSchema>;

let dashboardsConfig: DashboardsConfig | null = null;

export function getDashboardsConfig(): DashboardsConfig {
    if (dashboardsConfig === null) {
        dashboardsConfig = readTypedConfigFile(DASHBOARDS_CONFIG_FILE, dashboardsConfigSchema);
    }
    return dashboardsConfig;
}

export function getLapisUrl(organism: Organism): string {
    return getDashboardsConfig()[organism].lapisUrl;
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
