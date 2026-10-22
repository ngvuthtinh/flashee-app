export type Rule = (value: unknown) => string | null;
export type Schema = Record<string, Rule[]>;
export type FieldErrors = Record<string, string>;
export type ValidationResult = | { ok: true, data: Record<string,unknown> }
                               | { ok: false, errors: FieldErrors};

export const required: Rule = (v) => v === undefined || v === null || v === '' ? 'is required' : null;
export const isString: Rule = (v) => typeof v === 'string' ? null : 'must be a string';
export const isEmail: Rule = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'must be a valid email';
export const minLength = (n: number): Rule => (v) => typeof v === 'string' && v.length < n ? `must be at least ${n} characters` : null;
export const maxLength = (n: number): Rule => (v) => typeof v === 'string' && v.length > n ? `must be at most ${n} characters` : null;

export function validate(schema: Schema, body: unknown): ValidationResult {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return { ok: false, errors: { body: 'must be a JSON object'} };
    }

    const input = body as Record<string, unknown>;
    const errors: FieldErrors = {};
    const data: Record<string, unknown> = {};

    for (const [field, rules] of Object.entries(schema)) {
        const value = input[field];

        for (const rule of rules) {
            const message = rule(value);
            if (message) {
                errors[field] = message;
                break;
            }
        }

        if (!errors[field]) {
            data[field] = value;
        }
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors};
    }
    return { ok: true, data};
}