const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const { OAuth2Client } = require('google-auth-library');
const { getDatabase } = require('../database/init');
const router = express.Router();

// Configuration Google OAuth (temporairement désactivé)
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'jacques-ia-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation des données
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur, email et mot de passe sont requis' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }
    
    const db = getDatabase();
    
    // Vérifier si l'utilisateur existe déjà
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
      if (err) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', err);
        return res.status(500).json({ error: 'Erreur lors de la vérification de l\'utilisateur' });
      }
      
      if (existingUser) {
        return res.status(409).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' });
      }
      
      try {
        // Hasher le mot de passe
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Créer l'utilisateur
        db.run(`
          INSERT INTO users (username, email, password_hash, preferences)
          VALUES (?, ?, ?, ?)
        `, [username, email, passwordHash, JSON.stringify({
          theme: 'light',
          language: 'fr',
          notifications: true,
          autoSave: true
        })], function(err) {
          if (err) {
            console.error('Erreur lors de la création de l\'utilisateur:', err);
            return res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
          }
          
          const userId = this.lastID;
          
          // Générer un token JWT
          const token = jwt.sign(
            { userId, username, email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: {
              id: userId,
              username,
              email,
              created_at: new Date().toISOString()
            },
            token
          });
        });
        
      } catch (hashError) {
        console.error('Erreur lors du hashage du mot de passe:', hashError);
        res.status(500).json({ error: 'Erreur lors du traitement du mot de passe' });
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe sont requis' });
    }
    
    const db = getDatabase();
    
    // Récupérer l'utilisateur (par nom d'utilisateur ou email)
    db.get(`
      SELECT id, username, email, password_hash, preferences, is_active
      FROM users 
      WHERE (username = ? OR email = ?) AND is_active = 1
    `, [username, username], async (err, user) => {
      if (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        return res.status(500).json({ error: 'Erreur lors de la connexion' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
      }
      
      try {
        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }
        
        // Mettre à jour la dernière connexion
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        
        // Générer un token JWT
        const token = jwt.sign(
          { userId: user.id, username: user.username, email: user.email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Parser les préférences
        let preferences = {};
        try {
          preferences = JSON.parse(user.preferences || '{}');
        } catch (parseError) {
          console.error('Erreur lors du parsing des préférences:', parseError);
        }
        
        res.json({
          message: 'Connexion réussie',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            preferences
          },
          token
        });
        
      } catch (compareError) {
        console.error('Erreur lors de la vérification du mot de passe:', compareError);
        res.status(500).json({ error: 'Erreur lors de la vérification du mot de passe' });
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Route d'authentification Google (temporairement désactivée)
router.post('/google', async (req, res) => {
  return res.status(503).json({ error: 'Authentification Google temporairement désactivée' });
  
  /*
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Credential Google requis' });
    }
    
    // Vérifier le token Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    if (!email) {
      return res.status(400).json({ error: 'Email non fourni par Google' });
    }
    
    const db = getDatabase();
    
    // Vérifier si l'utilisateur existe déjà
    db.get('SELECT id, username, email, preferences, is_active FROM users WHERE email = ?', [email], (err, existingUser) => {
      if (err) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', err);
        return res.status(500).json({ error: 'Erreur lors de l\'authentification Google' });
      }
      
      if (existingUser) {
        // Utilisateur existant - connexion
        if (!existingUser.is_active) {
          return res.status(401).json({ error: 'Compte désactivé' });
        }
        
        // Mettre à jour la dernière connexion et l'ID Google si nécessaire
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP, google_id = ? WHERE id = ?', [googleId, existingUser.id]);
        
        // Générer un token JWT
        const token = jwt.sign(
          { userId: existingUser.id, username: existingUser.username, email: existingUser.email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Parser les préférences
        let preferences = {};
        try {
          preferences = JSON.parse(existingUser.preferences || '{}');
        } catch (parseError) {
          console.error('Erreur lors du parsing des préférences:', parseError);
        }
        
        res.json({
          message: 'Connexion Google réussie',
          user: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            preferences
          },
          token
        });
        
      } else {
        // Nouvel utilisateur - inscription
        const username = name || email.split('@')[0];
        
        // Créer l'utilisateur avec Google ID
        db.run(`
          INSERT INTO users (username, email, google_id, preferences, avatar_url)
          VALUES (?, ?, ?, ?, ?)
        `, [username, email, googleId, JSON.stringify({
          theme: 'light',
          language: 'fr',
          notifications: true,
          autoSave: true
        }), picture || null], function(err) {
          if (err) {
            console.error('Erreur lors de la création de l\'utilisateur Google:', err);
            return res.status(500).json({ error: 'Erreur lors de la création du compte Google' });
          }
          
          const userId = this.lastID;
          
          // Générer un token JWT
          const token = jwt.sign(
            { userId, username, email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          res.status(201).json({
            message: 'Compte Google créé avec succès',
            user: {
              id: userId,
              username,
              email,
              created_at: new Date().toISOString()
            },
            token
          });
        });
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'authentification Google:', error);
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ error: 'Token Google invalide (utilisé trop tôt)' });
    }
    if (error.message && error.message.includes('Invalid token')) {
      return res.status(400).json({ error: 'Token Google invalide' });
    }
    res.status(500).json({ error: 'Erreur lors de l\'authentification Google' });
  }
  */
});

// Route pour vérifier le token
router.get('/verify', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.get(`
    SELECT id, username, email, preferences, created_at, last_login
    FROM users 
    WHERE id = ? AND is_active = 1
  `, [req.user.userId], (err, user) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', err);
      return res.status(500).json({ error: 'Erreur lors de la vérification' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Parser les préférences
    let preferences = {};
    try {
      preferences = JSON.parse(user.preferences || '{}');
    } catch (parseError) {
      console.error('Erreur lors du parsing des préférences:', parseError);
    }
    
    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        preferences,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  });
});

// Route pour mettre à jour le profil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword, preferences } = req.body;
    const userId = req.user.userId;
    
    const db = getDatabase();
    
    // Récupérer l'utilisateur actuel
    db.get('SELECT username, email, password_hash FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      let updates = [];
      let params = [];
      
      // Vérifier si le nom d'utilisateur ou l'email change
      if (username && username !== user.username) {
        // Vérifier que le nouveau nom d'utilisateur n'est pas déjà pris
        const existingUser = await new Promise((resolve, reject) => {
          db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        
        if (existingUser) {
          return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà utilisé' });
        }
        
        updates.push('username = ?');
        params.push(username);
      }
      
      if (email && email !== user.email) {
        if (!isValidEmail(email)) {
          return res.status(400).json({ error: 'Format d\'email invalide' });
        }
        
        // Vérifier que le nouvel email n'est pas déjà pris
        const existingEmail = await new Promise((resolve, reject) => {
          db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        
        if (existingEmail) {
          return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }
        
        updates.push('email = ?');
        params.push(email);
      }
      
      // Changer le mot de passe si demandé
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Le mot de passe actuel est requis pour changer le mot de passe' });
        }
        
        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
        }
        
        try {
          const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
          
          if (!isCurrentPasswordValid) {
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
          }
          
          const newPasswordHash = await bcrypt.hash(newPassword, 12);
          updates.push('password_hash = ?');
          params.push(newPasswordHash);
          
        } catch (passwordError) {
          console.error('Erreur lors du traitement du mot de passe:', passwordError);
          return res.status(500).json({ error: 'Erreur lors du traitement du mot de passe' });
        }
      }
      
      // Mettre à jour les préférences
      if (preferences) {
        updates.push('preferences = ?');
        params.push(JSON.stringify(preferences));
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'Aucune modification à apporter' });
      }
      
      // Exécuter la mise à jour
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      params.push(userId);
      
      db.run(query, params, function(err) {
        if (err) {
          console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
          return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
        }
        
        res.json({ message: 'Profil mis à jour avec succès' });
      });
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// Route pour supprimer le compte
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;
    
    if (!password) {
      return res.status(400).json({ error: 'Le mot de passe est requis pour supprimer le compte' });
    }
    
    const db = getDatabase();
    
    // Vérifier le mot de passe
    db.get('SELECT password_hash FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        return res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      try {
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Mot de passe incorrect' });
        }
        
        // Désactiver le compte au lieu de le supprimer complètement
        db.run('UPDATE users SET is_active = 0 WHERE id = ?', [userId], function(err) {
          if (err) {
            console.error('Erreur lors de la désactivation du compte:', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
          }
          
          res.json({ message: 'Compte supprimé avec succès' });
        });
        
      } catch (compareError) {
        console.error('Erreur lors de la vérification du mot de passe:', compareError);
        res.status(500).json({ error: 'Erreur lors de la vérification du mot de passe' });
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
});

// Middleware d'authentification
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
    
    req.user = user;
    next();
  });
}

// Fonction utilitaire pour valider l'email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;