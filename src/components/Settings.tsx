import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Sparkles, Key, Cpu, 
  ShieldCheck, Save, RefreshCw, Info, AlertCircle, CheckCircle2
} from 'lucide-react';
import { AISettings, AIProvider } from '../types';
import { getAISettings, saveAISettings } from '../services/aiService';
import { cn } from '../lib/utils';

export default function Settings() {
  const [settings, setSettings] = useState<AISettings>(getAISettings());
  const [isSaved, setIsSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    saveAISettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-12 space-y-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight uppercase italic flex items-center gap-4">
          <SettingsIcon className="w-10 h-10 text-netflix-red" />
          Paramètres
        </h1>
        <p className="text-netflix-gray">Configurez votre expérience IA et les préférences de l'application.</p>
      </div>

      {/* AI Configuration */}
      <section className="space-y-8 p-8 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-32 h-32 text-blue-400" />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Mode IA Avancé
            </h2>
            <p className="text-sm text-netflix-gray">Activez l'IA basée sur le cloud pour des résumés de haute qualité et une analyse approfondie.</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={cn(
              "w-14 h-8 rounded-full p-1 transition-all duration-300",
              settings.enabled ? "bg-blue-600" : "bg-white/10"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300",
              settings.enabled ? "translate-x-6" : "translate-x-0"
            )} />
          </button>
        </div>

        <div className={cn("space-y-8 transition-all duration-500", settings.enabled ? "opacity-100" : "opacity-40 pointer-events-none grayscale")}>
          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['local', 'gemini', 'openai'] as AIProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => setSettings(prev => ({ ...prev, provider: p }))}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all text-left space-y-2 group",
                  settings.provider === p 
                    ? "bg-blue-600/20 border-blue-600 text-white" 
                    : "bg-white/5 border-white/10 text-netflix-gray hover:border-white/20 hover:text-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-widest text-xs">{p}</span>
                  {settings.provider === p && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[10px] leading-tight">
                  {p === 'local' && "Utilisez Ollama tournant sur votre machine. Aucune connexion internet requise."}
                  {p === 'gemini' && "L'IA multimodale puissante de Google. Idéal pour l'analyse de scènes."}
                  {p === 'openai' && "Modèles GPT standard de l'industrie. Excellent pour les résumés."}
                </p>
              </button>
            ))}
          </div>

          {/* API Key Input */}
          {settings.provider !== 'local' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Key className="w-4 h-4 text-netflix-gray" />
                  Clé API {settings.provider.toUpperCase()} (Modèle : gemini-3.6-flash)
                </label>
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="text-[10px] text-blue-400 font-bold uppercase hover:underline"
                >
                  {showKey ? "Masquer" : "Afficher"} la clé
                </button>
              </div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder={settings.provider === 'gemini' ? "Laissez vide pour utiliser la clé serveur par défaut, ou entrez votre clé" : `Entrez votre clé API ${settings.provider.toUpperCase()}`}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-mono placeholder:text-netflix-gray/50"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] font-bold text-green-500 uppercase">Sécurisé</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-600/10 border border-blue-600/20">
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-xs text-blue-400 leading-relaxed">
                  L'IA utilise le modèle ultra-récent <strong>Gemini 3.6 Flash</strong>. Elle possède une maîtrise complète de votre bibliothèque (recherche de films/séries, correction de titres, résumés et recommandations). Si la clé est vide, la clé d'environnement est utilisée automatiquement.
                </p>
              </div>
            </div>
          )}

          {/* Local Model Selection */}
          {settings.provider === 'local' && (
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4 text-netflix-gray" />
                Modèle Local (Ollama)
              </label>
              <select
                value={settings.model}
                onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all appearance-none"
              >
                <option value="mistral">Mistral (Recommandé)</option>
                <option value="llama3">Llama 3</option>
                <option value="phi3">Phi-3</option>
                <option value="gemma">Gemma</option>
              </select>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-600/10 border border-orange-600/20">
                <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />
                <p className="text-xs text-orange-400 leading-relaxed">
                  Assurez-vous qu'Ollama est en cours d'exécution sur votre machine et configuré pour autoriser les requêtes provenant de cette origine.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-8 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-netflix-gray">
            <RefreshCw className={cn("w-4 h-4", isSaved && "animate-spin")} />
            <span className="text-xs">{isSaved ? "Paramètres enregistrés avec succès !" : "Modifications non enregistrées"}</span>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-white/90 transition-all transform hover:scale-105 active:scale-95"
          >
            <Save className="w-5 h-5" />
            Enregistrer les modifications
          </button>
        </div>
      </section>

      {/* App Info */}
      <section className="p-8 rounded-2xl border border-white/10 space-y-4">
        <h2 className="text-xl font-bold">À propos de Rassoul Hub</h2>
        <p className="text-sm text-netflix-gray leading-relaxed">
          Rassoul Hub est un lecteur multimédia de nouvelle génération conçu pour l'ère de l'IA. 
          En combinant la lecture de fichiers locaux avec des modèles d'IA avancés, nous offrons 
          des perspectives sans précédent sur votre contenu préféré.
        </p>
        <div className="flex items-center gap-4 pt-4">
          <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-netflix-gray border border-white/10 uppercase tracking-widest">Version 1.0.0</div>
          <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-netflix-gray border border-white/10 uppercase tracking-widest">Build 2026.03</div>
        </div>
      </section>
    </div>
  );
}
