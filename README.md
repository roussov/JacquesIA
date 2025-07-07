# Jacques IA - Assistant de Programmation Intelligent

🚀 **Site web complet avec IA pour l'aide à la programmation**

Jacques IA est une plateforme web complète qui intègre une intelligence artificielle avancée pour aider les développeurs dans toutes leurs tâches de programmation : chat interactif, génération de code, test, débogage et bien plus encore.

## ✨ Fonctionnalités

### 🤖 Intelligence Artificielle
- **Chat interactif** avec IA spécialisée en programmation
- **Génération de code** dans multiple langages
- **Analyse et révision** de code automatique
- **Suggestions d'optimisation** et de bonnes pratiques
- Support des modèles **OpenAI GPT-4** et **Anthropic Claude**

### 💻 Éditeur de Code Intégré
- **Éditeur Monaco** (VS Code dans le navigateur)
- **Coloration syntaxique** pour tous les langages populaires
- **Auto-complétion** et **IntelliSense**
- **Gestion de projets** multi-fichiers
- **Sauvegarde automatique**

### 🔧 Exécution et Test
- **Exécution sécurisée** de code dans des conteneurs Docker
- Support de **JavaScript, Python, Java, C++, Go, Rust**
- **Tests unitaires** intégrés
- **Mesure des performances** (temps d'exécution, mémoire)

### 🐛 Débogage Avancé
- **Débogueur interactif** avec breakpoints
- **Inspection des variables** en temps réel
- **Pile d'appels** détaillée
- **Suggestions de correction** automatiques
- **Analyse statique** du code

### 🔄 Temps Réel
- **WebSockets** pour la collaboration
- **Chat en temps réel** avec l'IA
- **Notifications** instantanées
- **Synchronisation** multi-utilisateurs

### 🔐 Sécurité et Authentification
- **Authentification JWT** sécurisée
- **Authentification Google OAuth** intégrée
- **Chiffrement** des mots de passe avec bcrypt
- **Rate limiting** pour prévenir les abus
- **Validation** stricte des données

## 🏗️ Architecture Technique

### Backend (Node.js + Express)
```
server/
├── index.js              # Point d'entrée du serveur
├── database/
│   └── init.js           # Configuration SQLite
├── routes/
│   ├── ai.js             # Routes IA et suggestions
│   ├── auth.js           # Authentification
│   ├── chat.js           # Gestion du chat
│   ├── code.js           # Exécution de code
│   └── debug.js          # Débogage
├── middleware/
│   └── rateLimiter.js    # Limitation de taux
└── socket/
    └── handlers.js       # WebSocket handlers
```

### Frontend (React + TypeScript)
```
client/src/
├── App.tsx               # Application principale
├── stores/
│   └── authStore.ts      # Store Zustand pour l'auth
├── contexts/
│   └── SocketContext.tsx # Contexte WebSocket
├── components/
│   ├── UI/               # Composants UI réutilisables
│   └── Auth/             # Composants d'authentification
├── pages/                # Pages de l'application
└── styles/               # Thème et styles globaux
```

### Base de Données (SQLite)
- **users** - Gestion des utilisateurs
- **chat_sessions** - Sessions de conversation
- **chat_messages** - Messages du chat
- **code_projects** - Projets de code
- **code_files** - Fichiers de code
- **code_executions** - Historique d'exécution
- **debug_sessions** - Sessions de débogage
- **ai_suggestions** - Suggestions de l'IA

## 🚀 Installation et Démarrage

### Prérequis
- **Node.js** 18+ et **npm**
- **Docker** (optionnel, pour l'exécution de code)
- **Clés API** OpenAI ou Anthropic (optionnelles)

### 1. Cloner le projet
```bash
git clone <repository-url>
cd JacquesIA
```

### 2. Installation des dépendances
```bash
# Installer les dépendances du serveur et du client
npm run install:all
```

### 3. Configuration
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos configurations
nano .env
```

**Variables d'environnement importantes :**
```env
# Serveur
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Sécurité
JWT_SECRET=votre-cle-secrete-jwt-tres-longue-et-complexe

# APIs d'IA (configurez au moins une)
OPENAI_API_KEY=votre-cle-openai
ANTHROPIC_API_KEY=votre-cle-anthropic

# Authentification Google (optionnelle)
GOOGLE_CLIENT_ID=votre-client-id-google
GOOGLE_CLIENT_SECRET=votre-client-secret-google
REACT_APP_GOOGLE_CLIENT_ID=votre-client-id-google
```

### Configuration Google OAuth (Optionnelle)

Pour activer l'authentification Google :

1. **Créer un projet Google Cloud** :
   - Allez sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créez un nouveau projet ou sélectionnez un projet existant
   - Activez l'API Google Identity

2. **Configurer OAuth 2.0** :
   - Dans "APIs & Services" > "Credentials"
   - Créez des identifiants OAuth 2.0 Client ID
   - Ajoutez `http://localhost:3000` aux origines autorisées
   - Ajoutez les URIs de redirection appropriées

3. **Configurer les variables d'environnement** :
   - Copiez le Client ID et Client Secret dans votre `.env`
   - Redémarrez l'application

📖 **Guide détaillé** : Consultez [`GOOGLE_AUTH_SETUP.md`](./GOOGLE_AUTH_SETUP.md) pour les instructions complètes.

### 4. Démarrage en développement
```bash
# Démarrer le serveur et le client simultanément
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **WebSocket** : ws://localhost:5000

### 5. Build pour la production
```bash
# Build du client
npm run build

# Démarrage en production
npm start
```

## 🔧 Configuration Avancée

### Docker pour l'Exécution de Code
Pour activer l'exécution sécurisée de code :

```bash
# Installer Docker
# Puis configurer dans .env :
DOCKER_HOST=unix:///var/run/docker.sock
```

### Clés API IA
1. **OpenAI** : https://platform.openai.com/api-keys
2. **Anthropic** : https://console.anthropic.com/

### Base de Données
La base SQLite est créée automatiquement au premier démarrage dans `server/database/jacques_ia.db`.

## 📚 Utilisation

### 1. Créer un Compte
- Accédez à http://localhost:3000
- Cliquez sur "Créer un compte"
- **Option 1** : Remplissez le formulaire d'inscription classique
- **Option 2** : Cliquez sur "Continuer avec Google" pour une inscription rapide

### 2. Chat avec l'IA
- Accédez à la section "Chat"
- Posez vos questions de programmation
- L'IA vous aidera avec du code, des explications, etc.

### 3. Éditeur de Code
- Créez un nouveau projet
- Écrivez votre code dans l'éditeur
- Exécutez et testez directement

### 4. Débogage
- Ajoutez des breakpoints dans votre code
- Lancez une session de débogage
- Inspectez les variables et la pile d'appels

## 🛠️ Scripts Disponibles

```bash
# Développement
npm run dev                    # Démarrer en mode développement
npm run server:dev            # Serveur uniquement
npm run client:dev            # Client uniquement

# Production
npm run build                 # Build du client
npm start                     # Démarrer en production

# Utilitaires
npm run install:all           # Installer toutes les dépendances
npm test                      # Lancer les tests
npm run docker:build          # Build de l'image Docker
npm run docker:run            # Lancer avec Docker
```

## 🔒 Sécurité

- **Authentification JWT** avec expiration
- **Hashage bcrypt** des mots de passe (12 rounds)
- **Rate limiting** sur toutes les routes
- **Validation** stricte des entrées
- **Exécution sandboxée** du code utilisateur
- **CORS** configuré correctement
- **Helmet.js** pour les headers de sécurité

## 🚀 Déploiement

### Heroku
```bash
# Ajouter les variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=votre-cle-secrete
heroku config:set OPENAI_API_KEY=votre-cle

# Déployer
git push heroku main
```

### Docker
```bash
# Build et run
npm run docker:build
npm run docker:run
```

### VPS/Serveur Dédié
1. Cloner le projet sur le serveur
2. Configurer les variables d'environnement
3. Installer PM2 : `npm install -g pm2`
4. Démarrer : `pm2 start server/index.js --name jacques-ia`

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Documentation** : Consultez ce README
- **Issues** : Ouvrez une issue sur GitHub
- **Email** : support@jacques-ia.com

## 🎯 Roadmap

- [ ] **Mobile App** (React Native)
- [ ] **Plugin VS Code** 
- [ ] **Intégration Git** avancée
- [ ] **Collaboration temps réel** multi-utilisateurs
- [ ] **Marketplace** de templates de code
- [ ] **API publique** pour développeurs
- [ ] **Support de plus de langages** (Kotlin, Swift, etc.)
- [ ] **IA vocale** pour interaction parlée

---

**Jacques IA** - Votre assistant de programmation intelligent 🤖✨

Développé avec ❤️ pour la communauté des développeurs.