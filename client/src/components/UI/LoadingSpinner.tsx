import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div<{ size: string }>`
  display: inline-block;
  width: ${({ size }) => {
    switch (size) {
      case 'small': return '16px';
      case 'medium': return '24px';
      case 'large': return '32px';
      case 'xl': return '48px';
      default: return '24px';
    }
  }};
  height: ${({ size }) => {
    switch (size) {
      case 'small': return '16px';
      case 'medium': return '24px';
      case 'large': return '32px';
      case 'xl': return '48px';
      default: return '24px';
    }
  }};
`;

const Spinner = styled.div<{ color?: string }>`
  width: 100%;
  height: 100%;
  border: 2px solid ${({ theme, color }) => color || theme.colors.secondary[200]};
  border-top: 2px solid ${({ theme, color }) => color || theme.colors.primary[500]};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const SpinnerWithText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const SpinnerText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'xl';
  color?: string;
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  text,
  className,
}) => {
  const spinnerElement = (
    <SpinnerContainer size={size} className={className}>
      <Spinner color={color} />
    </SpinnerContainer>
  );

  if (text) {
    return (
      <SpinnerWithText>
        {spinnerElement}
        <SpinnerText>{text}</SpinnerText>
      </SpinnerWithText>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;