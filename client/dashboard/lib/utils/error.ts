export class AppError extends Error {
    constructor(
        public message: string,
        public status: number = 500,
        public code: string = 'UNKNOWN'
    ) {
        super(message);
        this.name = 'AppError';
    }
}
