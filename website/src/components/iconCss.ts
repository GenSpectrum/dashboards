import { z } from 'zod';

export const externalLinkIconCss = 'after:iconify after:align-middle after:mdi--external-link';

export const iconMapping = {
    tube: 'mdi--test-tube',
    magnify: 'mdi--magnify',
    compare: 'mdi--compare-horizontal',
    database: 'mdi--database-outline',
    virus: 'mdi--virus-outline',
    table: 'mdi--table',
    chartSankey: 'mdi--chart-sankey',
} as const;

export const menuIconTypeSchema = z.enum(Object.keys(iconMapping) as [keyof typeof iconMapping]);
export type MenuIconType = z.infer<typeof menuIconTypeSchema>;
