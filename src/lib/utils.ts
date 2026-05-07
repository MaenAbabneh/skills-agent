export function generateSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
    .replace(/--+/g, '-');
}