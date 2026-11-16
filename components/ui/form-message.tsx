import type { ActionState } from "@/lib/action-state";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        state.ok ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
      }`}
      role="status"
    >
      {state.message}
    </p>
  );
}
