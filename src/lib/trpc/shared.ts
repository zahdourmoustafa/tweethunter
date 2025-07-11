import superjson from 'superjson';

export function getBaseUrl() {
  if (typeof window !== 'undefined') return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}

export const transformer = superjson;
