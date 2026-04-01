'use client';

/**
 * Recharts PieChart visualization of pool distribution
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { microAlgosToAlgo } from '@/lib/lora';

interface PoolChartProps {
  pools: number[];
  outcomes: string[];
  className?: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

export function PoolChart({ pools, outcomes, className = '' }: PoolChartProps) {
  const data = outcomes.map((outcome, index) => ({
    name: outcome,
    value: microAlgosToAlgo(pools[index]),
    microAlgos: pools[index],
  }));

  const totalAlgo = data.reduce((sum, item) => sum + item.value, 0);

  if (totalAlgo === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500">No bets placed yet</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => `${Number(value).toFixed(2)} ALGO`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Total Pool: <span className="font-semibold text-gray-900">{totalAlgo.toFixed(2)} ALGO</span>
        </p>
      </div>
    </div>
  );
}
