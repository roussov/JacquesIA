import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface User {
  id: number;
  username: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
    autoSave: boolean;
  };
  created_at: string;
  last_login?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  googleAuth: (credential: string) => Promise<boolean>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

// Configuration axios par défaut
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      toast.error('Session expirée. Veuillez vous reconnecter.');
    }
    return Promise.reject(error);
  }
);

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post('/auth/login', {
            username,
            password,
          });

          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Stocker le token dans localStorage
          localStorage.setItem('jacques_ia_token', token);

          toast.success(`Bienvenue, ${user.username} !`);
          return true;

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erreur lors de la connexion';
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
          });

          toast.error(errorMessage);
          return false;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post('/auth/register', {
            username,
            email,
            password,
          });

          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Stocker le token dans localStorage
          localStorage.setItem('jacques_ia_token', token);

          toast.success('Compte créé avec succès !');
          return true;

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erreur lors de l\'inscription';
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
          });

          toast.error(errorMessage);
          return false;
        }
      },

      googleAuth: async (credential: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post('/auth/google', {
            credential,
          });

          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Stocker le token dans localStorage
          localStorage.setItem('jacques_ia_token', token);

          toast.success(`Bienvenue, ${user.username} !`);
          return true;

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erreur lors de l\'authentification Google';
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
          });

          toast.error(errorMessage);
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });

        // Supprimer le token du localStorage
        localStorage.removeItem('jacques_ia_token');
        
        toast.success('Déconnexion réussie');
      },

      verifyToken: async () => {
        const token = localStorage.getItem('jacques_ia_token');
        
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return false;
        }

        set({ isLoading: true });

        try {
          const response = await api.get('/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });

          const { user } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;

        } catch (error: any) {
          // Token invalide ou expiré
          localStorage.removeItem('jacques_ia_token');
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          return false;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.put('/auth/profile', data);

          // Mettre à jour l'utilisateur local
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...data };
            set({
              user: updatedUser,
              isLoading: false,
              error: null,
            });
          }

          toast.success('Profil mis à jour avec succès');
          return true;

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour du profil';
          
          set({
            isLoading: false,
            error: errorMessage,
          });

          toast.error(errorMessage);
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'jacques-ia-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook personnalisé pour l'API
export const useApi = () => {
  return api;
};

// Types d'export
export type { AuthStore };