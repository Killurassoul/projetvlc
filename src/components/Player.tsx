import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, SkipForward, FastForward, SkipBack, Volume2, VolumeX, 
  Maximize, Minimize, Settings, Subtitles, MessageSquare, 
  ArrowLeft, Sparkles, Clock, ChevronRight, ListVideo, RotateCcw,
  Heart, Gauge, PictureInPicture, HelpCircle, X, Upload, Tv, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoMetadata, Subtitle } from '../types';
import { parseSrt, getContextForTime } from '../services/subtitleService';
import { getLibrary, updateVideoProgress, getNextEpisode, toggleFavorite } from '../services/libraryService';
import AIChat from './AIChat';
import { cn } from '../lib/utils';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [library, setLibrary] = useState(getLibrary());
  const video = library.items.find(v => v.id === id);
  const nextEpisode = video ? getNextEpisode(video) : null;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!video) {
      navigate('/library');
    }
  }, [video, navigate]);

  if (!video) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showCreditsButton, setShowCreditsButton] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [isOutroActive, setIsOutroActive] = useState(false);
  
  // New Enhanced Features
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSubtitlesModal, setShowSubtitlesModal] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);

  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync Video Volume & Mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync Playback Speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Check for resume position
  useEffect(() => {
    if (video.progress && video.progress > 10 && !hasResumed) {
      setShowResumePrompt(true);
      const timer = setTimeout(() => setShowResumePrompt(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [video.progress, hasResumed]);

  // Auto Hide Controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        if (!showSpeedMenu && !showEpisodesDrawer && !showShortcutsModal && !showSubtitlesModal) {
          setShowControls(false);
        }
      }, 3500);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showSpeedMenu, showEpisodesDrawer, showShortcutsModal, showSubtitlesModal]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted(prev => !prev);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case '?':
          setShowShortcutsModal(prev => !prev);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
    }
  };

  const handleResume = () => {
    if (videoRef.current && video.progress) {
      videoRef.current.currentTime = video.progress;
      setHasResumed(true);
      setShowResumePrompt(false);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStartOver = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setHasResumed(true);
      setShowResumePrompt(false);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      
      if (Math.floor(current) % 5 === 0 && current > 0) {
        updateVideoProgress(video.id, current, total);
      }

      // Detect Intro (between 5s and 90s)
      if (current >= 5 && current <= 90 && total > 90) {
        setIsIntroActive(true);
      } else {
        setIsIntroActive(false);
      }

      // Detect Outro / Credits (between last 120s and last 15s)
      if (total > 0 && (total - current <= 120) && (total - current > 15)) {
        setIsOutroActive(true);
      } else {
        setIsOutroActive(false);
      }

      // Auto-trigger Next Episode 5s countdown
      if (nextEpisode && total - current <= 15 && !showNextEpisode && total > 0) {
        setShowNextEpisode(true);
        setCountdown(5);
      }
    }
  };

  const handleSkipIntro = () => {
    if (videoRef.current) {
      const targetTime = Math.min(duration - 10, 90);
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      setIsIntroActive(false);
    }
  };

  const handleSkipOutro = () => {
    if (nextEpisode) {
      setShowNextEpisode(true);
      setCountdown(5);
      setIsOutroActive(false);
    } else if (videoRef.current && duration) {
      videoRef.current.currentTime = Math.max(0, duration - 5);
      setIsOutroActive(false);
    }
  };

  const handlePlayNextEpisodeImmediately = () => {
    if (nextEpisode) {
      navigate(`/player/${nextEpisode.id}`);
      window.location.reload();
    }
  };

  const handleAIPlayerAction = (actionName: string) => {
    if (actionName === 'skipIntro') {
      handleSkipIntro();
    } else if (actionName === 'skipOutro') {
      handleSkipOutro();
    } else if (actionName === 'playNextEpisode') {
      handlePlayNextEpisodeImmediately();
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showNextEpisode && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0 && nextEpisode) {
      navigate(`/player/${nextEpisode.id}`);
      window.location.reload();
    }
    return () => clearInterval(timer);
  }, [showNextEpisode, countdown, navigate, nextEpisode]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverPosition(e.clientX - rect.left);
    setHoverTime(pos * duration);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const togglePiP = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (videoRef.current) {
      await videoRef.current.requestPictureInPicture();
    }
  };

  const handleToggleFavInPlayer = () => {
    const updated = toggleFavorite(video.id);
    setLibrary({ ...updated });
  };

  const handleSrtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const parsed = parseSrt(text);
          setSubtitles(parsed);
          setSubtitlesEnabled(true);
          setShowSubtitlesModal(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const currentContext = getContextForTime(subtitles, currentTime);

  // Series or Related Items for Episode Drawer
  const relatedEpisodes = video.seriesId 
    ? library.items.filter(i => i.seriesId === video.seriesId).sort((a,b) => (a.episode || 0) - (b.episode || 0))
    : library.items;

  return (
    <div 
      ref={playerContainerRef}
      className="relative h-screen bg-black overflow-hidden group font-sans selection:bg-netflix-red selection:text-white"
    >
      {/* Ambient Lighting Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-netflix-red/10 via-blue-900/10 to-purple-900/10 blur-[150px] pointer-events-none scale-125" />

      {/* Video Canvas */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="w-full h-full object-contain relative z-10 cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onClick={togglePlay}
        autoPlay
      />

      {/* Subtitles Overlay */}
      {subtitlesEnabled && currentContext && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center max-w-3xl px-6">
          <span className="bg-black/80 text-white text-xl md:text-3xl font-bold px-6 py-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl leading-relaxed italic font-display">
            {currentContext}
          </span>
        </div>
      )}

      {/* Resume Prompt */}
      <AnimatePresence>
        {showResumePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-40 left-1/2 -translate-x-1/2 p-8 bg-black/90 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] z-50 flex flex-col items-center gap-6 shadow-2xl max-w-md w-full"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-netflix-red rounded-2xl shadow-lg shadow-netflix-red/40">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic font-display">Reprendre la lecture ?</h3>
                <p className="text-netflix-gray font-medium">Position sauvegardée : {formatTime(video.progress || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full">
              <button 
                onClick={handleResume}
                className="flex-1 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-tighter italic text-lg hover:bg-white/90 transition-all shadow-xl"
              >
                Reprendre
              </button>
              <button 
                onClick={handleStartOver}
                className="flex-1 bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-tighter italic text-lg hover:bg-white/20 transition-all border border-white/10"
              >
                Recommencer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Intro Floating Overlay Button */}
      <AnimatePresence>
        {isIntroActive && (
          <motion.button
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            onClick={handleSkipIntro}
            className="absolute bottom-28 right-8 z-50 bg-white/95 hover:bg-white text-black px-6 py-3.5 rounded-2xl font-black italic uppercase tracking-wider text-sm flex items-center gap-3 shadow-2xl border border-white hover:scale-105 active:scale-95 transition-all group cursor-pointer"
          >
            <FastForward className="w-5 h-5 text-netflix-red fill-current group-hover:translate-x-1 transition-transform" />
            <span>Passer l'introduction</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Skip Outro / Credits Floating Overlay Button */}
      <AnimatePresence>
        {isOutroActive && !showNextEpisode && (
          <motion.button
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            onClick={handleSkipOutro}
            className="absolute bottom-28 right-8 z-50 bg-netflix-red/90 hover:bg-netflix-red text-white px-6 py-3.5 rounded-2xl font-black italic uppercase tracking-wider text-sm flex items-center gap-3 shadow-2xl border border-netflix-red/50 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
          >
            <SkipForward className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
            <span>Passer le générique {nextEpisode ? "• Épisode suivant" : ""}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Netflix-style Auto-play Next Episode Card (5s Countdown) */}
      <AnimatePresence>
        {showNextEpisode && nextEpisode && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-28 right-8 z-50 p-6 bg-black/95 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] flex flex-col gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-sm w-full"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-netflix-red">
                <Tv className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest italic font-display">Épisode Suivant</span>
              </div>
              <div className="flex items-center gap-2 bg-netflix-red/20 px-3 py-1 rounded-full border border-netflix-red/40 text-netflix-red animate-pulse">
                <span className="text-xs font-black font-mono">Démarrage dans {countdown}s</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-24 aspect-video rounded-xl bg-white/5 overflow-hidden relative border border-white/10 flex-shrink-0">
                {nextEpisode.thumbnail ? (
                  <img src={nextEpisode.thumbnail} alt={nextEpisode.title} className="w-full h-full object-cover" />
                ) : (
                  <Play className="w-6 h-6 text-white/40 absolute inset-0 m-auto fill-current" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black italic uppercase font-display text-white truncate">{nextEpisode.title}</h4>
                {nextEpisode.episode && (
                  <p className="text-[10px] text-netflix-gray font-bold uppercase tracking-widest mt-0.5">
                    Épisode {nextEpisode.episode} {nextEpisode.season ? `• S${nextEpisode.season}` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handlePlayNextEpisodeImmediately}
                className="flex-1 bg-netflix-red hover:bg-red-700 text-white py-3 rounded-2xl font-black italic uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-netflix-red/30 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Regarder maintenant</span>
              </button>
              <button
                onClick={() => setShowNextEpisode(false)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black italic uppercase text-xs tracking-wider transition-all border border-white/10 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 w-full p-8 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-50 flex items-center justify-between"
          >
            {/* Left: Back & Title */}
            <div className="flex items-center gap-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="p-4 rounded-2xl bg-black/50 hover:bg-black/80 backdrop-blur-2xl text-white transition-all border border-white/10 shadow-xl"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
              
              <div className="space-y-1">
                <h2 className="text-3xl font-black font-display italic uppercase tracking-tighter leading-none text-glow">{video.title}</h2>
                {video.season && (
                  <p className="text-xs text-netflix-gray font-black uppercase tracking-[0.3em]">
                    Saison {video.season} • Épisode {video.episode}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions (Favorite, Shortcuts, AI Assistant) */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleFavInPlayer}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-2xl transition-all shadow-xl flex items-center gap-2",
                  video.isFavorite ? "bg-netflix-red text-white border-netflix-red shadow-netflix-red/30" : "bg-black/50 text-white border-white/10 hover:bg-black/80"
                )}
                title={video.isFavorite ? "Favori actif" : "Ajouter aux favoris"}
              >
                <Heart className={cn("w-5 h-5", video.isFavorite && "fill-current")} />
                <span className="text-xs font-black uppercase tracking-widest hidden md:inline">{video.isFavorite ? "Favori" : "J'aime"}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowShortcutsModal(true)}
                className="p-4 rounded-2xl bg-black/50 hover:bg-black/80 backdrop-blur-2xl text-white border border-white/10 transition-all shadow-xl"
                title="Raccourcis clavier"
              >
                <HelpCircle className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={cn(
                  "px-6 py-4 rounded-2xl backdrop-blur-2xl transition-all flex items-center gap-3 border shadow-xl",
                  isChatOpen 
                    ? "bg-netflix-red text-white border-netflix-red shadow-netflix-red/40" 
                    : "bg-black/50 hover:bg-black/80 text-white border-white/10"
                )}
              >
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest hidden md:block">Assistant IA</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Episode Overlay */}
      <AnimatePresence>
        {showNextEpisode && nextEpisode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className="absolute bottom-40 right-12 p-8 bg-black/90 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] z-50 w-96 shadow-2xl"
          >
            <div className="flex items-center gap-6 mb-6">
              <div className="w-32 h-20 rounded-2xl bg-netflix-gray/20 overflow-hidden relative shadow-xl">
                {nextEpisode.thumbnail ? (
                  <img src={nextEpisode.thumbnail} alt="Next" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                    <span className="text-[8px] font-black opacity-20 uppercase italic font-display px-2 text-center">{nextEpisode.title}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white fill-current" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] text-netflix-red uppercase font-black tracking-[0.3em]">ÉPISODE SUIVANT</p>
                <p className="text-xl font-black truncate font-display italic">{nextEpisode.title}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                  navigate(`/player/${nextEpisode.id}`);
                  window.location.reload();
                }}
                className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-xl font-black text-sm uppercase tracking-tighter italic hover:bg-white/90 transition-all shadow-xl"
              >
                Regarder Maintenant
              </button>
              <div className="flex items-center gap-3 text-white/60">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" />
                    <circle 
                      cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" 
                      strokeDasharray="113.1" 
                      strokeDashoffset={113.1 - (113.1 * countdown / 10)}
                      className="text-netflix-red transition-all duration-1000"
                    />
                  </svg>
                  <span className="text-sm font-black font-display italic">{countdown}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bottom Controls Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-0 left-0 w-full p-10 bg-gradient-to-t from-black via-black/80 to-transparent z-40 space-y-6"
          >
            {/* Interactive Progress Bar with Hover Preview */}
            <div className="relative group/progress cursor-pointer">
              {hoverTime !== null && (
                <div 
                  className="absolute -top-10 -translate-x-1/2 px-3 py-1 rounded-lg bg-black/90 border border-white/20 text-xs font-black text-white font-display italic backdrop-blur-md shadow-2xl pointer-events-none"
                  style={{ left: `${hoverPosition}px` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
              
              <div 
                className="flex items-center gap-6"
                onMouseMove={handleProgressHover}
                onMouseLeave={() => setHoverTime(null)}
              >
                <span className="text-sm font-black font-display italic text-white/70">{formatTime(currentTime)}</span>
                
                <div className="flex-1 relative h-2.5 group-hover/progress:h-4 transition-all duration-300 rounded-full overflow-hidden bg-white/10">
                  <div 
                    className="absolute inset-y-0 left-0 bg-netflix-red rounded-full shadow-[0_0_25px_rgba(229,9,20,0.8)] transition-all" 
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <span className="text-sm font-black font-display italic text-white/70">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Bottom Buttons Bar */}
            <div className="flex items-center justify-between pt-2">
              {/* Playback Controls */}
              <div className="flex items-center gap-8">
                <button 
                  onClick={togglePlay} 
                  className="p-3 bg-white text-black rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-white/20"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-0.5" />}
                </button>

                <div className="flex items-center gap-4">
                  <button onClick={() => skip(-10)} className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Reculer de 10s">
                    <RotateCcw className="w-6 h-6" />
                  </button>
                  <button onClick={() => skip(10)} className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Avancer de 10s">
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-4 group/vol relative">
                  <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 text-netflix-red" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                  <div className="w-0 group-hover/vol:w-28 transition-all duration-300 overflow-hidden flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-24 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-netflix-red"
                    />
                  </div>
                </div>
              </div>

              {/* Title Center */}
              <div className="hidden lg:flex flex-col items-center">
                <p className="text-2xl font-black uppercase italic font-display tracking-tight text-white">{video.title}</p>
                <div className="flex items-center gap-3 text-[10px] text-netflix-gray font-bold uppercase tracking-widest">
                  <span>{video.year}</span>
                  <span>•</span>
                  <span>{video.category}</span>
                </div>
              </div>

              {/* Right Side Tools */}
              <div className="flex items-center gap-4">
                {/* Playback Speed Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className={cn(
                      "p-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                      playbackSpeed !== 1 ? "bg-netflix-red text-white border-netflix-red" : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                    )}
                    title="Vitesse de lecture"
                  >
                    <Gauge className="w-5 h-5" />
                    <span>{playbackSpeed}x</span>
                  </button>

                  <AnimatePresence>
                    {showSpeedMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-16 right-0 p-3 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col gap-1 z-50 min-w-32 shadow-2xl"
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => {
                              setPlaybackSpeed(speed);
                              setShowSpeedMenu(false);
                            }}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-left flex items-center justify-between transition-all",
                              playbackSpeed === speed ? "bg-netflix-red text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <span>{speed}x</span>
                            {playbackSpeed === speed && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Subtitles Button */}
                <button 
                  onClick={() => setShowSubtitlesModal(true)}
                  className={cn(
                    "p-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                    subtitles.length > 0 && subtitlesEnabled ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                  )}
                  title="Sous-titres"
                >
                  <Subtitles className="w-5 h-5" />
                  <span className="hidden md:inline">Sous-titres</span>
                </button>

                {/* Episode / Playlist Drawer Toggle */}
                <button 
                  onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/70 hover:text-white transition-all"
                  title="Liste des épisodes"
                >
                  <ListVideo className="w-5 h-5" />
                </button>

                {/* Picture in Picture */}
                <button 
                  onClick={togglePiP}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/70 hover:text-white transition-all hidden sm:block"
                  title="Image dans l'image (PiP)"
                >
                  <PictureInPicture className="w-5 h-5" />
                </button>

                {/* Fullscreen Toggle */}
                <button 
                  onClick={toggleFullscreen}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/70 hover:text-white transition-all"
                  title="Plein écran"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Drawer Sidebar */}
      <AnimatePresence>
        {showEpisodesDrawer && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEpisodesDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-netflix-black border-l border-white/10 p-8 overflow-y-auto space-y-8 z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <Tv className="w-6 h-6 text-netflix-red" />
                  <h3 className="text-2xl font-black font-display uppercase italic">{video.seriesId ? "Épisodes" : "Bibliothèque"}</h3>
                </div>
                <button onClick={() => setShowEpisodesDrawer(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                {relatedEpisodes.map((item) => {
                  const isActive = item.id === video.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        navigate(`/player/${item.id}`);
                        setShowEpisodesDrawer(false);
                      }}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group",
                        isActive ? "bg-netflix-red/20 border-netflix-red text-white" : "bg-white/5 border-white/5 hover:bg-white/10 text-netflix-gray hover:text-white"
                      )}
                    >
                      <div className="w-20 aspect-video rounded-xl bg-black/40 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Play className="w-6 h-6 text-white/40" />
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-netflix-red/40 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white fill-current animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-black text-sm truncate italic font-display">{item.title}</p>
                        {item.episode && <p className="text-[10px] text-netflix-gray font-bold uppercase tracking-widest">Épisode {item.episode}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subtitles Upload Modal */}
      <AnimatePresence>
        {showSubtitlesModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubtitlesModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-netflix-black border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Subtitles className="w-6 h-6 text-netflix-red" />
                  <h3 className="text-2xl font-black font-display italic uppercase">Gestion des Sous-titres</h3>
                </div>
                <button onClick={() => setShowSubtitlesModal(false)} className="p-2 hover:bg-white/10 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                  className={cn(
                    "w-full p-4 rounded-2xl border font-black text-sm uppercase tracking-widest flex items-center justify-between transition-all",
                    subtitlesEnabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-white/5 border-white/10 text-netflix-gray"
                  )}
                >
                  <span>Afficher les Sous-titres</span>
                  <div className={cn("w-10 h-6 rounded-full transition-colors relative p-1", subtitlesEnabled ? "bg-emerald-500" : "bg-white/20")}>
                    <div className={cn("w-4 h-4 rounded-full bg-white transition-transform", subtitlesEnabled && "translate-x-4")} />
                  </div>
                </button>

                <label className="w-full p-6 border-2 border-dashed border-white/10 hover:border-netflix-red/50 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer bg-white/5 hover:bg-white/10 transition-all">
                  <Upload className="w-8 h-8 text-netflix-red" />
                  <span className="text-sm font-black uppercase tracking-widest italic font-display">Charger Fichier .SRT</span>
                  <input type="file" accept=".srt" onChange={handleSrtUpload} className="hidden" />
                </label>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShortcutsModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-netflix-black border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-netflix-red" />
                  <h3 className="text-2xl font-black font-display italic uppercase">Raccourcis Clavier</h3>
                </div>
                <button onClick={() => setShowShortcutsModal(false)} className="p-2 hover:bg-white/10 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "Espace / K", action: "Lecture / Pause" },
                  { key: "F", action: "Plein Écran" },
                  { key: "M", action: "Muet" },
                  { key: "Flèche Droite / L", action: "Avancer +10s" },
                  { key: "Flèche Gauche / J", action: "Reculer -10s" },
                  { key: "?", action: "Aide Raccourcis" }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                    <span className="text-xs font-black uppercase tracking-widest text-netflix-red font-display italic">{item.key}</span>
                    <span className="text-sm font-medium text-white/80">{item.action}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Chat Panel */}
      <AIChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        context={currentContext}
        onAction={handleAIPlayerAction}
      />
    </div>
  );
}
