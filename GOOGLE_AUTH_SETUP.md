# Configuration de l'Authentification Google pour Jacques IA

## 🎯 Implémentation Complétée

L'authentification Google a été entièrement implémentée dans l'application Jacques IA. Voici un résumé des modifications apportées :

### ✅ Modifications Côté Client

1. **Composant GoogleAuth** (`client/src/components/Auth/GoogleAuth.tsx`)
   - Composant réutilisable pour l'authentification Google
   - Intégration avec Google Identity Services
   - Gestion des callbacks de succès et d'erreur
   - Styling avec styled-components

2. **Store d'authentification** (`client/src/stores/authStore.ts`)
   - Ajout de la méthode `googleAuth` pour gérer l'authentification Google
   - Envoi des credentials Google au serveur via `/auth/google`
   - Gestion des tokens JWT et stockage utilisateur

3. **Pages de connexion et d'inscription**
   - **LoginPage** : Intégration du composant GoogleAuth
   - **RegisterPage** : Intégration du composant GoogleAuth
   - Gestion des callbacks de succès/erreur

4. **Template HTML** (`client/public/index.html`)
   - Ajout du script Google Identity Services
   - `<script src="https://accounts.google.com/gsi/client" async defer></script>`

### ✅ Modifications Côté Serveur

1. **Route d'authentification Google** (`server/routes/auth.js`)
   - Nouvelle route `POST /auth/google`
   - Vérification des tokens Google avec `google-auth-library`
   - Création automatique d'utilisateurs ou connexion d'utilisateurs existants
   - Génération de tokens JWT pour l'authentification

2. **Base de données** (`server/database/init.js`)
   - Ajout des colonnes `google_id` et `avatar_url` à la table users
   - Migration automatique pour les bases de données existantes
   - Contrainte CHECK pour s'assurer qu'un utilisateur a soit un mot de passe soit un Google ID

3. **Dépendances** (`package.json`)
   - Ajout de `google-auth-library` pour la vérification des tokens Google

### ✅ Configuration

1. **Variables d'environnement** (`.env`)
   ```env
   # Google OAuth
   GOOGLE_CLIENT_ID=votre_google_client_id_ici
   GOOGLE_CLIENT_SECRET=votre_google_client_secret_ici
   REACT_APP_GOOGLE_CLIENT_ID=votre_google_client_id_ici
   ```

2. **Exemple de configuration** (`.env.example`)
   - Ajout des variables Google OAuth avec des exemples

## 🚀 Étapes de Configuration pour l'Utilisateur

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ ou Google Identity

### 2. Configurer OAuth 2.0

1. Dans Google Cloud Console, allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth 2.0 Client IDs"
3. Sélectionnez "Web application"
4. Ajoutez les origines autorisées :
   - `http://localhost:3000` (pour le développement)
   - Votre domaine de production
5. Ajoutez les URIs de redirection autorisées :
   - `http://localhost:3000` (pour le développement)
   - Votre domaine de production

### 3. Configurer les Variables d'Environnement

Copiez les identifiants obtenus et mettez-les dans votre fichier `.env` :

```env
GOOGLE_CLIENT_ID=votre_client_id_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret_google
REACT_APP_GOOGLE_CLIENT_ID=votre_client_id_google.apps.googleusercontent.com
```

### 4. Redémarrer l'Application

```bash
# Arrêter l'application si elle est en cours d'exécution
# Puis redémarrer
npm run dev
```

## 🔧 Fonctionnalités

### Connexion Google
- Les utilisateurs peuvent se connecter avec leur compte Google
- Si l'utilisateur existe déjà (même email), il est connecté automatiquement
- Mise à jour automatique du `google_id` et de la `last_login`

### Inscription Google
- Les nouveaux utilisateurs sont créés automatiquement
- Le nom d'utilisateur est généré à partir du nom Google ou de l'email
- L'avatar Google est sauvegardé si disponible
- Préférences par défaut appliquées

### Sécurité
- Vérification des tokens Google côté serveur
- Génération de tokens JWT pour l'authentification
- Validation de l'audience et de l'émetteur du token

## 🐛 Résolution de Problèmes

### Erreur "Token used too early"
- Vérifiez que l'horloge système est synchronisée
- Le token Google peut avoir un décalage temporel

### Erreur "Invalid token"
- Vérifiez que le `GOOGLE_CLIENT_ID` est correct
- Assurez-vous que le domaine est autorisé dans Google Cloud Console

### Utilisateur non créé
- Vérifiez les logs du serveur pour les erreurs de base de données
- Assurez-vous que les migrations de base de données ont été appliquées

## 📝 Notes Techniques

- L'authentification Google utilise le flux "Authorization Code" avec PKCE
- Les tokens sont vérifiés côté serveur pour la sécurité
- La base de données supporte les utilisateurs avec mot de passe ET/OU Google ID
- Les avatars Google sont optionnels et stockés comme URL

## 🎉 Test de l'Implémentation

1. Démarrez l'application : `npm run dev`
2. Allez sur `http://localhost:3000`
3. Cliquez sur "Se connecter" ou "S'inscrire"
4. Cliquez sur le bouton "Continuer avec Google"
5. Connectez-vous avec votre compte Google
6. Vous devriez être redirigé vers le tableau de bord

L'implémentation est maintenant complète et prête à être utilisée !