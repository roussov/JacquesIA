const express = require('express');
const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');
const { Docker } = require('node-docker-api');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Configuration Docker pour l'exécution sécurisée
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Langages supportés et leurs configurations
const SUPPORTED_LANGUAGES = {
  javascript: {
    name: 'JavaScript',
    extension: '.js',
    dockerImage: 'node:18-alpine',
    runCommand: 'node',
    timeout: 10000
  },
  python: {
    name: 'Python',
    extension: '.py',
    dockerImage: 'python:3.11-alpine',
    runCommand: 'python',
    timeout: 10000
  },
  java: {
    name: 'Java',
    extension: '.java',
    dockerImage: 'openjdk:17-alpine',
    runCommand: 'javac Main.java && java Main',
    timeout: 15000
  },
  cpp: {
    name: 'C++',
    extension: '.cpp',
    dockerImage: 'gcc:alpine',
    runCommand: 'g++ -o main main.cpp && ./main',
    timeout: 15000
  },
  go: {
    name: 'Go',
    extension: '.go',
    dockerImage: 'golang:alpine',
    runCommand: 'go run',
    timeout: 10000
  },
  rust: {
    name: 'Rust',
    extension: '.rs',
    dockerImage: 'rust:alpine',
    runCommand: 'rustc main.rs && ./main',
    timeout: 20000
  }
};

// Route pour créer un nouveau projet
router.post('/projects', async (req, res) => {
  try {
    const { name, description, language, userId } = req.body;
    
    if (!name || !language) {
      return res.status(400).json({ error: 'Le nom et le langage sont requis' });
    }
    
    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({ error: 'Langage non supporté' });
    }
    
    const projectId = uuidv4();
    const db = getDatabase();
    
    db.run(`
      INSERT INTO code_projects (id, user_id, name, description, language)
      VALUES (?, ?, ?, ?, ?)
    `, [projectId, userId, name, description, language], function(err) {
      if (err) {
        console.error('Erreur lors de la création du projet:', err);
        return res.status(500).json({ error: 'Erreur lors de la création du projet' });
      }
      
      res.json({
        id: projectId,
        name,
        description,
        language,
        created_at: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    res.status(500).json({ error: 'Erreur lors de la création du projet' });
  }
});

// Route pour obtenir les projets d'un utilisateur
router.get('/projects', (req, res) => {
  const { userId } = req.query;
  const db = getDatabase();
  
  let query = 'SELECT * FROM code_projects WHERE 1=1';
  let params = [];
  
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  
  query += ' ORDER BY updated_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération des projets:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
    }
    
    res.json({ projects: rows });
  });
});

// Route pour obtenir un projet spécifique
router.get('/projects/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.get('SELECT * FROM code_projects WHERE id = ?', [id], (err, project) => {
    if (err) {
      console.error('Erreur lors de la récupération du projet:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    
    // Récupérer les fichiers du projet
    db.all('SELECT * FROM code_files WHERE project_id = ? ORDER BY filename', [id], (err, files) => {
      if (err) {
        console.error('Erreur lors de la récupération des fichiers:', err);
        return res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
      }
      
      res.json({
        ...project,
        files: files || []
      });
    });
  });
});

// Route pour créer/mettre à jour un fichier
router.post('/projects/:projectId/files', (req, res) => {
  const { projectId } = req.params;
  const { filename, content, language, isMain = false } = req.body;
  
  if (!filename || content === undefined) {
    return res.status(400).json({ error: 'Le nom de fichier et le contenu sont requis' });
  }
  
  const fileId = uuidv4();
  const db = getDatabase();
  
  // Vérifier si le fichier existe déjà
  db.get('SELECT id FROM code_files WHERE project_id = ? AND filename = ?', [projectId, filename], (err, existingFile) => {
    if (err) {
      console.error('Erreur lors de la vérification du fichier:', err);
      return res.status(500).json({ error: 'Erreur lors de la vérification du fichier' });
    }
    
    if (existingFile) {
      // Mettre à jour le fichier existant
      db.run(`
        UPDATE code_files 
        SET content = ?, language = ?, is_main = ?, updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND filename = ?
      `, [content, language, isMain, projectId, filename], function(err) {
        if (err) {
          console.error('Erreur lors de la mise à jour du fichier:', err);
          return res.status(500).json({ error: 'Erreur lors de la mise à jour du fichier' });
        }
        
        res.json({
          id: existingFile.id,
          filename,
          content,
          language,
          isMain,
          updated_at: new Date().toISOString()
        });
      });
    } else {
      // Créer un nouveau fichier
      db.run(`
        INSERT INTO code_files (id, project_id, filename, content, language, is_main)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [fileId, projectId, filename, content, language, isMain], function(err) {
        if (err) {
          console.error('Erreur lors de la création du fichier:', err);
          return res.status(500).json({ error: 'Erreur lors de la création du fichier' });
        }
        
        res.json({
          id: fileId,
          filename,
          content,
          language,
          isMain,
          created_at: new Date().toISOString()
        });
      });
    }
  });
});

// Route pour exécuter du code
router.post('/execute', async (req, res) => {
  try {
    const { code, language, input = '', projectId, userId } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Le code et le langage sont requis' });
    }
    
    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({ error: 'Langage non supporté' });
    }
    
    const executionId = uuidv4();
    const startTime = Date.now();
    
    try {
      const result = await executeCodeSafely(code, language, input);
      const executionTime = Date.now() - startTime;
      
      // Sauvegarder l'exécution dans la base de données
      const db = getDatabase();
      db.run(`
        INSERT INTO code_executions (id, project_id, user_id, input_code, output, error_output, execution_time, language, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [executionId, projectId, userId, code, result.output, result.error, executionTime, language, result.status]);
      
      res.json({
        id: executionId,
        output: result.output,
        error: result.error,
        status: result.status,
        executionTime,
        language
      });
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Sauvegarder l'erreur d'exécution
      const db = getDatabase();
      db.run(`
        INSERT INTO code_executions (id, project_id, user_id, input_code, error_output, execution_time, language, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [executionId, projectId, userId, code, error.message, executionTime, language, 'error']);
      
      res.json({
        id: executionId,
        output: '',
        error: error.message,
        status: 'error',
        executionTime,
        language
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution du code:', error);
    res.status(500).json({ error: 'Erreur lors de l\'exécution du code' });
  }
});

// Route pour obtenir l'historique d'exécution
router.get('/executions/:projectId', (req, res) => {
  const { projectId } = req.params;
  const db = getDatabase();
  
  db.all(`
    SELECT id, output, error_output, execution_time, language, status, created_at
    FROM code_executions 
    WHERE project_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `, [projectId], (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
    
    res.json({ executions: rows });
  });
});

// Route pour obtenir les langages supportés
router.get('/languages', (req, res) => {
  const languages = Object.keys(SUPPORTED_LANGUAGES).map(key => ({
    id: key,
    name: SUPPORTED_LANGUAGES[key].name,
    extension: SUPPORTED_LANGUAGES[key].extension
  }));
  
  res.json({ languages });
});

// Fonction pour exécuter du code de manière sécurisée
async function executeCodeSafely(code, language, input = '') {
  const config = SUPPORTED_LANGUAGES[language];
  const tempDir = path.join(__dirname, '../temp', uuidv4());
  
  try {
    // Créer un répertoire temporaire
    await fs.mkdir(tempDir, { recursive: true });
    
    // Écrire le code dans un fichier
    const filename = language === 'java' ? 'Main.java' : `main${config.extension}`;
    const filepath = path.join(tempDir, filename);
    await fs.writeFile(filepath, code);
    
    // Si il y a des données d'entrée, les écrire dans un fichier
    if (input) {
      await fs.writeFile(path.join(tempDir, 'input.txt'), input);
    }
    
    // Exécuter le code dans un conteneur Docker
    const result = await runInDocker(config, tempDir, filename, input);
    
    return result;
    
  } catch (error) {
    throw new Error(`Erreur d'exécution: ${error.message}`);
  } finally {
    // Nettoyer le répertoire temporaire
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (cleanupError) {
      console.error('Erreur lors du nettoyage:', cleanupError);
    }
  }
}

// Fonction pour exécuter dans Docker (simulation pour l'instant)
async function runInDocker(config, workDir, filename, input) {
  // Pour l'instant, simulation de l'exécution
  // Dans un environnement de production, ceci utiliserait vraiment Docker
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        output: `Simulation d'exécution pour ${config.name}\nCode exécuté avec succès!\nEntrée: ${input || 'aucune'}`,
        error: '',
        status: 'success'
      });
    }, Math.random() * 2000 + 500); // Simulation d'un délai d'exécution
  });
}

module.exports = router;