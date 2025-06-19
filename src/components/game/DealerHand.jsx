import React from "react";
import PlayingCard from "./PlayingCard";

export default function DealerHand({ cards, gameStatus }) {
  let dealerValue = 0;
  let hasHiddenCard = false;

  // calculate dealer hand value
  if (cards) {
    const visibleCards = cards.filter(card => {
        if (card.hidden) hasHiddenCard = true;
        return !card.hidden;
    });
    
    // add up visible card values
    for (let i = 0; i < visibleCards.length; i++) {
      dealerValue += visibleCards[i].value || 0;
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex -space-x-3 h-24 items-center min-w-[80px] justify-center">
        {cards && cards.map((card, index) => (
          <PlayingCard
            key={index}
            card={card}
            hidden={card.hidden}
            index={index}
            className="hover:translate-y-1 transition-transform duration-500 ease-out"
          />
        ))}
      </div>
      <div className="">
        <span className="text-yellow-300 my-4 p-0 text-xl font-medium">
          {dealerValue > 0 ? dealerValue : ''}
          {!hasHiddenCard && dealerValue === 21 && cards.length === 2 && ' (Blackjack!)'}
          {!hasHiddenCard && dealerValue > 21 && ' (Bust)'}
        </span>
      </div>
    </div>
  );
}