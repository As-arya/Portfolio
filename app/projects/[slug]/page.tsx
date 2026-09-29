import { notFound } from "next/navigation";
import { getProject } from "../../../lib/repository";
import { ProjectDetail } from "./project-detail";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
