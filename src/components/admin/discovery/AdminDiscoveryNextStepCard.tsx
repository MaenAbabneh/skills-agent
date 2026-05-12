import { Database } from "lucide-react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

export function AdminDiscoveryNextStepCard() {
	return (
		<Card className="bg-muted/20">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<Database className="h-4 w-4" />
					Next Step
				</CardTitle>

				<CardDescription>
					Discovery and sync are temporary admin controls. Later they can be
					moved into scheduled jobs.
				</CardDescription>
			</CardHeader>

			<CardContent className="text-sm text-muted-foreground">
				After testing, we will create a scheduled discovery runner that
				distributes the GitHub search budget across sections automatically.
			</CardContent>
		</Card>
	);
}
