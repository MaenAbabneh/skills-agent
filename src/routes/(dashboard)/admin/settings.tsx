import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AdminEmptyState } from "#/components/admin/common";
import { AdminSectionSelector } from "#/components/admin/discovery";
import {
	AdminAutoTuneSummary,
	AdminDiscoverySettingsForm,
	AdminSearchQueriesManager,
	AdminSearchQueryInsights,
	AdminSettingsHeader,
	AdminTemporaryDiscoveriesCard,
} from "#/components/admin/settings";
import { normalizeSectionId, type SectionId } from "#/lib/sections";

import { getAdminDiscoverySettingsAction } from "#/server/functions/admin-discovery-settings";
import {
	getAdminSectionSearchQueriesAction,
	getTemporaryDiscoveriesAction,
} from "#/server/functions/admin-section-search-queries";

export const Route = createFileRoute("/(dashboard)/admin/settings")({
	component: AdminSettingsPage,

	validateSearch: (search) => ({
		section: normalizeSectionId(search.section),
	}),

	loaderDeps: ({ search }) => ({
		section: search.section,
	}),

	loader: async ({ deps }) => {
		const [discoverySettings, searchQueries, temporaryDiscoveries] =
			await Promise.all([
				getAdminDiscoverySettingsAction(),
				getAdminSectionSearchQueriesAction({
					data: {
						section: deps.section,
					},
				}),
				getTemporaryDiscoveriesAction({
					data: {
						section: deps.section,
						limit: 20,
					},
				}),
			]);

		return {
			discoverySettings,
			searchQueries,
			temporaryDiscoveries,
		};
	},
});

function AdminSettingsPage() {
	const navigate = useNavigate({ from: "/admin/settings" });
	const search = Route.useSearch();
	const { discoverySettings, searchQueries, temporaryDiscoveries } =
		Route.useLoaderData();
	const selectedSection: SectionId = search.section;

	const sectionSettings = discoverySettings.sections.find(
		(section) => section.section === selectedSection,
	);

	function handleSectionChange(section: SectionId) {
		navigate({
			search: {
				section,
			},
		});
	}

	if (!sectionSettings) {
		return (
			<div className="space-y-6">
				<AdminSettingsHeader />

				<AdminEmptyState
					title="No discovery settings found"
					description={`No discovery settings were returned for ${selectedSection}.`}
				/>
			</div>
		);
	}

	const discoverySettingsForForm = {
		...sectionSettings,
	};

	return (
		<div className="space-y-6">
			<AdminSettingsHeader />

			<AdminSectionSelector
				section={selectedSection as "3d-motion"}
				onSectionChange={handleSectionChange}
			/>

			<AdminAutoTuneSummary
				enabled={sectionSettings.autoTuneQueriesEnabled}
				queries={searchQueries}
			/>

			<AdminDiscoverySettingsForm settings={discoverySettingsForForm} />

			<AdminSearchQueryInsights
				section={selectedSection}
				queries={searchQueries}
			/>

			<AdminTemporaryDiscoveriesCard
				section={selectedSection}
				discoveries={temporaryDiscoveries}
			/>

			<AdminSearchQueriesManager
				section={selectedSection}
				queries={searchQueries}
			/>
		</div>
	);
}
