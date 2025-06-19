import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Game } from "@/api/entities";
import { Player } from "@/api/entities";
import { AdminLog } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Users, 
  CreditCard, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  UserCheck,
  UserX,
  DollarSign,
  History,
  Search,
  Filter
} from "lucide-react";

const ADMIN_PASSWORD = "66606";

export default function AdminPanel() {
  // login states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // data states
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  
  // filter states
  const [userFilter, setUserFilter] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  
  // stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    activeGames: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });

  // when component loads
  useEffect(() => {
    if (isLoggedIn) {
      loadAllAdminData();
      
      // refresh every 30 seconds
      const timer = setInterval(loadAllAdminData, 30000);
      return () => clearInterval(timer);
    }
  }, [isLoggedIn]);

  // handle login
  const handleLogin = async () => {
    if (password === ADMIN_PASSWORD) {
      setIsLoading(true);
      try {
        const user = await User.me();
        await User.updateMyUserData({ role: 'admin' });
        setCurrentAdmin(user);
        setIsLoggedIn(true);
        
        // log admin access
        await AdminLog.create({
          action: "Admin Panel Access",
          admin_email: user.email,
          details: "Admin successfully logged into panel"
        });
      } catch (error) {
        console.error("Error setting admin privileges:", error);
      }
      setIsLoading(false);
    } else {
      alert("Wrong password");
    }
  };

  // load all admin data
  const loadAllAdminData = async () => {
    try {
      const [allUsers, allTransactions, allGames, allPlayers, allLogs] = await Promise.all([
        User.list('-created_date', 100),
        Transaction.list('-created_date', 500),
        Game.list('-created_date', 50),
        Player.list('-created_date', 200),
        AdminLog.list('-created_date', 100)
      ]);

      setUsers(allUsers);
      setTransactions(allTransactions);
      setGames(allGames);
      setPlayers(allPlayers);
      setAdminLogs(allLogs);

      // calculate stats
      let totalDeposits = 0;
      let totalWithdrawals = 0;
      
      for (let i = 0; i < allTransactions.length; i++) {
        const t = allTransactions[i];
        if (t.type === 'deposit' && t.status === 'completed') {
          totalDeposits += t.amount;
        }
        if (t.type === 'withdrawal' && t.status === 'completed') {
          totalWithdrawals += t.amount;
        }
      }

      let activeGamesCount = 0;
      for (let i = 0; i < allGames.length; i++) {
        if (allGames[i].status === 'playing') {
          activeGamesCount++;
        }
      }

      setStats({
        totalUsers: allUsers.length,
        totalTransactions: allTransactions.length,
        totalVolume: totalDeposits + totalWithdrawals,
        activeGames: activeGamesCount,
        totalDeposits: totalDeposits,
        totalWithdrawals: totalWithdrawals
      });

    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };

  // update user balance
  const updateUserBalance = async (userId, newBalance) => {
    try {
      await User.update(userId, { wallet_balance: newBalance });
      
      const targetUser = users.find(u => u.id === userId);
      await AdminLog.create({
        action: "Balance Adjustment",
        target_user: targetUser?.email,
        admin_email: currentAdmin.email,
        details: "Balance set to $" + newBalance
      });
      
      await loadAllAdminData();
      alert("Balance updated successfully");
    } catch (error) {
      console.error("Error updating balance:", error);
      alert("Failed to update balance");
    }
  };

  // suspend user
  const suspendUser = async (userId) => {
    try {
      await User.update(userId, { role: 'suspended' });
      
      const targetUser = users.find(u => u.id === userId);
      await AdminLog.create({
        action: "User Suspended",
        target_user: targetUser?.email,
        admin_email: currentAdmin.email,
        details: "Account suspended by admin"
      });
      
      await loadAllAdminData();
      alert("User suspended");
    } catch (error) {
      console.error("Error suspending user:", error);
      alert("Failed to suspend user");
    }
  };

  // unsuspend user
  const unsuspendUser = async (userId) => {
    try {
      await User.update(userId, { role: 'user' });
      
      const targetUser = users.find(u => u.id === userId);
      await AdminLog.create({
        action: "User Unsuspended",
        target_user: targetUser?.email,
        admin_email: currentAdmin.email,
        details: "Account unsuspended by admin"
      });
      
      await loadAllAdminData();
      alert("User unsuspended");
    } catch (error) {
      console.error("Error unsuspending user:", error);
      alert("Failed to unsuspend user");
    }
  };

  // update player chips
  const updatePlayerChips = async (playerId, newChips) => {
    try {
      await Player.update(playerId, { chips: newChips });
      
      const player = players.find(p => p.id === playerId);
      await AdminLog.create({
        action: "Player Chips Adjusted",
        target_user: player?.created_by,
        admin_email: currentAdmin.email,
        details: "Chips set to $" + newChips + " for player in game " + player?.game_id
      });
      
      await loadAllAdminData();
      alert("Player chips updated");
    } catch (error) {
      console.error("Error updating player chips:", error);
      alert("Failed to update chips");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-6">
        <div className="bg-gray-200 rounded-3xl p-12 shadow-neumorphic-large max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full shadow-neumorphic-inset flex items-center justify-center">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Enter admin password to continue</p>
          </div>
          
          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="h-12 text-center bg-gray-200 shadow-neumorphic-inset border-0"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-red-600 text-white font-semibold rounded-xl shadow-neumorphic hover:shadow-neumorphic-pressed border-0"
            >
              {isLoading ? "Checking..." : "Access Panel"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // filter users
  const filteredUsers = users.filter(user => {
    const nameMatch = user.full_name?.toLowerCase().includes(userFilter.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(userFilter.toLowerCase());
    return nameMatch || emailMatch;
  });

  // filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const userMatch = transaction.created_by?.toLowerCase().includes(transactionFilter.toLowerCase());
    const descMatch = transaction.description?.toLowerCase().includes(transactionFilter.toLowerCase());
    return userMatch || descMatch;
  });

  return (
    <div className="min-h-screen bg-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="bg-gray-200 inline-block px-8 py-4 rounded-3xl shadow-neumorphic">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
              <Shield className="w-8 h-8 text-red-600" />
              Admin Control Panel
            </h1>
            <p className="text-gray-600">Welcome, {currentAdmin?.full_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card className="bg-gray-200 shadow-neumorphic border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-600 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-gray-800">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-200 shadow-neumorphic border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-600 flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-gray-800">{stats.totalTransactions}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-200 shadow-neumorphic border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">${stats.totalVolume.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-200 shadow-neumorphic border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-600 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Active Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-600">{stats.activeGames}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-200 shadow-neumorphic border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-600 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">${stats.totalDeposits.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-200 shadow-neumorphic border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-600 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">${stats.totalWithdrawals.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-200 shadow-neumorphic-inset p-1 rounded-2xl">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-200 data-[state=active]:shadow-neumorphic rounded-xl">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-gray-200 data-[state=active]:shadow-neumorphic rounded-xl">
              <Activity className="w-4 h-4 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gray-200 data-[state=active]:shadow-neumorphic rounded-xl">
              <CreditCard className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-gray-200 data-[state=active]:shadow-neumorphic rounded-xl">
              <History className="w-4 h-4 mr-2" />
              Admin Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-gray-200 shadow-neumorphic border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search users..."
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="w-64 bg-gray-200 shadow-neumorphic-inset border-0"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="p-4 bg-gray-200 rounded-xl shadow-neumorphic-inset">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div 
                              className="w-10 h-10 rounded-full shadow-neumorphic-inset flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: user.avatar_color || '#6366f1' }}
                            >
                              {user.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{user.full_name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                            <Badge className={`ml-2 ${
                              user.role === 'suspended' ? 'bg-red-100 text-red-800' :
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role || 'user'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Balance</p>
                              <p className="font-semibold text-green-600">${user.wallet_balance?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Games</p>
                              <p className="font-semibold">{user.total_games || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Winnings</p>
                              <p className={`font-semibold ${(user.total_winnings || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${user.total_winnings?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Joined</p>
                              <p className="font-semibold">{new Date(user.created_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => {
                              const newBalance = prompt("New balance:", user.wallet_balance || 0);
                              if (newBalance !== null) {
                                updateUserBalance(user.id, parseFloat(newBalance) || 0);
                              }
                            }}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg shadow-neumorphic hover:shadow-neumorphic-pressed border-0"
                          >
                            Edit Balance
                          </Button>
                          
                          {user.role === 'suspended' ? (
                            <Button
                              onClick={() => unsuspendUser(user.id)}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg shadow-neumorphic hover:shadow-neumorphic-pressed border-0"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Unsuspend
                            </Button>
                          ) : (
                            <Button
                              onClick={() => suspendUser(user.id)}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg shadow-neumorphic hover:shadow-neumorphic-pressed border-0"
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Suspend
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players">
            <Card className="bg-gray-200 shadow-neumorphic border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Active Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {players.filter(p => p.is_active).map(player => (
                    <div key={player.id} className="p-4 bg-gray-200 rounded-xl shadow-neumorphic-inset">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">
                            {player.created_by?.split('@')[0]} - Seat {player.seat_position}
                          </p>
                          <p className="text-sm text-gray-600">
                            Game: {player.game_id.slice(-8)} | Chips: ${player.chips} | Bet: ${player.bet}
                          </p>
                          <p className="text-xs text-gray-500">
                            Status: {player.status} | Hand Value: {player.hand_value}
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            const newChips = prompt("New chip amount:", player.chips);
                            if (newChips !== null) {
                              updatePlayerChips(player.id, parseFloat(newChips) || 0);
                            }
                          }}
                          className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg shadow-neumorphic hover:shadow-neumorphic-pressed border-0"
                        >
                          Edit Chips
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-gray-200 shadow-neumorphic border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Transaction History
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search transactions..."
                      value={transactionFilter}
                      onChange={(e) => setTransactionFilter(e.target.value)}
                      className="w-64 bg-gray-200 shadow-neumorphic-inset border-0"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTransactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-200 rounded-xl shadow-neumorphic-inset">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'deposit' ? 'bg-green-100' :
                          transaction.type === 'withdrawal' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          <DollarSign className={`w-4 h-4 ${
                            transaction.type === 'deposit' ? 'text-green-600' :
                            transaction.type === 'withdrawal' ? 'text-red-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description || transaction.type}</p>
                          <p className="text-xs text-gray-600">
                            {transaction.created_by} • {new Date(transaction.created_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                        <Badge className={`text-xs ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="bg-gray-200 shadow-neumorphic border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Admin Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {adminLogs.map(log => (
                    <div key={log.id} className="p-3 bg-gray-200 rounded-xl shadow-neumorphic-inset">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{log.action}</p>
                          {log.target_user && (
                            <p className="text-xs text-gray-600">Target: {log.target_user}</p>
                          )}
                          {log.details && (
                            <p className="text-xs text-gray-500">{log.details}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">{log.admin_email}</p>
                          <p className="text-xs text-gray-500">{new Date(log.created_date).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}