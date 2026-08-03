import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Endpoint: AI Chat with Gemini 3.6 Flash & Library Mastery
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { prompt, context, libraryItems, userApiKey } = req.body;
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ 
          error: "Clé API Gemini non configurée. Veuillez ajouter votre clé GEMINI_API_KEY dans le panneau des paramètres ou dans Secrets." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare library context summary for Gemini
      let librarySummary = "";
      if (Array.isArray(libraryItems) && libraryItems.length > 0) {
        librarySummary = "\n\nCONTENU ACTUEL DE LA BIBLIOTHÈQUE DU LECTEUR (Rassoul Hub):\n" + 
          libraryItems.map((item: any) => 
            `- ID: "${item.id}" | Titre: "${item.title}" | Categorie: "${item.category || 'Non classé'}" | Saison: ${item.season || 'N/A'}, Episode: ${item.episode || 'N/A'} | Année: ${item.year || 'Inconnue'} | Favori: ${item.isFavorite ? 'Oui' : 'Non'} | Fichier: "${item.filePath || 'Local'}"`
          ).join('\n');
      } else {
        librarySummary = "\n\nLa bibliothèque est actuellement vide.";
      }

      const systemInstruction = `Tu es l'Assistant Neural officiel de Rassoul Hub, un lecteur média haut de gamme et intelligent.
Tu as une maîtrise totale de l'application et de la bibliothèque multimédia de l'utilisateur.

Tes rôles principaux :
1. Recherche & Localisation : Trouver immédiatement un film, une série ou un épisode dans la bibliothèque de l'utilisateur.
2. Correction de Métadonnées : Détecter et proposer des corrections si un titre est mal nommé, si la catégorie est incorrecte, ou si l'année/saison/épisode est erronée. Quand l'utilisateur demande de corriger un film/série, réponds de façon claire en précisant les données corrigées.
3. Analyse & Recommandations : Expliquer les scènes, analyser le contexte en cours de visionnage, résumer les épisodes et recommander d'autres titres de sa bibliothèque en fonction de ses préférences et favoris.
4. Navigation & Aide : Guider l'utilisateur dans l'interface (mode sombre, gestion des favoris, raccourcis clavier, vitesse de lecture, sous-titres SRT).

Voici l'état actuel de la bibliothèque :
${librarySummary}

Directives de réponse :
- Sois très précis, poli, chaleureux et professionnel en français.
- Quand tu trouves un film ou une série dans la bibliothèque, cite son titre exact et ses détails.
- Si un film demandé n'est pas dans la bibliothèque, indique-le poliment et suggère des titres similaires présents dans sa collection.
- Reste concis et bien structuré avec des puces d'action quand c'est pertinent.`;

      const userContent = context 
        ? `[Contexte de lecture actuel: ${context}]\n\nDemande utilisateur: ${prompt}`
        : prompt;

      // Function definitions for Gemini Tool Calls
      const searchLibraryTool = {
        name: "searchLibrary",
        description: "Chercher un film, une série ou un épisode spécifique dans la bibliothèque de Rassoul Hub",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Terme de recherche (ex: nom du film, genre, mot-clé)" }
          },
          required: ["query"]
        }
      };

      const correctMetadataTool = {
        name: "correctMetadata",
        description: "Proposer ou appliquer une correction de métadonnées pour un titre dans la bibliothèque",
        parameters: {
          type: Type.OBJECT,
          properties: {
            videoId: { type: Type.STRING, description: "Identifiant de la vidéo" },
            newTitle: { type: Type.STRING, description: "Nouveau titre corrigé" },
            newCategory: { type: Type.STRING, description: "Nouvelle catégorie/genre" },
            newYear: { type: Type.NUMBER, description: "Nouvelle année de sortie" }
          },
          required: ["videoId"]
        }
      };

      const skipIntroTool = {
        name: "skipIntro",
        description: "Passer ou sauter l'introduction de l'épisode ou de la série en cours",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      };

      const skipOutroTool = {
        name: "skipOutro",
        description: "Passer le générique de fin (outro) ou sauter les crédits de l'épisode",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      };

      const playNextEpisodeTool = {
        name: "playNextEpisode",
        description: "Lancer immédiatement l'épisode suivant de la série",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userContent,
        config: {
          systemInstruction,
          temperature: 0.7,
          tools: [{ functionDeclarations: [searchLibraryTool, correctMetadataTool, skipIntroTool, skipOutroTool, playNextEpisodeTool] }]
        }
      });

      const functionCalls = response.functionCalls;
      let actionToExecute = null;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        actionToExecute = {
          name: call.name,
          args: call.args
        };
      }

      res.json({
        text: response.text || "J'ai traité votre demande.",
        action: actionToExecute
      });

    } catch (err: any) {
      console.error("Gemini API server error:", err);
      res.status(500).json({ error: err.message || "Erreur interne lors de la communication avec l'IA Gemini." });
    }
  });

  // Vite integration for dev and production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rassoul Hub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
