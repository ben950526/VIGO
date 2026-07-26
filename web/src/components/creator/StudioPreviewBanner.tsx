interface StudioPreviewBannerProps {
  reason: "pending" | "unlisted" | "rejected" | "admin";
}

const messages: Record<StudioPreviewBannerProps["reason"], string> = {
  pending: "工作室審核中，目前僅您可預覽此頁。通過審核後才會出現在探索頁。",
  unlisted: "工作室已下架，目前僅您可預覽此頁。重新上架後才會對外顯示。",
  rejected: "工作室未通過審核，目前僅您可預覽此頁。請修改資料後等待重新審核。",
  admin: "管理員預覽模式：此工作室尚未對外公開，或目前未上架。",
};

export function StudioPreviewBanner({ reason }: StudioPreviewBannerProps) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-center text-sm text-amber-900">
      {messages[reason]}
    </div>
  );
}
