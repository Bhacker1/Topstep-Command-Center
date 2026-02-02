import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { JournalEntry } from '../types';

interface ChartProps {
  data: JournalEntry[];
}

export const CumulativeChart: React.FC<ChartProps> = ({ data }) => {
  let runningTotal = 0;
  const chartData = data
    .filter(d => !d.isPayout)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
      runningTotal += entry.pnl;
      return {
        date: entry.date,
        value: runningTotal,
        daily: entry.pnl
      };
    });

  // Calculate gradient offset for "Stake-style" green/red line
  const gradientOffset = () => {
    const dataMax = Math.max(...chartData.map((i) => i.value));
    const dataMin = Math.min(...chartData.map((i) => i.value));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={1} />
              <stop offset={off} stopColor="#f43f5e" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'monospace' }} 
            tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric'})}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'monospace' }} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${val/1000}k`}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              borderRadius: '12px', 
              border: '1px solid #27272a',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              color: '#fff'
            }}
            itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
            labelStyle={{ color: '#a1a1aa', marginBottom: '0.5rem', fontSize: '12px' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative P/L']}
          />
          <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="url(#splitColor)" 
            strokeWidth={3} 
            dot={false} 
            activeDot={{ r: 6, fill: '#fff', strokeWidth: 0 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PayoutsChart: React.FC<ChartProps> = ({ data }) => {
  let runningTotal = 0;
  const chartData = data
    .filter(d => d.isPayout)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
      runningTotal += (entry.payoutAmount || 0);
      return {
        date: entry.date,
        value: runningTotal,
        amount: entry.payoutAmount
      };
    });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="payoutLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'monospace' }} 
            tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric'})}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'monospace' }} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${val/1000}k`}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              borderRadius: '12px', 
              border: '1px solid #27272a',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              color: '#fff'
            }}
            itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
            labelStyle={{ color: '#a1a1aa', marginBottom: '0.5rem', fontSize: '12px' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative Payouts']}
          />
          <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
          <Line 
            type="stepAfter" 
            dataKey="value" 
            stroke="url(#payoutLineGradient)" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#18181b', stroke: '#f59e0b', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#fff', strokeWidth: 0 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DailyBarChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = [...data]
    .filter(d => !d.isPayout)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
           <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <Tooltip 
            cursor={{fill: '#27272a'}}
            contentStyle={{ 
              backgroundColor: '#18181b', 
              borderRadius: '12px', 
              border: '1px solid #27272a',
              color: '#fff'
            }}
            itemStyle={{ fontFamily: 'monospace' }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <ReferenceLine y={0} stroke="#3f3f46" />
          <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} strokeWidth={0} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};