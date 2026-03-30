export const DEFAULT_IMAGE_URL = '/default-image.svg';

export const resolveMediaUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return DEFAULT_IMAGE_URL;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw;
  }
  if (raw.startsWith('/')) return raw;
  return `/${raw}`;
};
