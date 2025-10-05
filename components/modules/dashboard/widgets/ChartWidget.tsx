"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { WidgetProps } from '../types';

const mockBarData = [
  { name: 'Mon', tasks: 12, emails: 24 },
  { name: 'Tue', tasks: 19, emails: 32 },
  { name: 'Wed', tasks: 8, emails: 18 },
  { name: 'Thu', tasks: 15, emails: 28 },
  { name: 'Fri', tasks: 22, emails: 35 },
  { name: 'Sat', tasks: 5, emails: 8 },
  { name: 'Sun', tasks: 3, emails: 6 }
];

const mockPieData = [
  { name: 'Completed', value: 65, color: 'var(--success)' },
  { name: 'In Progress', value: 25, color: 'var(--primary)' },
  { name: 'Pending', value: 10, color: 'var(--warning)' }
];

const mockLineData = [
  { name: 'Week 1', productivity: 65 },
  { name: 'Week 2', productivity: 72 },
  { name: 'Week 3', productivity: 68 },
  { name: 'Week 4', productivity: 85 }
];

export function ChartWidget({ widget }: WidgetProps) {
  const chartType = widget.config.chartType || 'bar';
  const title = widget.config.chartTitle || 'Weekly Activity';

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mockPieData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={10}
              >
                {mockPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockLineData}>
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <Line 
                type="monotone" 
                dataKey="productivity" 
                stroke="var(--primary)" 
                strokeWidth={2}
                dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      default: // bar chart
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockBarData}>
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <Bar 
                dataKey="tasks" 
                fill="var(--primary)" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="emails" 
                fill="var(--info)" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chart Title */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[var(--text-primary)]">
          {title}
        </h4>
        {chartType === 'bar' && (
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[var(--primary)] rounded"></div>
              <span className="text-xs text-[var(--text-secondary)]">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[var(--info)] rounded"></div>
              <span className="text-xs text-[var(--text-secondary)]">Emails</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {renderChart()}
      </div>
    </div>
  );
}