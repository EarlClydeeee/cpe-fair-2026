import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4">
      <h1 className="font-display text-5xl">Page not found</h1>
      <p className="mt-3 text-sm text-muted">That route does not exist in ACCESS CPE Fair 2026.</p>
      <LinkButton href="/leaderboard" className="mt-6 w-fit">
        Back to leaderboard
      </LinkButton>
    </div>
  );
}
