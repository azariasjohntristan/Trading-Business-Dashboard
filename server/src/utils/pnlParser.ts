export function parsePnl(value: string): number {
  const trimmed = value.trim();

  if (trimmed.startsWith('$(') && trimmed.endsWith(')')) {
    return -parseFloat(trimmed.slice(2, -1));
  }

  if (trimmed.startsWith('$')) {
    return parseFloat(trimmed.slice(1));
  }

  return parseFloat(trimmed);
}
