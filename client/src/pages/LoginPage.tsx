import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthStore } from '../stores/authStore.ts';
import LoadingSpinner from '../components/UI/LoadingSpinner.tsx';
import GoogleAuth from '../components/Auth/GoogleAuth.tsx';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary[50]} 0%, ${({ theme }) => theme.colors.primary[100]} 100%);
  padding: ${({ theme }) => theme.spacing[4]};
`;

const LoginCard = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  width: 100%;
  max-width: 400px;
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const LogoText = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const LogoSubtext = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background.tertiary};
    cursor: not-allowed;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};

  ${({ variant = 'primary', theme }) => {
    if (variant === 'primary') {
      return `
        background-color: ${theme.colors.primary[600]};
        color: ${theme.colors.text.inverse};
        border: 1px solid ${theme.colors.primary[600]};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.primary[700]};
          border-color: ${theme.colors.primary[700]};
        }

        &:disabled {
          background-color: ${theme.colors.secondary[300]};
          border-color: ${theme.colors.secondary[300]};
          cursor: not-allowed;
        }
      `;
    } else {
      return `
        background-color: transparent;
        color: ${theme.colors.primary[600]};
        border: 1px solid ${theme.colors.primary[600]};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.primary[50]};
        }
      `;
    }
  }}
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error}10;
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border: 1px solid ${({ theme }) => theme.colors.error}20;
`;

const LinkText = styled.div`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing[6]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};

  a {
    color: ${({ theme }) => theme.colors.primary[600]};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const { login, googleAuth, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(formData.username, formData.password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    const success = await googleAuth(credential);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleGoogleError = (error: any) => {
    console.error('Erreur Google Auth:', error);
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <LogoText>Jacques IA</LogoText>
          <LogoSubtext>Assistant de programmation intelligent</LogoSubtext>
        </Logo>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <FormGroup>
            <Label htmlFor="username">Nom d'utilisateur ou Email</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              required
              autoComplete="username"
              placeholder="Entrez votre nom d'utilisateur ou email"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
              autoComplete="current-password"
              placeholder="Entrez votre mot de passe"
            />
          </FormGroup>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="small" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </Form>

        <GoogleAuth
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          text="Se connecter avec Google"
        />

        <LinkText>
          Pas encore de compte ?{' '}
          <Link to="/register">Créer un compte</Link>
        </LinkText>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;