export const UNPUBLISHED = "尚未公布";

export function UnpublishedText({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[var(--text-muted)] ${className}`.trim()}>{UNPUBLISHED}</p>
  );
}
