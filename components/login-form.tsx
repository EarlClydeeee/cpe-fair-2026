"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "./ui/form-message";
import { CheckboxField, TextField } from "./ui/input";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const unauthorized = searchParams.get("error") === "unauthorized";
  const [state, action] = useActionState(signIn, initialActionState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative flex flex-col justify-between overflow-hidden bg-accent px-8 py-10 text-black sm:px-12">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-black font-display text-xl text-accent">
            A
          </span>
          <span>
            <span className="block font-display text-2xl leading-none">ACCESS</span>
            <span className="block text-[10px] tracking-[0.18em] uppercase">CPE Fair 2026</span>
          </span>
        </div>

        <div className="my-16 max-w-md">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase">
            For the crew behind the competition.
          </p>
          <h1 className="mt-4 font-display text-6xl leading-[0.9] sm:text-7xl">
            Keep the fair in flight.
          </h1>
          <p className="mt-6 text-sm leading-6 text-black/80">
            Every fixture. Every point. Every team. One place to keep the fair moving.
          </p>
          <div className="mt-8 border-t-2 border-dashed border-black/30" />
        </div>

        <div className="relative z-10 space-y-1">
          <p className="text-xs tracking-[0.16em] uppercase">Eight teams. One shared ambition.</p>
          <p className="font-display text-2xl tracking-wide">Fly high. Play as one.</p>
        </div>

        <span className="pointer-events-none absolute bottom-0 right-4 font-display text-[11rem] leading-none text-black/10 sm:text-[14rem]">
          2026
        </span>
      </section>

      <section className="flex flex-col justify-between bg-background px-8 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md flex-1">
          <p className="text-xs tracking-[0.2em] text-accent uppercase">
            Control room / Authorized access
          </p>
          <h2 className="mt-3 font-display text-5xl">Welcome back.</h2>
          <p className="mt-3 text-sm text-muted">
            Sign in to manage ACCESS CPE Fair 2026. Your team is counting on you.
          </p>
          {unauthorized ? (
            <p className="mt-4 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
              This account is not authorized for the control room.
            </p>
          ) : null}

          <form action={action} className="mt-8 space-y-4">
            <input type="hidden" name="next" value={next} />
            <TextField
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              error={state.errors?.email?.[0]}
            />
            <div className="relative">
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                error={state.errors?.password?.[0]}
              />
              <button
                type="button"
                className="absolute top-8 right-3 text-xs text-muted transition-colors duration-200 hover:text-accent"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <CheckboxField label="Keep me signed in" name="remember" />
              <span className="text-xs text-accent">Forgot password?</span>
            </div>
            <FormMessage state={state} />
            <SubmitButton className="w-full">Sign in</SubmitButton>
          </form>

          <p className="mt-6 text-xs text-muted">Need access? Contact your workspace owner.</p>

          <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-xs leading-5 text-muted">
            <p className="font-semibold tracking-wide text-foreground uppercase">
              Authorized organizers only
            </p>
            <p className="mt-2">
              Your role determines which fair-management tools you can use. Contact your workspace
              owner if you need additional access.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-md items-center justify-between border-t border-border pt-6 text-xs text-muted">
          <Link href="/leaderboard" className="transition-colors duration-200 hover:text-accent">
            ← Back to leaderboard
          </Link>
          <span>UI preview · Auth required</span>
        </div>
      </section>
    </div>
  );
}
