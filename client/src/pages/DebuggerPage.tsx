import React from 'react';
import styled from 'styled-components';

const DebugContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1200px;
  margin: 0 auto;
`;

const DebugTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ComingSoon = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]};
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

const ComingSoonIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ComingSoonText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const DebuggerPage: React.FC = () => {
  return (
    <DebugContainer>
      <DebugTitle>Débogueur</DebugTitle>
      <ComingSoon>
        <ComingSoonIcon>🐛</ComingSoonIcon>
        <ComingSoonText>
          Le débogueur sera bientôt disponible !
        </ComingSoonText>
      </ComingSoon>
    </DebugContainer>
  );
};

export default DebuggerPage;