import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { motion } from 'motion/react';
import { 
  Clock, Film, Heart, Award, TrendingUp, 
  PieChart as PieIcon, BarChart3, CheckCircle2, PlayCircle, Sparkles
} from 'lucide-react';
import { VideoMetadata } from '../types';
import { cn } from '../lib/utils';

interface StatisticsProps {
  videos: VideoMetadata[];
}

export default function Statistics({ videos }: StatisticsProps) {
  // Helper to parse duration string like "2h 15m" or "45m" into seconds if totalDuration is not available
  const getDurationInSeconds = (item: VideoMetadata): number => {
    if (item.totalDuration && item.totalDuration > 0) {
      return item.totalDuration;
    }
    if (!item.duration) return 0;
    
    let totalSec = 0;
    const hoursMatch = item.duration.match(/(\d+)\s*h/i);
    const minsMatch = item.duration.match(/(\d+)\s*m/i);
    if (hoursMatch) totalSec += parseInt(hoursMatch[1]) * 3600;
    if (minsMatch) totalSec += parseInt(minsMatch[1]) * 60;
    
    // Default fallback if unknown
    return totalSec || 3600;
  };

  // Helper to parse progress in seconds
  const getProgressInSeconds = (item: VideoMetadata): number => {
    return item.progress || 0;
  };

  const stats = useMemo(() => {
    let totalWatchedSeconds = 0;
    let totalLibrarySeconds = 0;
    let favoritesCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;

    const genreMap: { [key: string]: { count: number; watchedSec: number; totalSec: number } } = {};

    videos.forEach(item => {
      const durationSec = getDurationInSeconds(item);
      const watchedSec = getProgressInSeconds(item);

      totalLibrarySeconds += durationSec;
      totalWatchedSeconds += watchedSec;

      if (item.isFavorite) favoritesCount++;

      if (durationSec > 0 && watchedSec / durationSec >= 0.9) {
        completedCount++;
      } else if (watchedSec > 10) {
        inProgressCount++;
      }

      const cat = item.category || 'Non classé';
      if (!genreMap[cat]) {
        genreMap[cat] = { count: 0, watchedSec: 0, totalSec: 0 };
      }
      genreMap[cat].count += 1;
      genreMap[cat].watchedSec += watchedSec;
      genreMap[cat].totalSec += durationSec;
    });

    const totalHoursWatched = (totalWatchedSeconds / 3600).toFixed(1);
    const totalHoursLibrary = (totalLibrarySeconds / 3600).toFixed(1);

    // Genre Chart Data
    const genreChartData = Object.keys(genreMap).map(cat => ({
      name: cat,
      Titres: genreMap[cat].count,
      'Heures Vues': parseFloat((genreMap[cat].watchedSec / 3600).toFixed(2)),
      'Heures Totales': parseFloat((genreMap[cat].totalSec / 3600).toFixed(2))
    })).sort((a, b) => b['Heures Vues'] - a['Heures Vues'] || b.Titres - a.Titres);

    // Completion Status Data
    const completionData = [
      { name: 'Terminés', value: completedCount, color: '#10B981' },
      { name: 'En cours', value: inProgressCount, color: '#E50914' },
      { name: 'Non commencés', value: Math.max(0, videos.length - completedCount - inProgressCount), color: '#374151' }
    ].filter(d => d.value > 0);

    // Most watched genre
    const topGenre = genreChartData[0]?.name || 'Aucun';

    // Top Movies/Series by Progress
    const topWatchedItems = [...videos]
      .sort((a, b) => (b.progress || 0) - (a.progress || 0))
      .slice(0, 5)
      .map(v => ({
        name: v.title.length > 20 ? v.title.substring(0, 18) + '...' : v.title,
        minutes: Math.round((v.progress || 0) / 60)
      }));

    return {
      totalHoursWatched,
      totalHoursLibrary,
      favoritesCount,
      completedCount,
      inProgressCount,
      topGenre,
      genreChartData,
      completionData,
      topWatchedItems
    };
  }, [videos]);

  const COLORS = ['#E50914', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 bg-black/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-2xl relative overflow-hidden shadow-2xl"
    >
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-netflix-red/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-netflix-red to-red-700 rounded-2xl shadow-xl shadow-netflix-red/30">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight font-display text-glow">
              Statistiques de Visionnage
            </h2>
            <p className="text-netflix-gray text-xs font-bold uppercase tracking-widest mt-1">
              Analyse détaillée de vos habitudes multimédia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
          <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-white/80 font-display">
            {videos.length} Titres analysés
          </span>
        </div>
      </div>

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-5 shadow-xl hover:border-netflix-red/40 transition-all"
        >
          <div className="p-4 rounded-2xl bg-netflix-red/20 text-netflix-red border border-netflix-red/30">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-netflix-gray">Temps Visionné</p>
            <h3 className="text-3xl font-black italic font-display text-white mt-1">{stats.totalHoursWatched}h</h3>
            <p className="text-[10px] font-semibold text-white/40 mt-0.5">Sur {stats.totalHoursLibrary}h au total</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-5 shadow-xl hover:border-blue-500/40 transition-all"
        >
          <div className="p-4 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-netflix-gray">Genre Favori</p>
            <h3 className="text-2xl font-black italic font-display text-white mt-1 truncate max-w-[150px]">{stats.topGenre}</h3>
            <p className="text-[10px] font-semibold text-white/40 mt-0.5">Le plus représenté</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-5 shadow-xl hover:border-emerald-500/40 transition-all"
        >
          <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-netflix-gray">Titres Terminés</p>
            <h3 className="text-3xl font-black italic font-display text-white mt-1">{stats.completedCount}</h3>
            <p className="text-[10px] font-semibold text-white/40 mt-0.5">{stats.inProgressCount} actuellement en cours</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-5 shadow-xl hover:border-pink-500/40 transition-all"
        >
          <div className="p-4 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-netflix-gray">Coups de Cœur</p>
            <h3 className="text-3xl font-black italic font-display text-white mt-1">{stats.favoritesCount}</h3>
            <p className="text-[10px] font-semibold text-white/40 mt-0.5">Dans vos favoris</p>
          </div>
        </motion.div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genre Breakdown Bar Chart */}
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-5 h-5 text-netflix-red" />
              <h3 className="text-xl font-black italic uppercase font-display">Répartition par Genre</h3>
            </div>
            <span className="text-[10px] font-bold text-netflix-gray uppercase tracking-widest">Heures vues</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.genreChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold' }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '1rem', color: '#FFF' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="Heures Vues" fill="#E50914" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Titres" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Donut Chart */}
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PieIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-black italic uppercase font-display">Statut de Visionnage</h3>
            </div>
            <span className="text-[10px] font-bold text-netflix-gray uppercase tracking-widest">Progression</span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {stats.completionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.completionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '1rem', color: '#FFF' }}
                  />
                  <Legend 
                    formatter={(value) => <span className="text-xs font-bold text-white/80">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-netflix-gray font-medium text-sm">Aucune donnée disponible</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Watched Media Items */}
      {stats.topWatchedItems.length > 0 && (
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h3 className="text-xl font-black italic uppercase font-display">Titres les plus visionnés</h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.topWatchedItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E50914" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#E50914" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold' }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '1rem', color: '#FFF' }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#E50914" fillOpacity={1} fill="url(#colorMinutes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}
