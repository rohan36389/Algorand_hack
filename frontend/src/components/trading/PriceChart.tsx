'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import { Market } from '@/types/market';

interface PriceChartProps {
  market: Market;
}

export function PriceChart({ market }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const probIndex0 = market.totalPool > 0 ? (market.pools[0] / market.totalPool) : 0.5;

    const chartOptions = {
      layout: {
        textColor: 'black',
        background: { type: ColorType.Solid, color: 'white' }
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    };

    const chart = createChart(chartContainerRef.current, chartOptions);

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 2,
    });

    // Generate historical mock data leading up to current probability
    const data = [];
    let currentPrice = 0.5;
    const now = Math.floor(Date.now() / 1000);
    const day = 24 * 60 * 60;

    for (let i = 14; i >= 0; i--) {
      // simulate drift towards probIndex0
      const drift = (probIndex0 - currentPrice) / (i + 1);
      const randomNoise = (Math.random() - 0.5) * 0.05;
      currentPrice += drift + randomNoise;
      currentPrice = Math.max(0.01, Math.min(0.99, currentPrice));

      data.push({
        time: now - (i * day),
        value: Number(currentPrice.toFixed(2))
      });
    }

    lineSeries.setData(data as any);

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth || 0
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [market.id, market.totalPool]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Probability Chart</h3>
      <div ref={chartContainerRef} className="w-full h-[300px]" />
    </div>
  );
}
