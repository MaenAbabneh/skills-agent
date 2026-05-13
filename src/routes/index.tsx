import { createFileRoute } from "@tanstack/react-router";
import { PublicHomePage } from "@/components/home/PublicHomePage";
import { getPublicHomeData } from "@/server/functions/public-home";

export const Route = createFileRoute("/")({
	component: Home,

	loader: async () => {
		const homeData = await getPublicHomeData();

		return {
			homeData,
		};
	},

	staleTime: 1000 * 60 * 5,
});

function Home() {
	const { homeData } = Route.useLoaderData();

	return <PublicHomePage data={homeData} />;
}
