"use client";

import { useActionState, useEffect, useState } from "react";
import { saveLiveBroadcast } from "@/app/actions/live";
import { initialActionState } from "@/lib/action-state";
import { facebookVideoEmbedSrc } from "@/lib/facebook-live";
import { FormMessage } from "../ui/form-message";
import { TextField } from "../ui/input";
import { Badge } from "../ui/badge";
import { SubmitButton } from "../submit-button";

export type LiveBroadcastFormData = {
  id: string | null;
  title: string;
  facebook_url: string;
  is_active: boolean;
};

export function LiveBroadcastManager({
  broadcast,
}: {
  broadcast: LiveBroadcastFormData;
}) {
  const [state, action] = useActionState(saveLiveBroadcast, initialActionState);
  const [title, setTitle] = useState(broadcast.title);
  const [url, setUrl] = useState(broadcast.facebook_url);
  const [active, setActive] = useState(broadcast.is_active);
  const [id, setId] = useState(broadcast.id);

  useEffect(() => {
    setTitle(broadcast.title);
    setUrl(broadcast.facebook_url);
    setActive(broadcast.is_active);
    setId(broadcast.id);
  }, [broadcast]);

  useEffect(() => {
    if (state.ok && state.id) setId(state.id);
  }, [state.ok, state.id]);

  const previewSrc = facebookVideoEmbedSrc(url);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form action={action} className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        {id ? <input type="hidden" name="id" value={id} /> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
              Public /live page
            </p>
            <h2 className="mt-1 font-display text-2xl leading-none">Facebook stream</h2>
          </div>
          <Badge tone={active ? "success" : "muted"}>
            {active ? "Live on site" : "Offline"}
          </Badge>
        </div>

        <TextField
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={state.errors?.title?.[0]}
          hint="Shown above the player on the public page."
        />

        <TextField
          label="Facebook URL"
          name="facebook_url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.facebook.com/YourPage/videos/… or /live"
          error={state.errors?.facebook_url?.[0]}
          hint="Paste a public Facebook Live, video, or page /live link. Video must be public to embed."
        />

        <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3">
          <input
            type="checkbox"
            name="is_active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-1 size-4 accent-[var(--accent)]"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              Show on the public Live page
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              Turn off to hide the embed without deleting the URL.
            </span>
          </span>
        </label>

        <FormMessage state={state} />

        <div className="flex flex-wrap gap-3">
          <SubmitButton>Save live stream</SubmitButton>
          <a
            href="/live"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm text-muted transition-colors hover:text-foreground"
          >
            Open public page
          </a>
        </div>
      </form>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
            Embed preview
          </p>
          <p className="mt-2 text-sm text-muted">
            Chat stays on Facebook. Viewers need a public video URL for the player to load.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-background">
            {previewSrc ? (
              <div className="relative aspect-video w-full">
                <iframe
                  title="Facebook Live preview"
                  src={previewSrc}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-muted">
                Paste a valid Facebook URL to preview the embed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
