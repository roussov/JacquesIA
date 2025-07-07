const express = require('express');
const axios = require('axios');
const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Configuration des modèles d'IA disponibles
const AI_MODELS = {
  openai: {
    name: 'OpenAI GPT-4',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  anthropic: {
    name: 'Claude 3',
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }
  }
};

// Prompts système spécialisés
const SYSTEM_PROMPTS = {
  code_generation: `Tu es Jacques IA, un assistant de programmation expert. Tu aides à :
- Générer du code propre et optimisé
- Expliquer les concepts de programmation
- Proposer des solutions aux problèmes techniques
- Suivre les meilleures pratiques de développement
Réponds toujours en français et fournis du code commenté.`,

  code_review: `Tu es un expert en révision de code. Analyse le code fourni et :
- Identifie les problèmes potentiels
- Suggère des améliorations
- Vérifie la sécurité et les performances
- Propose des refactorisations si nécessaire
Sois constructif et pédagogique dans tes commentaires.`,

  debugging: `Tu es un expert en débogage. Aide à :
- Identifier les bugs dans le code
- Expliquer les erreurs et leurs causes
- Proposer des solutions de correction
- Suggérer des techniques de débogage
Fournis des explications claires et des solutions pratiques.`,

  architecture: `Tu es un architecte logiciel expert. Aide à :
- Concevoir l'architecture d'applications
- Choisir les bonnes technologies
- Optimiser les performances
- Planifier la scalabilité
Fournis des conseils stratégiques et des diagrammes si nécessaire.`
};

// Route pour obtenir une suggestion d'IA
router.post('/suggest', async (req, res) => {
  try {
    const { prompt, context, model = 'openai', type = 'code_generation', sessionId, userId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt est requis' });
    }

    const startTime = Date.now();
    const db = getDatabase();
    
    // Construire le prompt complet avec le contexte
    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.code_generation;
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
    
    let response;
    let tokensUsed = 0;
    
    if (model === 'openai' && process.env.OPENAI_API_KEY) {
      const openaiResponse = await axios.post(AI_MODELS.openai.endpoint, {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: AI_MODELS.openai.headers,
        timeout: 30000
      });
      
      response = openaiResponse.data.choices[0].message.content;
      tokensUsed = openaiResponse.data.usage.total_tokens;
      
    } else if (model === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      const anthropicResponse = await axios.post(AI_MODELS.anthropic.endpoint, {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: fullPrompt }
        ]
      }, {
        headers: AI_MODELS.anthropic.headers,
        timeout: 30000
      });
      
      response = anthropicResponse.data.content[0].text;
      tokensUsed = anthropicResponse.data.usage.input_tokens + anthropicResponse.data.usage.output_tokens;
      
    } else {
      // Fallback vers une réponse simulée si aucune API n'est configurée
      response = generateFallbackResponse(prompt, type);
      tokensUsed = Math.floor(prompt.length / 4); // Estimation approximative
    }
    
    const responseTime = Date.now() - startTime;
    
    // Sauvegarder la suggestion dans la base de données
    const suggestionId = uuidv4();
    db.run(`
      INSERT INTO ai_suggestions (id, user_id, session_id, prompt, response, model_used, tokens_used, response_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [suggestionId, userId, sessionId, prompt, response, model, tokensUsed, responseTime]);
    
    res.json({
      id: suggestionId,
      response,
      model,
      tokensUsed,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération de suggestion IA:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération de la suggestion',
      details: error.message 
    });
  }
});

// Route pour analyser du code
router.post('/analyze', async (req, res) => {
  try {
    const { code, language, analysisType = 'general' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Le code est requis' });
    }
    
    const analysisPrompts = {
      general: `Analyse ce code ${language} et fournis :
1. Un résumé de ce que fait le code
2. Les points forts
3. Les points à améliorer
4. Les problèmes potentiels
5. Des suggestions d'optimisation`,
      
      security: `Analyse la sécurité de ce code ${language} :
1. Identifie les vulnérabilités potentielles
2. Vérifie les pratiques de sécurité
3. Suggère des améliorations de sécurité
4. Évalue les risques`,
      
      performance: `Analyse les performances de ce code ${language} :
1. Identifie les goulots d'étranglement
2. Suggère des optimisations
3. Évalue la complexité algorithmique
4. Propose des alternatives plus efficaces`
    };
    
    const prompt = `${analysisPrompts[analysisType] || analysisPrompts.general}

Code à analyser :
\`\`\`${language}
${code}
\`\`\``;
    
    const startTime = Date.now();
    const db = getDatabase();
    
    let response;
    let tokensUsed = 0;
    
    if (process.env.OPENAI_API_KEY) {
      const openaiResponse = await axios.post(AI_MODELS.openai.endpoint, {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.code_review },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: AI_MODELS.openai.headers,
        timeout: 30000
      });
      
      response = openaiResponse.data.choices[0].message.content;
      tokensUsed = openaiResponse.data.usage.total_tokens;
      
    } else if (process.env.ANTHROPIC_API_KEY) {
      const anthropicResponse = await axios.post(AI_MODELS.anthropic.endpoint, {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        system: SYSTEM_PROMPTS.code_review,
        messages: [
          { role: 'user', content: prompt }
        ]
      }, {
        headers: AI_MODELS.anthropic.headers,
        timeout: 30000
      });
      
      response = anthropicResponse.data.content[0].text;
      tokensUsed = anthropicResponse.data.usage.input_tokens + anthropicResponse.data.usage.output_tokens;
      
    } else {
      response = generateFallbackResponse(prompt, 'code_review');
      tokensUsed = Math.floor(prompt.length / 4);
    }
    
    res.json({
      analysis: response,
      analysisType,
      language,
      tokensUsed,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse de code:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse du code',
      details: error.message 
    });
  }
});

// Route pour obtenir les modèles disponibles
router.get('/models', (req, res) => {
  const availableModels = Object.keys(AI_MODELS).map(key => ({
    id: key,
    name: AI_MODELS[key].name,
    available: key === 'openai' ? !!process.env.OPENAI_API_KEY : !!process.env.ANTHROPIC_API_KEY
  }));
  
  res.json({ models: availableModels });
});

// Route pour obtenir l'historique des suggestions
router.get('/suggestions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const db = getDatabase();
  
  db.all(`
    SELECT id, prompt, response, model_used, tokens_used, response_time, rating, created_at
    FROM ai_suggestions 
    WHERE session_id = ? 
    ORDER BY created_at DESC
    LIMIT 50
  `, [sessionId], (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération des suggestions:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des suggestions' });
    }
    
    res.json({ suggestions: rows });
  });
});

// Route pour évaluer une suggestion
router.post('/suggestions/:id/rate', (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
  }
  
  const db = getDatabase();
  db.run(`
    UPDATE ai_suggestions 
    SET rating = ?, feedback = ? 
    WHERE id = ?
  `, [rating, feedback, id], function(err) {
    if (err) {
      console.error('Erreur lors de la sauvegarde de l\'évaluation:', err);
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde de l\'évaluation' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Suggestion non trouvée' });
    }
    
    res.json({ message: 'Évaluation sauvegardée avec succès' });
  });
});

// Fonction de fallback pour générer des réponses simulées
function generateFallbackResponse(prompt, type) {
  const responses = {
    code_generation: `Je suis Jacques IA, votre assistant de programmation. 

Pour utiliser pleinement mes capacités, veuillez configurer une clé API OpenAI ou Anthropic dans les variables d'environnement.

En attendant, voici quelques conseils généraux pour votre demande :

1. **Analysez le problème** : Décomposez votre tâche en étapes plus petites
2. **Choisissez les bons outils** : Sélectionnez le langage et les frameworks appropriés
3. **Écrivez du code propre** : Utilisez des noms de variables explicites et commentez votre code
4. **Testez régulièrement** : Implémentez des tests unitaires et d'intégration

Pour une assistance complète avec génération de code personnalisée, configurez votre clé API.`,

    debugging: `Mode débogage activé ! 

Pour un débogage complet, configurez une clé API. En attendant :

**Techniques de débogage générales :**
1. Utilisez des console.log() ou print() pour tracer l'exécution
2. Vérifiez les types de données et les valeurs nulles
3. Examinez la pile d'appels en cas d'erreur
4. Utilisez un débogueur intégré (breakpoints)
5. Testez avec des données d'entrée simples

**Erreurs communes :**
- Variables non définies
- Erreurs de syntaxe
- Problèmes de portée (scope)
- Erreurs de logique métier`,

    code_review: `Révision de code en cours...

Pour une analyse détaillée, configurez une clé API. Voici une checklist générale :

**Points à vérifier :**
✅ Lisibilité du code
✅ Respect des conventions de nommage
✅ Gestion des erreurs
✅ Sécurité (validation des entrées)
✅ Performance (complexité algorithmique)
✅ Tests unitaires
✅ Documentation

**Bonnes pratiques :**
- Code DRY (Don't Repeat Yourself)
- Principe de responsabilité unique
- Gestion appropriée des exceptions
- Validation des données d'entrée`
  };

  return responses[type] || responses.code_generation;
}

module.exports = router;