import React from 'react';

const MetricCard = ({ title, value, subtitle, color = "blue" }) => {
  const colorClasses = {
    blue: "border-blue-500 bg-blue-50 text-blue-700",
    red: "border-red-500 bg-red-50 text-red-700",
    green: "border-green-500 bg-green-50 text-green-700",
    yellow: "border-yellow-500 bg-yellow-50 text-yellow-700"
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 shadow-sm ${colorClasses[color]}`}>
      <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-xs mt-1 opacity-80">{subtitle}</p>
    </div>
  );
};

export default MetricCard;