/** Availability copy, straight from the prototype's rules. */
export function availLine(reserved: number, capacity: number): string {
  const remaining = capacity - reserved;
  if (remaining <= 0) return `ALL ${capacity} COOKIES RESERVED`;
  if (remaining <= 18) return `ONLY ${remaining} COOKIES REMAINING`;
  return `${reserved} OF ${capacity} COOKIES RESERVED`;
}
