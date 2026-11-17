"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "./ui/form-message";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const unauthorized = searchParams.get("error") === "unauthorized";
  const [state, action] = useActionState(signIn, initialActionState);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, #FF6B2133, transparent 70%), radial-gradient(ellipse 50% 35% at 80% 100%, #FF6B2114, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="h-1 bg-accent" aria-hidden />

        <div className="px-8 pt-10 pb-8 sm:px-10">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-xl bg-accent font-display text-3xl text-black shadow-[0_0_28px_#FF6B2166]">
              A
            </span>
            <h1 className="mt-6 font-display text-4xl tracking-[0.08em] uppercase sm:text-5xl">
              Umpires Gate
            </h1>
            <p className="mt-2 text-xs tracking-[0.14em] text-muted uppercase">
              Restricted access · ACCESS CPE Fair admins only
            </p>
          </div>

          {unauthorized ? (
            <p className="mt-6 rounded-lg bg-danger/15 px-3 py-2 text-center text-sm text-danger">
              This account is not authorized for the control room.
            </p>
          ) : null}

          <form action={action} className="mt-8 space-y-5">
            <input type="hidden" name="next" value={next} />

            <label className="block space-y-1.5">
              <span className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
                Access code
              </span>
              <div className="relative">
                <span
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                  aria-hidden
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showCode ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(state.errors?.password?.[0])}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pr-16 pl-10 text-sm text-foreground outline-none transition placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/40"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-xs tracking-wide text-muted uppercase transition-colors duration-200 hover:text-accent"
                  onClick={() => setShowCode((v) => !v)}
                >
                  {showCode ? "Hide" : "Show"}
                </button>
              </div>
              {state.errors?.password?.[0] ? (
                <span className="block text-xs text-danger">{state.errors.password[0]}</span>
              ) : (
                <span className="block text-xs text-muted">
                  Use the access code provided by your administrator.
                </span>
              )}
            </label>

            <FormMessage state={state} />
            <SubmitButton className="w-full tracking-[0.12em] uppercase">
              Enter terminal →
            </SubmitButton>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Need access? Contact your workspace owner.
          </p>
        </div>

        <div className="border-t border-border px-8 py-4 text-center sm:px-10">
          <Link
            href="/leaderboard"
            className="text-xs tracking-wide text-muted uppercase transition-colors duration-200 hover:text-accent"
          >
            ← Back to leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
