import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Spade, Users, BarChart3, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from "@/api/firebaseClient";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [signupEmail, setSignupEmail] = React.useState('');
  const [signupPassword, setSignupPassword] = React.useState('');
  const [signupError, setSignupError] = React.useState('');
  const [signupSuccess, setSignupSuccess] = React.useState('');
  const [showAdminModal, setShowAdminModal] = React.useState(false);
  const [adminPassword, setAdminPassword] = React.useState('');
  const [adminError, setAdminError] = React.useState('');
  const SECRET_ADMIN_PASSWORD = "admin12345"; // Change this for production!

  // load user data when component mounts
  React.useEffect(() => {
    loadUserData();
  }, []);

  // load user data from database
  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.log("User not logged in");
    }
    setIsLoading(false);
  };

  // logout user
  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  const handleLogin = async () => {
    try {
      await User.login(loginEmail, loginPassword);
      window.location.reload();
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleSignup = async () => {
    setSignupError('');
    setSignupSuccess('');
    try {
      await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      setSignupSuccess('Account created! You can now log in.');
      setSignupEmail('');
      setSignupPassword('');
    } catch (err) {
      setSignupError(err.message);
    }
  };

  const handleAdminPromotion = async () => {
    setAdminError('');
    if (adminPassword === SECRET_ADMIN_PASSWORD) {
      try {
        await User.updateMyUserData({ role: 'admin', is_dealer: true });
        setShowAdminModal(false);
        window.location.reload();
      } catch (err) {
        setAdminError('Failed to promote to admin.');
      }
    } else {
      setAdminError('Incorrect admin password.');
    }
  };

  // if still loading, show spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // if user not logged in, show login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 shadow-2xl shadow-black max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-8 bg-gray-900 rounded-full border-2 border-red-600 flex items-center justify-center">
            <Spade className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 tracking-wider">BlackJack Royale</h1>
          <p className="text-gray-400 mb-8">An exclusive gaming experience awaits.</p>
          <form className="mb-4 text-left" onSubmit={async (e) => {
            e.preventDefault();
            try {
              await User.login(loginEmail, loginPassword);
              window.location.reload();
            } catch (err) {
              setLoginError(err.message);
            }
          }}>
            <label htmlFor="login-email" className="block text-gray-300 mb-1">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="mb-3 p-3 rounded w-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              autoComplete="email"
              required
            />
            <label htmlFor="login-password" className="block text-gray-300 mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              className="mb-3 p-3 rounded w-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              autoComplete="current-password"
              required
            />
            <button
              type="submit"
              className="w-full h-14 bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200 border-0 text-lg"
            >
              Enter Casino
            </button>
          </form>
          {loginError && <div className="text-red-500 mt-2">{loginError}</div>}

          {/* Sign Up Form */}
          <div className="mt-8 border-t border-gray-700 pt-8">
            <h2 className="text-xl font-bold mb-4">Sign Up</h2>
            <form onSubmit={e => { e.preventDefault(); handleSignup(); }}>
              <label htmlFor="signup-email" className="block text-gray-300 mb-1">Email</label>
              <input
                id="signup-email"
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                className="mb-3 p-3 rounded w-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                autoComplete="email"
                required
              />
              <label htmlFor="signup-password" className="block text-gray-300 mb-1">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="Password"
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value)}
                className="mb-3 p-3 rounded w-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                autoComplete="new-password"
                required
              />
              <button
                type="submit"
                className="w-full h-14 bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200 border-0 text-lg"
              >
                Create Account
              </button>
            </form>
            {signupError && <div className="text-red-500 mt-2">{signupError}</div>}
            {signupSuccess && <div className="text-green-500 mt-2">{signupSuccess}</div>}
          </div>
        </div>
      </div>
    );
  }

  // navigation items based on user role
  const navigationItems = [
    {
      title: "Play Now",
      url: createPageUrl("GameTable"),
      icon: Spade,
      active: currentPageName === "GameTable"
    }
  ];

  // add dealer panel for dealers
  if (user.is_dealer) {
    navigationItems.push({
      title: "Dealer Panel",
      url: createPageUrl("DealerPanel"),
      icon: BarChart3,
      active: currentPageName === "DealerPanel"
    });
  }

  // add admin panel for admins
  if (user.role === 'admin') {
    navigationItems.push({
      title: "Admin Panel",
      url: createPageUrl("AdminPanel"),
      icon: Shield,
      active: currentPageName === "AdminPanel"
    });
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-900 rounded-full border-2 border-red-600 flex items-center justify-center">
              <Spade className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BlackJack Royale</h1>
              <p className="text-sm text-gray-400">Premium Gaming Experience</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-offset-2 ring-offset-gray-800"
                style={{ backgroundColor: user.avatar_color || '#c00', borderColor: user.avatar_color || '#c00' }}
              >
                {user.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="text-right">
                <p className="text-white font-medium text-sm">{user.full_name}</p>
                {user.role === 'admin' && (
                  <span className="text-xs text-red-400">Admin</span>
                )}
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="w-10 h-10 bg-gray-700/50 hover:bg-gray-700 rounded-full"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
            </Button>
            {user && user.role !== 'admin' && (
              <>
                <Button
                  onClick={() => setShowAdminModal(true)}
                  className="ml-2 bg-yellow-700 text-white font-semibold rounded-lg shadow-lg hover:bg-yellow-600 transition-all duration-200 border-0 text-sm px-4 py-2"
                >
                  Admin Access
                </Button>
                {showAdminModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center w-full max-w-xs border border-gray-700">
                      <h2 className="text-xl font-bold text-white mb-4">Admin Access</h2>
                      <input
                        type="password"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        className="mb-3 p-3 rounded w-full bg-gray-900 border border-gray-700 text-white"
                      />
                      <button
                        onClick={handleAdminPromotion}
                        className="w-full h-12 bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200 border-0 text-lg"
                      >
                        Promote to Admin
                      </button>
                      {adminError && <div className="text-red-500 mt-2">{adminError}</div>}
                      <button
                        onClick={() => setShowAdminModal(false)}
                        className="mt-3 text-gray-400 hover:text-white text-sm underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto mt-6">
        {user.role === 'admin' || user.is_dealer ? (
          <>
            <aside className="w-64 pr-6">
              <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl space-y-2">
                {navigationItems.map(item => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      item.active
                        ? 'bg-red-700/80 text-white'
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </aside>
            <main className="flex-1">
              {children}
            </main>
          </>
        ) : (
          <main className="w-full">
            {children}
          </main>
        )}
      </div>
    </div>
  );
}

