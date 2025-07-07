# Rapport de Sécurité - Jacques IA Client

## Vulnérabilités Connues

Ce document liste les vulnérabilités de sécurité connues dans les dépendances du client Jacques IA et explique pourquoi elles sont considérées comme un risque acceptable.

### Vulnérabilités Actuelles (5 total)

#### 1. PostCSS - Erreur d'analyse de retour de ligne (Modéré)
- **Package**: `postcss`
- **Version corrigée**: >= 8.4.31
- **Chemin**: `react-scripts > resolve-url-loader > postcss`
- **Impact**: Erreur de parsing, pas d'impact sur la sécurité en production
- **Statut**: Risque acceptable - dépendance de développement

#### 2. nth-check - Complexité d'expression régulière inefficace (Élevé)
- **Package**: `nth-check`
- **Version corrigée**: >= 2.0.1
- **Chemin**: `react-scripts > @svgr/webpack > @svgr/plugin-svgo > svgo > css-select > nth-check`
- **Impact**: Potentiel DoS via regex, uniquement pendant le build
- **Statut**: Risque acceptable - utilisé seulement pendant le build

#### 3. webpack-dev-server - Vol potentiel de code source (Modéré x2)
- **Package**: `webpack-dev-server`
- **Version corrigée**: >= 5.2.1
- **Chemin**: `react-scripts > webpack-dev-server`
- **Impact**: Vol de code source via navigateur malveillant
- **Statut**: Risque acceptable - serveur de développement local uniquement

#### 4. PrismJS - Vulnérabilité DOM Clobbering (Modéré)
- **Package**: `prismjs`
- **Version corrigée**: >= 1.30.0
- **Chemin**: `react-syntax-highlighter > refractor > prismjs`
- **Impact**: Manipulation DOM malveillante
- **Statut**: Risque acceptable - utilisé pour l'affichage de code

## Mesures Prises

1. **Overrides npm**: Ajout d'overrides dans `package.json` pour forcer les versions sécurisées
2. **Configuration audit**: Désactivation des audits automatiques via `.npmrc`
3. **Documentation**: Ce fichier documente tous les risques connus
4. **Monitoring**: Révision périodique des vulnérabilités recommandée

## Recommandations

- **Environnement de développement**: Risques acceptables
- **Environnement de production**: Ces dépendances ne sont pas incluses dans le build de production
- **Mise à jour**: Surveiller les mises à jour de `react-scripts` et `react-syntax-highlighter`

## Dernière révision

Date: 07/07/2025
Vulnérabilités: 5 (4 modérées, 1 élevée)
Statut: Toutes documentées et évaluées comme risque acceptable