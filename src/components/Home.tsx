import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Plus, ChevronRight, ChevronLeft, Sparkles, Star, Clock, Flame, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLibrary } from '../services/libraryService';
import { VideoMetadata } from '../types';
import { cn } from '../lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const library = getLibrary();
  const videos = library.items;
  const featured = videos[0];
  const continueWatching = videos.filter(v => v.progress && v.progress > 0).sort((a, b) => (b.lastWatched || 0) - (a.lastWatched || 0));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="pb-32 bg-netflix-black min-h-screen">
      {!featured ? (
        <div className="flex flex-col items-center justify-center h-screen space-y-8 text-center px-4">
          <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-netflix-red/5 blur-3xl group-hover:bg-netflix-red/10 transition-all" />
            <div className="relative space-y-6">
              <div className="w-24 h-24 bg-netflix-red/20 rounded-full flex items-center justify-center mx-auto border border-netflix-red/30 shadow-lg shadow-netflix-red/20">
                <Plus className="w-12 h-12 text-netflix-red" />
              </div>
              <h1 className="text-6xl font-black font-display uppercase tracking-tighter italic">Votre bibliothèque est vide</h1>
              <p className="text-netflix-gray text-xl max-w-md mx-auto font-medium">Commencez par ajouter vos films et séries préférés dans l'onglet Bibliothèque.</p>
              <button 
                onClick={() => navigate('/library')}
                className="bg-white text-black px-12 py-5 rounded-3xl font-black text-2xl hover:bg-white/90 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-white/10 italic tracking-tighter uppercase"
              >
                Aller à la Bibliothèque
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section - Editorial Style */}
          <section className="relative h-[90vh] w-full overflow-hidden">
            <motion.div 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0"
            >
              {featured.thumbnail ? (
                <img 
                  src={featured.thumbnail} 
                  alt={featured.title} 
                  className="w-full h-full object-cover brightness-[0.5]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-netflix-black via-white/5 to-netflix-black flex items-center justify-center">
                  <span className="text-9xl font-black opacity-10 uppercase italic font-display">{featured.title}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-transparent to-transparent" />
            </motion.div>

        <div className="absolute bottom-32 left-8 md:left-16 max-w-4xl space-y-10 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="px-4 py-1.5 bg-netflix-red/20 border border-netflix-red/40 rounded-full flex items-center gap-2 backdrop-blur-xl">
              <Flame className="w-4 h-4 text-netflix-red" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white font-display">À LA UNE</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400 bg-blue-400/10 px-4 py-1.5 rounded-full border border-blue-400/20 shadow-lg shadow-blue-400/10">
              <Sparkles className="w-4 h-4" />
              <span className="uppercase tracking-widest text-[10px] font-black">IA OPTIMISÉE</span>
            </div>
          </motion.div>
          
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="text-8xl md:text-[10rem] font-black tracking-tighter uppercase leading-[0.8] italic font-display text-glow"
            >
              {featured.title}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex flex-wrap items-center gap-8 text-sm font-bold"
            >
              <div className="flex items-center gap-2 text-green-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-lg">98% de Correspondance</span>
              </div>
              <span className="text-white/60 text-lg">{featured.year}</span>
              <span className="px-3 py-1 border border-white/40 rounded-lg text-xs tracking-widest">{featured.rating}</span>
              <div className="flex items-center gap-2 text-white/60 text-lg">
                <Clock className="w-5 h-5" />
                <span>{featured.duration}</span>
              </div>
            </motion.div>
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="text-2xl text-netflix-gray line-clamp-2 leading-relaxed max-w-3xl font-medium"
          >
            {featured.description}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="flex items-center gap-6 pt-6"
          >
            <button 
              onClick={() => navigate(`/player/${featured.id}`)}
              className="flex items-center gap-5 bg-white text-black px-12 py-5 rounded-3xl font-black text-2xl hover:bg-white/90 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-white/10 italic tracking-tighter"
            >
              <Play className="w-8 h-8 fill-current" />
              REGARDER
            </button>
            <button className="flex items-center gap-5 bg-white/5 backdrop-blur-2xl text-white px-12 py-5 rounded-3xl font-black text-2xl border border-white/10 hover:bg-white/10 transition-all shadow-2xl italic tracking-tighter">
              <Info className="w-8 h-8" />
              PLUS D'INFOS
            </button>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="px-8 md:px-16 -mt-20 space-y-24 relative z-20">
        {/* Continue Watching - Special Layout */}
        {continueWatching.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-tighter uppercase italic font-display flex items-center gap-4">
                <Clock className="w-8 h-8 text-netflix-red" />
                Continuer à regarder
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {continueWatching.map((video, idx) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -10 }}
                  className="group relative aspect-video rounded-[2rem] overflow-hidden cursor-pointer bg-white/5 border border-white/10 shadow-2xl"
                  onClick={() => navigate(`/player/${video.id}`)}
                >
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                      <span className="text-xl font-black opacity-20 uppercase italic font-display px-4 text-center">{video.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 w-full p-8">
                    <h3 className="text-2xl font-black truncate font-display italic">{video.title}</h3>
                    <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(video.progress! / video.totalDuration!) * 100}%` }}
                        className="h-full bg-netflix-red shadow-[0_0_15px_rgba(229,9,20,0.8)]" 
                      />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-6 bg-white rounded-full text-black shadow-2xl scale-110">
                      <Play className="w-8 h-8 fill-current" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Trending - Standard Row */}
        <VideoRow title="Tendances Actuelles" videos={videos} icon={<TrendingUp className="w-8 h-8 text-netflix-red" />} />
        
        {/* Categories */}
        {Array.from(new Set(videos.map(v => v.category))).filter(Boolean).map(cat => (
          <VideoRow key={cat} title={cat!} videos={videos.filter(v => v.category === cat)} />
        ))}
      </div>
      </>
      )}
    </div>
  );
}

interface VideoRowProps {
  title: string;
  videos: VideoMetadata[];
  icon?: React.ReactNode;
}

const VideoRow: React.FC<VideoRowProps> = ({ title, videos, icon }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 group/row">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic font-display flex items-center gap-4">
          {icon}
          {title}
          <ChevronRight className="w-8 h-8 text-netflix-red opacity-0 group-hover/row:opacity-100 transition-all translate-x-[-10px] group-hover/row:translate-x-0" />
        </h2>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-12 scrollbar-hide snap-x">
        {videos.map((video, idx) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, zIndex: 50, y: -10 }}
            className="flex-none w-[28rem] aspect-video relative rounded-[2rem] overflow-hidden cursor-pointer group/card snap-start shadow-2xl border border-white/5"
            onClick={() => navigate(`/player/${video.id}`)}
          >
            {video.thumbnail ? (
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                <span className="text-xl font-black opacity-20 uppercase italic font-display px-4 text-center">{video.title}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
            
            <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover/card:translate-y-0 opacity-0 group-hover/card:opacity-100 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-white rounded-full text-black shadow-2xl hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/20 hover:bg-white/20 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="ml-auto flex items-center gap-2 text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-full border border-blue-400/20">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Prêt IA</span>
                </div>
              </div>
              <p className="text-2xl font-black truncate font-display italic">{video.title}</p>
              <div className="flex items-center gap-4 text-[10px] text-netflix-gray font-bold uppercase tracking-widest mt-3">
                <span className="text-green-500">98% de Correspondance</span>
                <span>{video.duration}</span>
                <span className="px-2 py-0.5 border border-white/20 rounded-md">{video.rating}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
