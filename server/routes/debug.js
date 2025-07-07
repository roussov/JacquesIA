const express = require('express');
const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Route pour créer une session de débogage
router.post('/sessions', (req, res) => {
  try {
    const { projectId, userId, code, breakpoints = [] } = req.body;
    
    if (!projectId || !code) {
      return res.status(400).json({ error: 'L\'ID du projet et le code sont requis' });
    }
    
    const sessionId = uuidv4();
    const db = getDatabase();
    
    db.run(`
      INSERT INTO debug_sessions (id, project_id, user_id, code_snapshot, breakpoints, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sessionId, projectId, userId, code, JSON.stringify(breakpoints), 'active'], function(err) {
      if (err) {
        console.error('Erreur lors de la création de la session de débogage:', err);
        return res.status(500).json({ error: 'Erreur lors de la création de la session de débogage' });
      }
      
      res.json({
        id: sessionId,
        projectId,
        status: 'active',
        breakpoints,
        created_at: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error('Erreur lors de la création de la session de débogage:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session de débogage' });
  }
});

// Route pour obtenir une session de débogage
router.get('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.get('SELECT * FROM debug_sessions WHERE id = ?', [id], (err, session) => {
    if (err) {
      console.error('Erreur lors de la récupération de la session:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération de la session' });
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Session de débogage non trouvée' });
    }
    
    // Parser les données JSON
    try {
      session.breakpoints = JSON.parse(session.breakpoints || '[]');
      session.variables = JSON.parse(session.variables || '{}');
      session.call_stack = JSON.parse(session.call_stack || '[]');
    } catch (parseError) {
      console.error('Erreur lors du parsing des données de session:', parseError);
    }
    
    res.json(session);
  });
});

// Route pour mettre à jour les breakpoints
router.put('/sessions/:id/breakpoints', (req, res) => {
  const { id } = req.params;
  const { breakpoints } = req.body;
  
  if (!Array.isArray(breakpoints)) {
    return res.status(400).json({ error: 'Les breakpoints doivent être un tableau' });
  }
  
  const db = getDatabase();
  db.run(`
    UPDATE debug_sessions 
    SET breakpoints = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [JSON.stringify(breakpoints), id], function(err) {
    if (err) {
      console.error('Erreur lors de la mise à jour des breakpoints:', err);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour des breakpoints' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Session de débogage non trouvée' });
    }
    
    res.json({ message: 'Breakpoints mis à jour avec succès', breakpoints });
  });
});

// Route pour analyser le code et détecter les problèmes potentiels
router.post('/analyze', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Le code et le langage sont requis' });
    }
    
    const analysis = await analyzeCodeForDebugging(code, language);
    
    res.json({
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse du code:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse du code' });
  }
});

// Route pour obtenir des suggestions de débogage
router.post('/suggestions', async (req, res) => {
  try {
    const { error, code, language, context } = req.body;
    
    if (!error) {
      return res.status(400).json({ error: 'L\'erreur est requise' });
    }
    
    const suggestions = await generateDebuggingSuggestions(error, code, language, context);
    
    res.json({
      suggestions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération des suggestions:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des suggestions' });
  }
});

// Route pour simuler l'exécution pas à pas
router.post('/sessions/:id/step', (req, res) => {
  const { id } = req.params;
  const { stepType = 'over', currentLine } = req.body;
  
  const db = getDatabase();
  
  // Simuler l'exécution pas à pas
  const stepResult = simulateStepExecution(stepType, currentLine);
  
  // Mettre à jour la session avec les nouvelles variables et la pile d'appels
  db.run(`
    UPDATE debug_sessions 
    SET variables = ?, call_stack = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [JSON.stringify(stepResult.variables), JSON.stringify(stepResult.callStack), id], function(err) {
    if (err) {
      console.error('Erreur lors de la mise à jour de la session:', err);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de la session' });
    }
    
    res.json({
      currentLine: stepResult.nextLine,
      variables: stepResult.variables,
      callStack: stepResult.callStack,
      status: stepResult.status
    });
  });
});

// Route pour évaluer une expression dans le contexte de débogage
router.post('/sessions/:id/evaluate', (req, res) => {
  const { id } = req.params;
  const { expression } = req.body;
  
  if (!expression) {
    return res.status(400).json({ error: 'L\'expression est requise' });
  }
  
  const db = getDatabase();
  
  // Récupérer le contexte de la session
  db.get('SELECT variables FROM debug_sessions WHERE id = ?', [id], (err, session) => {
    if (err) {
      console.error('Erreur lors de la récupération de la session:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération de la session' });
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Session de débogage non trouvée' });
    }
    
    try {
      const variables = JSON.parse(session.variables || '{}');
      const result = evaluateExpression(expression, variables);
      
      res.json({
        expression,
        result,
        type: typeof result
      });
      
    } catch (error) {
      res.json({
        expression,
        error: error.message,
        result: null
      });
    }
  });
});

// Route pour arrêter une session de débogage
router.delete('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.run(`
    UPDATE debug_sessions 
    SET status = 'stopped', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [id], function(err) {
    if (err) {
      console.error('Erreur lors de l\'arrêt de la session:', err);
      return res.status(500).json({ error: 'Erreur lors de l\'arrêt de la session' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Session de débogage non trouvée' });
    }
    
    res.json({ message: 'Session de débogage arrêtée avec succès' });
  });
});

// Fonction pour analyser le code et détecter les problèmes
async function analyzeCodeForDebugging(code, language) {
  const issues = [];
  const warnings = [];
  const suggestions = [];
  
  // Analyse basique selon le langage
  if (language === 'javascript') {
    // Vérifications JavaScript
    if (code.includes('var ')) {
      warnings.push({
        line: getLineNumber(code, 'var '),
        message: 'Utilisation de "var" détectée. Préférez "let" ou "const".',
        severity: 'warning'
      });
    }
    
    if (code.includes('==') && !code.includes('===')) {
      warnings.push({
        line: getLineNumber(code, '=='),
        message: 'Utilisation de "==" détectée. Préférez "===" pour une comparaison stricte.',
        severity: 'warning'
      });
    }
    
    if (!code.includes('try') && (code.includes('JSON.parse') || code.includes('fetch'))) {
      suggestions.push({
        message: 'Considérez l\'ajout de gestion d\'erreurs avec try-catch pour les opérations risquées.',
        severity: 'info'
      });
    }
  }
  
  if (language === 'python') {
    // Vérifications Python
    if (code.includes('except:')) {
      issues.push({
        line: getLineNumber(code, 'except:'),
        message: 'Évitez les clauses except vides. Spécifiez le type d\'exception.',
        severity: 'error'
      });
    }
    
    if (code.includes('print(') && !code.includes('if __name__')) {
      suggestions.push({
        message: 'Considérez l\'utilisation de logging au lieu de print pour le débogage.',
        severity: 'info'
      });
    }
  }
  
  // Vérifications générales
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    if (line.trim().startsWith('//TODO') || line.trim().startsWith('#TODO')) {
      suggestions.push({
        line: index + 1,
        message: 'TODO trouvé - n\'oubliez pas de compléter cette partie.',
        severity: 'info'
      });
    }
  });
  
  return {
    issues,
    warnings,
    suggestions,
    linesAnalyzed: lines.length,
    complexity: calculateComplexity(code)
  };
}

// Fonction pour générer des suggestions de débogage
async function generateDebuggingSuggestions(error, code, language, context) {
  const suggestions = [];
  
  // Analyse de l'erreur
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('undefined')) {
    suggestions.push({
      type: 'variable_check',
      title: 'Variable non définie',
      description: 'Vérifiez que toutes les variables sont déclarées avant utilisation.',
      action: 'Ajoutez des vérifications de type ou initialisez les variables.'
    });
  }
  
  if (errorLower.includes('null')) {
    suggestions.push({
      type: 'null_check',
      title: 'Valeur null détectée',
      description: 'Ajoutez des vérifications pour les valeurs null.',
      action: 'Utilisez des opérateurs de coalescence ou des conditions de garde.'
    });
  }
  
  if (errorLower.includes('syntax')) {
    suggestions.push({
      type: 'syntax_error',
      title: 'Erreur de syntaxe',
      description: 'Vérifiez la syntaxe du code.',
      action: 'Examinez les parenthèses, crochets et points-virgules manquants.'
    });
  }
  
  if (errorLower.includes('timeout') || errorLower.includes('infinite')) {
    suggestions.push({
      type: 'infinite_loop',
      title: 'Boucle infinie possible',
      description: 'Le code semble être bloqué dans une boucle.',
      action: 'Vérifiez les conditions de sortie des boucles et ajoutez des compteurs de sécurité.'
    });
  }
  
  // Suggestions spécifiques au langage
  if (language === 'javascript') {
    suggestions.push({
      type: 'debugging_tools',
      title: 'Outils de débogage JavaScript',
      description: 'Utilisez les outils de développement du navigateur.',
      action: 'Ajoutez des console.log(), utilisez le débogueur ou les breakpoints.'
    });
  }
  
  if (language === 'python') {
    suggestions.push({
      type: 'debugging_tools',
      title: 'Outils de débogage Python',
      description: 'Utilisez pdb pour le débogage interactif.',
      action: 'Ajoutez import pdb; pdb.set_trace() pour des breakpoints.'
    });
  }
  
  return suggestions;
}

// Fonction pour simuler l'exécution pas à pas
function simulateStepExecution(stepType, currentLine) {
  // Simulation basique de l'exécution pas à pas
  const variables = {
    'x': Math.floor(Math.random() * 100),
    'y': Math.floor(Math.random() * 100),
    'result': null
  };
  
  const callStack = [
    {
      function: 'main',
      line: currentLine || 1,
      variables: variables
    }
  ];
  
  return {
    nextLine: (currentLine || 1) + 1,
    variables,
    callStack,
    status: 'paused'
  };
}

// Fonction pour évaluer une expression
function evaluateExpression(expression, variables) {
  // Évaluation sécurisée basique
  // Dans un environnement de production, utilisez un évaluateur plus sécurisé
  
  try {
    // Remplacer les variables dans l'expression
    let evaluatedExpression = expression;
    
    Object.keys(variables).forEach(varName => {
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      evaluatedExpression = evaluatedExpression.replace(regex, JSON.stringify(variables[varName]));
    });
    
    // Évaluation simple (attention: dangereux en production)
    // Ici on simule juste le résultat
    if (evaluatedExpression.includes('+')) {
      return 'Résultat de l\'addition simulée';
    } else if (evaluatedExpression.includes('*')) {
      return 'Résultat de la multiplication simulée';
    } else {
      return variables[expression] || `Valeur de ${expression}`;
    }
    
  } catch (error) {
    throw new Error(`Impossible d'évaluer l'expression: ${error.message}`);
  }
}

// Fonction utilitaire pour obtenir le numéro de ligne
function getLineNumber(code, searchString) {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString)) {
      return i + 1;
    }
  }
  return 1;
}

// Fonction pour calculer la complexité du code
function calculateComplexity(code) {
  let complexity = 1; // Complexité de base
  
  // Compter les structures de contrôle
  const controlStructures = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
  
  controlStructures.forEach(structure => {
    const regex = new RegExp(`\\b${structure}\\b`, 'g');
    const matches = code.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  });
  
  return complexity;
}

module.exports = router;