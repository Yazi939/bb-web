// Content Security Policy configuration
export const csp = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'", "data:"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "http://89.169.170.164:5000", "ws://89.169.170.164:5000"],
  'worker-src': ["'self'"],
}; 