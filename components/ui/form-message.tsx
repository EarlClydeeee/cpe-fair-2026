import type { ActionState } from "@/lib/action-state";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message && !state.errors) return null;
  const details = state.errors
    ? Object.values(state.errors)
        .flatMap((msgs) => msgs ?? [])
        .filter(Boolean)
    : [];
  return (
    <div
      className={`rounded-lg px-3 py-2 text-sm ${
        state.ok ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
      }`}
      role="status"
    >
      {state.message ? <p>{state.message}</p> : null}
      {!state.ok && details.length > 0 ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
          {details.map((msg, i) => (
            <li key={`${i}-${msg}`}>{msg}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
