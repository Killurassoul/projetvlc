import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, MessageSquare, Bot, User, Loader2, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types';
import { getAIResponse, getAISettings } from '../services/aiService';
import { cn } from '../lib/utils';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
  onAction?: (actionName: string, args: any) => void;
}

export default function AIChat({ isOpen, onClose, context, onAction }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Bonjour ! Je suis votre assistant IA pour Rassoul Hub. Vous pouvez me demander de passer l'intro, passer le générique, lancer l'épisode suivant, ou analyser la scène !",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const settings = getAISettings();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAIResponse(input, context, onAction);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('AI Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute top-0 right-0 w-96 h-full bg-netflix-black/90 backdrop-blur-3xl border-l border-white/10 z-50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-400/10 border border-blue-400/20">
                <BrainCircuit className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-[0.2em] uppercase font-display italic">Assistant Neural</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-netflix-gray uppercase tracking-widest">En ligne</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all text-netflix-gray hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {messages.map((msg, idx) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "flex flex-col max-w-[90%] group",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed shadow-xl transition-all",
                  msg.role === 'user' 
                    ? "bg-netflix-red text-white rounded-tr-none shadow-netflix-red/20" 
                    : "bg-white/5 text-white rounded-tl-none border border-white/10 backdrop-blur-md"
                )}>
                  {msg.content}
                </div>
                <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-netflix-gray font-bold uppercase tracking-widest">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 text-blue-400">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Vérifié</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-blue-400 bg-blue-400/10 px-4 py-2 rounded-full border border-blue-400/20 w-fit"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Synthèse de la réponse...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="relative group">
              <div className="absolute inset-0 bg-netflix-red/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Posez n'importe quelle question à votre assistant..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-4 focus:ring-netflix-red/20 transition-all backdrop-blur-md font-medium placeholder:text-netflix-gray/50"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-netflix-red rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transition-all shadow-lg shadow-netflix-red/30"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-[10px] text-netflix-gray font-bold uppercase tracking-widest">
                <Bot className="w-3.5 h-3.5" />
                <span>{settings.provider === 'local' ? 'Ollama (Local)' : settings.provider.toUpperCase()}</span>
              </div>
              {settings.enabled && settings.apiKey && (
                <div className="flex items-center gap-1.5 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Mode Avancé</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
