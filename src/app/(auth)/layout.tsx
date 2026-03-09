import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-muted/40 px-4 py-6 md:py-8">
      <Link href="/" className="mb-5 text-xl font-bold text-primary tracking-tight">
        SocialApp
      </Link>
      <div className="w-full max-w-[360px]">{children}</div>
    </div>
  );
}
