import React from 'react';
import styled from 'styled-components';

const ProfileContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 800px;
  margin: 0 auto;
`;

const ProfileTitle = styled.h1`
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

const ProfilePage: React.FC = () => {
  return (
    <ProfileContainer>
      <ProfileTitle>Profil</ProfileTitle>
      <ComingSoon>
        <ComingSoonIcon>👤</ComingSoonIcon>
        <ComingSoonText>
          La page de profil sera bientôt disponible !
        </ComingSoonText>
      </ComingSoon>
    </ProfileContainer>
  );
};

export default ProfilePage;