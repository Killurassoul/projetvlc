import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { AISettings, ChatMessage } from "../types";

// Encryption placeholder (simple base64 for now as per "securely stored in local storage" requirement)
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
    enabled: false,
    provider: 'local',
    apiKey: '',
    model: 'mistral'
  };
};

export const saveAISettings = (settings: AISettings) => {
  const toSave = {
    ...settings,
    apiKey: encrypt(settings.apiKey)
  };
  localStorage.setItem('rassoul_hub_ai_settings', JSON.stringify(toSave));
};

export async function getAIResponse(prompt: string, context?: string): Promise<string> {
  const settings = getAISettings();
  const fullPrompt = context ? `Context: ${context}\n\nQuestion: ${prompt}` : prompt;

  if (settings.enabled && settings.apiKey) {
    try {
      if (settings.provider === 'gemini') {
        return await callGemini(settings.apiKey, fullPrompt);
      } else if (settings.provider === 'openai') {
        return await callOpenAI(settings.apiKey, fullPrompt);
      }
    } catch (error) {
      console.error(`Cloud AI failed, falling back to local:`, error);
      // Fallback to local
    }
  }

  // Default or Fallback: Local Ollama
  return await callOllama(settings.model || 'mistral', fullPrompt);
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are an AI assistant for Rassoul Hub, a modern media player. Help users with summaries, character analysis, and scene explanations based on the provided context.",
    }
  });
  return response.text || "Sorry, I couldn't generate a response.";
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an AI assistant for Rassoul Hub, a modern media player. Help users with summaries, character analysis, and scene explanations based on the provided context." },
      { role: "user", content: prompt }
    ],
  });
  return response.choices[0].message.content || "Sorry, I couldn't generate a response.";
}

async function callOllama(model: string, prompt: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    });
    
    if (!response.ok) throw new Error('Ollama not reachable');
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama error:', error);
    return "Local AI (Ollama) is not reachable. Please ensure Ollama is running on localhost:11434 and OLLAMA_ORIGINS is set to allow this site.";
  }
}
