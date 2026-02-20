/**
 * Better Auth configuration
 * Server-only code - should only be imported in server functions
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";

// Import database and schema
import { db } from "~/db/client.server";
import * as schema from "~/db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verification: schema.verificationTokens,
    },
  }),
  emailAndPassword: {
    enabled: false, // Only Google OAuth
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Users cannot set this field themselves
      },
    },
  },
  plugins: [
    tanstackStartCookies(), // Must be last plugin for cookie handling
  ],
  callbacks: {
    session({ session, user }: { session: any; user: any }) {
      // Add role to session
      if (session.user) {
        session.user.role = user.role || "user";
      }
      return session;
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Handle Google OAuth callback - check superadmin access
      if (ctx.path === "/callback/google") {
        const session = ctx.context.session || ctx.context.newSession;

        if (!session) {
          return;
        }

        const user = session.user;
        const isNewUser = !!ctx.context.newSession;

        // For new users, set role based on superadmin email list
        if (isNewUser) {
          const superadminEmails = (process.env.SUPERADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);

          const role = superadminEmails.includes(user.email)
            ? "superadmin"
            : "user";

          // Update user with role
          await db
            .update(schema.users)
            .set({ role })
            .where(eq(schema.users.id, user.id));

          // If user is not a superadmin, prevent sign-in
          if (role !== "superadmin") {
            throw new APIError("UNAUTHORIZED", {
              message: "Unauthorized: Superadmin access required",
            });
          }
        } else {
          // For existing users, check if they're a superadmin
          const [userRecord] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, user.id))
            .limit(1);

          if (!userRecord || userRecord.role !== "superadmin") {
            throw new APIError("UNAUTHORIZED", {
              message: "Unauthorized: Superadmin access required",
            });
          }
        }
      }
    }),
  },
});
