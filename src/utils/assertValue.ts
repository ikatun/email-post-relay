export function assertValue<T>(value: T | undefined | null, msg?: string): T {
  if (value === undefined || value === null) {
    throw new Error(msg ?? 'Invalid value');
  }

  return value;
}
