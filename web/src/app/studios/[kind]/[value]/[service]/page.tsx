import { FacetStudiosPage, facetMetadata } from "@/components/seo/FacetStudiosPage";

// 地區×服務的組合頁（例：/studios/region/台北市/剪輯）；資料每小時更新
export const revalidate = 3600;

type Props = { params: Promise<{ kind: string; value: string; service: string }> };

export async function generateMetadata({ params }: Props) {
  return facetMetadata(await params);
}

export default async function Page({ params }: Props) {
  return <FacetStudiosPage params={await params} />;
}
