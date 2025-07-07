const express = require('express');
const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Route pour créer une nouvelle session de chat
router.post('/sessions', (req, res) => {
  try {
    const { userId, title = 'Nouvelle conversation' } = req.body;
    
    const sessionId = uuidv4();
    const db = getDatabase();
    
    db.run(`
      INSERT INTO chat_sessions (id, user_id, title)
      VALUES (?, ?, ?)
    `, [sessionId, userId, title], function(err) {
      if (err) {
        console.error('Erreur lors de la création de la session de chat:', err);
        return res.status(500).json({ error: 'Erreur lors de la création de la session de chat' });
      }
      
      res.json({
        id: sessionId,
        title,
        created_at: new Date().toISOString(),
        messages: []
      });
    });
    
  } catch (error) {
    console.error('Erreur lors de la création de la session de chat:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session de chat' });
  }
});

// Route pour obtenir les sessions de chat d'un utilisateur
router.get('/sessions', (req, res) => {
  const { userId } = req.query;
  const db = getDatabase();
  
  let query = 'SELECT * FROM chat_sessions WHERE is_active = 1';
  let params = [];
  
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  
  query += ' ORDER BY updated_at DESC';
  
  db.all(query, params, (err, sessions) => {
    if (err) {
      console.error('Erreur lors de la récupération des sessions:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
    }
    
    res.json({ sessions: sessions || [] });
  });
});

// Route pour obtenir une session de chat spécifique avec ses messages
router.get('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  // Récupérer la session
  db.get('SELECT * FROM chat_sessions WHERE id = ? AND is_active = 1', [id], (err, session) => {
    if (err) {
      console.error('Erreur lors de la récupération de la session:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération de la session' });
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Session de chat non trouvée' });
    }
    
    // Récupérer les messages de la session
    db.all(`
      SELECT id, role, content, timestamp, metadata, tokens_used, model_used
      FROM chat_messages 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `, [id], (err, messages) => {
      if (err) {
        console.error('Erreur lors de la récupération des messages:', err);
        return res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
      }
      
      // Parser les métadonnées JSON
      const parsedMessages = messages.map(msg => {
        try {
          msg.metadata = JSON.parse(msg.metadata || '{}');
        } catch (parseError) {
          msg.metadata = {};
        }
        return msg;
      });
      
      res.json({
        ...session,
        messages: parsedMessages
      });
    });
  });
});

// Route pour ajouter un message à une session
router.post('/sessions/:id/messages', (req, res) => {
  const { id } = req.params;
  const { role, content, metadata = {}, tokensUsed = 0, modelUsed } = req.body;
  
  if (!role || !content) {
    return res.status(400).json({ error: 'Le rôle et le contenu sont requis' });
  }
  
  if (!['user', 'assistant', 'system'].includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide' });
  }
  
  const db = getDatabase();
  
  // Vérifier que la session existe
  db.get('SELECT id FROM chat_sessions WHERE id = ? AND is_active = 1', [id], (err, session) => {
    if (err) {
      console.error('Erreur lors de la vérification de la session:', err);
      return res.status(500).json({ error: 'Erreur lors de la vérification de la session' });
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Session de chat non trouvée' });
    }
    
    // Ajouter le message
    db.run(`
      INSERT INTO chat_messages (session_id, role, content, metadata, tokens_used, model_used)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, role, content, JSON.stringify(metadata), tokensUsed, modelUsed], function(err) {
      if (err) {
        console.error('Erreur lors de l\'ajout du message:', err);
        return res.status(500).json({ error: 'Erreur lors de l\'ajout du message' });
      }
      
      // Mettre à jour la timestamp de la session
      db.run('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      
      res.json({
        id: this.lastID,
        session_id: id,
        role,
        content,
        metadata,
        tokens_used: tokensUsed,
        model_used: modelUsed,
        timestamp: new Date().toISOString()
      });
    });
  });
});

// Route pour mettre à jour le titre d'une session
router.put('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Le titre est requis' });
  }
  
  const db = getDatabase();
  
  db.run(`
    UPDATE chat_sessions 
    SET title = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_active = 1
  `, [title, id], function(err) {
    if (err) {
      console.error('Erreur lors de la mise à jour du titre:', err);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du titre' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Session de chat non trouvée' });
    }
    
    res.json({ message: 'Titre mis à jour avec succès', title });
  });
});

// Route pour supprimer une session de chat
router.delete('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.run(`
    UPDATE chat_sessions 
    SET is_active = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [id], function(err) {
    if (err) {
      console.error('Erreur lors de la suppression de la session:', err);
      return res.status(500).json({ error: 'Erreur lors de la suppression de la session' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Session de chat non trouvée' });
    }
    
    res.json({ message: 'Session supprimée avec succès' });
  });
});

// Route pour supprimer un message
router.delete('/messages/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.run('DELETE FROM chat_messages WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Erreur lors de la suppression du message:', err);
      return res.status(500).json({ error: 'Erreur lors de la suppression du message' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }
    
    res.json({ message: 'Message supprimé avec succès' });
  });
});

// Route pour rechercher dans les messages
router.get('/search', (req, res) => {
  const { query, userId, limit = 50 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'La requête de recherche est requise' });
  }
  
  const db = getDatabase();
  
  let searchQuery = `
    SELECT cm.*, cs.title as session_title
    FROM chat_messages cm
    JOIN chat_sessions cs ON cm.session_id = cs.id
    WHERE cs.is_active = 1 AND cm.content LIKE ?
  `;
  let params = [`%${query}%`];
  
  if (userId) {
    searchQuery += ' AND cs.user_id = ?';
    params.push(userId);
  }
  
  searchQuery += ' ORDER BY cm.timestamp DESC LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(searchQuery, params, (err, results) => {
    if (err) {
      console.error('Erreur lors de la recherche:', err);
      return res.status(500).json({ error: 'Erreur lors de la recherche' });
    }
    
    // Parser les métadonnées
    const parsedResults = results.map(result => {
      try {
        result.metadata = JSON.parse(result.metadata || '{}');
      } catch (parseError) {
        result.metadata = {};
      }
      return result;
    });
    
    res.json({ 
      results: parsedResults,
      query,
      count: parsedResults.length
    });
  });
});

// Route pour obtenir les statistiques de chat
router.get('/stats', (req, res) => {
  const { userId } = req.query;
  const db = getDatabase();
  
  let queries = [];
  let params = [];
  
  // Requête pour le nombre total de sessions
  let sessionsQuery = 'SELECT COUNT(*) as total_sessions FROM chat_sessions WHERE is_active = 1';
  if (userId) {
    sessionsQuery += ' AND user_id = ?';
    params.push(userId);
  }
  
  // Requête pour le nombre total de messages
  let messagesQuery = `
    SELECT COUNT(*) as total_messages 
    FROM chat_messages cm
    JOIN chat_sessions cs ON cm.session_id = cs.id
    WHERE cs.is_active = 1
  `;
  if (userId) {
    messagesQuery += ' AND cs.user_id = ?';
  }
  
  // Requête pour les tokens utilisés
  let tokensQuery = `
    SELECT SUM(tokens_used) as total_tokens
    FROM chat_messages cm
    JOIN chat_sessions cs ON cm.session_id = cs.id
    WHERE cs.is_active = 1
  `;
  if (userId) {
    tokensQuery += ' AND cs.user_id = ?';
  }
  
  // Exécuter les requêtes
  db.get(sessionsQuery, userId ? [userId] : [], (err, sessionsResult) => {
    if (err) {
      console.error('Erreur lors du calcul des statistiques de sessions:', err);
      return res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
    }
    
    db.get(messagesQuery, userId ? [userId] : [], (err, messagesResult) => {
      if (err) {
        console.error('Erreur lors du calcul des statistiques de messages:', err);
        return res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
      }
      
      db.get(tokensQuery, userId ? [userId] : [], (err, tokensResult) => {
        if (err) {
          console.error('Erreur lors du calcul des statistiques de tokens:', err);
          return res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
        }
        
        res.json({
          totalSessions: sessionsResult.total_sessions || 0,
          totalMessages: messagesResult.total_messages || 0,
          totalTokens: tokensResult.total_tokens || 0,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
});

// Route pour exporter une session de chat
router.get('/sessions/:id/export', (req, res) => {
  const { id } = req.params;
  const { format = 'json' } = req.query;
  
  const db = getDatabase();
  
  // Récupérer la session avec ses messages
  db.get('SELECT * FROM chat_sessions WHERE id = ? AND is_active = 1', [id], (err, session) => {
    if (err) {
      console.error('Erreur lors de la récupération de la session:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération de la session' });
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Session de chat non trouvée' });
    }
    
    db.all(`
      SELECT role, content, timestamp, model_used
      FROM chat_messages 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `, [id], (err, messages) => {
      if (err) {
        console.error('Erreur lors de la récupération des messages:', err);
        return res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
      }
      
      const exportData = {
        session: {
          id: session.id,
          title: session.title,
          created_at: session.created_at,
          updated_at: session.updated_at
        },
        messages: messages,
        exported_at: new Date().toISOString()
      };
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="chat-${id}.json"`);
        res.json(exportData);
      } else if (format === 'txt') {
        let textContent = `Conversation: ${session.title}\n`;
        textContent += `Créée le: ${session.created_at}\n`;
        textContent += `Exportée le: ${exportData.exported_at}\n\n`;
        textContent += '=' .repeat(50) + '\n\n';
        
        messages.forEach(msg => {
          textContent += `[${msg.timestamp}] ${msg.role.toUpperCase()}:\n`;
          textContent += `${msg.content}\n\n`;
        });
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="chat-${id}.txt"`);
        res.send(textContent);
      } else {
        res.status(400).json({ error: 'Format non supporté. Utilisez json ou txt.' });
      }
    });
  });
});

module.exports = router;