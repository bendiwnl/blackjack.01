
import React from "react";
import { User, Loader2 } from "lucide-react";
import PlayingCard from "./PlayingCard";

// component for showing a hand of cards
const HandDisplay = ({ cards, handValue, status, isActive, bet }) => (
  <div className={`transition-all duration-500 ${isActive ? 'ring-2 ring-yellow-400 rounded-lg p-2 bg-green-600 bg-opacity-30' : 'p-2'}`}>
    <div className="flex -space-x-4 h-24 items-center justify-center min-h-[6rem] min-w-[5rem]">
      {cards.map((card, index) => (
        <PlayingCard
          key={index}
          card={card}
          index={index}
          className="hover:-translate-y-1 transition-all duration-500 ease-out"
        />
      ))}
    </div>
    {cards.length > 0 && (
      <div className="bg-green-700 border border-yellow-400 px-3 py-1 mt-2 rounded-full shadow-lg text-center">
        <span className="text-sm font-semibold text-yellow-300">
          {handValue}
          {status === 'blackjack' && ' (21!)'}
          {status === 'busted' && ' (Bust)'}
        </span>
      </div>
    )}
  </div>
);

export default function PlayerSeat({ 
  player, 
  position, 
  isEmpty = false, 
  isCurrentTurn = false,
  onJoinSeat,
  onAction,
  isJoining = false
}) {
  // if seat is empty
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center space-y-3">
        <button
          onClick={() => onJoinSeat && onJoinSeat(position)}
          disabled={!onJoinSeat || isJoining}
          className="w-20 h-20 bg-black/20 border-2 border-dashed border-yellow-400/50 rounded-full shadow-lg hover:border-solid hover:border-yellow-400 hover:bg-black/40 transition-all duration-300 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJoining ? (
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
          ) : (
            <User className="w-8 h-8 text-yellow-400/80 group-hover:text-yellow-300" />
          )}
        </button>
        <div className="text-center">
          <p className="text-sm text-yellow-200 opacity-80">
            {onJoinSeat ? 'Click to join' : 'Already seated'}
          </p>
        </div>
      </div>
    );
  }

  // if no player data
  if (!player) return <div></div>;

  // check if player can split
  const canSplit = isCurrentTurn && player.status === 'playing' && !player.has_split && player.cards.length === 2 && player.cards[0].rank === player.cards[1].rank && player.chips >= player.bet;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex gap-2">
        <HandDisplay
          cards={player.cards}
          handValue={player.hand_value}
          status={player.status}
          isActive={isCurrentTurn && player.active_hand_index === 0}
          bet={player.bet}
        />
        {player.has_split && (
          <HandDisplay
            cards={player.split_cards}
            handValue={player.split_hand_value}
            status={player.split_status}
            isActive={isCurrentTurn && player.active_hand_index === 1}
            bet={player.split_bet}
          />
        )}
      </div>

      {isCurrentTurn && onAction && (
        <div className="flex gap-2 mt-2 flex-wrap justify-center">
          <button
            onClick={() => onAction('hit')}
            className="px-4 py-1.5 text-sm bg-black/40 border border-yellow-400 text-yellow-300 font-semibold rounded-lg shadow-lg hover:bg-yellow-400 hover:text-black transition-all duration-200"
          >
            Hit
          </button>
          <button
            onClick={() => onAction('stand')}
            className="px-4 py-1.5 text-sm bg-black/40 border border-yellow-400 text-yellow-300 font-semibold rounded-lg shadow-lg hover:bg-yellow-400 hover:text-black transition-all duration-200"
          >
            Stand
          </button>
          <button
            onClick={() => onAction('double')}
            className="px-4 py-1.5 text-sm bg-black/40 border border-yellow-400 text-yellow-300 font-semibold rounded-lg shadow-lg hover:bg-yellow-400 hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={(player.active_hand_index === 0 ? player.cards.length !== 2 : player.split_cards.length !== 2) || player.chips < (player.active_hand_index === 0 ? player.bet : player.split_bet)}
          >
            Double
          </button>
          {canSplit && (
            <button
              onClick={() => onAction('split')}
              className="px-4 py-1.5 text-sm bg-black/40 border border-yellow-400 text-yellow-300 font-semibold rounded-lg shadow-lg hover:bg-yellow-400 hover:text-black transition-all duration-200"
            >
              Split
            </button>
          )}
        </div>
      )}
    </div>
  );
}
