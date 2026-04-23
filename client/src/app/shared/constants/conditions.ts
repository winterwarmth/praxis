export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

export function formatCondition(value: string | null | undefined): string {
  if (!value) return '';
  const match = CONDITIONS.find(c => c.value === value);
  return match ? match.label : value;
}
