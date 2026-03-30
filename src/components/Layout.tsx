import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, Settings, Play, Info, Sparkles, LogOut, User, MessageSquare, Bell, Menu, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAISettings } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import AIChat from './AIChat';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const aiSettings = getAISettings();
  const isAIEnabled = aiSettings.enabled && aiSettings.apiKey;

  const navItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: Search, label: 'Rechercher', path: '/search' },
    { icon: Library, label: 'Bibliothèque', path: '/library' },
    { icon: Settings, label: 'Paramètres', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-netflix-black text-white overflow-hidden font-sans selection:bg-netflix-red selection:text-white">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-netflix-red/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse delay-700" />
        {isAIEnabled && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-[150px] rounded-full animate-pulse" />
        )}
      </div>

      {/* Sidebar */}
      <aside className="w-20 md:w-72 flex flex-col border-r border-white/5 bg-netflix-black/80 backdrop-blur-3xl z-50 shadow-2xl relative">
        <div className="p-8 flex items-center gap-4">
          <motion.div 
            whileHover={{ rotate: -10, scale: 1.1 }}
            className="w-10 h-10 bg-netflix-red rounded-xl flex items-center justify-center font-black text-2xl shadow-xl shadow-netflix-red/40 transform -rotate-3"
          >
            R
          </motion.div>
          <span className="hidden md:block font-black text-2xl tracking-tighter uppercase italic font-display text-glow">
            Rassoul Hub
          </span>
        </div>

        <nav className="flex-1 px-6 py-8 space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                location.pathname === item.path 
                  ? "bg-netflix-red text-white shadow-2xl shadow-netflix-red/30 scale-105" 
                  : "text-netflix-gray hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-6 h-6 transition-transform duration-300 group-hover:scale-110",
                location.pathname === item.path ? "text-white" : "text-netflix-gray group-hover:text-white"
              )} />
              <span className="hidden md:block font-black uppercase tracking-widest text-xs font-display">{item.label}</span>
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" 
                />
              )}
            </Link>
          ))}
        </nav>

        {isAIEnabled && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mb-10 p-6 rounded-[2rem] bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 hidden md:block relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute inset-0 bg-blue-400/5 animate-pulse" />
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="p-2 bg-blue-400/20 rounded-lg backdrop-blur-md">
                <BrainCircuit className="w-4 h-4 text-blue-400 animate-float" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Moteur Neural Actif</span>
            </div>
            <p className="text-[11px] text-netflix-gray leading-relaxed font-medium relative z-10">
              La synthèse IA avancée optimise actuellement votre expérience cinématographique.
            </p>
          </motion.div>
        )}

        <div className="p-8 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-netflix-red to-orange-500 p-0.5 shadow-xl group-hover:scale-110 transition-transform">
                <div className="w-full h-full rounded-[0.85rem] bg-netflix-black flex items-center justify-center overflow-hidden">
                  <User className="w-6 h-6 text-white/80" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-netflix-black rounded-full shadow-lg" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-black uppercase tracking-tighter font-display italic">Rassoul</p>
              <p className="text-[10px] text-netflix-gray font-bold uppercase tracking-widest">Membre Élite</p>
            </div>
            <LogOut className="hidden md:block ml-auto w-5 h-5 text-netflix-gray hover:text-netflix-red transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth z-10">
        <header className="sticky top-0 z-30 px-8 py-6 flex items-center justify-between bg-gradient-to-b from-netflix-black via-netflix-black/80 to-transparent backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-netflix-gray uppercase tracking-[0.3em]">
              <span className="text-white">Parcourir</span>
              <span className="opacity-30">/</span>
              <span>{location.pathname === '/' ? 'Accueil' : location.pathname.slice(1)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-netflix-gray hover:text-white hover:bg-white/10 rounded-xl transition-all relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-netflix-red rounded-full border-2 border-netflix-black" />
            </button>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-netflix-gray group-hover:text-white transition-colors" />
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-blue-400 animate-pulse" />
              </div>
              <span className="hidden sm:block text-xs font-black uppercase tracking-widest">Assistant IA</span>
            </button>
          </div>
        </header>

        <div className="px-8 pb-12 relative">
          {children}
        </div>
      </main>

      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
