import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { SchemaSetupBanner } from "@/components/admin/SchemaSetupBanner";
import { getCurrentUserCreatorProfile } from "@/lib/data/creators";
import { checkCreatorProfileSchema } from "@/lib/db-schema";
import { isSupabaseConfigured } from "@/lib/utils";

export default async function ProfileEditPage() {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const profile = await getCurrentUserCreatorProfile();
  if (!profile) redirect("/login");

  const schema = await checkCreatorProfileSchema();

  return (
    <>
      {!schema.ok && <SchemaSetupBanner />}
      <ProfileForm profile={profile} />
    </>
  );
}
