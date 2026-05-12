import { Button } from "#/components/ui/button";

type AdminSegmentedFilterOption<TValue extends string | number> = {
	value: TValue;
	label: string;
};

type AdminSegmentedFilterProps<TValue extends string | number> = {
	label: string;
	value: TValue;
	options: Array<AdminSegmentedFilterOption<TValue>>;
	activeVariant?: "default" | "secondary";
	onValueChange: (value: TValue) => void;
};

export function AdminSegmentedFilter<TValue extends string | number>({
	label,
	value,
	options,
	activeVariant = "secondary",
	onValueChange,
}: AdminSegmentedFilterProps<TValue>) {
	return (
		<div className="min-w-0 space-y-2">
			<div className="text-sm font-medium">{label}</div>
			<div className="flex max-w-full flex-wrap gap-2">
				{options.map((option) => {
					const isActive = option.value === value;

					return (
						<Button
							key={String(option.value)}
							type="button"
							size="sm"
							variant={isActive ? activeVariant : "outline"}
							disabled={isActive}
							className="min-w-0"
							onClick={() => onValueChange(option.value)}
						>
							<span className="truncate">{option.label}</span>
						</Button>
					);
				})}
			</div>
		</div>
	);
}
