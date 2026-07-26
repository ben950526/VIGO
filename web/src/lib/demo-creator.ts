/** 是否為平台示範帳號（非真實接案者） */
export function isDemoCreator(
  creator: { is_demo?: boolean; slug?: string },
): boolean {
  return creator.is_demo === true || (creator.slug?.endsWith("-demo") ?? false);
}

export const DEMO_BADGE_LABEL = "示範帳號";

export const DEMO_WARNING =
  "此為 Vigo 示範帳號，僅供瀏覽平台介面與作品集樣式，並非真實接案創作者。請勿聯絡、委託或匯款。";
