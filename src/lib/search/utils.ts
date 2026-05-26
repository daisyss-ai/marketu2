// lib/search/utils.ts  ← ficheiro novo, fonte única de verdade
export function normalizeText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}