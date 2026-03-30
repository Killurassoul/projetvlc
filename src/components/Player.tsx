import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Maximize, Minimize, Settings, Subtitles, MessageSquare, 
  ArrowLeft, Sparkles, Clock, ChevronRight, ListVideo, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_VIDEOS } from '../constants';
import { VideoMetadata, Subtitle } from '../types';
import { parseSrt, getContextForTime } from '../services/subtitleService';
import { getLibrary, updateVideoProgress, getNextEpisode } from '../services/libraryService';
import AIChat from './AIChat';
import { cn } from '../lib/utils';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const library = getLibrary();
  const video = library.items.find(v => v.id === id);
  const nextEpisode = video ? getNextEpisode(video) : null;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
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
  const [countdown, setCountdown] = useState(10);
  const [showCreditsButton, setShowCreditsButton] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);

  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check for resume position
  useEffect(() => {
    if (video.progress && video.progress > 10 && !hasResumed) {
      setShowResumePrompt(true);
      // Auto-hide prompt after 10 seconds
      const timer = setTimeout(() => setShowResumePrompt(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [video.progress, hasResumed]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
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
      
      // Save progress every 5 seconds
      if (Math.floor(current) % 5 === 0 && current > 0) {
        updateVideoProgress(video.id, current, total);
      }

      // Show "Watch Credits" button near the end (last 30 seconds)
      if (total - current < 30 && !showCreditsButton && total > 0) {
        setShowCreditsButton(true);
      }

      // Show "Next Episode" countdown (last 10 seconds)
      if (nextEpisode && total - current < 10 && !showNextEpisode && total > 0) {
        setShowNextEpisode(true);
      }
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
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const currentContext = getContextForTime(subtitles, currentTime);

  return (
    <div className="relative h-screen bg-black overflow-hidden group font-sans">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onClick={togglePlay}
        autoPlay
      />

      {/* Resume Prompt */}
      <AnimatePresence>
        {showResumePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-40 left-1/2 -translate-x-1/2 p-8 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] z-50 flex flex-col items-center gap-6 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-netflix-red rounded-2xl shadow-lg shadow-netflix-red/30">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic font-display">Reprendre la lecture ?</h3>
                <p className="text-netflix-gray font-medium">Vous vous êtes arrêté à {formatTime(video.progress || 0)}</p>
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

      {/* Back Button */}
      <AnimatePresence>
        {showControls && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => navigate(-1)}
            className="absolute top-8 left-8 p-4 rounded-2xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white z-50 transition-all border border-white/5"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI Chat Toggle */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={cn(
          "absolute top-8 right-8 p-4 rounded-2xl backdrop-blur-md z-50 transition-all flex items-center gap-3 border border-white/5",
          isChatOpen ? "bg-netflix-red text-white shadow-lg shadow-netflix-red/30" : "bg-black/40 hover:bg-black/60 text-white"
        )}
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-xs font-black uppercase tracking-widest hidden md:block">Assistant IA</span>
      </button>

      {/* Next Episode Overlay */}
      <AnimatePresence>
        {showNextEpisode && nextEpisode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className="absolute bottom-40 right-12 p-8 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] z-50 w-96 shadow-2xl"
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

      {/* Watch Credits Button */}
      <AnimatePresence>
        {showCreditsButton && !showNextEpisode && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-40 right-12 px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white font-black text-sm z-50 transition-all flex items-center gap-3 uppercase tracking-tighter italic"
          >
            Voir le Générique
            <ChevronRight className="w-5 h-5 text-netflix-red" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 w-full p-12 bg-gradient-to-t from-black via-black/60 to-transparent z-40"
          >
            {/* Progress Bar */}
            <div className="flex items-center gap-6 mb-8">
              <span className="text-sm font-black font-display italic text-white/60">{formatTime(currentTime)}</span>
              <div className="flex-1 relative h-2 group/progress cursor-pointer">
                <div className="absolute inset-0 bg-white/10 rounded-full" />
                <div 
                  className="absolute inset-y-0 left-0 bg-netflix-red rounded-full shadow-[0_0_20px_rgba(229,9,20,0.6)]" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-sm font-black font-display italic text-white/60">{formatTime(duration)}</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-10">
                <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                  {isPlaying ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current" />}
                </button>
                <div className="flex items-center gap-6">
                  <button className="text-white/60 hover:text-white transition-colors">
                    <SkipBack className="w-8 h-8" />
                  </button>
                  <button className="text-white/60 hover:text-white transition-colors">
                    <SkipForward className="w-8 h-8" />
                  </button>
                </div>
                <div className="flex items-center gap-6 group/vol">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-0 group-hover/vol:w-32 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white transition-all overflow-hidden"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <p className="text-3xl font-black tracking-tighter uppercase italic font-display">{video.title}</p>
                {video.season && <p className="text-xs text-netflix-gray font-black uppercase tracking-[0.4em]">Saison {video.season} • Épisode {video.episode}</p>}
              </div>

              <div className="flex items-center gap-10">
                <button className="text-white/60 hover:text-white transition-colors flex items-center gap-3">
                  <Subtitles className="w-8 h-8" />
                  <span className="text-xs font-black uppercase tracking-widest hidden lg:block">Sous-titres</span>
                </button>
                <button className="text-white/60 hover:text-white transition-colors">
                  <ListVideo className="w-8 h-8" />
                </button>
                <button className="text-white/60 hover:text-white transition-colors">
                  <Maximize className="w-8 h-8" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chat Panel */}
      <AIChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        context={currentContext}
      />
    </div>
  );
}
