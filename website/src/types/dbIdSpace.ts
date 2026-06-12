export const dbIdSpaces = {
    prod: 'prod',
    staging: 'staging',
    local: 'local',
} as const;

export type DbIdSpace = (typeof dbIdSpaces)[keyof typeof dbIdSpaces];

export function getDbIdSpace(): DbIdSpace {
    const envValue = process.env.DB_ID_SPACE ?? import.meta.env.DB_ID_SPACE;
    if (!envValue) {
        return dbIdSpaces.prod;
    }
    const validValues: string[] = [dbIdSpaces.prod, dbIdSpaces.staging, dbIdSpaces.local];
    if (validValues.includes(envValue)) {
        return envValue as DbIdSpace;
    }
    throw new Error(
        `Environment variable DB_ID_SPACE (value '${envValue}') is not valid. Expected one of: ${validValues.join(', ')}`,
    );
}
