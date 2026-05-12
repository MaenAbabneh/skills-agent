import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { SECTION_OPTIONS, type SectionId } from "#/lib/sections";

type AdminSectionSelectorProps = {
	section: SectionId;
	onSectionChange?: (section: SectionId) => void;
};

export function AdminSectionSelector({
	section,
	onSectionChange,
}: AdminSectionSelectorProps) {
	const selectedOption = SECTION_OPTIONS.find(
		(option) => option.value === section,
	);

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">Section</CardTitle>

				<CardDescription>
					Choose which section discovery and sync actions should target.
				</CardDescription>
			</CardHeader>

			<CardContent className="grid gap-4 md:grid-cols-[280px_1fr] md:items-start">
				<Select
					value={section}
					onValueChange={(value) => onSectionChange?.(value as SectionId)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select section" />
					</SelectTrigger>

					<SelectContent>
						{SECTION_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="rounded-lg border bg-muted/30 p-3 text-sm">
					<div className="font-medium">
						{selectedOption?.label ?? "Unknown section"}
					</div>

					<p className="mt-1 text-muted-foreground">
						{selectedOption?.description ??
							"No description available for this section."}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
