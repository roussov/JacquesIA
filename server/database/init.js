const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'jacques_ia.db');

// Assurer que le répertoire existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de la base de données:', err.message);
  } else {
    console.log('✅ Connexion à la base de données SQLite établie');
  }
});

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Table des utilisateurs
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          google_id TEXT UNIQUE,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          preferences TEXT DEFAULT '{}',
          is_active BOOLEAN DEFAULT 1
        )
      `);

      // Ajouter les colonnes Google si elles n'existent pas (migration)
      db.run(`ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erreur lors de l\'ajout de la colonne google_id:', err.message);
        }
      });
      
      db.run(`ALTER TABLE users ADD COLUMN avatar_url TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erreur lors de l\'ajout de la colonne avatar_url:', err.message);
        }
      });

      // Modifier la contrainte NOT NULL sur password_hash pour permettre l'auth Google
      db.run(`
        CREATE TABLE IF NOT EXISTS users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          google_id TEXT UNIQUE,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          preferences TEXT DEFAULT '{}',
          is_active BOOLEAN DEFAULT 1,
          CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
        )
      `, (err) => {
        if (err) {
          console.log('Table users existe déjà avec la nouvelle structure');
        }
      });

      // Table des sessions de chat
      db.run(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1,
          metadata TEXT DEFAULT '{}',
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Table des messages de chat
      db.run(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT DEFAULT '{}',
          tokens_used INTEGER DEFAULT 0,
          model_used TEXT,
          FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
        )
      `);

      // Table des projets de code
      db.run(`
        CREATE TABLE IF NOT EXISTS code_projects (
          id TEXT PRIMARY KEY,
          user_id INTEGER,
          name TEXT NOT NULL,
          description TEXT,
          language TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_public BOOLEAN DEFAULT 0,
          tags TEXT DEFAULT '[]',
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Table des fichiers de code
      db.run(`
        CREATE TABLE IF NOT EXISTS code_files (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          filename TEXT NOT NULL,
          content TEXT NOT NULL,
          language TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_main BOOLEAN DEFAULT 0,
          FOREIGN KEY (project_id) REFERENCES code_projects (id),
          UNIQUE(project_id, filename)
        )
      `);

      // Table des exécutions de code
      db.run(`
        CREATE TABLE IF NOT EXISTS code_executions (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          user_id INTEGER,
          input_code TEXT NOT NULL,
          output TEXT,
          error_output TEXT,
          execution_time INTEGER,
          memory_used INTEGER,
          language TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES code_projects (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Table des sessions de débogage
      db.run(`
        CREATE TABLE IF NOT EXISTS debug_sessions (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          user_id INTEGER,
          code_snapshot TEXT NOT NULL,
          breakpoints TEXT DEFAULT '[]',
          variables TEXT DEFAULT '{}',
          call_stack TEXT DEFAULT '[]',
          status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'stopped')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES code_projects (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Table des suggestions d'IA
      db.run(`
        CREATE TABLE IF NOT EXISTS ai_suggestions (
          id TEXT PRIMARY KEY,
          user_id INTEGER,
          session_id TEXT,
          prompt TEXT NOT NULL,
          response TEXT NOT NULL,
          model_used TEXT NOT NULL,
          tokens_used INTEGER DEFAULT 0,
          response_time INTEGER,
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          feedback TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
        )
      `);

      // Index pour améliorer les performances
      db.run(`CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_code_files_project ON code_files(project_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_code_executions_project ON code_executions(project_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_debug_sessions_project ON debug_sessions(project_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user ON ai_suggestions(user_id)`);

      console.log('✅ Tables de base de données créées/vérifiées');
      resolve();
    });
  });
};

const getDatabase = () => db;

const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Connexion à la base de données fermée');
        resolve();
      }
    });
  });
};

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};