import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

export const auth = betterAuth({
	plugins: [tanstackStartCookies()],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),

	emailAndPassword: {
		enabled: true,
	},

	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
});
