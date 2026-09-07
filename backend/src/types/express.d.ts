import { UserRole } from "../model/User";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: UserRole;
            }
        }
    }
}