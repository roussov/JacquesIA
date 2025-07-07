import { createGlobalStyle } from 'styled-components';
import { Theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  /* Reset CSS */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily.sans.join(', ')};
    font-size: ${({ theme }) => theme.typography.fontSize.base};
    font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.background.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  /* Scrollbar personnalisée */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.secondary[300]};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    transition: background-color ${({ theme }) => theme.transitions.fast};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.secondary[400]};
  }

  /* Firefox scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.colors.secondary[300]} ${({ theme }) => theme.colors.background.secondary};
  }

  /* Focus styles */
  :focus {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};
    outline-offset: 2px;
  }

  :focus:not(:focus-visible) {
    outline: none;
  }

  /* Selection styles */
  ::selection {
    background-color: ${({ theme }) => theme.colors.primary[200]};
    color: ${({ theme }) => theme.colors.primary[900]};
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }

  h1 {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  }

  h2 {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }

  h3 {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }

  h4 {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }

  h5 {
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  }

  h6 {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  p {
    margin-bottom: ${({ theme }) => theme.spacing[4]};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  }

  a {
    color: ${({ theme }) => theme.colors.primary[600]};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};
  }

  a:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
    text-decoration: underline;
  }

  /* Code styles */
  code {
    font-family: ${({ theme }) => theme.typography.fontFamily.mono.join(', ')};
    font-size: 0.875em;
    background-color: ${({ theme }) => theme.colors.background.tertiary};
    padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.primary};
  }

  pre {
    font-family: ${({ theme }) => theme.typography.fontFamily.mono.join(', ')};
    background-color: ${({ theme }) => theme.colors.code.background};
    color: ${({ theme }) => theme.colors.code.text};
    padding: ${({ theme }) => theme.spacing[4]};
    border-radius: ${({ theme }) => theme.borderRadius.lg};
    overflow-x: auto;
    margin: ${({ theme }) => theme.spacing[4]} 0;
    border: 1px solid ${({ theme }) => theme.colors.border.primary};
  }

  pre code {
    background: none;
    padding: 0;
    border: none;
    color: inherit;
  }

  /* Form elements */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  button {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .break-words {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  /* Animation classes */
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  .slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }

  .slide-in-left {
    animation: slideInLeft 0.3s ease-out;
  }

  .bounce-in {
    animation: bounceIn 0.5s ease-out;
  }

  /* Keyframes */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes bounceIn {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }
    50% {
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Loading animation */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  /* Pulse animation */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    body {
      color: ${({ theme }) => theme.dark.colors.text.primary};
      background-color: ${({ theme }) => theme.dark.colors.background.primary};
    }

    ::-webkit-scrollbar-track {
      background: ${({ theme }) => theme.dark.colors.background.secondary};
    }

    ::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.colors.secondary[600]};
    }

    ::-webkit-scrollbar-thumb:hover {
      background: ${({ theme }) => theme.colors.secondary[500]};
    }

    * {
      scrollbar-color: ${({ theme }) => theme.colors.secondary[600]} ${({ theme }) => theme.dark.colors.background.secondary};
    }
  }

  /* Print styles */
  @media print {
    * {
      background: transparent !important;
      color: black !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    a, a:visited {
      text-decoration: underline;
    }

    pre, blockquote {
      border: 1px solid #999;
      page-break-inside: avoid;
    }

    thead {
      display: table-header-group;
    }

    tr, img {
      page-break-inside: avoid;
    }

    img {
      max-width: 100% !important;
    }

    p, h2, h3 {
      orphans: 3;
      widows: 3;
    }

    h2, h3 {
      page-break-after: avoid;
    }
  }

  /* Responsive typography */
  @media (max-width: 768px) {
    html {
      font-size: 14px;
    }

    h1 {
      font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
    }

    h2 {
      font-size: ${({ theme }) => theme.typography.fontSize.xl};
    }

    h3 {
      font-size: ${({ theme }) => theme.typography.fontSize.lg};
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    * {
      border-color: currentColor !important;
    }

    button, input, select, textarea {
      border: 2px solid currentColor !important;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;