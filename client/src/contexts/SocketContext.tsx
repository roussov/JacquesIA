import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChatSession: (sessionId: string) => void;
  leaveChatSession: (sessionId: string) => void;
  sendChatMessage: (sessionId: string, message: string, role?: string) => void;
  joinDebugSession: (sessionId: string) => void;
  leaveDebugSession: (sessionId: string) => void;
  sendDebugUpdate: (sessionId: string, type: string, payload: any) => void;
  startTyping: (sessionId: string) => void;
  stopTyping: (sessionId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Initialiser la connexion WebSocket
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Gestionnaires d'événements de connexion
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connecté');
      setIsConnected(true);
      toast.success('Connexion temps réel établie');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket déconnecté:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Déconnexion forcée par le serveur
        toast.error('Connexion fermée par le serveur');
      } else if (reason === 'transport close') {
        // Perte de connexion réseau
        toast.error('Connexion réseau perdue');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion WebSocket:', error);
      setIsConnected(false);
      toast.error('Erreur de connexion temps réel');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ WebSocket reconnecté (tentative ${attemptNumber})`);
      setIsConnected(true);
      toast.success('Connexion rétablie');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Erreur de reconnexion:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Échec de reconnexion WebSocket');
      toast.error('Impossible de rétablir la connexion');
    });

    // Gestionnaires d'événements personnalisés
    newSocket.on('connection_established', (data) => {
      console.log('🎉 Connexion WebSocket établie:', data);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Erreur WebSocket:', error);
      toast.error(error.message || 'Erreur de connexion');
    });

    // Gestionnaires pour les messages de chat
    newSocket.on('new_chat_message', (message) => {
      console.log('💬 Nouveau message de chat:', message);
      // Émettre un événement personnalisé pour que les composants puissent l'écouter
      window.dispatchEvent(new CustomEvent('newChatMessage', { detail: message }));
    });

    newSocket.on('user_typing', (data) => {
      console.log('⌨️ Utilisateur en train de taper:', data);
      window.dispatchEvent(new CustomEvent('userTyping', { detail: data }));
    });

    // Gestionnaires pour le débogage
    newSocket.on('debug_update', (data) => {
      console.log('🐛 Mise à jour de débogage:', data);
      window.dispatchEvent(new CustomEvent('debugUpdate', { detail: data }));
    });

    // Gestionnaires pour l'exécution de code
    newSocket.on('code_execution_status', (data) => {
      console.log('⚡ Statut d\'exécution de code:', data);
      window.dispatchEvent(new CustomEvent('codeExecutionStatus', { detail: data }));
    });

    newSocket.on('code_execution_complete', (data) => {
      console.log('✅ Exécution de code terminée:', data);
      window.dispatchEvent(new CustomEvent('codeExecutionComplete', { detail: data }));
    });

    // Gestionnaires pour les notifications
    newSocket.on('notification', (notification) => {
      console.log('🔔 Notification:', notification);
      toast(notification.message, {
        icon: notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️',
      });
    });

    // Ping périodique pour maintenir la connexion
    const pingInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      }
    }, 30000);

    newSocket.on('pong', (data) => {
      console.log('🏓 Pong reçu:', data);
    });

    setSocket(newSocket);

    // Nettoyage
    return () => {
      clearInterval(pingInterval);
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  // Fonctions utilitaires
  const joinChatSession = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      socket.emit('join_chat_session', { sessionId });
    }
  }, [socket, isConnected]);

  const leaveChatSession = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_chat_session', { sessionId });
    }
  }, [socket, isConnected]);

  const sendChatMessage = useCallback((sessionId: string, message: string, role: string = 'user') => {
    if (socket && isConnected) {
      socket.emit('chat_message', { sessionId, message, role });
    }
  }, [socket, isConnected]);

  const joinDebugSession = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      socket.emit('join_debug_session', { sessionId });
    }
  }, [socket, isConnected]);

  const leaveDebugSession = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_debug_session', { sessionId });
    }
  }, [socket, isConnected]);

  const sendDebugUpdate = useCallback((sessionId: string, type: string, payload: any) => {
    if (socket && isConnected) {
      socket.emit('debug_update', { sessionId, type, payload });
    }
  }, [socket, isConnected]);

  const startTyping = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { sessionId });
    }
  }, [socket, isConnected]);

  const stopTyping = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { sessionId });
    }
  }, [socket, isConnected]);

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    joinChatSession,
    leaveChatSession,
    sendChatMessage,
    joinDebugSession,
    leaveDebugSession,
    sendDebugUpdate,
    startTyping,
    stopTyping,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook personnalisé pour écouter les événements WebSocket
export const useSocketEvent = (eventName: string, handler: (data: any) => void) => {
  useEffect(() => {
    const handleEvent = (event: CustomEvent) => {
      handler(event.detail);
    };

    window.addEventListener(eventName, handleEvent as EventListener);

    return () => {
      window.removeEventListener(eventName, handleEvent as EventListener);
    };
  }, [eventName, handler]);
};