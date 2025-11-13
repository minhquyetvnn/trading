import { TrendingUp, Target, Star, BarChart3, Brain, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Sidebar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff6726] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">TB</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">MINH QUYET</h1>
            <p className="text-xs text-gray-500">TRADING</p>
          </div>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <Link href="/">
            <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              isActive('/') 
                ? 'text-[#ff6726] bg-orange-50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
              <TrendingUp size={20} />
              <span>Market</span>
            </button>
          </Link>

          <Link href="/trading-signals">
            <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              isActive('/trading-signals') 
                ? 'text-[#ff6726] bg-orange-50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
              <Zap size={20} />
              <span>Trading Signals</span>
            </button>
          </Link>

          <Link href="/ai-trading">
            <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              isActive('/ai-trading') 
                ? 'text-[#ff6726] bg-orange-50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
              <Brain size={20} />
              <span>AI Trading</span>
            </button>
          </Link>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Target size={20} />
            <span>Signals</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Star size={20} />
            <span>Watchlist</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <BarChart3 size={20} />
            <span>Analytics</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Language Selector */}
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
            🌙
          </button>
          <button className="flex-1 px-3 py-2 bg-[#ff6726] text-white rounded-lg text-sm font-medium">
            EN
          </button>
          <button className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
            VI
          </button>
        </div>

        {/* Login Button */}
        <button className="w-full py-3 bg-[#ff6726] text-white rounded-lg font-semibold hover:bg-[#e55a1f] transition-colors">
          Login
        </button>

        {/* Copyright */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">© 2025 Titan Bros</p>
          <p className="text-xs text-gray-400 mt-1">
            A product of <span className="text-[#ff6726] font-medium">Titanlabs</span> • Alex Le
          </p>
        </div>
      </div>
    </div>
  );
};
