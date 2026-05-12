import { Link, useRouter } from "@tanstack/react-router";
import { Filter, Search, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { AdminSegmentedFilter } from "#/components/admin/common";
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
import { ADMIN_REPOS_DEFAULT_SEARCH } from "#/constants/admin/navigation";
import { SECTION_CONFIGS } from "#/lib/sections";
import { buildSearchParams, getAlgorithmLabel } from "./admin-repos.helpers";
import {
	type AdminReposSearch,
	ALGORITHM_OPTIONS,
	PAGE_SIZE_OPTIONS,
	STATUS_OPTIONS,
} from "./admin-repos.schema";

type AdminReposFiltersProps = {
	search: AdminReposSearch;
	result: {
		section?: string;
		total: number;
		itemsCount: number;
	};
};

function getStatusLabel(status: AdminReposSearch["status"]) {
	if (status === "all") return "All";
	return status.charAt(0).toUpperCase() + status.slice(1);
}

function AdminReposSearchBox({ search }: { search: AdminReposSearch }) {
	const router = useRouter();
	const [query, setQuery] = useState(search.query);

	useEffect(() => {
		setQuery(search.query);
	}, [search.query]);

	function navigate(next: Partial<AdminReposSearch>) {
		router.navigate({
			to: "/admin/repos",
			search: buildSearchParams(search, next),
		});
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		navigate({
			query: query.trim(),
			page: 1,
		});
	}

	function handleClear() {
		setQuery("");
		navigate({
			query: "",
			page: 1,
		});
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex min-w-0 flex-col gap-2 sm:flex-row"
		>
			<div className="relative min-w-0 flex-1">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search by repo, owner, name, or description..."
					className="pr-9 pl-9"
				/>
				{query && (
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						className="absolute right-2 top-1/2 -translate-y-1/2"
						aria-label="Clear search input"
						onClick={handleClear}
					>
						<X className="h-3 w-3" />
					</Button>
				)}
			</div>

			<Button type="submit">Search</Button>
		</form>
	);
}

export function AdminReposFilters({ search, result }: AdminReposFiltersProps) {
	const router = useRouter();

	function navigate(next: Partial<AdminReposSearch>) {
		router.navigate({
			to: "/admin/repos",
			search: buildSearchParams(search, next),
		});
	}

	const hasActiveFilters =
		search.status !== ADMIN_REPOS_DEFAULT_SEARCH.status ||
		search.algorithm !== ADMIN_REPOS_DEFAULT_SEARCH.algorithm ||
		search.query !== ADMIN_REPOS_DEFAULT_SEARCH.query ||
		search.pageSize !== ADMIN_REPOS_DEFAULT_SEARCH.pageSize;
	const sectionLabel =
		SECTION_CONFIGS[search.section]?.label ?? result.section ?? search.section;

	return (
		<Card>
			<CardHeader className="gap-3 pb-3">
				<div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Filter className="h-5 w-5" />
							Filters
						</CardTitle>
						<CardDescription>
							Server-side filters for status, algorithm decision, and search.
						</CardDescription>
					</div>

					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!hasActiveFilters}
						asChild={hasActiveFilters}
					>
						{hasActiveFilters ? (
							<Link
								to="/admin/repos"
								search={buildSearchParams(search, {
									status: "pending",
									algorithm: "all",
									query: "",
									page: 1,
									pageSize: 24,
								})}
							>
								Clear filters
							</Link>
						) : (
							<span>Clear filters</span>
						)}
					</Button>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<AdminReposSearchBox search={search} />

				<div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_1fr_auto]">
					<AdminSegmentedFilter
						label="Status"
						value={search.status}
						activeVariant="default"
						options={STATUS_OPTIONS.map((status) => ({
							value: status,
							label: getStatusLabel(status),
						}))}
						onValueChange={(status) =>
							navigate({
								status,
								page: 1,
							})
						}
					/>

					<AdminSegmentedFilter
						label="Algorithm"
						value={search.algorithm}
						options={ALGORITHM_OPTIONS.map((algorithm) => ({
							value: algorithm,
							label: getAlgorithmLabel(algorithm),
						}))}
						onValueChange={(algorithm) =>
							navigate({
								algorithm,
								page: 1,
							})
						}
					/>

					<AdminSegmentedFilter
						label="Page size"
						value={search.pageSize}
						options={PAGE_SIZE_OPTIONS.map((pageSize) => ({
							value: pageSize,
							label: `${pageSize} / page`,
						}))}
						onValueChange={(pageSize) =>
							navigate({
								pageSize,
								page: 1,
							})
						}
					/>
				</div>

				<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
					<Badge variant="outline">Section: {sectionLabel}</Badge>
					<Badge variant="outline">Status: {search.status}</Badge>
					<Badge variant="outline">Algorithm: {search.algorithm}</Badge>
					{search.query && (
						<Badge variant="outline">Search: {search.query}</Badge>
					)}
					<Badge variant="outline">Total: {result.total}</Badge>
					<Badge variant="outline">Showing: {result.itemsCount}</Badge>
				</div>
			</CardContent>
		</Card>
	);
}
