const { RateLimiterMemory } = require('rate-limiter-flexible');

// Configuration du rate limiter
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'jacques_ia_api',
  points: 100, // Nombre de requêtes
  duration: 60, // Par minute
  blockDuration: 60, // Bloquer pendant 60 secondes si limite dépassée
});

// Middleware de rate limiting
const rateLimiterMiddleware = async (req, res, next) => {
  try {
    // Utiliser l'IP comme clé, ou l'ID utilisateur si authentifié
    const key = req.user?.userId || req.ip;
    
    await rateLimiter.consume(key);
    next();
  } catch (rejRes) {
    // Limite dépassée
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Trop de requêtes',
      message: `Limite de requêtes dépassée. Réessayez dans ${secs} secondes.`,
      retryAfter: secs
    });
  }
};

// Rate limiter spécial pour les requêtes d'IA (plus restrictif)
const aiRateLimiter = new RateLimiterMemory({
  keyPrefix: 'jacques_ia_ai',
  points: 20, // 20 requêtes d'IA
  duration: 60, // Par minute
  blockDuration: 120, // Bloquer pendant 2 minutes
});

const aiRateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.user?.userId || req.ip;
    await aiRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Limite de requêtes IA dépassée',
      message: `Vous avez atteint la limite de requêtes IA. Réessayez dans ${secs} secondes.`,
      retryAfter: secs
    });
  }
};

// Rate limiter pour l'exécution de code (très restrictif)
const codeExecutionRateLimiter = new RateLimiterMemory({
  keyPrefix: 'jacques_ia_code',
  points: 10, // 10 exécutions
  duration: 60, // Par minute
  blockDuration: 300, // Bloquer pendant 5 minutes
});

const codeExecutionRateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.user?.userId || req.ip;
    await codeExecutionRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Limite d\'exécution de code dépassée',
      message: `Vous avez atteint la limite d'exécutions de code. Réessayez dans ${secs} secondes.`,
      retryAfter: secs
    });
  }
};

module.exports = {
  rateLimiter: rateLimiterMiddleware,
  aiRateLimiter: aiRateLimiterMiddleware,
  codeExecutionRateLimiter: codeExecutionRateLimiterMiddleware
};