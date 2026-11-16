export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-surface-2" />
      <div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
