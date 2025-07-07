import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles.ts';
import { theme } from './styles/theme.ts';
import { SocketProvider } from './contexts/SocketContext.tsx';

// Pages
import DashboardPage from './pages/DashboardPage.tsx';
import ChatPage from './pages/ChatPage.tsx';
import CodeEditorPage from './pages/CodeEditorPage.tsx';
import DebuggerPage from './pages/DebuggerPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';

// Components
import Layout from './components/Layout/Layout.tsx';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router>
        <div className="App">
          <SocketProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:sessionId" element={<ChatPage />} />
                <Route path="/code" element={<CodeEditorPage />} />
                <Route path="/code/:projectId" element={<CodeEditorPage />} />
                <Route path="/debug" element={<DebuggerPage />} />
                <Route path="/debug/:sessionId" element={<DebuggerPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </SocketProvider>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
              },
              success: {
                iconTheme: {
                  primary: theme.colors.success,
                  secondary: theme.colors.background.secondary,
                },
              },
              error: {
                iconTheme: {
                  primary: theme.colors.error,
                  secondary: theme.colors.background.secondary,
                },
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;