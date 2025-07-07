const { getDatabase } = require('../database/init');

// Map pour stocker les connexions actives
const activeConnections = new Map();
const userSessions = new Map(); // socketId -> Set of socketIds

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Générer un ID utilisateur temporaire pour les connexions anonymes
    const anonymousUserId = `anonymous_${socket.id}`;
    const anonymousUsername = `Utilisateur_${socket.id.substring(0, 8)}`;
    
    socket.userId = anonymousUserId;
    socket.username = anonymousUsername;
    
    console.log(`✅ Utilisateur connecté: ${socket.username} (${socket.id})`);
    
    // Enregistrer la connexion
    activeConnections.set(socket.id, {
      userId: socket.userId,
      username: socket.username,
      connectedAt: new Date(),
      lastActivity: new Date()
    });
    
    // Ajouter à la map des sessions utilisateur
    if (!userSessions.has(socket.userId)) {
      userSessions.set(socket.userId, new Set());
    }
    userSessions.get(socket.userId).add(socket.id);
    
    // Rejoindre une room personnelle pour les notifications
    socket.join(`user_${socket.userId}`);
    
    // Envoyer les informations de connexion
    socket.emit('connection_established', {
      message: 'Connexion WebSocket établie',
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date().toISOString()
    });
    
    // Gestionnaire pour rejoindre une session de chat
    socket.on('join_chat_session', (data) => {
      const { sessionId } = data;
      
      if (!sessionId) {
        socket.emit('error', { message: 'ID de session requis' });
        return;
      }
      
      // Accès libre aux sessions de chat
      socket.join(`chat_${sessionId}`);
      socket.currentChatSession = sessionId;
      
      socket.emit('joined_chat_session', {
        sessionId,
        message: 'Rejoint la session de chat'
      });
      
      console.log(`👥 ${socket.username} a rejoint la session de chat ${sessionId}`);
    });
    
    // Gestionnaire pour quitter une session de chat
    socket.on('leave_chat_session', (data) => {
      const { sessionId } = data;
      
      if (sessionId) {
        socket.leave(`chat_${sessionId}`);
        socket.currentChatSession = null;
        
        socket.emit('left_chat_session', {
          sessionId,
          message: 'Session de chat quittée'
        });
      }
    });
    
    // Gestionnaire pour les messages de chat en temps réel
    socket.on('chat_message', (data) => {
      const { sessionId, message, role = 'user' } = data;
      
      if (!sessionId || !message) {
        socket.emit('error', { message: 'Session ID et message requis' });
        return;
      }
      
      // Accès libre aux messages de chat
      const messageData = {
        id: Date.now(), // ID temporaire basé sur timestamp
        sessionId,
        role,
        content: message,
        timestamp: new Date().toISOString(),
        userId: socket.userId,
        username: socket.username
      };
      
      // Diffuser le message à tous les clients de la session
      io.to(`chat_${sessionId}`).emit('new_chat_message', messageData);
      
      console.log(`💬 Message de ${socket.username} dans la session ${sessionId}`);
    });
    
    // Gestionnaire pour les sessions de débogage
    socket.on('join_debug_session', (data) => {
      const { sessionId } = data;
      
      if (!sessionId) {
        socket.emit('error', { message: 'ID de session de débogage requis' });
        return;
      }
      
      // Accès libre aux sessions de débogage
      socket.join(`debug_${sessionId}`);
      socket.currentDebugSession = sessionId;
      
      socket.emit('joined_debug_session', {
        sessionId,
        message: 'Rejoint la session de débogage'
      });
      
      console.log(`🐛 ${socket.username} a rejoint la session de débogage ${sessionId}`);
    });
    
    // Gestionnaire pour les mises à jour de débogage en temps réel
    socket.on('debug_update', (data) => {
      const { sessionId, type, payload } = data;
      
      if (!sessionId || !type) {
        socket.emit('error', { message: 'Session ID et type requis' });
        return;
      }
      
      // Diffuser la mise à jour à tous les clients de la session de débogage
      socket.to(`debug_${sessionId}`).emit('debug_update', {
        type,
        payload,
        timestamp: new Date().toISOString(),
        userId: socket.userId,
        username: socket.username
      });
    });
    
    // Gestionnaire pour l'exécution de code en temps réel
    socket.on('code_execution_start', (data) => {
      const { projectId, language } = data;
      
      socket.emit('code_execution_status', {
        status: 'started',
        projectId,
        language,
        timestamp: new Date().toISOString()
      });
      
      // Notifier les autres utilisateurs du projet (si collaboration)
      socket.to(`project_${projectId}`).emit('code_execution_status', {
        status: 'started',
        projectId,
        language,
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });
    });
    
    // Gestionnaire pour les résultats d'exécution
    socket.on('code_execution_result', (data) => {
      const { projectId, result, error, executionTime } = data;
      
      const resultData = {
        projectId,
        result,
        error,
        executionTime,
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      };
      
      socket.emit('code_execution_complete', resultData);
      
      // Notifier les autres utilisateurs du projet
      socket.to(`project_${projectId}`).emit('code_execution_complete', resultData);
    });
    
    // Gestionnaire pour les notifications système
    socket.on('request_notifications', () => {
      // Notifications libres d'accès
      socket.emit('notifications', {
        count: 0,
        notifications: []
      });
    });
    
    // Gestionnaire pour le statut de frappe (typing indicator)
    socket.on('typing_start', (data) => {
      const { sessionId } = data;
      if (sessionId && socket.currentChatSession === sessionId) {
        socket.to(`chat_${sessionId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
          typing: true
        });
      }
    });
    
    socket.on('typing_stop', (data) => {
      const { sessionId } = data;
      if (sessionId && socket.currentChatSession === sessionId) {
        socket.to(`chat_${sessionId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
          typing: false
        });
      }
    });
    
    // Gestionnaire pour le ping/pong (maintien de connexion)
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
      
      // Mettre à jour la dernière activité
      const connection = activeConnections.get(socket.id);
      if (connection) {
        connection.lastActivity = new Date();
      }
    });
    
    // Gestionnaire de déconnexion
    socket.on('disconnect', (reason) => {
      console.log(`❌ Utilisateur déconnecté: ${socket.username} (${socket.id}) - Raison: ${reason}`);
      
      // Nettoyer les connexions
      activeConnections.delete(socket.id);
      
      const userSocketSet = userSessions.get(socket.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSessions.delete(socket.userId);
        }
      }
      
      // Notifier les autres utilisateurs dans les sessions actives
      if (socket.currentChatSession) {
        socket.to(`chat_${socket.currentChatSession}`).emit('user_disconnected', {
          userId: socket.userId,
          username: socket.username
        });
      }
      
      if (socket.currentDebugSession) {
        socket.to(`debug_${socket.currentDebugSession}`).emit('user_disconnected', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });
    
    // Gestionnaire d'erreur
    socket.on('error', (error) => {
      console.error(`❌ Erreur WebSocket pour ${socket.username}:`, error);
      socket.emit('error', { message: 'Erreur de connexion WebSocket' });
    });
  });
  
  // Fonction utilitaire pour envoyer des notifications à un utilisateur
  function sendNotificationToUser(userId, notification) {
    io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }
  
  // Fonction utilitaire pour obtenir les statistiques de connexion
  function getConnectionStats() {
    return {
      totalConnections: activeConnections.size,
      uniqueUsers: userSessions.size,
      connections: Array.from(activeConnections.values())
    };
  }
  
  // Nettoyage périodique des connexions inactives
  setInterval(() => {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes
    
    for (const [socketId, connection] of activeConnections.entries()) {
      if (now - connection.lastActivity > timeout) {
        console.log(`🧹 Nettoyage de la connexion inactive: ${connection.username}`);
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    }
  }, 5 * 60 * 1000); // Vérifier toutes les 5 minutes
  
  return {
    sendNotificationToUser,
    getConnectionStats
  };
}

module.exports = {
  setupSocketHandlers
};