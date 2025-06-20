import React, { useState, useEffect } from "react";
import { Game } from "@/api/entities";
import { Player } from "@/api/entities";
import { User } from "@/api/entities";
import PlayerSeat from "../components/game/PlayerSeat";
import DealerHand from "../components/game/DealerHand";
import BettingPanel from "../components/game/BettingPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spade } from "lucide-react";

// creates a new deck of cards
function createDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck = [];
  
  // make all the cards
  for (let i = 0; i < suits.length; i++) {
    for (let j = 0; j < ranks.length; j++) {
      let value = parseInt(ranks[j]);
      if (ranks[j] === 'A') {
        value = 11;
      } else if (ranks[j] === 'J' || ranks[j] === 'Q' || ranks[j] === 'K') {
        value = 10;
      }
      
      deck.push({ 
        suit: suits[i], 
        rank: ranks[j], 
        value: value 
      });
    }
  }
  
  // shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    let temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  
  return deck;
}

export default function GameTable() {
  // all the states we need
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [user, setUser] = useState(null);
  const [deck, setDeck] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showBuyIn, setShowBuyIn] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState(1000);
  const [joiningSeat, setJoiningSeat] = useState(null);
  const [showRebuyModal, setShowRebuyModal] = useState(false);

  // when component loads
  useEffect(() => {
    startEverything();
    
    // check for updates every 2 seconds
    const timer = setInterval(() => {
      if (game) {
        loadGameData(game.id);
      }
    }, 2000);
    
    return () => clearInterval(timer);
  }, [game?.id]);

  // simple wait function
  function waitForSeconds(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // start everything when page loads
  async function startEverything() {
    setIsLoading(true);
    try {
      // get user data
      const userData = await User.me();
      setUser(userData);
      
      // find existing games
      const games = await Game.list('-created_date', 10);
      let currentGame = games.find(g => g.status !== 'finished');
      
      if (!currentGame) {
        // make new game if none exists
        currentGame = await Game.create({
          status: 'waiting',
          dealer_cards: [],
          pot: 0,
          round_number: 1
        });
      } else if (currentGame.status === 'playing') {
        // reset game if it was stuck
        setStatusMessage("Resetting stuck game...");
        
        const playersToReset = await Player.filter({ game_id: currentGame.id });
        for (let i = 0; i < playersToReset.length; i++) {
          await Player.update(playersToReset[i].id, {
            cards: [], 
            bet: 0, 
            status: 'waiting', 
            hand_value: 0,
            has_split: false, 
            split_cards: [], 
            split_bet: 0, 
            split_hand_value: 0, 
            split_status: 'waiting', 
            active_hand_index: 0
          });
        }
        
        const updatedGame = await Game.update(currentGame.id, { 
          status: 'waiting', 
          current_turn: null 
        });
        setGame(updatedGame);
        
        await waitForSeconds(2000);
      }
      
      setGame(currentGame);
      setDeck(createDeck());
      await loadGameData(currentGame.id, userData.email);

    } catch (error) {
      console.error("Error starting game:", error);
      setStatusMessage("Failed to load game");
    }
    setIsLoading(false);
  }

  // load game data from database
  async function loadGameData(gameId, userEmail = null) {
    const targetEmail = userEmail || user?.email;
    if (!gameId) return;

    try {
      const [games, gamePlayers] = await Promise.all([
        Game.list('-created_date', 10),
        Player.filter({ game_id: gameId, is_active: true })
      ]);
      
      const updatedGame = games.find(g => g.id === gameId);
      if (updatedGame) {
        setGame(updatedGame);
      }
      
      // sort players by seat number
      const sortedPlayers = gamePlayers.sort((a, b) => a.seat_position - b.seat_position);
      setPlayers(sortedPlayers);
      
      if (targetEmail) {
        const myPlayer = sortedPlayers.find(p => p.created_by === targetEmail);
        setCurrentPlayer(myPlayer || null);
      }
    } catch (error) {
      console.error("Error loading game:", error);
    }
  }

  // reset the game
  async function resetGame() {
    if (!game) return;
    
    setStatusMessage("Resetting game...");
    
    try {
      // reset all players
      for (let i = 0; i < players.length; i++) {
        await Player.update(players[i].id, {
          bet: 0,
          status: 'waiting',
          cards: [],
          hand_value: 0,
          has_split: false,
          split_cards: [],
          split_bet: 0,
          split_hand_value: 0,
          split_status: 'waiting',
          active_hand_index: 0
        });
      }
      
      // reset game
      await Game.update(game.id, {
        status: 'waiting',
        dealer_cards: [],
        current_turn: null,
        round_number: game.round_number + 1
      });
      
      await loadGameData(game.id);
      setStatusMessage("Game reset!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      console.error("Error resetting:", error);
      setStatusMessage("Reset failed");
    }
  }

  // when user clicks on empty seat
  function handleJoinSeatClick(seatPosition) {
    if (!user || !game || isJoining || currentPlayer) {
      if (currentPlayer) {
        setStatusMessage("You're already sitting at seat " + currentPlayer.seat_position);
      }
      return;
    }
    
    // check if seat is taken
    const seatTaken = players.find(p => p.seat_position === seatPosition);
    if (seatTaken) {
      setStatusMessage("Seat " + seatPosition + " is taken");
      return;
    }
    
    setJoiningSeat(seatPosition);
    setBuyInAmount(1000);
    setShowBuyIn(true);
  }
  
  // confirm joining a seat
  async function confirmJoinSeat() {
    if (!user || !game || isJoining || !joiningSeat || buyInAmount < 100) {
      setStatusMessage("Need at least $100 to join");
      return;
    }

    setIsJoining(true);
    setStatusMessage("Joining seat " + joiningSeat + "...");

    try {
      const newPlayer = await Player.create({
        game_id: game.id,
        seat_position: joiningSeat,
        cards: [],
        bet: 0,
        chips: buyInAmount,
        initial_buy_in: buyInAmount,
        status: 'waiting',
        hand_value: 0,
        is_active: true,
        table_limit: buyInAmount,
        has_split: false,
        split_cards: [],
        split_bet: 0,
        split_hand_value: 0,
        split_status: 'waiting',
        active_hand_index: 0,
        created_by: user.email
      });
      
      setCurrentPlayer(newPlayer);
      setStatusMessage("Joined seat " + joiningSeat + "!");
      
      setShowBuyIn(false);
      setJoiningSeat(null);
      
      await waitForSeconds(500);
      await loadGameData(game.id);
      
      setTimeout(() => setStatusMessage(""), 2000);
    } catch (error) {
      console.error("Error joining seat:", error);
      setStatusMessage("Failed to join seat");
    }
    
    setIsJoining(false);
  }

  // place a bet
  async function placeBet(amount) {
    if (!currentPlayer || !game) return;

    // check minimum bet
    const minBet = currentPlayer.table_limit ? currentPlayer.table_limit * 0.01 : 10;
    if (amount < minBet && amount !== 0) {
        setStatusMessage("Minimum bet is $" + minBet);
        return;
    }
    if (amount > currentPlayer.chips + currentPlayer.bet) {
        setStatusMessage("Not enough chips");
        return;
    }

    try {
      let newChips;
      if (amount === 0) {
        newChips = currentPlayer.chips + currentPlayer.bet;
      } else {
        newChips = currentPlayer.chips - amount + (currentPlayer.bet || 0);
      }

      await Player.update(currentPlayer.id, {
        bet: amount,
        chips: newChips
      });

      if (amount > 0) {
        setStatusMessage("Bet: $" + amount);
      } else {
        setStatusMessage("Bet cleared");
      }
      setTimeout(() => setStatusMessage(""), 2000);

      await loadGameData(game.id);
    } catch (error) {
      console.error("Error placing bet:", error);
      setStatusMessage("Bet failed");
    }
  }

  // calculate hand value
  function calcHandValue(cards) {
    let value = 0;
    let aces = 0;

    for (let i = 0; i < cards.length; i++) {
      if (cards[i].rank === 'A') {
        aces++;
        value += 11;
      } else {
        value += cards[i].value;
      }
    }

    // fix aces if over 21
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  }

  // start the game
  async function startGame() {
    if (!game || game.status !== 'waiting') return;

    const playersWithBets = players.filter(p => p.bet > 0);
    if (playersWithBets.length === 0) {
      setStatusMessage("Need at least one bet to start");
      return;
    }

    // check minimum bets
    let invalidBets = false;
    for (let i = 0; i < playersWithBets.length; i++) {
      const minBet = playersWithBets[i].table_limit ? playersWithBets[i].table_limit * 0.01 : 10;
      if (playersWithBets[i].bet < minBet) {
        invalidBets = true;
        break;
      }
    }
    
    if (invalidBets) {
      setStatusMessage("All players must bet at least table minimum");
      return;
    }

    setStatusMessage("Starting game...");

    try {
      const newDeck = createDeck();
      let deckIndex = 0;

      // deal cards to players
      for (let i = 0; i < playersWithBets.length; i++) {
        const player = playersWithBets[i];
        const cards = [newDeck[deckIndex++], newDeck[deckIndex++]];
        const handValue = calcHandValue(cards);
        let status = 'playing';
        if (handValue === 21) {
          status = 'blackjack';
        }
        
        await Player.update(player.id, { 
          cards: cards, 
          hand_value: handValue, 
          status: status 
        });
        await waitForSeconds(300);
      }

      await waitForSeconds(500); // Add this delay to ensure Firestore updates
      // get updated players
      const updatedPlayers = (await Player.filter({ 
        game_id: game.id, 
        is_active: true
      })).filter(p => p.bet > 0); // Filter bet > 0 in JS
      console.log("updatedPlayers after deal:", updatedPlayers);
      
      const playersToAct = updatedPlayers
        .filter(p => p.status === 'playing')
        .sort((a, b) => a.seat_position - b.seat_position);

      // deal dealer cards
      const dealerCards = [
        newDeck[deckIndex++],
        { ...newDeck[deckIndex++], hidden: true }
      ];

      let nextTurn = 'dealer';
      if (playersToAct.length > 0) {
        nextTurn = playersToAct[0].id;
      }

      await Game.update(game.id, {
        status: 'playing',
        dealer_cards: dealerCards,
        current_turn: nextTurn
      });

      setDeck(newDeck.slice(deckIndex));
      setStatusMessage("Cards dealt!");
      setTimeout(() => setStatusMessage(""), 2000);

      await loadGameData(game.id);

      console.log("playersToAct", playersToAct);
      console.log("nextTurn", nextTurn);

      if (nextTurn === 'dealer') {
        await waitForSeconds(2000);
        finishGame();
      }
    } catch (error) {
      console.error("Error starting game:", error);
      setStatusMessage("Failed to start game");
    }
  }

  // handle player actions
  async function playerAction(action) {
    if (!currentPlayer || !game || game.current_turn !== currentPlayer.id) return;
    
    const activeHandIndex = currentPlayer.active_hand_index;
    const isMainHand = activeHandIndex === 0;

    // check if player can act
    if (isMainHand && currentPlayer.status !== 'playing') return;
    if (!isMainHand && currentPlayer.split_status !== 'playing') return;

    try {
      let playerUpdates = {};
      let currentDeck = [...deck];

      if (action === 'split') {
        // check if can split
        const canSplit = currentPlayer.cards.length === 2 && 
                        currentPlayer.cards[0].rank === currentPlayer.cards[1].rank && 
                        currentPlayer.chips >= currentPlayer.bet;
        if (!canSplit) {
          setStatusMessage("Cannot split");
          return;
        }

        const secondCard = currentPlayer.cards[1];
        
        // deal new cards
        const newCardForMain = currentDeck.shift();
        const newCardForSplit = currentDeck.shift();

        const newMainHand = [currentPlayer.cards[0], newCardForMain];
        const newSplitHand = [secondCard, newCardForSplit];

        const mainValue = calcHandValue(newMainHand);
        const splitValue = calcHandValue(newSplitHand);

        playerUpdates = {
          has_split: true,
          cards: newMainHand,
          split_cards: newSplitHand,
          chips: currentPlayer.chips - currentPlayer.bet,
          split_bet: currentPlayer.bet,
          hand_value: mainValue,
          status: mainValue === 21 ? 'blackjack' : 'playing',
          split_hand_value: splitValue,
          split_status: splitValue === 21 ? 'blackjack' : 'playing',
          active_hand_index: 0
        };
        
        await Player.update(currentPlayer.id, playerUpdates);
        setDeck(currentDeck);
        await loadGameData(game.id);
        return;
      }

      // get current hand info
      let currentCards = isMainHand ? [...currentPlayer.cards] : [...currentPlayer.split_cards];
      let currentStatus = isMainHand ? currentPlayer.status : currentPlayer.split_status;
      let currentBet = isMainHand ? currentPlayer.bet : currentPlayer.split_bet;
      let currentChips = currentPlayer.chips;

      if (action === 'hit') {
        const newCard = currentDeck.shift();
        if (newCard) currentCards.push(newCard);
      } else if (action === 'stand') {
        currentStatus = 'standing';
      } else if (action === 'double') {
        // double down
        if (currentChips >= currentBet && currentCards.length === 2) {
          const newCard = currentDeck.shift();
          if (newCard) currentCards.push(newCard);
          
          currentChips -= currentBet;
          currentBet = currentBet * 2;
          currentStatus = 'standing';
        } else {
          setStatusMessage("Cannot double down");
          return;
        }
      }
      
      const newHandValue = calcHandValue(currentCards);
      if (newHandValue > 21) {
        currentStatus = 'busted';
      }
      if (newHandValue === 21 && action !== 'double') {
        currentStatus = 'standing';
      }

      if (isMainHand) {
        playerUpdates = {
          cards: currentCards,
          hand_value: newHandValue,
          status: currentStatus,
          bet: currentBet,
          chips: currentChips,
        };
      } else {
        playerUpdates = {
          split_cards: currentCards,
          split_hand_value: newHandValue,
          split_status: currentStatus,
          split_bet: currentBet,
          chips: currentChips,
        };
      }
      
      await Player.update(currentPlayer.id, playerUpdates);
      setDeck(currentDeck);

      // figure out next turn
      const updatedPlayer = { ...currentPlayer, ...playerUpdates };
      const mainHandDone = updatedPlayer.status !== 'playing';
      const splitHandDone = updatedPlayer.split_status !== 'playing';

      if (mainHandDone && updatedPlayer.has_split && updatedPlayer.active_hand_index === 0) {
        // switch to split hand
        await Player.update(currentPlayer.id, { active_hand_index: 1 });
      } else if (mainHandDone && (!updatedPlayer.has_split || splitHandDone)) {
        // move to next player
        const allPlayersInRound = await Player.filter({ 
          game_id: game.id, 
          is_active: true, 
          bet: { $gt: 0 } 
        });
        
        const playingPlayersSorted = allPlayersInRound
            .filter(p => p.status === 'playing' || (p.has_split && p.split_status === 'playing'))
            .sort((a, b) => a.seat_position - b.seat_position);

        const nextPlayerToAct = playingPlayersSorted.find(p => p.seat_position > currentPlayer.seat_position);
        
        if (nextPlayerToAct) {
          await Game.update(game.id, { current_turn: nextPlayerToAct.id });
        } else {
          await Game.update(game.id, { current_turn: 'dealer' });
          await waitForSeconds(1000);
          finishGame();
        }
      }
      
      await loadGameData(game.id);
    } catch (error) {
      console.error("Error with action:", error);
      setStatusMessage("Action failed");
    }
  }

  // prepare next round
  async function prepareNextRound() {
    const activePlayers = await Player.filter({ game_id: game.id, is_active: true });
    for (let i = 0; i < activePlayers.length; i++) {
        await Player.update(activePlayers[i].id, {
            bet: 0,
            status: 'waiting',
            cards: [],
            hand_value: 0,
            has_split: false,
            split_cards: [],
            split_bet: 0,
            split_hand_value: 0,
            split_status: 'waiting',
            active_hand_index: 0
        });
    }

    await Game.update(game.id, {
      status: 'waiting',
      dealer_cards: [],
      current_turn: null,
      round_number: game.round_number + 1
    });

    await loadGameData(game.id);
    setStatusMessage("Place bets for next round!");
    setTimeout(() => setStatusMessage(""), 3000);
  }

  // finish the game
  async function finishGame() {
    if (!game) return;

    try {
      await waitForSeconds(1000);
      
      // reveal dealer cards
      const revealedDealerCards = game.dealer_cards.map(c => ({ ...c, hidden: false }));
      setGame(prev => prev ? { ...prev, dealer_cards: revealedDealerCards } : null);
      await Game.update(game.id, { dealer_cards: revealedDealerCards });

      let dealerCards = [...revealedDealerCards];
      let dealerValue = calcHandValue(dealerCards);
      let currentDeck = [...deck];

      // dealer hits on 16 and below
      while (dealerValue < 17) {
        await waitForSeconds(1000);
        const newCard = currentDeck.shift();
        if (newCard) {
            dealerCards.push(newCard);
            dealerValue = calcHandValue(dealerCards);
            setGame(prev => prev ? { ...prev, dealer_cards: dealerCards } : null);
            await Game.update(game.id, { dealer_cards: dealerCards });
        } else {
            break;
        }
      }
      setDeck(currentDeck);

      // calculate payouts
      const playersInGame = players.filter(p => p.bet > 0);
      for (let i = 0; i < playersInGame.length; i++) {
        const player = playersInGame[i];
        let totalWinnings = 0;

        // main hand payout
        totalWinnings += calculateWinnings(player, dealerValue, game.dealer_cards);
        
        // split hand payout
        if (player.has_split) {
          const splitHandData = { 
            ...player, 
            hand_value: player.split_hand_value, 
            status: player.split_status, 
            bet: player.split_bet 
          };
          totalWinnings += calculateWinnings(splitHandData, dealerValue, game.dealer_cards);
        }

        if (totalWinnings > 0) {
          await Player.update(player.id, {
            chips: player.chips + totalWinnings
          });
        }
        await waitForSeconds(300);
      }

      await waitForSeconds(2000);

      // check for broke players
      const finalPlayersState = await Player.filter({ game_id: game.id, is_active: true });
      let currentUserIsBroke = false;
      
      for (let i = 0; i < finalPlayersState.length; i++) {
          const p = finalPlayersState[i];  
          if (p.chips <= 0) {
              if (p.id === currentPlayer?.id) {
                  currentUserIsBroke = true;
              } else {
                  await Player.update(p.id, { is_active: false });
              }
          }
      }
      
      if (currentUserIsBroke) {
          setStatusMessage("Out of chips!");
          setShowRebuyModal(true);
      } else {
          await prepareNextRound();
      }

    } catch (error) {
      console.error("Error finishing game:", error);
      setStatusMessage("Game finish failed");
    }
  }

  // calculate winnings for a hand
  function calculateWinnings(playerHand, dealerValue, dealerCards) {
    let winnings = 0;
    const playerValue = playerHand.hand_value;
    const playerBet = playerHand.bet;
    const dealerBlackjack = dealerCards.length === 2 && dealerValue === 21;
    const playerBlackjack = playerHand.status === 'blackjack';

    if (playerHand.status === 'busted') {
      winnings = 0;
    } else if (playerBlackjack && !dealerBlackjack) {
      winnings = playerBet + (playerBet * 1.5); // blackjack pays 3:2
    } else if (playerBlackjack && dealerBlackjack) {
      winnings = playerBet; // push
    } else if (!playerBlackjack && dealerBlackjack) {
      winnings = 0;
    } else if (dealerValue > 21) {
      winnings = playerBet * 2;
    } else if (playerValue > dealerValue) {
      winnings = playerBet * 2;
    } else if (playerValue === dealerValue) {
      winnings = playerBet; // push
    } else {
      winnings = 0;
    }
    return winnings;
  }

  // handle rebuy
  async function handleRebuy() {
    if (!currentPlayer) return;
    const rebuyAmount = buyInAmount || 1000;
    
    await Player.update(currentPlayer.id, {
      chips: currentPlayer.chips + rebuyAmount,
      initial_buy_in: currentPlayer.initial_buy_in + rebuyAmount,
      is_active: true
    });
    
    setShowRebuyModal(false);
    await prepareNextRound();
  }

  // handle leaving table
  async function handleLeaveTable() {
    if (!currentPlayer) return;

    // A player can only leave if the game is waiting, or if their bet is 0 (round is over for them).
    if (game.status !== 'waiting' && currentPlayer.bet > 0) {
        setStatusMessage("Please wait for the current round to finish before leaving.");
        setTimeout(() => setStatusMessage(""), 3000);
        return;
    }

    setStatusMessage("Leaving the table...");
    try {
        await Player.update(currentPlayer.id, { is_active: false });
        setCurrentPlayer(null); // Clear the current player from local state
        
        // If the leave button in the rebuy modal was clicked, close it.
        if (showRebuyModal) {
            setShowRebuyModal(false);
        }
        
        await loadGameData(game.id); // Refresh data to show the player has left
        setStatusMessage("You have left the table.");
        setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
        console.error("Error leaving table:", error);
        setStatusMessage("Failed to leave the table.");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading Game...</p>
        </div>
      </div>
    );
  }

  const myPlayer = players.find(p => p.created_by === user?.email);
  const allPlayersReady = players.some(p => p.bet > 0);
  
  let isMyTurn = false;
  if (myPlayer && game?.current_turn === myPlayer?.id) {
    const isMainHandTurn = myPlayer.active_hand_index === 0 && myPlayer.status === 'playing';
    const isSplitHandTurn = myPlayer.active_hand_index === 1 && myPlayer.split_status === 'playing';
    isMyTurn = isMainHandTurn || isSplitHandTurn;
  }

  console.log("user:", user);
  console.log("players:", players);
  console.log("myPlayer:", myPlayer);
  console.log("game:", game);

  return (
    <div className="min-h-[calc(100vh-150px)] bg-gray-900 p-4 sm:p-6 font-serif flex flex-col">
      <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col">
        <div className="text-center mb-4">
          <div className="bg-transparent inline-block px-8 py-2">
            <h1 className="text-3xl font-bold text-yellow-200 mb-2 tracking-wider">Blackjack</h1>
            <p className="text-gray-300">
              {statusMessage ||
                (game?.status === 'waiting' && 'Join a seat and place your bet!') ||
                (game?.status === 'playing' && game.current_turn !== 'dealer' && 'Game in progress') ||
                (game?.status === 'playing' && game.current_turn === 'dealer' && "Dealer's turn...") ||
                (game?.status === 'finished' && 'Round finished')}
            </p>
            <p className="text-sm text-gray-400 mt-1">Round {game?.round_number}</p>
          </div>
        </div>

        <div className="text-center mb-2">
          <h2 className="text-xl font-bold text-yellow-300 tracking-wider">Dealer</h2>
          {game?.status === 'playing' && !myPlayer && (
              <button 
                onClick={resetGame}
                className="mt-1 px-3 py-1 bg-red-800 text-white text-xs rounded-lg hover:bg-red-700"
              >
                Reset Game (if stuck)
              </button>
          )}
        </div>

        {/* Classic Blackjack Table */}
        <div className="relative mx-auto flex-grow w-full" style={{ maxWidth: '1000px' }}>
          <div className="blackjack-table-container relative h-full">
            <div className="blackjack-table bg-red-900 relative overflow-hidden h-full">
              {/* Table felt pattern */}
              <div className="absolute inset-0 bg-gradient-radial from-red-800 to-red-900"></div>
              
              {/* Table edge/rail */}
              <div className="absolute inset-0 rounded-full border-[18px] border-[#3D2115] shadow-inner"></div>
              <div className="absolute inset-0 rounded-full border-[16px] border-[#29160E]"></div>
              
              {/* Dealer area */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <DealerHand cards={game?.dealer_cards || []} gameStatus={game?.status || 'waiting'} />
              </div>

              {/* Player position */}
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-full">
                <div className="flex justify-center items-end">
                  {/* Render only the center seat (position 3) */}
                  {[3].map(position => {
                    const player = players.find(p => p.seat_position === position);
                    const isEmpty = !player;
                    
                    let isCurrentTurnForSeat = false;
                    if (player && game?.current_turn === player.id) {
                        const isMainTurn = player.active_hand_index === 0 && player.status === 'playing';
                        const isSplitTurn = player.active_hand_index === 1 && player.split_status === 'playing';
                        isCurrentTurnForSeat = isMainTurn || isSplitTurn;
                    }

                    const canJoin = !myPlayer && !isJoining;
                    
                    return (
                      <div 
                        key={position}
                        className="relative flex flex-col items-center"
                        style={{ 
                          transform: `translateY(-10px)`,
                          minWidth: '120px'
                        }}
                      >
                        <div>
                          <PlayerSeat
                            player={player}
                            position={position}
                            isEmpty={isEmpty}
                            isCurrentTurn={isCurrentTurnForSeat}
                            onJoinSeat={canJoin ? handleJoinSeatClick : null}
                            onAction={playerAction}
                            isJoining={isJoining && joiningSeat === position}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table markings */}
              <div className="absolute inset-x-0 top-32 text-center pointer-events-none">
                <p className="text-yellow-400 font-semibold text-xs opacity-50 tracking-widest">BLACKJACK PAYS 3:2</p>
                <p className="text-yellow-400 font-semibold text-xs opacity-50 tracking-widest mt-1">DEALER MUST STAND ON ALL 17s</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Spade className="w-48 h-48 text-black opacity-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Player Info Below Table */}
        {myPlayer && (
          <div className="w-full mt-4 flex justify-between items-center text-sm">
            <div className="bg-black/30 px-4 py-2 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-300">
                {myPlayer.created_by?.split('@')[0] || 'Player'}
              </h3>
              <div className="flex justify-center gap-4 text-xs">
                <div>
                  <p className="text-gray-400">Chips</p>
                  <p className="text-white font-semibold">${myPlayer.chips}</p>
                </div>
                {myPlayer.bet > 0 && (
                  <div>
                    <p className="text-gray-400">Bet</p>
                    <p className="text-blue-400 font-semibold">${myPlayer.bet}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400">Session</p>
                  <p className={`font-semibold ${(myPlayer.chips - myPlayer.initial_buy_in) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(myPlayer.chips - myPlayer.initial_buy_in) >= 0 ? '+' : ''}${myPlayer.chips - myPlayer.initial_buy_in}
                  </p>
                </div>
              </div>
            </div>
             <Button
                onClick={handleLeaveTable}
                className="bg-red-800/80 text-white hover:bg-red-700 font-semibold rounded-lg shadow-lg border-0 h-10 px-5"
              >
                Leave Table
              </Button>
          </div>
        )}
        
        {myPlayer && game?.status === 'waiting' && (
          <BettingPanel
            player={myPlayer}
            onPlaceBet={placeBet}
            onStartGame={startGame}
            allPlayersReady={allPlayersReady}
            tableLimit={myPlayer.table_limit}
          />
        )}
        
        {game?.status === 'playing' && isMyTurn && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-700 text-white px-8 py-4 rounded-lg shadow-lg z-50 animate-pulse">
            <p className="text-lg font-bold text-center">Your Turn!</p>
            <p className="text-sm text-center opacity-90">Choose your action</p>
            <p className="text-xs text-center mt-1">
              Hand: {myPlayer?.active_hand_index === 0 ? myPlayer?.hand_value : myPlayer?.split_hand_value}
              {myPlayer?.has_split && myPlayer?.active_hand_index === 0 ? " (Main Hand)" : ""}
              {myPlayer?.has_split && myPlayer?.active_hand_index === 1 ? " (Split Hand)" : ""}
            </p>
          </div>
        )}
        
        {showBuyIn && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl shadow-black text-center w-full max-w-sm border border-gray-700">
              <h2 className="text-xl font-bold text-yellow-300 mb-4">Join Table</h2>
              <p className="text-gray-300 mb-6">Choose your buy-in amount:</p>
              <div className="space-y-4 mb-6">
                <button 
                  onClick={() => setBuyInAmount(1000)}
                  className={`w-full p-4 rounded-lg font-semibold transition-all duration-200 ${
                    buyInAmount === 1000 
                      ? 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-200' 
                      : 'bg-gray-700 text-yellow-200 hover:bg-gray-600'
                  }`}
                >
                  $1,000 - Casual Table
                </button>
                <button 
                  onClick={() => setBuyInAmount(5000)}
                  className={`w-full p-4 rounded-lg font-semibold transition-all duration-200 ${
                    buyInAmount === 5000 
                      ? 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-200' 
                      : 'bg-gray-700 text-yellow-200 hover:bg-gray-600'
                  }`}
                >
                  $5,000 - High Stakes
                </button>
                <button 
                  onClick={() => setBuyInAmount(10000)}
                  className={`w-full p-4 rounded-lg font-semibold transition-all duration-200 ${
                    buyInAmount === 10000 
                      ? 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-200' 
                      : 'bg-gray-700 text-yellow-200 hover:bg-gray-600'
                  }`}
                >
                  $10,000 - VIP Table
                </button>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => { setShowBuyIn(false); setJoiningSeat(null); }} className="w-full h-12 bg-gray-600 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-500 transition-all duration-200 border-0">
                  Cancel
                </Button>
                <Button onClick={confirmJoinSeat} disabled={isJoining} className="w-full h-12 bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200 border-0">
                  {isJoining ? "Joining..." : `Join - $${buyInAmount}`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showRebuyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl shadow-black text-center w-full max-w-sm border border-gray-700">
              <h2 className="text-xl font-bold text-yellow-300 mb-4">Out of Chips!</h2>
              <p className="text-gray-300 mb-6">Buy back in or leave the table?</p>
              <div className="space-y-4 mb-6">
                <button 
                  onClick={() => setBuyInAmount(1000)}
                  className={`w-full p-3 rounded-lg font-semibold transition-all duration-200 ${
                    buyInAmount === 1000 
                      ? 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-200' 
                      : 'bg-gray-700 text-yellow-200 hover:bg-gray-600'
                  }`}
                >
                  Re-buy $1,000
                </button>
                <button 
                  onClick={() => setBuyInAmount(5000)}
                  className={`w-full p-3 rounded-lg font-semibold transition-all duration-200 ${
                    buyInAmount === 5000 
                      ? 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-200' 
                      : 'bg-gray-700 text-yellow-200 hover:bg-gray-600'
                  }`}
                >
                  Re-buy $5,000
                </button>
                <button 
                  onClick={() => setBuyInAmount(10000)}
                  className={`w-full p-3 rounded-lg font-semibold transition-all duration-200 ${
                    buyInAmount === 10000 
                      ? 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-200' 
                      : 'bg-gray-700 text-yellow-200 hover:bg-gray-600'
                  }`}
                >
                  Re-buy $10,000
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <Button onClick={handleRebuy} className="w-full h-12 bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200 border-0">
                  Re-buy (${buyInAmount})
                </Button>
                <Button onClick={handleLeaveTable} className="w-full h-12 bg-gray-600 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-500 transition-all duration-200 border-0">
                  Leave Table
                </Button>
              </div>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-6 py-3 rounded-xl shadow-lg z-40">
            {statusMessage}
          </div>
        )}
      </div>
      
      <style>{`
        .blackjack-table-container {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .blackjack-table {
          width: 900px;
          height: 550px; /* This height might be overridden by h-full in Tailwind, which is usually desired for responsiveness */
          border-radius: 50% / 60%;
          position: relative;
          box-shadow: 
            0 0 30px rgba(0, 0, 0, 0.3),
            inset 0 0 20px rgba(0, 0, 0, 0.2);
        }
        
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, #8a0202 0%, #4a0000 70%, #2e0000 100%);
        }
      `}</style>
    </div>
  );
}
