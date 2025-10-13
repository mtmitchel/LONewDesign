export function formatRelativeTime(timestamp: number | null): string | null {
  if (!timestamp) return null;

  const now = Date.now();
  const diffMs = now - timestamp;
  if (!Number.isFinite(diffMs)) return null;

  const seconds = Math.max(Math.round(diffMs / 1000), 0);
  if (seconds < 45) return 'just now';
  if (seconds < 90) return '1m ago';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.round(days / 365);
  return `${years}y ago`;
}
