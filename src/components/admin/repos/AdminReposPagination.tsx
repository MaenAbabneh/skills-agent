import { Link } from "@tanstack/react-router";
import { formatShowingRange } from "#/components/admin/common";
import { Button } from "#/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
} from "#/components/ui/pagination";
import { buildSearchParams, getVisiblePages } from "./admin-repos.helpers";
import type { AdminReposSearch } from "./admin-repos.schema";

type AdminReposPaginationProps = {
	search: AdminReposSearch;
	total: number;
	count: number;
};

export function AdminReposPagination({
	search,
	total,
	count,
}: AdminReposPaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / search.pageSize));
	const hasPreviousPage = search.page > 1;
	const hasNextPage = search.page < totalPages;

	const visiblePages = getVisiblePages({
		currentPage: search.page,
		totalPages,
	});

	return (
		<div className="flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
			<div className="text-sm text-muted-foreground">
				{formatShowingRange({
					page: search.page,
					pageSize: search.pageSize,
					total,
					count,
				})}{" "}
				· Page {search.page} of {totalPages}
			</div>

			<Pagination className="mx-0 w-full justify-start overflow-hidden sm:w-auto sm:justify-end">
				<PaginationContent className="max-w-full overflow-hidden">
					<PaginationItem>
						{hasPreviousPage ? (
							<Button size="sm" variant="outline" asChild>
								<Link
									to="/admin/repos"
									search={buildSearchParams(search, { page: search.page - 1 })}
								>
									<span className="hidden sm:inline">Previous</span>
									<span className="sm:hidden">Prev</span>
								</Link>
							</Button>
						) : (
							<Button size="sm" variant="outline" disabled>
								<span className="hidden sm:inline">Previous</span>
								<span className="sm:hidden">Prev</span>
							</Button>
						)}
					</PaginationItem>

					{visiblePages.map((page, index) => {
						const previousPage = visiblePages[index - 1];
						const shouldShowGap =
							previousPage !== undefined && page - previousPage > 1;

						return (
							<PaginationItem key={page} className="hidden sm:list-item">
								{shouldShowGap && (
									<span className="inline-flex">
										<PaginationEllipsis />
									</span>
								)}

								{search.page === page ? (
									<Button size="sm" disabled>
										{page}
									</Button>
								) : (
									<Button size="sm" variant="outline" asChild>
										<Link
											to="/admin/repos"
											search={buildSearchParams(search, { page })}
										>
											{page}
										</Link>
									</Button>
								)}
							</PaginationItem>
						);
					})}

					<PaginationItem className="sm:hidden">
						<Button size="sm" variant="secondary" disabled>
							{search.page}
						</Button>
					</PaginationItem>

					<PaginationItem>
						{hasNextPage ? (
							<Button size="sm" variant="outline" asChild>
								<Link
									to="/admin/repos"
									search={buildSearchParams(search, { page: search.page + 1 })}
								>
									Next
								</Link>
							</Button>
						) : (
							<Button size="sm" variant="outline" disabled>
								Next
							</Button>
						)}
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}
