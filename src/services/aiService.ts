import { AISettings } from "../types";
import { getLibrary, updateVideoMetadata } from "./libraryService";

const encrypt = (text: string) => btoa(text);
const decrypt = (text: string) => {
  try {
    return atob(text);
  } catch {
    return text;
  }
};

export const getAISettings = (): AISettings => {
  const saved = localStorage.getItem('rassoul_hub_ai_settings');
  if (saved) {
    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      apiKey: decrypt(parsed.apiKey || '')
    };
  }
  return {
    enabled: true,
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3.6-flash'
  };
};

export const saveAISettings = (settings: AISettings) => {
  const toSave = {
    ...settings,
    apiKey: encrypt(settings.apiKey)
  };
  localStorage.setItem('rassoul_hub_ai_settings', JSON.stringify(toSave));
};

export async function getAIResponse(
  prompt: string, 
  context?: string, 
  onAction?: (actionName: string, args: any) => void
): Promise<string> {
  const settings = getAISettings();
  const library = getLibrary();

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        context,
        libraryItems: library.items,
        userApiKey: settings.apiKey || undefined,
        model: settings.model || 'gemini-3.6-flash'
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erreur serveur (${response.status})`);
    }

    const data = await response.json();

    // If Gemini requested metadata correction or action
    if (data.action) {
      if (data.action.name === 'correctMetadata' && data.action.args) {
        const { videoId, newTitle, newCategory, newYear } = data.action.args;
        if (videoId) {
          updateVideoMetadata(videoId, {
            title: newTitle,
            category: newCategory,
            year: newYear ? String(newYear) : undefined
          });
        }
      }
      
      // Dispatch action to player or UI callback
      if (onAction && data.action.name) {
        onAction(data.action.name, data.action.args || {});
      }
    }

    return data.text || "Réponse générée avec succès par l'assistant Gemini.";
  } catch (error: any) {
    console.error('AI Request Error:', error);
    return `Erreur IA : ${error.message || "Impossible de contacter l'assistant Gemini."}`;
  }
}
