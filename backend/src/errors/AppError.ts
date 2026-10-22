export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public errors?: Record<string, string>,
    ) {
        super(message);
        this.name = 'AppError';
    }
}