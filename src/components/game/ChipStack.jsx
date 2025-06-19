import React from "react";

const chipColors = {
  1: "#ffffff",
  5: "#ef4444", 
  25: "#22c55e",
  100: "#1f2937",
  500: "#7c3aed"
};

export default function ChipStack({ value, count = 1, onClick, className = "" }) {
  const color = chipColors[value] || "#6b7280";
  
  return (
    <div 
      className={`relative cursor-pointer transition-transform hover:scale-105 ${className}`}
      onClick={onClick}
    >
      {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
        <div
          key={index}
          className="w-12 h-12 rounded-full shadow-neumorphic border-2 border-gray-300 flex items-center justify-center font-bold text-sm absolute"
          style={{ 
            backgroundColor: color,
            color: value === 1 ? '#1f2937' : '#ffffff',
            top: -index * 2,
            left: 0,
            zIndex: 5 - index
          }}
        >
          {value}
        </div>
      ))}
      {count > 5 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-neumorphic">
          {count}
        </div>
      )}
    </div>
  );
}