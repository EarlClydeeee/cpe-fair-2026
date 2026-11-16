import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const field =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent/40";

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export function TextField({
  label,
  name,
  error,
  hint,
  className = "",
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
      <input id={name} name={name} className={field} aria-invalid={Boolean(error)} {...props} />
      {hint && !error ? <span className="block text-xs text-muted">{hint}</span> : null}
      {error ? <span className="block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  className = "",
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
      <textarea id={name} name={name} className={`${field} min-h-24`} {...props} />
      {error ? <span className="block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  name,
  error,
  children,
  className = "",
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
      <select id={name} name={name} className={field} {...props}>
        {children}
      </select>
      {error ? <span className="block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 rounded border-border accent-accent"
      />
      {label}
    </label>
  );
}
