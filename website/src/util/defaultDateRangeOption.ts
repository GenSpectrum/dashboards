import { type DateRangeOption, dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

export const defaultDateRangeOption = {
    since2000: { label: 'Since 2000', dateFrom: '2000-01-01' },
    since2020: { label: 'Since 2020', dateFrom: '2020-01-01' },
    before2000: { label: 'Before 2000', dateTo: '1999-12-31' },
    from2000to2009: { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
    from2010to2019: { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
    year2024: { label: '2024', dateFrom: '2024-01-01', dateTo: '2024-12-31' },
    year2023: { label: '2023', dateFrom: '2023-01-01', dateTo: '2023-12-31' },
    year2022: { label: '2022', dateFrom: '2022-01-01', dateTo: '2022-12-31' },
    year2021: { label: '2021', dateFrom: '2021-01-01', dateTo: '2021-12-31' },
    year2020: { label: '2020', dateFrom: '2020-01-01', dateTo: '2020-12-31' },
    since2021: { label: 'Since 2021', dateFrom: '2021-01-01' },
    before2021: { label: 'Before 2021', dateTo: '2020-12-31' },
    since2017: { label: 'Since 2017', dateFrom: '2017-01-01' },
    from2017to2020: { label: '2017-2020', dateFrom: '2017-01-01', dateTo: '2020-12-31' },
    before2017: { label: 'Before 2017', dateTo: '2016-12-31' },
} satisfies { [key: string]: DateRangeOption };

export const defaultDateRangeOptions = [
    dateRangeOptionPresets.last6Months,
    dateRangeOptionPresets.lastYear,
    defaultDateRangeOption.since2020,
    defaultDateRangeOption.from2010to2019,
    defaultDateRangeOption.from2000to2009,
    defaultDateRangeOption.since2000,
    defaultDateRangeOption.before2000,
    dateRangeOptionPresets.allTimes,
];

export const fineGrainedDefaultDateRangeOptions = [
    dateRangeOptionPresets.lastMonth,
    dateRangeOptionPresets.last2Months,
    dateRangeOptionPresets.last3Months,
    dateRangeOptionPresets.last6Months,
    dateRangeOptionPresets.lastYear,
    defaultDateRangeOption.since2020,
    defaultDateRangeOption.from2010to2019,
    defaultDateRangeOption.from2000to2009,
    defaultDateRangeOption.since2000,
    defaultDateRangeOption.before2000,
    dateRangeOptionPresets.allTimes,
];
