import React, { useState, useEffect } from "react";
import { Game } from "@/api/entities";
import { Player } from "@/api/entities";
import { User } from "@/api/entities";
import { Eye, Users, TrendingUp, Clock } from "lucide-react";
import PlayingCard from "../components/game/PlayingCard";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function DealerPanel() {
  // all the states
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    activePlayers: 0,
    totalBets: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // when component loads
  useEffect(() => {
    const startUp = async () => {
      await checkIfDealer();
      await loadAllData(true);
    };

    startUp();
    
    // refresh data every 10 seconds
    const timer = setInterval(() => {
      loadAllData(false);
    }, 10000);
    
    return () => clearInterval(timer);
  }, []);

  // wait function
  const waitTime = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // check if user is dealer
  const checkIfDealer = async () => {
    try {
      const user = await User.me();
      // make user a dealer for demo
      if (!user.is_dealer) {
        await waitTime(500);
        await User.updateMyUserData({ is_dealer: true });
      }
    } catch (error) {
      console.error("Error checking dealer access:", error);
    }
  };

  // load all data
  const loadAllData = async (isFirstTime = false) => {
    if (isFirstTime) {
      setIsLoading(true);
    }
    try {
      const [allGames, allPlayers] = await Promise.all([
        Game.list('-created_date', 10),
        Player.list('-created_date', 50)
      ]);

      setGames(allGames);
      
      const activePlayers = allPlayers.filter(p => p.is_active);
      let totalBets = 0;
      for (let i = 0; i < activePlayers.length; i++) {
        totalBets += activePlayers[i].bet || 0;
      }
      
      setStats({
        totalGames: allGames.length,
        activePlayers: activePlayers.length,
        totalBets: totalBets
      });

      // if a game is selected, update its players
      if (selectedGame) {
        const gamePlayers = allPlayers.filter(p => 
          p.game_id === selectedGame.id && p.is_active
        );
        gamePlayers.sort((a, b) => a.seat_position - b.seat_position);
        setPlayers(gamePlayers);
      }
      
    } catch (error) {
      console.error("Error loading dealer data:", error);
    }
    if (isFirstTime) {
      setIsLoading(false);
    }
  };

  // when user clicks on a game
  const selectGame = async (game) => {
    setSelectedGame(game);
    try {
      const gamePlayers = await Player.filter({ game_id: game.id, is_active: true });
      gamePlayers.sort((a, b) => a.seat_position - b.seat_position);
      setPlayers(gamePlayers);
    } catch (error) {
      console.error("Error loading game players:", error);
    }
  };

  // get color for game status
  const getStatusColor = (status) => {
    if (status === 'waiting') return 'bg-yellow-100 text-yellow-800';
    if (status === 'playing') return 'bg-green-100 text-green-800';
    if (status === 'finished') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  // get color for player status
  const getPlayerStatusColor = (status) => {
    if (status === 'playing') return 'bg-blue-100 text-blue-800';
    if (status === 'standing') return 'bg-green-100 text-green-800';
    if (status === 'busted') return 'bg-red-100 text-red-800';
    if (status === 'blackjack') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading Dealer Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-0 sm:p-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="bg-gray-800/50 inline-block px-8 py-4 rounded-xl border border-gray-700">
            <h1 className="text-3xl font-bold text-white mb-2">Dealer Control Panel</h1>
            <p className="text-gray-400">Monitor and manage all active games</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Games</p>
                <p className="text-2xl font-bold text-white">{stats.totalGames}</p>
              </div>
              <div className="w-12 h-12 bg-gray-900/50 rounded-full border border-gray-700 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Players</p>
                <p className="text-2xl font-bold text-white">{stats.activePlayers}</p>
              </div>
              <div className="w-12 h-12 bg-gray-900/50 rounded-full border border-gray-700 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Bets</p>
                <p className="text-2xl font-bold text-white">${stats.totalBets}</p>
              </div>
              <div className="w-12 h-12 bg-gray-900/50 rounded-full border border-gray-700 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Active Games</h2>
            <div className="space-y-4">
              {games.map(game => (
                <div
                  key={game.id}
                  onClick={() => selectGame(game)}
                  className={`p-4 rounded-lg bg-gray-900/50 border border-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-700/50 ${
                    selectedGame?.id === game.id ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">Game #{game.id.slice(-8)}</p>
                      <p className="text-sm text-gray-400">Round {game.round_number}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(game.created_date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                        {game.status}
                      </span>
                      <Eye className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              ))}
              {games.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No active games</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">
              {selectedGame ? 'Game #' + selectedGame.id.slice(-8) + ' Details' : 'Select a Game'}
            </h2>
            
            {selectedGame ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-300 mb-3">Dealer Hand</h3>
                  <div className="flex -space-x-2 h-20 items-center">
                    {selectedGame.dealer_cards.map((card, index) => (
                      <PlayingCard
                        key={index}
                        card={card}
                        hidden={card.hidden && selectedGame.status !== 'finished'}
                        className="scale-75"
                      />
                    ))}
                    {selectedGame.dealer_cards.length === 0 && (
                      <p className="text-sm text-gray-500">No cards dealt</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-300 mb-3">Players ({players.length})</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {players.map(player => (
                      <div key={player.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-white">
                              {player.created_by?.split('@')[0] || 'Player ' + player.seat_position}
                            </p>
                            <p className="text-sm text-gray-400">Seat {player.seat_position}</p>
                            <p className="text-sm text-gray-400">Chips: ${player.chips}</p>
                            {player.bet > 0 && (
                              <p className="text-sm font-semibold text-blue-400">Bet: ${player.bet}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlayerStatusColor(player.status)}`}>
                            {player.status}
                          </span>
                        </div>
                        
                        {player.cards.length > 0 && (
                          <div>
                            <div className="flex -space-x-4 mb-2 h-16 items-center">
                              {player.cards.map((card, index) => (
                                <PlayingCard
                                  key={index}
                                  card={card}
                                  className="scale-50"
                                />
                              ))}
                            </div>
                            <p className="text-sm text-gray-400">
                              Hand Value: {player.hand_value}
                              {player.status === 'blackjack' && ' (Blackjack!)'}
                              {player.status === 'busted' && ' (Bust)'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {players.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No players in this game</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Select a game to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
