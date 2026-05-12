import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import type { SectionId } from "#/lib/sections";
import { updateSectionDiscoverySettingsAction } from "#/server/functions/admin-discovery-settings";

import {
	parseNumberList,
	parseStarRanges,
	stringifyNumberList,
	stringifyStarRanges,
} from "./admin-settings.helpers";

type DiscoveryStarRange = {
	min: number;
	max?: number;
};

type SectionDiscoverySettings = {
	section: SectionId;
	enabled: boolean;
	autoTuneQueriesEnabled: boolean;
	perPage: number;
	maxVariantsPerRun: number;
	minSearchRemaining: number;
	maxCandidateMultiplier: number;
	pages: number[];
	pushedWithinDays: number[];
	createdWithinDays: number[];
	starRanges: DiscoveryStarRange[];
};

type AdminDiscoverySettingsFormValues = {
	enabled: boolean;
	autoTuneQueriesEnabled: boolean;
	perPage: string;
	maxVariantsPerRun: string;
	minSearchRemaining: string;
	maxCandidateMultiplier: string;
	pages: string;
	pushedWithinDays: string;
	createdWithinDays: string;
	starRanges: string;
};

type AdminDiscoverySettingsFormProps = {
	settings: SectionDiscoverySettings;
};

function toDefaultValues(
	settings: SectionDiscoverySettings,
): AdminDiscoverySettingsFormValues {
	return {
		enabled: settings.enabled,
		autoTuneQueriesEnabled: settings.autoTuneQueriesEnabled,
		perPage: String(settings.perPage),
		maxVariantsPerRun: String(settings.maxVariantsPerRun),
		minSearchRemaining: String(settings.minSearchRemaining),
		maxCandidateMultiplier: String(settings.maxCandidateMultiplier),
		pages: stringifyNumberList(settings.pages),
		pushedWithinDays: stringifyNumberList(settings.pushedWithinDays),
		createdWithinDays: stringifyNumberList(settings.createdWithinDays),
		starRanges: stringifyStarRanges(settings.starRanges),
	};
}

function parsePositiveInteger(value: string, fieldLabel: string) {
	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new Error(`${fieldLabel} must be a valid positive integer.`);
	}

	return parsed;
}

function hasInvalidCommaNumber(value: string) {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean)
		.some((item) => {
			const parsed = Number(item);
			return !Number.isInteger(parsed) || parsed <= 0;
		});
}

function validateNumberListField(value: string, fieldLabel: string) {
	const parsed = parseNumberList(value);

	if (parsed.length === 0) {
		return `${fieldLabel} must contain at least one number.`;
	}

	if (hasInvalidCommaNumber(value)) {
		return `${fieldLabel} must use comma-separated positive integers.`;
	}

	return undefined;
}

function validateStarRangesField(value: string) {
	const rawRanges = value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
	const parsed = parseStarRanges(value);

	if (parsed.length === 0) {
		return "Star ranges must contain at least one valid range.";
	}

	if (parsed.length !== rawRanges.length) {
		return "Use star ranges like 1-20, 20-100, 100-500.";
	}

	return undefined;
}

function FieldError({ errors }: { errors: unknown[] }) {
	if (errors.length === 0) {
		return null;
	}

	return (
		<p className="text-xs text-destructive">
			{errors.map((error) => String(error)).join(", ")}
		</p>
	);
}

function SettingsSection({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

function SettingWarning({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
			<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
			<div>{children}</div>
		</div>
	);
}

export function AdminDiscoverySettingsForm({
	settings,
}: AdminDiscoverySettingsFormProps) {
	const router = useRouter();
	const defaultValues = toDefaultValues(settings);

	const form = useForm({
		defaultValues,

		onSubmit: async ({ value }) => {
			let savingToastId: string | number | undefined;

			try {
				savingToastId = toast.loading("Saving discovery settings...");

				const parsedPages = parseNumberList(value.pages);
				const parsedPushedWithinDays = parseNumberList(value.pushedWithinDays);
				const parsedCreatedWithinDays = parseNumberList(
					value.createdWithinDays,
				);
				const parsedStarRanges = parseStarRanges(value.starRanges);

				await updateSectionDiscoverySettingsAction({
					data: {
						section: settings.section,
						enabled: value.enabled,
						autoTuneQueriesEnabled: value.autoTuneQueriesEnabled,
						perPage: parsePositiveInteger(value.perPage, "Per page"),
						maxVariantsPerRun: parsePositiveInteger(
							value.maxVariantsPerRun,
							"Max variants per run",
						),
						minSearchRemaining: parsePositiveInteger(
							value.minSearchRemaining,
							"Min search remaining",
						),
						maxCandidateMultiplier: parsePositiveInteger(
							value.maxCandidateMultiplier,
							"Max candidate multiplier",
						),
						pages: parsedPages,
						pushedWithinDays: parsedPushedWithinDays,
						createdWithinDays: parsedCreatedWithinDays,
						starRanges: parsedStarRanges,
					},
				});

				form.reset(value);
				toast.success("Discovery settings updated successfully.", {
					id: savingToastId,
				});
				await router.invalidate();
			} catch (error) {
				console.error("Failed to update discovery settings:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to update discovery settings.",
					{ id: savingToastId },
				);
			}
		},
	});

	return (
		<form
			className="space-y-6"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Card>
				<CardHeader>
					<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
						<div>
							<CardTitle>Discovery Settings</CardTitle>
							<CardDescription>
								Section-level controls for discovery runs.
							</CardDescription>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline">{settings.section}</Badge>
							<form.Subscribe selector={(state) => state.values.enabled}>
								{(enabled) =>
									enabled ? (
										<Badge variant="default">Enabled</Badge>
									) : (
										<Badge variant="destructive">Disabled</Badge>
									)
								}
							</form.Subscribe>
						</div>
					</div>
				</CardHeader>
			</Card>

			<SettingsSection
				title="Basic"
				description="Enable or pause discovery for this section."
			>
				<form.Field name="enabled">
					{(field) => (
						<div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<Label>Discovery enabled</Label>
								<p className="mt-1 text-sm text-muted-foreground">
									If disabled, discovery will not run for this section.
								</p>
								<p className="mt-2 text-xs text-muted-foreground">
									Suggestion: keep this On during normal discovery, and switch
									it Off only when you want to pause the pipeline completely.
								</p>
							</div>
							<div className="flex gap-2">
								<Button
									type="button"
									variant={field.state.value ? "default" : "outline"}
									onClick={() => {
										field.handleChange(true);
										toast.info(
											"Discovery enabled. The cron can run for this section.",
										);
									}}
								>
									On
								</Button>
								<Button
									type="button"
									variant={!field.state.value ? "default" : "outline"}
									onClick={() => {
										field.handleChange(false);
										toast.info(
											"Discovery paused. This section will not run until you turn it back on.",
										);
									}}
								>
									Off
								</Button>
							</div>
						</div>
					)}
				</form.Field>

				<form.Field name="autoTuneQueriesEnabled">
					{(field) => (
						<div className="flex items-center justify-between rounded-lg border p-4">
							<div>
								<Label>Auto tune search queries</Label>

								<p className="mt-1 text-sm text-muted-foreground">
									When enabled, the cron job can automatically adjust query
									priorities based on discovery performance.
								</p>
								<p className="mt-2 text-xs text-muted-foreground">
									Suggestion: keep this Off until you have enough stable runs,
									then enable it to let the system tune query priorities
									automatically.
								</p>
							</div>

							<div className="flex gap-2">
								<Button
									type="button"
									variant={field.state.value ? "default" : "outline"}
									onClick={() => {
										field.handleChange(true);
										toast.info(
											"Auto tune enabled. The cron can now adjust query priorities.",
										);
									}}
								>
									On
								</Button>
								<Button
									type="button"
									variant={!field.state.value ? "default" : "outline"}
									onClick={() => {
										field.handleChange(false);
										toast.info(
											"Auto tune disabled. Query priorities will stay unchanged.",
										);
									}}
								>
									Off
								</Button>
							</div>
						</div>
					)}
				</form.Field>

				<form.Subscribe selector={(state) => state.values.enabled}>
					{(enabled) =>
						!enabled && (
							<div className="mt-4">
								<SettingWarning>
									Discovery is disabled for this section. Manual sync controls
									remain available.
								</SettingWarning>
							</div>
						)
					}
				</form.Subscribe>
			</SettingsSection>

			<SettingsSection
				title="GitHub Budget"
				description="Control request size and search budget safeguards."
			>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<form.Field
						name="perPage"
						validators={{
							onChange: ({ value }) => {
								const numberValue = Number(value);
								if (
									!Number.isInteger(numberValue) ||
									numberValue < 1 ||
									numberValue > 100
								) {
									return "Per page must be between 1 and 100.";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Per page</Label>
								<Input
									id={field.name}
									type="number"
									min={1}
									max={100}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									GitHub results per search request.
								</p>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field
						name="maxVariantsPerRun"
						validators={{
							onChange: ({ value }) => {
								const numberValue = Number(value);
								if (
									!Number.isInteger(numberValue) ||
									numberValue < 1 ||
									numberValue > 30
								) {
									return "Max variants per run must be between 1 and 30.";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Max variants per run</Label>
								<Input
									id={field.name}
									type="number"
									min={1}
									max={30}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Search requests allowed per discovery run.
								</p>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field
						name="minSearchRemaining"
						validators={{
							onChange: ({ value }) => {
								const numberValue = Number(value);
								if (
									!Number.isInteger(numberValue) ||
									numberValue < 0 ||
									numberValue > 30
								) {
									return "Min search remaining must be between 0 and 30.";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Min search remaining</Label>
								<Input
									id={field.name}
									type="number"
									min={0}
									max={30}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Reserve requests before discovery stops.
								</p>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field
						name="maxCandidateMultiplier"
						validators={{
							onChange: ({ value }) => {
								const numberValue = Number(value);
								if (
									!Number.isInteger(numberValue) ||
									numberValue < 1 ||
									numberValue > 20
								) {
									return "Max candidate multiplier must be between 1 and 20.";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Max candidate multiplier</Label>
								<Input
									id={field.name}
									type="number"
									min={1}
									max={20}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Safety value kept for compatibility.
								</p>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe
					selector={(state) => ({
						maxVariantsPerRun: Number(state.values.maxVariantsPerRun),
						minSearchRemaining: Number(state.values.minSearchRemaining),
					})}
				>
					{({ maxVariantsPerRun, minSearchRemaining }) => (
						<div className="mt-4 space-y-3">
							{maxVariantsPerRun >= 20 && (
								<SettingWarning>
									Max variants per run is high and may consume GitHub Search API
									budget quickly.
								</SettingWarning>
							)}
							{minSearchRemaining === 0 && (
								<SettingWarning>
									Min search remaining is 0, so discovery may fully exhaust the
									available search budget.
								</SettingWarning>
							)}
						</div>
					)}
				</form.Subscribe>
			</SettingsSection>

			<SettingsSection
				title="Search Windows"
				description="Comma-separated window settings used to generate discovery query variants."
			>
				<div className="grid gap-4 md:grid-cols-3">
					<form.Field
						name="pages"
						validators={{
							onChange: ({ value }) => validateNumberListField(value, "Pages"),
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Pages</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="1, 2"
								/>
								<p className="text-xs text-muted-foreground">
									Comma-separated GitHub search pages.
								</p>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field
						name="pushedWithinDays"
						validators={{
							onChange: ({ value }) =>
								validateNumberListField(value, "Pushed windows"),
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Pushed within days</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="7, 30"
								/>
								<p className="text-xs text-muted-foreground">
									Comma-separated pushed date windows.
								</p>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field
						name="createdWithinDays"
						validators={{
							onChange: ({ value }) =>
								validateNumberListField(value, "Created windows"),
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Created within days</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="30, 90"
								/>
								<p className="text-xs text-muted-foreground">
									Comma-separated created date windows.
								</p>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
				</div>
			</SettingsSection>

			<SettingsSection
				title="Star Ranges"
				description="Define GitHub star buckets used by discovery search variants."
			>
				<form.Field
					name="starRanges"
					validators={{
						onChange: ({ value }) => validateStarRangesField(value),
					}}
				>
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Star ranges</Label>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder="1-20, 20-100, 100-500"
							/>
							<p className="text-xs text-muted-foreground">
								Use comma-separated ranges, for example: 1-20, 20-100, 100-500.
							</p>
							<FieldError errors={field.state.meta.errors} />
						</div>
					)}
				</form.Field>
			</SettingsSection>

			<div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 p-4 backdrop-blur md:mx-0 md:rounded-lg md:border">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<form.Subscribe selector={(state) => state.isDirty}>
						{(isDirty) => (
							<div className="text-sm text-muted-foreground">
								{isDirty ? "Unsaved changes" : "All changes saved"}
							</div>
						)}
					</form.Subscribe>

					<form.Subscribe
						selector={(state) => [
							state.canSubmit,
							state.isSubmitting,
							state.isDirty,
						]}
					>
						{([canSubmit, isSubmitting, isDirty]) => (
							<div className="flex flex-col gap-2 sm:flex-row">
								<Button
									type="button"
									variant="outline"
									disabled={isSubmitting || !isDirty}
									onClick={() => form.reset()}
								>
									<RotateCcw className="mr-2 h-4 w-4" />
									Reset
								</Button>
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Save className="mr-2 h-4 w-4" />
									)}
									{isSubmitting ? "Saving..." : "Save Settings"}
								</Button>
							</div>
						)}
					</form.Subscribe>
				</div>
			</div>
		</form>
	);
}
