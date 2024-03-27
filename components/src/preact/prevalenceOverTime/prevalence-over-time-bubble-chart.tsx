import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { addUnit, minusTemporal } from '../../temporal';
import { getMinMaxNumber } from '../../utils';
import { PrevalenceOverTimeData } from '../../query/queryPrevalenceOverTime';
import { getYAxisScale, ScaleType } from '../../components/charts/getYAxisScale';
import GsChart from '../components/chart';
import { LogitScale } from '../../components/charts/LogitScale';

interface PrevalenceOverTimeBubbleChartProps {
    data: PrevalenceOverTimeData;
    yAxisScaleType: ScaleType;
}

Chart.register(...registerables, LogitScale);

const PrevalenceOverTimeBubbleChart = ({ data, yAxisScaleType }: PrevalenceOverTimeBubbleChartProps) => {
    const firstDate = data[0].content[0].dateRange!;
    const total = data.map((graphData) => graphData.content.map((dataPoint) => dataPoint.total)).flat();
    const [minTotal, maxTotal] = getMinMaxNumber(total)!;
    const scaleBubble = (value: number) => {
        return ((value - minTotal) / (maxTotal - minTotal)) * 4.5 + 0.5;
    };

    const config: ChartConfiguration = {
        type: 'bubble',
        data: {
            datasets: data.map((graphData) => ({
                label: graphData.displayName,
                data: graphData.content
                    .filter((dataPoint) => dataPoint.dateRange !== null)
                    .map((dataPoint) => ({
                        x: minusTemporal(dataPoint.dateRange!, firstDate),
                        y: dataPoint.prevalence,
                        r: scaleBubble(dataPoint.total),
                    })),
                borderWidth: 1,
                pointRadius: 0,
            })),
        },
        options: {
            animation: false,
            scales: {
                x: {
                    ticks: {
                        callback: (value) => addUnit(firstDate, value as number).toString(),
                    },
                },
                // @ts-expect-error-next-line -- chart.js typings are not complete with custom scales
                y: getYAxisScale(yAxisScaleType),
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: (context) => {
                            const dataset = data[context[0].datasetIndex!];
                            const dataPoint = dataset.content[context[0].dataIndex!];
                            return dataPoint.dateRange?.toString();
                        },
                        label: (context) => {
                            const dataset = data[context.datasetIndex!];
                            const dataPoint = dataset.content[context.dataIndex!];
                            return `${dataset.displayName}: ${(dataPoint.prevalence * 100).toFixed(2)}%, ${dataPoint.count}/${
                                dataPoint.total
                            } samples`;
                        },
                    },
                },
            },
        },
    };

    return <GsChart configuration={config} />;
};

export default PrevalenceOverTimeBubbleChart;
