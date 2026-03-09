import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};

export function UserAvatar({ name, image, size = "md" }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={sizeMap[size]}>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
}
