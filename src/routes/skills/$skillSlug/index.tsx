import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/skills/$skillSlug/')({
  component: RouteComponent,
})


function RouteComponent() {

  const { skillSlug } = Route.useParams()
  
  return   (
      <div className="p-10 flex items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">
        Skill details page is in progress for skill Slug: {skillSlug}
      </h1>
    </div>
)
}
