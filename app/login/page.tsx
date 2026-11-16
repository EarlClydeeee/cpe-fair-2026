import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const instant = false;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
