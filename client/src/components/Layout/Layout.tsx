import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  padding: ${({ theme }) => theme.spacing[4]} 0;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[6]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  text-decoration: none;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary[600] : theme.colors.text.secondary};
  text-decoration: none;
  font-weight: ${({ theme, $isActive }) => 
    $isActive ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;


const Main = styled.main`
  flex: 1;
  background: ${({ theme }) => theme.colors.background.primary};
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Tableau de bord' },
    { path: '/chat', label: 'Chat IA' },
    { path: '/code', label: 'Éditeur' },
    { path: '/debug', label: 'Débogueur' },
    { path: '/profile', label: 'Profil' },
  ];

  return (
    <LayoutContainer>
      <Header>
        <HeaderContent>
          <Logo to="/dashboard">Jacques IA</Logo>
          <Nav>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                $isActive={location.pathname === item.path}
              >
                {item.label}
              </NavLink>
            ))}
          </Nav>
        </HeaderContent>
      </Header>
      <Main>{children}</Main>
    </LayoutContainer>
  );
};

export default Layout;