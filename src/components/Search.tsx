import React, { useState } from 'react';
import { Search as SearchIcon, Film, Tv, TrendingUp, History, Sparkles, ArrowRight, Play } from 'lucide-react';
import { getLibrary } from '../services/libraryService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Search() {
  const navigate = useNavigate();
  const library = getLibrary();
  const [query, setQuery] = useState('');

  const results = library.items.filter(v => 
    v.title.toLowerCase().includes(query.toLowerCase()) ||
    v.category?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-8 md:p-16 space-y-16 min-h-screen bg-netflix-black">
      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto relative group"
      >
        <div className="absolute -inset-4 bg-netflix-red/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 rounded-[3rem]" />
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10" />
        <SearchIcon className="absolute left-10 top-1/2 -translate-y-1/2 w-10 h-10 text-netflix-gray group-focus-within:text-netflix-red transition-all duration-300 z-10" />
        <input 
          type="text" 
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans vos titres importés..." 
          className="w-full bg-transparent rounded-[2.5rem] py-10 pl-28 pr-16 text-4xl font-black tracking-tighter focus:outline-none focus:ring-4 focus:ring-netflix-red/20 transition-all placeholder:text-netflix-gray/30 font-display italic uppercase relative z-10"
        />
      </motion.div>

      {/* Categories */}
      <AnimatePresence>
        {!query && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
          >
            <CategoryCard title="Séries" icon={Tv} color="from-netflix-red/20 to-red-900/20" border="border-netflix-red/30" />
            <CategoryCard title="Films Locaux" icon={Film} color="from-blue-500/20 to-indigo-900/20" border="border-blue-500/30" />
            <CategoryCard title="Récemment Vus" icon={History} color="from-purple-500/20 to-pink-900/20" border="border-purple-500/30" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="space-y-12 relative">
        <div className="absolute -top-24 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white font-display italic">
              {query ? `Résultats pour "${query}"` : "Titres Suggérés"}
            </h2>
            <div className="flex items-center gap-3 text-netflix-gray font-bold uppercase tracking-[0.3em] text-[10px]">
              <span className="w-6 h-[1px] bg-netflix-red" />
              <span>{results.length} Titres Trouvés</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {results.map((video, idx) => (
            <motion.div
              layout
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.05, zIndex: 50, y: -10 }}
              className="group relative aspect-video rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 cursor-pointer shadow-2xl transition-all duration-500"
              onClick={() => navigate(`/player/${video.id}`)}
            >
              {video.thumbnail ? (
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                  <span className="text-xl font-black opacity-20 uppercase italic font-display px-4 text-center">{video.title}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />
              
              <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white rounded-full text-black shadow-xl hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div className="ml-auto px-3 py-1 rounded-lg bg-black/60 backdrop-blur-xl text-[8px] font-black uppercase tracking-widest border border-white/10">
                    {video.duration}
                  </div>
                </div>
                <p className="text-2xl font-black truncate font-display italic uppercase tracking-tighter">{video.title}</p>
                <div className="flex items-center gap-3 text-[10px] text-netflix-gray font-bold uppercase tracking-widest mt-2">
                  <span className="text-green-500">98% Match</span>
                  <span className="w-1 h-1 bg-netflix-gray rounded-full" />
                  <span>{video.category}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {results.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center space-y-6"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <SearchIcon className="w-10 h-10 text-netflix-gray" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black font-display uppercase tracking-tighter">Aucun résultat trouvé</h3>
              <p className="text-netflix-gray font-medium max-w-md mx-auto">Essayez de rechercher autre chose ou explorez nos catégories recommandées par l'IA.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function CategoryCard({ title, icon: Icon, color, border }: { title: string, icon: any, color: string, border: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      className={cn(
        "p-10 rounded-3xl bg-gradient-to-br border backdrop-blur-xl cursor-pointer transition-all group relative overflow-hidden",
        color,
        border
      )}
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-32 h-32 rotate-12" />
      </div>
      <Icon className="w-14 h-14 mb-6 group-hover:scale-110 transition-transform text-white" />
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-black uppercase tracking-tighter italic font-display">{title}</h3>
        <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all" />
      </div>
    </motion.div>
  );
}
