import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface TagPillProps {
  name: string;
  className?: string;
}

export function TagPill({ name, className }: TagPillProps) {
  return (
    <Link href={`/tags/${name}`}>
      <Badge variant="secondary" className={`cursor-pointer hover:bg-secondary/80 ${className ?? ""}`}>
        #{name}
      </Badge>
    </Link>
  );
}
