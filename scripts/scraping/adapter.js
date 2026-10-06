/**
 * EA FC Scraper HTTP Adapter
 * Handles HTTP requests with exponential backoff, rate limiting, and timeout
 */

const https = require('https');
const http = require('http');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, maxRetries = 3, backoffMs = 1000) {
  const parsedUrl = new URL(url);
  const client = parsedUrl.protocol === 'https:' ? https : http;

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 EA-FC-Companion/2.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
  };

  const requestOptions = {
    ...parsedUrl,
    method: options.method || 'GET',
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    timeout: options.timeout || 10000
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await new Promise((resolve, reject) => {
        const req = client.request(requestOptions, (res) => {
          let data = '';

          // Redirect handling
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            resolve(fetchWithRetry(res.headers.location, options, maxRetries - 1, backoffMs));
            return;
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP error ${res.statusCode}: ${res.statusMessage}`));
            return;
          }

          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => { resolve(data); });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Timeout after ${requestOptions.timeout}ms`));
        });

        if (options.body) {
          req.write(options.body);
        }
        req.end();
      });

      return result;
    } catch (err) {
      console.warn(`[Adapter] Intento ${attempt}/${maxRetries} fallido para ${url}: ${err.message}`);
      if (attempt === maxRetries) {
        throw err;
      }
      const delay = backoffMs * Math.pow(2, attempt - 1);
      console.log(`[Adapter] Esperando ${delay}ms antes del reintento...`);
      await sleep(delay);
    }
  }
}

module.exports = {
  fetchWithRetry,
  sleep
};
