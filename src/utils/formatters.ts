export function formatCount(count: number): string {
  if (!count || isNaN(count)) return '0';
  if (count >= 1_000_000) {
    const val = (count / 1_000_000).toFixed(1);
    return val.endsWith('.0') ? `${val.slice(0, -2)}M` : `${val}M`;
  }
  if (count >= 10_000) {
    const val = (count / 1_000).toFixed(1);
    return val.endsWith('.0') ? `${val.slice(0, -2)}K` : `${val}K`;
  }
  if (count >= 1_000) {
    const val = (count / 1_000).toFixed(1);
    return val.endsWith('.0') ? `${val.slice(0, -2)}K` : `${val}K`;
  }
  return count.toLocaleString();
}

export function timeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'recently';
  }
}

export const formatRelativeTime = timeAgo;
export const formatTimeAgo = timeAgo;
export const formatNumber = formatCount;

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
