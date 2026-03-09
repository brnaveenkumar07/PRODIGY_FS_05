import { Navbar } from "./Navbar";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className={`mx-auto max-w-2xl px-4 py-6 ${className ?? ""}`}>
        {children}
      </main>
    </div>
  );
}
