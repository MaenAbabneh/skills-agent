import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { userRoleEnum } from "./enums.schema";

/**
 * App profile linked to Better Auth user.id.
 */
export const profiles = pgTable(
	"profiles",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		username: text("username"),
		avatarUrl: text("avatar_url"),

		role: userRoleEnum("role").notNull().default("user"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		userIdUnique: uniqueIndex("profiles_user_id_unique").on(table.userId),

		usernameUnique: uniqueIndex("profiles_username_unique").on(table.username),

		roleIdx: index("profiles_role_idx").on(table.role),
	}),
);
