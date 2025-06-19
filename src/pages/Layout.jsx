

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Spade, Users, BarChart3, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

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
          <Button
            onClick={() => User.login()}
            className="w-full h-14 bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200 border-0 text-lg"
          >
            Enter Casino
          </Button>
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

