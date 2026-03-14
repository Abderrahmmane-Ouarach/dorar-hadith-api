const AppError = require('./AppError');
const config = require('../config/config');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const fetchWithTimeout = async (url, options = {}, retries = 3, delay = 2000) => {
  const timeout = config.fetchTimeout;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);


      // 429 → attendre et réessayer
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay * attempt;
        console.warn(`⚠️ 429 reçu (tentative ${attempt}/${retries}) - attente ${waitTime}ms`);

        if (attempt === retries) {
          throw new AppError('Trop de requêtes vers dorar.net. Réessayez dans quelques instants.', 429);
        }

        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        throw new AppError(`Failed to fetch data: ${response.statusText}`, response.status);
      }

      return response;

    } catch (error) {
      clearTimeout(id);

      if (error.name === 'AbortError') {
        throw new AppError('Request timeout. Please try again later.', 408);
      }
      if (error instanceof AppError) throw error;
      throw error;
    }
  }
};

module.exports = fetchWithTimeout;
