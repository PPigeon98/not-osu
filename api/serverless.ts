import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './server';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle path rewriting for Vercel
  // Express routes: /, /echo, /api/beatmaps, /api/beatmaps/upload
  // Vercel sends: /api, /api/echo, /api/beatmaps, /api/beatmaps/upload
  // We need: /, /echo, /api/beatmaps, /api/beatmaps/upload
  const originalUrl = req.url || '';
  
  if (originalUrl === '/api' || originalUrl === '/api/') {
    req.url = '/';
  } else if (originalUrl.startsWith('/api/echo')) {
    req.url = '/echo' + (originalUrl.includes('?') ? originalUrl.substring(originalUrl.indexOf('?')) : '');
  } else if (originalUrl.startsWith('/api/api/')) {
    // Double /api/api/ -> /api/
    req.url = originalUrl.replace('/api/api/', '/api/');
  }
  // For /api/beatmaps and other routes that already have /api in Express, keep as is
  
  return app(req, res);
}

