export type ClientPlatform = 'android' | 'ios' | 'web' | 'unknown';

export function detectClientPlatform(userAgent: string | undefined): ClientPlatform {
  if (!userAgent) return 'unknown';

  const agent = userAgent.toLowerCase();

  if (agent.includes('android')) return 'android';
  if (agent.includes('iphone') || agent.includes('ipad') || agent.includes('ios')) return 'ios';
  if (agent.includes('windows') || agent.includes('macintosh') || agent.includes('linux'))
    return 'web';

  return 'unknown';
}
