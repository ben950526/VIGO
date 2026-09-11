import { redirect } from "next/navigation";

export default function NewPortfolioRedirectPage() {
  redirect("/dashboard/studio#portfolio");
}
