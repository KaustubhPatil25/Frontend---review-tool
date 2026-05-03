const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-cyan-500', 'bg-rose-500', 'bg-amber-500'
];

export function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}
