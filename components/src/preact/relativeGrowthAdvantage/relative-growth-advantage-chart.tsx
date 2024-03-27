import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { YearMonthDay } from '../../temporal';
import { getYAxisScale, ScaleType } from '../../components/charts/getYAxisScale';
import GsChart from '../components/chart';
import { LogitScale } from '../../components/charts/LogitScale';

interface RelativeGrowthAdvantageChartData {
    t: YearMonthDay[];
    proportion: number[];
    ciLower: number[];
    ciUpper: number[];
    observed: number[];
}

interface RelativeGrowthAdvantageChartProps {
    data: RelativeGrowthAdvantageChartData;
    yAxisScaleType: ScaleType;
}

Chart.register(...registerables, LogitScale);

const RelativeGrowthAdvantageChart = ({ data, yAxisScaleType }: RelativeGrowthAdvantageChartProps) => {
    const config: ChartConfiguration = {
        type: 'line',
        data: {
            labels: data.t,
            datasets: [
                {
                    type: 'line',
                    label: 'Prevalence',
                    data: data.proportion,
                    borderWidth: 1,
                    pointRadius: 0,
                },
                {
                    type: 'line',
                    label: 'CI Lower',
                    data: data.ciLower,
                    borderWidth: 1,
                    pointRadius: 0,
                },
                {
                    type: 'line',
                    label: 'CI Upper',
                    data: data.ciUpper,
                    borderWidth: 1,
                    pointRadius: 0,
                },
                {
                    type: 'scatter',
                    label: 'Observed',
                    data: data.observed,
                    pointRadius: 1,
                },
            ],
        },
        options: {
            animation: false,
            scales: {
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
                },
            },
        },
    };

    return <GsChart configuration={config} />;
};

export default RelativeGrowthAdvantageChart;
