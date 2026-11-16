export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      {(eyebrow || title || description) && (
        <header className="mb-10 max-w-2xl">
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="font-display text-3xl leading-tight text-balance text-foreground sm:text-4xl">
              {title}
            </h2>
          ) : null}
          {description ? <p className="mt-3 text-base leading-7 text-muted">{description}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}
