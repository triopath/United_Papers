"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(res.status === 429 ? "Too many attempts. Wait a few minutes and try again." : data.error ?? "Sign-in failed.");
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-navy-900 px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-2xl">
        <Logo href="/" />
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-navy-900">Operations portal</h1>
          <p className="text-sm text-slate-600">Sign in with your owner or staff account.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className="h-11 pr-12" />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-slate-500 hover:text-navy-900"
              >
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
          <Button type="submit" disabled={busy} className="h-11 w-full gap-2 bg-navy-700 hover:bg-navy-900">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Sign in
          </Button>
        </form>
        <p className="text-xs text-slate-500">Demo environment. Access is restricted; credentials are issued by the project owner.</p>
      </div>
    </div>
  );
}
