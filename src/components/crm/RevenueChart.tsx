'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface RevenueChartProps {
  data?: Array<{ month: string; value: number }>;
}

const defaultData = [
  { month: 'Sep', value: 45000 },
  { month: 'Oct', value: 62000 },
  { month: 'Nov', value: 58000 },
  { month: 'Dec', value: 81000 },
  { month: 'Jan', value: 73000 },
  { month: 'Feb', value: 92000 },
  { month: 'Mar', value: 108000 },
];

const formatValue = (value: number) => {
  if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
  return `£${value}`;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: '#121320',
        border: '1px solid #1E2035',
        borderRadius: 8,
        padding: '8px 12px',
      }}
    >
      <p style={{ color: '#6B7299', fontSize: 12, margin: 0 }}>{label}</p>
      <p style={{ color: '#F1F3FA', fontSize: 14, fontWeight: 600, margin: '4px 0 0' }}>
        {formatValue(payload[0].value)}
      </p>
    </div>
  );
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data ?? defaultData;

  return (
    <div
      style={{
        backgroundColor: '#0F1019',
        border: '1px solid #1E2035',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div className="mb-4">
        <h3 style={{ color: '#F1F3FA', fontSize: 16, fontWeight: 600, margin: 0 }}>
          Revenue Trend
        </h3>
        <p style={{ color: '#6B7299', fontSize: 13, margin: '4px 0 0' }}>Last 7 months</p>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7299', fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="value" fill="url(#barGradient)" barSize={32} radius={[6, 6, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={index} fill="url(#barGradient)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
