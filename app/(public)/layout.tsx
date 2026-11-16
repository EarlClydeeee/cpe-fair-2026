import { Suspense } from "react";
import { PublicFooter, PublicHeader } from "@/components/public-shell";

function HeaderFallback() {
  return <div className="h-16 border-b border-border bg-background" />;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <PublicHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </>
  );
}
