const toPathSegments = (field: string): string[] => {
    return field
        .replace(/\[(\d+)]/g, '.$1')
        .split('.')
        .filter((segment) => segment.length > 0);
};

export const normalizeFieldPath = (field: string): string => {
    return toPathSegments(field).join('.');
};

export const getValueAtPath = (source: unknown, field: string): unknown => {
    const segments = toPathSegments(field);
    let currentValue: unknown = source;

    for (const segment of segments) {
        if (currentValue === null || currentValue === undefined) {
            return undefined;
        }

        currentValue = (currentValue as Record<string, unknown>)[segment];
    }

    return currentValue;
};

export const setValueAtPath = <T>(source: T, field: string, value: unknown): T => {
    const segments = toPathSegments(field);

    if (segments.length === 0) {
        return source;
    }

    const rootClone = Array.isArray(source)
        ? [...source] as unknown
        : { ...(source as Record<string, unknown>) };

    let cursor = rootClone as Record<string, unknown>;
    let sourceCursor: unknown = source;

    for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        const nextSegment = segments[index + 1];
        const existingValue = (sourceCursor as Record<string, unknown> | undefined)?.[segment];

        const clonedValue = Array.isArray(existingValue)
            ? [...existingValue]
            : existingValue !== null && typeof existingValue === 'object'
                ? { ...(existingValue as Record<string, unknown>) }
                : Number.isNaN(Number(nextSegment)) ? {} : [];

        cursor[segment] = clonedValue;
        cursor = clonedValue as Record<string, unknown>;
        sourceCursor = existingValue;
    }

    const lastSegment = segments[segments.length - 1];
    cursor[lastSegment] = value;

    return rootClone as T;
};
