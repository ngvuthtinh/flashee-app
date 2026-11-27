import { AppError } from '../errors/AppError';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => UUID_RE.test(value);

function readInt(value: unknown, fallback: number): number | null {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
    return Number(value);
}

export function parsePagination(query: Record<string, unknown>): { limit: number; after: string | null } {
    const limit = readInt(query['limit'], 20);
    const errors: Record<string, string> = {};

    if (limit === null || limit < 1 || limit > 50) {
        errors['limit'] = 'must be an integer between 1 and 50';
    }

    let after: string | null = null;
    const rawAfter = query['after'];
    if (rawAfter !== undefined) {
        if (typeof rawAfter === 'string' && isUuid(rawAfter)) after = rawAfter;
        else errors['after'] = 'must be a valid cursor';
    }

    if (Object.keys(errors).length > 0) {
        throw AppError.badRequest('Validation failed', errors);
    }
    return { limit: limit!, after };
}