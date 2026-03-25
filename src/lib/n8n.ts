export const n8nWebhook = (path: string): string => {
  const base = process.env.N8N_BASE_URL;
  if (!base) throw new Error("N8N_BASE_URL is not set");
  return `${base}/webhook/${path}`;
};
