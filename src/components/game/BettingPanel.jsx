
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const chipValues = [25, 50, 100, 250, 500];

export default function BettingPanel({ player, onPlaceBet, onStartGame, allPlayersReady, tableLimit }) {
  // calculate minimum bet (1% of table limit)
  const minBet = tableLimit * 0.01;
  const [selectedBet, setSelectedBet] = useState(minBet);

  // when component loads or minBet changes
  useEffect(() => {
    setSelectedBet(minBet);
  }, [minBet]);

  // handle placing bet
  function handlePlaceBet() {
    if (selectedBet >= minBet && selectedBet <= player.chips) {
      onPlaceBet(selectedBet);
    }
  }

  // handle bet input change
  function handleBetChange(e) {
    const val = parseInt(e.target.value);
    if (isNaN(val)) {
        setSelectedBet(0);
    } else if (val > player.chips) {
        setSelectedBet(player.chips);
    } else {
        setSelectedBet(val);
    }
  }

  // check if bet is valid
  const betIsInvalid = selectedBet < minBet || selectedBet > player.chips;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm p-3 rounded-xl shadow-lg w-full max-w-lg z-20 border border-gray-700">
      <div className="flex flex-col items-center space-y-2">
        <h3 className="text-sm font-bold text-yellow-200">Place Your Bet (Min: ${minBet})</h3>
        <div className="w-full px-4">
          <Input
            type="number"
            value={selectedBet}
            onChange={handleBetChange}
            placeholder="Enter bet amount"
            className="h-10 text-center text-lg bg-gray-900/70 text-white shadow-inner border-gray-600 focus-visible:ring-red-500"
            min={minBet}
          />
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {chipValues.filter(v => v >= minBet).map(value => (
            <button 
              key={value} 
              onClick={() => setSelectedBet(value)} 
              className="px-3 py-1 bg-gray-700/80 text-yellow-200 font-semibold rounded-lg shadow-md hover:bg-gray-600/80 transition-all duration-200 text-xs"
            >
              ${value}
            </button>
          ))}
           <button 
             onClick={() => setSelectedBet(player.chips)} 
             className="px-3 py-1 bg-blue-600/80 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500/80 transition-all duration-200 text-xs"
           >
              All In
            </button>
        </div>
        <div className="flex gap-2 mt-1">
          {player.bet === 0 ? (
            <Button
                onClick={handlePlaceBet}
                disabled={betIsInvalid}
                className="px-6 py-2 bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200 border-0 disabled:opacity-50 text-sm"
            >
                Place Bet (${selectedBet})
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => onPlaceBet(0)}
                className="px-4 py-2 bg-gray-600/50 text-white font-medium rounded-lg shadow-lg hover:bg-gray-500/50 transition-all duration-200 border-0 text-sm"
              >
                Clear Bet
              </Button>
              {allPlayersReady && (
                <Button
                  onClick={onStartGame}
                  className="px-6 py-2 bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200 border-0 text-sm animate-pulse"
                >
                  Start Game
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
