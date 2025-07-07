import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const GoogleButton = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin: ${({ theme }) => theme.spacing[4]} 0;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: ${({ theme }) => theme.spacing[4]} 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border.primary};
  }
  
  span {
    padding: 0 ${({ theme }) => theme.spacing[4]};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

interface GoogleAuthProps {
  onSuccess: (credential: string) => void;
  onError: (error: any) => void;
  text?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onSuccess, onError, text = "Se connecter avec Google" }): JSX.Element => {
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              onError(new Error('Aucun credential reçu de Google'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: text === "Se connecter avec Google" ? 'signin_with' : 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    };

    // Vérifier si le script Google est déjà chargé
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Attendre que le script soit chargé
      const checkGoogleLoaded = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogleLoaded);
          initializeGoogleSignIn();
        }
      }, 100);

      // Nettoyer l'intervalle après 10 secondes
      setTimeout(() => {
        clearInterval(checkGoogleLoaded);
      }, 10000);
    }
  }, [onSuccess, onError, text]);

  return (
    <>
      <Divider>
        <span>ou</span>
      </Divider>
      <GoogleButton ref={googleButtonRef} />
    </>
  );
};

export default GoogleAuth;