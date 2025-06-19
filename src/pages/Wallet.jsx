
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet as WalletIcon, 
  CreditCard, 
  Bitcoin, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  History,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(100);
  const [withdrawAmount, setWithdrawAmount] = useState(100);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('visa');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [userData, userTransactions] = await Promise.all([
        User.me(),
        Transaction.list('-created_date', 50)
      ]);
      
      setUser(userData);
      setTransactions(userTransactions);
    } catch (error) {
      console.error("Error loading wallet data:", error);
    }
    setIsLoading(false);
  };

  const handleDeposit = async () => {
    if (!user || depositAmount < 10) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create transaction record
      await Transaction.create({
        type: 'deposit',
        amount: depositAmount,
        method: selectedPaymentMethod,
        status: 'completed',
        description: `Deposit via ${selectedPaymentMethod.toUpperCase()}`,
        reference_id: `dep_${Date.now()}`
      });
      
      // Update user balance
      await User.updateMyUserData({
        wallet_balance: (user.wallet_balance || 0) + depositAmount,
        total_deposited: (user.total_deposited || 0) + depositAmount
      });
      
      setShowDepositModal(false);
      setDepositAmount(100);
      await loadWalletData();
      
    } catch (error) {
      console.error("Error processing deposit:", error);
    }
    
    setIsProcessing(false);
  };

  const handleWithdraw = async () => {
    if (!user || withdrawAmount < 20 || withdrawAmount > (user.wallet_balance || 0)) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create transaction record
      await Transaction.create({
        type: 'withdrawal',
        amount: withdrawAmount,
        method: selectedPaymentMethod,
        status: 'completed',
        description: `Withdrawal via ${selectedPaymentMethod.toUpperCase()}`,
        reference_id: `with_${Date.now()}`
      });
      
      // Update user balance
      await User.updateMyUserData({
        wallet_balance: (user.wallet_balance || 0) - withdrawAmount,
        total_withdrawn: (user.total_withdrawn || 0) + withdrawAmount
      });
      
      setShowWithdrawModal(false);
      setWithdrawAmount(100);
      await loadWalletData();
      
    } catch (error) {
      console.error("Error processing withdrawal:", error);
    }
    
    setIsProcessing(false);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <Plus className="w-4 h-4 text-green-600" />;
      case 'withdrawal': return <Minus className="w-4 h-4 text-red-600" />;
      case 'game_win': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'game_loss': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'buy_in': return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'cash_out': return <DollarSign className="w-4 h-4 text-purple-600" />;
      default: return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit':
      case 'game_win':
      case 'cash_out': return 'text-green-400'; // Changed from text-green-600
      case 'withdrawal':
      case 'game_loss':
      case 'buy_in': return 'text-red-400'; // Changed from text-red-600
      default: return 'text-gray-400'; // Changed from text-gray-600
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />; // Adjusted shade for dark theme
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />; // Adjusted shade for dark theme
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />; // Adjusted shade for dark theme
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading Wallet...</p>
        </div>
      </div>
    );
  }

  const netProfit = (user?.wallet_balance || 0) + (user?.total_withdrawn || 0) - (user?.total_deposited || 0);

  return (
    <div className="min-h-screen bg-gray-900 p-0 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="bg-gray-800/50 inline-block px-8 py-4 rounded-xl border border-gray-700">
            <h1 className="text-3xl font-bold text-white mb-2">My Wallet</h1>
            <p className="text-gray-400">Manage your funds and track your gambling history</p>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <WalletIcon className="w-4 h-4" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${user?.wallet_balance?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Total Deposited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                ${user?.total_deposited?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Minus className="w-4 h-4" />
                Total Withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                ${user?.total_withdrawn?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Net Profit/Loss
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={() => setShowDepositModal(true)}
            className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-500 transition-all duration-200 border-0 flex items-center gap-2 text-base"
          >
            <Plus className="w-5 h-5" />
            Add Funds
          </Button>
          <Button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!user?.wallet_balance || user.wallet_balance < 20}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-500 transition-all duration-200 border-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            <Minus className="w-5 h-5" />
            Withdraw
          </Button>
        </div>

        {/* Transaction History */}
        <Card className="bg-gray-800/50 border border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" /> {/* Adjusted color */}
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions yet
                </div>
              ) : (
                transactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-white">
                          {transaction.description || transaction.type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(transaction.created_date).toLocaleDateString()} • {transaction.method.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${getTransactionColor(transaction.type)}`}>
                        {['deposit', 'game_win', 'cash_out'].includes(transaction.type) ? '+' : '-'}
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(transaction.status)}
                        <Badge variant="outline" className={`text-xs ${
                          transaction.status === 'completed' ? 'bg-green-900/30 text-green-400 border-green-700' : // Adjusted for dark theme
                          transaction.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700' : // Adjusted for dark theme
                          'bg-red-900/30 text-red-400 border-red-700' // Adjusted for dark theme
                        }`}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl shadow-black w-full max-w-md border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Add Funds</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                    className="text-center text-lg h-12 bg-gray-900/70 text-white shadow-inner border-gray-600 focus-visible:ring-red-500 focus-visible:ring-offset-0" // Added focus-visible classes
                    min="10"
                    step="10"
                  />
                  <p className="text-xs text-gray-500 mt-2">Minimum deposit: $10</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedPaymentMethod('visa')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                        selectedPaymentMethod === 'visa' 
                          ? 'border-blue-500 bg-blue-900/30' 
                          : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-white" />
                      <span className="font-medium text-white">Visa</span>
                    </button>
                    <button
                      onClick={() => setSelectedPaymentMethod('crypto')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                        selectedPaymentMethod === 'crypto' 
                          ? 'border-orange-500 bg-orange-900/30' 
                          : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                      }`}
                    >
                      <Bitcoin className="w-5 h-5 text-white" />
                      <span className="font-medium text-white">Crypto</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDepositModal(false)}
                    disabled={isProcessing}
                    className="flex-1 h-12 bg-gray-600 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-500 border-0"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeposit}
                    disabled={isProcessing || depositAmount < 10}
                    className="flex-1 h-12 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-500 border-0"
                  >
                    {isProcessing ? 'Processing...' : `Deposit $${depositAmount}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl shadow-black w-full max-w-md border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Withdraw Funds</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(parseInt(e.target.value) || 0)}
                    className="text-center text-lg h-12 bg-gray-900/70 text-white shadow-inner border-gray-600 focus-visible:ring-red-500 focus-visible:ring-offset-0" // Added focus-visible classes
                    min="20"
                    max={user?.wallet_balance || 0}
                    step="10"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Available: ${user?.wallet_balance?.toFixed(2) || '0.00'} | Min: $20
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Withdrawal Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedPaymentMethod('visa')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                        selectedPaymentMethod === 'visa' 
                          ? 'border-blue-500 bg-blue-900/30' 
                          : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-white" />
                      <span className="font-medium text-white">Visa</span>
                    </button>
                    <button
                      onClick={() => setSelectedPaymentMethod('crypto')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                        selectedPaymentMethod === 'crypto' 
                          ? 'border-orange-500 bg-orange-900/30' 
                          : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                      }`}
                    >
                      <Bitcoin className="w-5 h-5 text-white" />
                      <span className="font-medium text-white">Crypto</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowWithdrawModal(false)}
                    disabled={isProcessing}
                    className="flex-1 h-12 bg-gray-600 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-500 border-0"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleWithdraw}
                    disabled={isProcessing || withdrawAmount < 20 || withdrawAmount > (user?.wallet_balance || 0)}
                    className="flex-1 h-12 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-500 border-0"
                  >
                    {isProcessing ? 'Processing...' : `Withdraw $${withdrawAmount}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
