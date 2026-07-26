import Image from "next/image";

interface CreatorAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function CreatorAvatar({
  name,
  avatarUrl,
  className = "",
  sizes = "(max-width: 768px) 100vw, 340px",
  priority = false,
}: CreatorAvatarProps) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        fill
        className={`object-cover ${className}`}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300 ${className}`}
    >
      <span className="text-5xl font-bold text-slate-500">{name.charAt(0)}</span>
    </div>
  );
}
