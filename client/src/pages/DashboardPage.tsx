import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const DashboardContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1200px;
  margin: 0 auto;
`;

const Hero = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary[500]} 0%, ${({ theme }) => theme.colors.primary[600]} 100%);
  color: white;
  padding: ${({ theme }) => theme.spacing[8]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const HeroSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  opacity: 0.9;
  margin: 0;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const FeatureCard = styled(Link)`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all ${({ theme }) => theme.transitions.fast};
  text-decoration: none;
  
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const FeatureTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
`;

const QuickStart = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
`;

const QuickStartTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const QuickStartActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
`;

const QuickStartButton = styled(Link)`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  display: inline-block;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const DashboardPage: React.FC = () => {
  const features = [
    {
      icon: '🤖',
      title: 'Chat IA',
      description: 'Discutez avec notre assistant IA pour obtenir de l\'aide sur vos projets de programmation.',
      link: '/chat'
    },
    {
      icon: '💻',
      title: 'Éditeur de Code',
      description: 'Écrivez et testez votre code directement dans le navigateur avec notre éditeur intégré.',
      link: '/code-editor'
    },
    {
      icon: '🐛',
      title: 'Débogueur',
      description: 'Identifiez et corrigez les erreurs dans votre code avec nos outils de débogage avancés.',
      link: '/debugger'
    }
  ];

  return (
    <DashboardContainer>
      <Hero>
        <HeroTitle>Bienvenue sur Jacques IA</HeroTitle>
        <HeroSubtitle>
          Votre assistant de programmation intelligent pour développer plus efficacement
        </HeroSubtitle>
      </Hero>

      <FeaturesGrid>
        {features.map((feature, index) => (
          <FeatureCard key={index} to={feature.link}>
            <FeatureIcon>{feature.icon}</FeatureIcon>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
          </FeatureCard>
        ))}
      </FeaturesGrid>

      <QuickStart>
        <QuickStartTitle>Commencer rapidement</QuickStartTitle>
        <QuickStartActions>
          <QuickStartButton to="/chat">
            Démarrer un chat
          </QuickStartButton>
          <QuickStartButton to="/code-editor">
            Ouvrir l'éditeur
          </QuickStartButton>
        </QuickStartActions>
      </QuickStart>
    </DashboardContainer>
  );
};

export default DashboardPage;