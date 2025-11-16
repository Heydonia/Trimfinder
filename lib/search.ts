const KNOWN_MODELS = [
  'rav4',
  'camry',
  'corolla',
  'tacoma',
  '4runner',
  'prius',
  'highlander',
  'sequoia',
  'sienna',
  'tundra',
  'venza',
  'crown',
  'gr86',
  'supra',
  'bz4x',
];

export type ParsedQuery = {
  models: string[];
  keywords: string[];
};

export function parseQuery(query: string): ParsedQuery {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const models = new Set<string>();
  const keywords = new Set<string>();

  for (const token of tokens) {
    const normalized = token.replace(/[^a-z0-9]/g, '');
    if (!normalized) continue;
    if (KNOWN_MODELS.includes(normalized)) {
      models.add(normalized);
    } else {
      keywords.add(normalized);
    }
  }

  return {
    models: [...models],
    keywords: [...keywords],
  };
}

export function scorePage(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    const re = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'gi');
    const matches = lower.match(re);
    if (matches) score += matches.length;
  }
  return score;
}

export function buildSnippet(text: string, keywords: string[], radius = 120): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  let idx = -1;

  for (const keyword of keywords) {
    const found = lower.indexOf(keyword);
    if (found !== -1 && (idx === -1 || found < idx)) idx = found;
  }

  if (idx === -1) {
    return text.slice(0, radius * 2) + (text.length > radius * 2 ? '…' : '');
  }

  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

export function toPublicPath(filePath: string): string {
  // Deprecated – kept for compatibility. Real conversion happens via getPublicUrl.
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  if (filePath.startsWith('/uploads/')) return filePath;
  const idx = filePath.lastIndexOf('/uploads/');
  if (idx >= 0) return filePath.slice(idx);
  return `/uploads/${filePath.replace(/^.*[\\/]/, '')}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

