export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatVolume(value) {
  const litres = Number(value) || 0;
  return `${litres.toLocaleString('en-IN', { maximumFractionDigits: 0 })} L`;
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
