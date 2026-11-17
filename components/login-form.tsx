"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "./ui/form-message";

function EnterTerminalButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff6a00] py-3.5 px-4 text-xs font-black tracking-wider text-black uppercase transition-all hover:bg-[#ff7b1a] active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-[0_4px_20px_rgba(255,106,0,0.25)]"
    >
      <span>{pending ? "CONNECTING..." : "ENTER TERMINAL"}</span>
      <svg
        className="size-3.5 stroke-[3]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const unauthorized = searchParams.get("error") === "unauthorized";
  const [state, action] = useActionState(signIn, initialActionState);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#101114] p-4 text-white">
      {/* Subtle warm ambient spotlight behind the card */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_48%,rgba(255,106,0,0.09),transparent_70%)]" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-xl border border-neutral-800/90 bg-[#16171b] px-8 pt-9 pb-8 shadow-2xl shadow-black/90">
        {/* Accent orange bar on the top edge */}
        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-[#ff6a00]" />

        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <Image
            src="/logo.png"
            alt="CPE Fair 2026 Logo"
            width={76}
            height={76}
            className="h-16 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,106,0,0.35)]"
            priority
          />
        </div>

        {/* Header */}
        <h1 className="text-center font-display text-3xl font-black tracking-wider text-white uppercase sm:text-4xl">
          UMPIRES GATE
        </h1>
        <p className="mt-1.5 text-center text-xs font-medium text-neutral-400">
          Restricted Access: Irminsul Admins Only
        </p>

        {unauthorized ? (
          <p className="mt-4 rounded-lg bg-danger/15 px-3 py-2 text-center text-xs text-danger">
            This account is not authorized for the control room.
          </p>
        ) : null}

        {/* Form */}
        <form action={action} className="mt-7 space-y-4">
          <input type="hidden" name="next" value={next} />

          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-bold tracking-[0.16em] text-[#ff6a00] uppercase"
            >
              ACCESS CODE
            </label>

            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="block w-full rounded-lg border border-neutral-800 bg-[#0e0f12] py-2.5 pr-3 pl-10 text-sm tracking-widest text-white placeholder-neutral-500 transition-colors focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] focus:outline-none"
              />
            </div>

            <p className="mt-2 text-[11px] text-neutral-400">
              Use the access code provided by your administrator.
            </p>
          </div>

          <FormMessage state={state} />

          <EnterTerminalButton />
        </form>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Need access? Contact your workspace owner.
        </p>
      </div>

      {/* Back link */}
      <div className="relative z-10 mt-6 text-center">
        <Link
          href="/leaderboard"
          className="text-xs text-neutral-400 transition-colors hover:text-[#ff6a00]"
        >
          ← Back to leaderboard
        </Link>
      </div>
    </div>
  );
}
