import { redirect } from 'next/navigation';

export default async function WorkspaceGitHubRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/${id}/settings/github`);
}
