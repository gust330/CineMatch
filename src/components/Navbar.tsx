import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Clapperboard, 
  Sparkles, 
  Bookmark, 
  History, 
  User,
  LogOut,
  Search
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';

export const Navbar: React.FC = () => {
  const { signOut, user } = useAuth();

  const navItems = [
    { to: '/', icon: Sparkles, label: 'Descobrir' },
    { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
    { to: '/history', icon: History, label: 'Histórico' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
      <div className="glass-card rounded-full px-6 py-3 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5">
        {/* Logo Section */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
            <Clapperboard className="text-black w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white hidden sm:block">CineMatch</span>
        </NavLink>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 sm:gap-4 bg-white/5 rounded-full p-1 border border-white/5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300",
                isActive 
                  ? "bg-teal-500 text-black shadow-glow" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="hidden md:block">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-500/50 leading-none mb-1">Perfil</span>
            <span className="text-xs font-bold text-white truncate max-w-[120px]">{user?.email?.split('@')[0]}</span>
          </div>
          
          <div className="flex gap-2">
            <button className="p-2.5 rounded-full bg-white/5 text-zinc-400 hover:text-white transition-colors border border-white/5 cursor-pointer">
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => signOut()}
              className="p-2.5 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
