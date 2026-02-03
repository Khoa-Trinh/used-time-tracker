
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db";
import { user, session, account, verification } from "../../db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user,
            session,
            account,
            verification
        }
    }),
    emailAndPassword: {
        enabled: true
    },
    trustedOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [],
    advanced: {
        cookiePrefix: process.env.NODE_ENV === "production" ? "used-time-tracker" : undefined,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        }
    }
});
