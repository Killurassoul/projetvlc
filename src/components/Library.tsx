import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Upload, Film, Tv, Search, Filter, 
  Trash2, Play, Info, MoreVertical, Sparkles,
  FileVideo, X, CheckCircle2, Loader2, ArrowRight, FolderSearch,
  LayoutGrid, List, Calendar, Clock as ClockIcon, Folder, Heart, Monitor, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLibrary, saveLibrary, addToLibrary, toggleFavorite, removeFromLibrary } from '../services/libraryService';
import { VideoMetadata } from '../types';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import Statistics from './Statistics';

export default function Library() {
  const navigate = useNavigate();
  const [library, setLibrary] = useState(getLibrary());
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filter, setFilter] = useState('Tout');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  const videos = library.items;

  const handleToggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = toggleFavorite(id);
    setLibrary({ ...updated });
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Voulez-vous vraiment supprimer cet élément de votre bibliothèque ?")) {
      const updated = removeFromLibrary(id);
      setLibrary({ ...updated });
    }
  };

  const parseFileName = (fileName: string) => {
    // S01E01 or 1x01 pattern
    const s01e01 = fileName.match(/(.+?)[. ]?S(\d{1,2})E(\d{1,2})/i);
    const oneXone = fileName.match(/(.+?)[. ]?(\d{1,2})x(\d{1,2})/i);
    
    if (s01e01) {
      return {
        title: s01e01[1].replace(/[._]/g, ' ').trim(),
        season: parseInt(s01e01[2]),
        episode: parseInt(s01e01[3]),
        seriesId: s01e01[1].toLowerCase().replace(/[^a-z0-9]/g, '')
      };
    } else if (oneXone) {
      return {
        title: oneXone[1].replace(/[._]/g, ' ').trim(),
        season: parseInt(oneXone[2]),
        episode: parseInt(oneXone[3]),
        seriesId: oneXone[1].toLowerCase().replace(/[^a-z0-9]/g, '')
      };
    }
    return { title: fileName.replace(/\.[^/.]+$/, ""), season: undefined, episode: undefined, seriesId: undefined };
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Veuillez télécharger un fichier vidéo valide.');
      return;
    }

    setIsUploading(true);
    setShowUploadModal(false);
    
    const { title, season, episode, seriesId } = parseFileName(file.name);
    
    setTimeout(() => {
      const newVideo: VideoMetadata = {
        id: Date.now().toString(),
        title: title,
        thumbnail: undefined,
        videoUrl: URL.createObjectURL(file),
        description: `Fichier local : ${file.name}.`,
        duration: "0h 0m",
        year: new Date().getFullYear().toString(),
        rating: "NR",
        category: seriesId ? "Série" : "Local",
        filePath: file.name,
        dateAdded: Date.now(),
        season,
        episode,
        seriesId
      };
      addToLibrary(newVideo);
      setLibrary(getLibrary());
      setIsUploading(false);
    }, 1500);
  };

  const handleScanFolder = () => {
    folderInputRef.current?.click();
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const videoFiles = Array.from(files).filter((file: File) => file.type.startsWith('video/') || file.name.match(/\.(mp4|mkv|avi|mov)$/i));
    
    if (videoFiles.length === 0) {
      setIsUploading(false);
      alert("Aucun fichier vidéo trouvé dans ce dossier.");
      return;
    }

    videoFiles.forEach((file: File, index: number) => {
      const { title, season, episode, seriesId } = parseFileName(file.name);
      const newVideo: VideoMetadata = {
        id: `scan-${Date.now()}-${index}`,
        title: title,
        thumbnail: undefined,
        videoUrl: URL.createObjectURL(file),
        description: `Fichier local scanné : ${file.name}`,
        duration: "0h 0m",
        year: new Date().getFullYear().toString(),
        rating: "NR",
        category: seriesId ? "Série" : "Local",
        filePath: (file as any).webkitRelativePath || file.name,
        dateAdded: Date.now(),
        season,
        episode,
        seriesId
      };
      addToLibrary(newVideo);
    });

    setTimeout(() => {
      setLibrary(getLibrary());
      setIsUploading(false);
    }, 1000);
  };

  const categories = ['Tout', 'Favoris', 'Série', 'Local', 'Science-Fiction', 'Documentaire', 'Thriller', 'Statistiques'];

  const filteredVideos = videos.filter(v => {
    const matchesFilter = filter === 'Tout' 
      ? true 
      : filter === 'Favoris' 
        ? !!v.isFavorite 
        : v.category === filter;
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (v.seriesId && v.seriesId.includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Grouping by series
  const groupedItems = React.useMemo(() => {
    const groups: { [key: string]: VideoMetadata[] } = {};
    const singles: VideoMetadata[] = [];

    filteredVideos.forEach(v => {
      if (v.seriesId) {
        if (!groups[v.seriesId]) groups[v.seriesId] = [];
        groups[v.seriesId].push(v);
      } else {
        singles.push(v);
      }
    });

    // Sort episodes within series
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (a.season !== b.season) return (a.season || 0) - (b.season || 0);
        return (a.episode || 0) - (b.episode || 0);
      });
    });

    return { groups, singles };
  }, [filteredVideos]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="p-8 md:p-16 space-y-16 min-h-screen bg-netflix-black selection:bg-netflix-red selection:text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-netflix-red/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-12 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="space-y-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="p-5 bg-gradient-to-br from-netflix-red to-red-700 rounded-[2rem] shadow-2xl shadow-netflix-red/40 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <Film className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic font-display text-glow leading-none">
                Ma Bibliothèque
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-netflix-gray font-bold uppercase tracking-[0.4em] text-[10px] ml-1">
                <span className="w-8 h-[1px] bg-netflix-red" />
                <span>{videos.length} Titres Importés</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-black tracking-widest flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  Mode Desktop (Sans Connexion)
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-wrap items-center gap-6 relative z-10">
          <div className="relative group hidden xl:block">
            <div className="absolute inset-0 bg-white/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-netflix-gray group-focus-within:text-netflix-red transition-all" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans vos films..." 
              className="bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-lg focus:outline-none focus:ring-4 focus:ring-netflix-red/20 transition-all w-96 backdrop-blur-2xl font-medium placeholder:text-netflix-gray/40"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleScanFolder}
              className="flex items-center gap-4 bg-white/5 border border-white/10 text-white px-8 py-5 rounded-[1.8rem] font-black text-lg hover:bg-white/10 transition-all shadow-2xl uppercase tracking-tighter italic backdrop-blur-xl group"
            >
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <FolderSearch className="w-6 h-6 text-blue-400" />
              </div>
              Scanner Dossier
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-4 bg-netflix-red text-white px-10 py-5 rounded-[1.8rem] font-black text-xl hover:bg-netflix-red/90 transition-all shadow-2xl shadow-netflix-red/40 uppercase tracking-tighter italic group"
            >
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              Ajouter
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mr-2 backdrop-blur-xl">
            <Filter className="w-5 h-5 text-netflix-gray" />
          </div>
          {categories.map((cat, idx) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap border font-display",
                filter === cat 
                  ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-105" 
                  : "bg-white/5 text-netflix-gray hover:bg-white/10 hover:text-white border-white/5 backdrop-blur-md"
              )}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[1.5rem] border border-white/10 backdrop-blur-xl">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-4 rounded-xl transition-all duration-300",
              viewMode === 'grid' ? "bg-white text-black shadow-xl scale-110" : "text-netflix-gray hover:text-white"
            )}
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "p-4 rounded-xl transition-all duration-300",
              viewMode === 'list' ? "bg-white text-black shadow-xl scale-110" : "text-netflix-gray hover:text-white"
            )}
          >
            <List className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content Layout */}
      {filter === 'Statistiques' ? (
        <Statistics videos={videos} />
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-4 gap-8" 
            : "flex flex-col gap-4"
        )}>
        <AnimatePresence mode="popLayout">
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "rounded-3xl bg-white/5 border-2 border-dashed border-netflix-red/40 flex flex-col items-center justify-center gap-6 relative overflow-hidden group shadow-2xl",
                viewMode === 'grid' ? "md:col-span-2 aspect-video" : "w-full py-12"
              )}
            >
              <div className="absolute inset-0 bg-netflix-red/5 animate-pulse" />
              <div className="relative">
                <Loader2 className="w-16 h-16 text-netflix-red animate-spin" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <div className="text-center z-10 space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-white">Traitement des fichiers</p>
                <p className="text-xs text-netflix-gray font-medium">Analyse de votre collection...</p>
              </div>
            </motion.div>
          )}
          
          {/* Series Groups */}
          {(Object.entries(groupedItems.groups) as [string, VideoMetadata[]][]).map(([seriesId, episodes], groupIdx) => {
            const firstEp = episodes[0];
            const epCount = episodes.length;
            const seasons = Array.from(new Set(episodes.map(e => e.season))).length;
            const isSeriesFav = episodes.some(e => e.isFavorite);

            return viewMode === 'grid' ? (
              <motion.div
                layout
                key={seriesId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.05 }}
                whileHover={{ scale: 1.02, zIndex: 50, y: -5 }}
                className={cn(
                  "group relative rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 cursor-pointer shadow-2xl transition-all duration-500",
                  groupIdx % 5 === 0 ? "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto" : "aspect-video"
                )}
                onClick={() => navigate(`/player/${firstEp.id}`)}
              >
                <div className="w-full h-full bg-gradient-to-br from-netflix-red/20 via-netflix-black to-blue-500/20 flex items-center justify-center">
                  <div className="text-center space-y-6 px-8 relative z-10">
                    <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-2xl group-hover:scale-110 transition-transform duration-500">
                      <Tv className="w-12 h-12 text-white opacity-60" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-4xl font-black font-display italic uppercase leading-tight tracking-tighter">{firstEp.title}</h3>
                      <div className="flex items-center justify-center gap-4">
                        <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em]">{seasons} Saisons</span>
                        <span className="px-4 py-1.5 rounded-xl bg-netflix-red/10 border border-netflix-red/20 text-[10px] font-black uppercase tracking-[0.2em] text-netflix-red">{epCount} Épisodes</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Tv className="w-64 h-64 rotate-12" />
                  </div>
                </div>

                {/* Favorite Heart Badge */}
                <div className="absolute top-6 left-6 z-30">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleToggleFav(e, seriesId)}
                    className={cn(
                      "p-3 rounded-2xl border backdrop-blur-2xl shadow-xl transition-all",
                      isSeriesFav 
                        ? "bg-netflix-red text-white border-netflix-red shadow-netflix-red/40" 
                        : "bg-black/40 text-white/60 border-white/10 hover:text-white hover:bg-black/60"
                    )}
                    title={isSeriesFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart className={cn("w-5 h-5", isSeriesFav && "fill-current text-white")} />
                  </motion.button>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-full p-10 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="p-5 bg-white rounded-full text-black shadow-2xl hover:scale-110 transition-transform"><Play className="w-6 h-6 fill-current" /></div>
                    <div className="p-5 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/20 hover:bg-white/20 transition-colors"><Plus className="w-6 h-6" /></div>
                  </div>
                  <h3 className="text-4xl font-black tracking-tight truncate font-display italic leading-none">{firstEp.title}</h3>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-xs text-netflix-gray font-bold uppercase tracking-[0.2em]">{episodes[episodes.length-1].season} Saisons</span>
                    <span className="w-1 h-1 bg-netflix-gray rounded-full" />
                    <span className="text-xs text-netflix-gray font-bold uppercase tracking-[0.2em]">{epCount} Épisodes</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div key={seriesId} className="space-y-6">
                <div className="flex items-center gap-6 px-10 py-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                  <div className="p-3 bg-netflix-red/20 rounded-xl">
                    <Tv className="w-8 h-8 text-netflix-red" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black font-display italic uppercase tracking-tighter leading-none">{firstEp.title}</h2>
                    <p className="text-[10px] font-black text-netflix-gray uppercase tracking-[0.3em]">{seasons} Saisons • {epCount} Épisodes</p>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <button 
                      onClick={(e) => handleToggleFav(e, seriesId)}
                      className={cn(
                        "p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                        isSeriesFav ? "bg-netflix-red text-white border-netflix-red" : "bg-white/5 border-white/10 text-netflix-gray hover:text-white"
                      )}
                    >
                      <Heart className={cn("w-4 h-4", isSeriesFav && "fill-current")} />
                      <span>{isSeriesFav ? "Favori" : "Mettre en favori"}</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 pl-12">
                  {episodes.map((video, idx) => (
                    <motion.div
                      layout
                      key={video.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group flex items-center gap-8 p-6 rounded-[1.8rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer shadow-xl relative overflow-hidden"
                      onClick={() => navigate(`/player/${video.id}`)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-netflix-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-48 aspect-video rounded-2xl overflow-hidden relative flex-shrink-0 bg-white/5 flex items-center justify-center border border-white/5">
                        <Play className="w-10 h-10 text-white/10 group-hover:text-white/40 group-hover:scale-110 transition-all" />
                        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[8px] font-black uppercase tracking-widest">S{video.season} E{video.episode}</div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-4 relative z-10">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-black font-display italic truncate group-hover:text-netflix-red transition-colors">Épisode {video.episode} • {video.title}</h3>
                          <div className="flex items-center gap-4 text-netflix-gray">
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => handleToggleFav(e, video.id)}
                              className={cn("p-2 rounded-xl border transition-all", video.isFavorite ? "bg-netflix-red/20 text-netflix-red border-netflix-red/30" : "hover:text-white border-transparent")}
                            >
                              <Heart className={cn("w-4 h-4", video.isFavorite && "fill-current text-netflix-red")} />
                            </motion.button>
                            {video.filePath && (
                              <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                <Folder className="w-3 h-3" />
                                <span className="max-w-[150px] truncate">{video.filePath.split('/').slice(0, -1).join('/') || 'Racine'}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><ClockIcon className="w-4 h-4" />{video.duration}</div>
                            <button 
                              onClick={(e) => handleRemove(e, video.id)}
                              className="p-2 rounded-xl text-netflix-gray hover:text-netflix-red transition-colors opacity-0 group-hover:opacity-100"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em]">
                            <span className="text-netflix-gray">Progression de l'épisode</span>
                            <span className="text-white">{video.progress && video.totalDuration ? Math.round((video.progress / video.totalDuration) * 100) : 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${video.progress && video.totalDuration ? (video.progress / video.totalDuration) * 100 : 0}%` }}
                              className="h-full bg-netflix-red shadow-[0_0_15px_rgba(229,9,20,0.4)]" 
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Single Items */}
          {groupedItems.singles.map((video, idx) => (
            viewMode === 'grid' ? (
              <motion.div
                layout
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, zIndex: 50, y: -5 }}
                className={cn(
                  "group relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer shadow-2xl transition-all duration-500",
                  idx % 5 === 0 ? "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto" : "aspect-video"
                )}
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
                
                {/* Favorite Heart Badge */}
                <div className="absolute top-6 left-6 z-30">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleToggleFav(e, video.id)}
                    className={cn(
                      "p-3 rounded-2xl border backdrop-blur-2xl shadow-xl transition-all",
                      video.isFavorite 
                        ? "bg-netflix-red text-white border-netflix-red shadow-netflix-red/40" 
                        : "bg-black/40 text-white/60 border-white/10 hover:text-white hover:bg-black/60"
                    )}
                    title={video.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart className={cn("w-5 h-5", video.isFavorite && "fill-current text-white")} />
                  </motion.button>
                </div>

                <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
                  <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-xl text-xs font-black text-white border border-white/10 shadow-2xl">
                    {video.duration}
                  </div>
                  <button 
                    onClick={(e) => handleRemove(e, video.id)}
                    className="p-2.5 rounded-xl bg-black/60 backdrop-blur-xl text-white/70 border border-white/10 hover:text-netflix-red hover:bg-black/80 transition-all shadow-2xl"
                    title="Supprimer de la bibliothèque"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                  <div className="flex items-center gap-4 mb-5">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-4 bg-white rounded-full text-black shadow-2xl"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </motion.div>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleToggleFav(e, video.id)}
                      className={cn(
                        "p-4 backdrop-blur-xl rounded-full border transition-colors",
                        video.isFavorite ? "bg-netflix-red text-white border-netflix-red" : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", video.isFavorite && "fill-current")} />
                    </motion.button>
                  </div>
                  <h3 className={cn(
                    "font-black tracking-tight truncate font-display italic",
                    idx % 5 === 0 ? "text-4xl" : "text-2xl"
                  )}>{video.title}</h3>
                  <div className="flex items-center gap-4 text-[10px] text-netflix-gray font-bold uppercase tracking-widest mt-3">
                    <span className="text-green-500">98% de Correspondance</span>
                    <span>{video.year}</span>
                    <span className="px-2 py-0.5 border border-white/20 rounded-md tracking-widest">{video.rating}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                layout
                key={video.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group flex items-center gap-8 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer shadow-xl"
                onClick={() => navigate(`/player/${video.id}`)}
              >
                {/* Thumbnail Mini */}
                <div className="w-48 aspect-video rounded-2xl overflow-hidden relative flex-shrink-0">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Film className="w-8 h-8 text-netflix-gray opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white fill-current" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black font-display italic truncate">{video.title}</h3>
                    <div className="flex items-center gap-4 text-netflix-gray">
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleToggleFav(e, video.id)}
                        className={cn("p-2 rounded-xl border transition-all", video.isFavorite ? "bg-netflix-red/20 text-netflix-red border-netflix-red/30" : "hover:text-white border-transparent")}
                        title={video.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Heart className={cn("w-4 h-4", video.isFavorite && "fill-current text-netflix-red")} />
                      </motion.button>
                      {video.filePath && (
                        <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                          <Folder className="w-3 h-3" />
                          <span className="max-w-[200px] truncate">{video.filePath.split('/').slice(0, -1).join('/') || 'Local'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <Calendar className="w-4 h-4" />
                        {video.dateAdded ? new Date(video.dateAdded).toLocaleDateString('fr-FR') : 'Inconnue'}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <ClockIcon className="w-4 h-4" />
                        {video.duration}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-netflix-gray">Progression</span>
                        <span className="text-white">{video.progress && video.totalDuration ? Math.round((video.progress / video.totalDuration) * 100) : 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${video.progress && video.totalDuration ? (video.progress / video.totalDuration) * 100 : 0}%` }}
                          className="h-full bg-netflix-red shadow-[0_0_10px_rgba(229,9,20,0.5)]" 
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-netflix-gray">{video.category}</span>
                      <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-netflix-gray">{video.rating}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={(e) => handleRemove(e, video.id)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 text-netflix-gray hover:text-netflix-red hover:bg-white/10 transition-all"
                  title="Supprimer de la bibliothèque"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>
      )}

      {/* Empty State */}
      {filter !== 'Statistiques' && filteredVideos.length === 0 && !isUploading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-40 space-y-10 text-center"
        >
          <div className="relative">
            <div className="w-40 h-40 rounded-[2.5rem] bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-xl transform -rotate-6">
              <Film className="w-16 h-16 text-netflix-gray" />
            </div>
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-4 -right-4 p-5 bg-netflix-red rounded-3xl shadow-2xl shadow-netflix-red/40"
            >
              <Plus className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <div className="space-y-4">
            <h3 className="text-5xl font-black font-display uppercase tracking-tighter italic">Votre coffre est vide</h3>
            <p className="text-xl text-netflix-gray max-w-md mx-auto font-medium leading-relaxed">Commencez à construire votre collection en téléchargeant des fichiers vidéo locaux pour une analyse assistée par l'IA.</p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={handleScanFolder}
              className="flex items-center gap-5 bg-white/5 border border-white/10 text-white px-12 py-5 rounded-[2rem] font-black text-2xl hover:bg-white/10 transition-all shadow-2xl transform hover:scale-105 active:scale-95"
            >
              <FolderSearch className="w-7 h-7 text-blue-400" />
              Scanner Dossier
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-5 bg-white text-black px-12 py-5 rounded-[2rem] font-black text-2xl hover:bg-white/90 transition-all shadow-2xl transform hover:scale-105 active:scale-95"
            >
              <Upload className="w-7 h-7" />
              Ajouter
            </button>
          </div>
        </motion.div>
      )}

      {/* Hidden Folder Input */}
      <input 
        type="file" 
        ref={folderInputRef}
        onChange={handleFolderSelect}
        className="hidden"
        {...({ webkitdirectory: "", directory: "", mozdirectory: "" } as any)}
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-netflix-black border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 bg-netflix-red rounded-2xl shadow-lg shadow-netflix-red/30">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-4xl font-black font-display uppercase tracking-tighter italic">Ajouter du Contenu</h2>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="p-3 hover:bg-white/10 rounded-full transition-all text-netflix-gray hover:text-white"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="p-10 space-y-10">
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "relative aspect-[21/9] rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-6 group cursor-pointer overflow-hidden",
                    dragActive 
                      ? "border-netflix-red bg-netflix-red/10 scale-[0.98]" 
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "p-6 rounded-3xl transition-all shadow-2xl",
                    dragActive ? "bg-netflix-red text-white scale-110" : "bg-white/5 text-netflix-gray group-hover:text-white"
                  )}>
                    <FileVideo className="w-12 h-12" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-black font-display uppercase tracking-tighter">Déposez votre chef-d'œuvre</p>
                    <p className="text-sm text-netflix-gray font-bold uppercase tracking-widest">MP4, MKV, AVI ou MOV</p>
                  </div>
                  
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3 text-blue-400">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synthèse IA</span>
                    </div>
                    <p className="text-sm text-netflix-gray leading-relaxed font-medium">Notre moteur neural cartographie automatiquement les personnages, les points d'intrigue et les moments clés dès l'ingestion.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3 text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Confidentialité</span>
                    </div>
                    <p className="text-sm text-netflix-gray leading-relaxed font-medium">Vos données restent locales. Nous ne traitons que les métadonnées pour l'analyse. Aucun stockage cloud requis.</p>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-white/5 border-t border-white/10 flex items-center justify-between">
                <p className="text-xs text-netflix-gray font-bold uppercase tracking-widest">Prêt pour l'ingestion</p>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-netflix-gray hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <label className="bg-white text-black px-12 py-4 rounded-2xl font-black text-lg cursor-pointer hover:bg-white/90 transition-all shadow-2xl flex items-center gap-3 uppercase tracking-tighter italic">
                    Parcourir
                    <ArrowRight className="w-5 h-5" />
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
