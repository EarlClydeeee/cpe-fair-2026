"use client";

import Link from "next/link";
import { useActionState } from "react";
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

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative flex flex-col justify-between bg-accent px-8 py-10 text-black sm:px-12">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-black font-display text-xl text-accent">
            A
          </span>
          <span>
            <span className="block font-display text-2xl leading-none">ACCESS</span>
            <span className="block text-[10px] tracking-[0.18em] uppercase">CPE Fair 2026</span>
          </span>
        </div>
        <div className="my-16 max-w-md">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase">
            For the crew behind the competition
          </p>
          <h1 className="mt-4 font-display text-6xl leading-[0.9] sm:text-7xl">
            Keep the fair in flight.
          </h1>
          <p className="mt-6 text-sm leading-6 text-black/80">
            Every fixture. Every point. Every team. One place to keep the fair moving.
          </p>
        </div>
        <p className="text-xs tracking-wide uppercase">
          Eight teams. One shared ambition. Fly high. Play as one.
        </p>
        <span className="pointer-events-none absolute bottom-0 right-6 font-display text-[10rem] leading-none text-black/10">
          2026
        </span>
      </section>

      <section className="flex flex-col justify-center bg-background px-8 py-12 sm:px-12">
        <p className="text-xs tracking-[0.2em] text-accent uppercase">
          Control room / Authorized access
        </p>
        <h2 className="mt-3 font-display text-5xl">Welcome back.</h2>
        <p className="mt-3 max-w-md text-sm text-muted">
          Sign in to manage ACCESS CPE Fair 2026. Your team is counting on you.
        </p>
        {unauthorized ? (
          <p className="mt-4 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
            This account is not authorized for the control room.
          </p>
        ) : null}
        <form action={action} className="mt-8 max-w-md space-y-4">
          <input type="hidden" name="next" value={next} />
          <TextField
            label="Email address"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            error={state.errors?.email?.[0]}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            error={state.errors?.password?.[0]}
          />
          <div className="flex items-center justify-between gap-3">
            <CheckboxField label="Keep me signed in" name="remember" />
            <span className="text-xs text-accent">Forgot password?</span>
          </div>
          <FormMessage state={state} />
          <SubmitButton className="w-full">Sign in</SubmitButton>
        </form>
        <p className="mt-6 max-w-md text-xs text-muted">
          Need access? Contact your workspace owner.
        </p>
        <div className="mt-6 max-w-md rounded-xl border border-border bg-surface p-4 text-xs leading-5 text-muted">
          <p className="font-semibold tracking-wide text-foreground uppercase">
            For authorized organizers only
          </p>
          <p className="mt-2">
            Roles determine which tools you can use in the control room — scoring, events, teams, or
            full owner access.
          </p>
        </div>
        <div className="mt-8 flex max-w-md justify-between text-xs text-muted">
          <Link href="/leaderboard" className="hover:text-accent">
            ← Back to leaderboard
          </Link>
        </div>
      </section>
    </div>
  );
}
