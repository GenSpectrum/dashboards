import { TemporalGranularity } from '../../types';
import { getPrevalenceOverTimeTableData } from './getPrevalenceOverTimeTableData';
import { PrevalenceOverTimeData } from '../../query/queryPrevalenceOverTime';
import { Table } from '../components/table';

interface PrevalenceOverTimeTableProps {
    data: PrevalenceOverTimeData;
    granularity: TemporalGranularity;
}

const PrevalenceOverTimeTable = ({ data, granularity }: PrevalenceOverTimeTableProps) => {
    const getSplitColumns = (data: PrevalenceOverTimeData) => {
        return data.map((dataset) => ({
            name: dataset.displayName,
            columns: [
                {
                    name: 'prevalence',
                    sort: true,
                },
                {
                    name: 'count',
                    sort: true,
                },
            ],
        }));
    };

    const getColumns = (data: PrevalenceOverTimeData) => [
        {
            name: granularity,
            sort: true,
        },
        ...getSplitColumns(data),
    ];

    const getData = (data: PrevalenceOverTimeData, granularity: TemporalGranularity) => {
        const dataByHeader = getPrevalenceOverTimeTableData(data, granularity);
        return Object.values(dataByHeader).map((row) => Object.values(row));
    };

    return <Table data={getData(data, granularity)} columns={getColumns(data)} pagination={false} />;
};

export default PrevalenceOverTimeTable;
