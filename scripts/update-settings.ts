import "dotenv/config";
import { db } from "../src/server/db/index";
import { sql } from "drizzle-orm";

async function main() {
	console.log("Updating agent-skills discovery settings...");
	await db.execute(sql`
		update section_discovery_settings
		set
			per_page = 30,
			max_variants_per_run = 2,
			pages = '[1]'::jsonb,
			pushed_within_days = '[7, 30]'::jsonb,
			created_within_days = '[30, 90]'::jsonb,
			star_ranges = '[{"min":1,"max":20},{"min":20,"max":100}]'::jsonb,
			updated_at = now()
		where section = 'agent-skills';
	`);
	console.log("Settings updated successfully!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Failed to update settings:", err);
	process.exit(1);
});
