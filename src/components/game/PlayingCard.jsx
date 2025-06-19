import React from "react";
import { Heart, Diamond, Club, Spade } from "lucide-react";

// card suit icons
const suitIcons = {
  hearts: Heart,
  diamonds: Diamond,
  clubs: Club,
  spades: Spade
};

// card suit colors
const suitColors = {
  hearts: "#ef4444",
  diamonds: "#ef4444", 
  clubs: "#1f2937",
  spades: "#1f2937"
};

export default function PlayingCard({ card, hidden = false, className = "", index = 0 }) {
  // if card is hidden, show back of card
  if (hidden) {
    return (
      <div 
        className={`w-16 h-24 bg-red-800 rounded-lg shadow-lg flex items-center justify-center transform transition-all duration-700 ease-out ${className}`}
        style={{
          animationDelay: `${index * 200}ms`,
          background: 'linear-gradient(45deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)'
        }}
      >
        <div className="w-12 h-16 bg-red-900 rounded shadow-inner flex items-center justify-center border-2 border-red-900/50">
          <div className="w-8 h-8 bg-red-800 rounded-full shadow-inner flex items-center justify-center">
            <div className="w-4 h-4 bg-yellow-400 rounded-full opacity-60"></div>
          </div>
        </div>
      </div>
    );
  }

  // if no card data
  if (!card) return null;

  const SuitIcon = suitIcons[card.suit];
  const suitColor = suitColors[card.suit];

  return (
    <div 
      className={`w-16 h-24 bg-white rounded-lg shadow-lg border border-gray-100 flex flex-col transform transition-all duration-700 ease-out hover:scale-110 hover:-translate-y-2 ${className}`}
      style={{
        animationDelay: `${index * 200}ms`,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), 0 6px 20px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div className="flex-1 p-2 flex flex-col justify-between">
        <div className="flex flex-col items-center">
          <span 
            className="text-sm font-bold leading-none"
            style={{ color: suitColor }}
          >
            {card.rank}
          </span>
          {SuitIcon && (
            <SuitIcon 
              className="w-3 h-3 mt-1" 
              style={{ color: suitColor }}
              fill={suitColor}
            />
          )}
        </div>
        
        <div className="flex justify-center">
          {SuitIcon && (
            <SuitIcon 
              className="w-6 h-6" 
              style={{ color: suitColor }}
              fill={suitColor}
            />
          )}
        </div>
        
        <div className="flex flex-col items-center rotate-180">
          <span 
            className="text-sm font-bold leading-none"
            style={{ color: suitColor }}
          >
            {card.rank}
          </span>
          {SuitIcon && (
            <SuitIcon 
              className="w-3 h-3 mt-1" 
              style={{ color: suitColor }}
              fill={suitColor}
            />
          )}
        </div>
      </div>
    </div>
  );
}