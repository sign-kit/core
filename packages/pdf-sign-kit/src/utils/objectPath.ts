function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizePath(path: string): string[] {
  return path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function cloneBranch(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice();
  if (isPlainObject(value)) return { ...value };
  return value;
}

export function getValueAtPath(target: unknown, path: string): unknown {
  const segments = normalizePath(path);
  let current: unknown = target;

  for (const segment of segments) {
    if (!isPlainObject(current) && !Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

export function setValueAtPath(target: object, path: string, value: unknown): void {
  const segments = normalizePath(path);
  if (!segments.length) return;

  let current = target as Record<string, unknown>;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = current[segment];
    if (!isPlainObject(next)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]] = value;
}

export function cloneWithValueAtPath<T extends object>(target: T, path: string, value: unknown): T {
  const segments = normalizePath(path);
  if (!segments.length) return target;

  const root = cloneBranch(target) as Record<string, unknown>;
  let sourceCurrent = target as unknown as Record<string, unknown>;
  let nextCurrent = root;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const sourceNext = sourceCurrent ? sourceCurrent[segment] : undefined;
    const branch = cloneBranch(sourceNext);
    nextCurrent[segment] = isPlainObject(branch) || Array.isArray(branch) ? branch : {};
    sourceCurrent = isPlainObject(sourceNext)
      ? (sourceNext as Record<string, unknown>)
      : ({} as Record<string, unknown>);
    nextCurrent = nextCurrent[segment] as Record<string, unknown>;
  }

  nextCurrent[segments[segments.length - 1]] = value;
  return root as T;
}
