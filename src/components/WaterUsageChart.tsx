
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WaterUsageData {
  name: string;
  current: number;
  recommended: number;
}

interface WaterUsageChartProps {
  data: WaterUsageData[];
  language: 'en' | 'hi';
}

const WaterUsageChart: React.FC<WaterUsageChartProps> = ({ data, language }) => {
  const tooltipLabels = {
    en: {
      current: 'Current Usage',
      recommended: 'Recommended Usage'
    },
    hi: {
      current: 'वर्तमान उपयोग',
      recommended: 'अनुशंसित उपयोग'
    }
  };

  const labels = {
    en: {
      title: 'Water Usage Comparison',
      yAxis: 'Water (liters per acre)',
      legend1: 'Current Usage',
      legend2: 'Recommended Usage'
    },
    hi: {
      title: 'जल उपयोग तुलना',
      yAxis: 'पानी (लीटर प्रति एकड़)',
      legend1: 'वर्तमान उपयोग',
      legend2: 'अनुशंसित उपयोग'
    }
  };

  return (
    <div className="w-full h-80 mt-6">
      <h3 className="text-lg font-semibold mb-2 text-center">
        {labels[language].title}
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: labels[language].yAxis, angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value, name) => {
              const formattedValue = `${value.toLocaleString()} L`;
              const label = name === 'current' ? tooltipLabels[language].current : tooltipLabels[language].recommended;
              return [formattedValue, label];
            }}
          />
          <Legend />
          <Bar dataKey="current" name={labels[language].legend1} fill="#219ebc" />
          <Bar dataKey="recommended" name={labels[language].legend2} fill="#52b788" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WaterUsageChart;
