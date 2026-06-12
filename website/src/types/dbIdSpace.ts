export const dbIdSpaces = {
    prod: 'prod',
    staging: 'staging',
    local: 'local',
} as const;

export type DbIdSpace = (typeof dbIdSpaces)[keyof typeof dbIdSpaces];
