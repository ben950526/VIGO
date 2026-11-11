import { FacetStudiosPage, facetMetadata } from "@/components/seo/FacetStudiosPage";

// 給 Google 搜尋的工作室列表頁（例：/studios/region/台北市）；資料每小時更新
export const revalidate = 3600;

type Props = { params: Promise<{ kind: string; value: string }> };

export async function generateMetadata({ params }: Props) {
  return facetMetadata(await params);
}

export default async function Page({ params }: Props) {
  return <FacetStudiosPage params={await params} />;
}
