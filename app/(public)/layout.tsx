import { Suspense } from "react";
import { PublicFooter, PublicHeader } from "@/components/public-shell";

function HeaderFallback() {
  return <div className="h-16 border-b border-border bg-background" />;
}

function FooterFallback() {
  return (
    <footer className="mt-auto border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto h-40 max-w-6xl px-4 py-10 sm:px-6" />
    </footer>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <PublicHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={<FooterFallback />}>
        <PublicFooter />
      </Suspense>
    </>
  );
}
