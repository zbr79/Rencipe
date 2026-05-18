import { redirect } from "next/navigation";

export default async function LegacyEditProfileFieldPage({
  params,
}: {
  params: Promise<{ field: string }>;
}) {
  const { field } = await params;
  redirect(`/settings/account/${field}`);
}
