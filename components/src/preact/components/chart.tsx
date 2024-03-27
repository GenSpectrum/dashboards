import { useEffect, useRef } from 'preact/hooks';
import { Chart, ChartConfiguration } from 'chart.js';

export interface GsChartProps {
    configuration: ChartConfiguration;
}

const GsChart = ({ configuration }: GsChartProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (canvasRef.current === null) {
            return;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (ctx === null) {
            return;
        }

        chartRef.current = new Chart(ctx, configuration);

        return () => {
            chartRef.current?.destroy();
        };
    }, [canvasRef, configuration]);

    return <canvas ref={canvasRef} />;
};

export default GsChart;
