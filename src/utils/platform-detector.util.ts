export function detectPlatform(userAgent: string): 'android' | 'ios' | 'web' | 'unknown' {
  if (!userAgent) {
    return 'unknown';
  }

  const ua = userAgent.toLowerCase();

  // Treat Postman as web
  if (ua.includes('postmanruntime')) {
    return 'web';
  }

  if (ua.includes('android')) {
    return 'android';
  } else if (ua.match(/iphone|ipad|ipod/)) {
    return 'ios';
  } else if (ua.match(/mozilla|chrome|safari|firefox|edge/)) {
    return 'web';
  }

  return 'unknown';
}
