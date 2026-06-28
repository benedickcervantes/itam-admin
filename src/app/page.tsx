"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { getAccessToken, persistSession } from "@/lib/auth/session";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (getAccessToken()) router.replace("/dashboard");
  }, [router]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const result = await login(email.trim(), password);
      persistSession(result.accessToken, result.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh bg-[#0F172A]">
      <div className="hidden flex-1 flex-col justify-center bg-gradient-to-br from-[#1E3A5F] to-[#0F172A] p-8 lg:flex lg:p-12">
        <Monitor className="mb-6 h-12 w-12 text-[#2E7D9A]" />
        <h1 className="max-w-md text-3xl font-bold text-white lg:text-4xl">IT Hardware Asset Management</h1>
        <p className="mt-4 max-w-md text-slate-300">
          Track audits, assets, assignments, maintenance, and disposals across all departments.
        </p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-2 lg:hidden">
          <Monitor className="h-7 w-7 text-[#2E7D9A]" />
          <span className="text-sm font-semibold text-white">IT Asset Management</span>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-xl sm:p-8">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Sign in</h2>
          <p className="mt-1 text-sm text-slate-400">Use your IT admin or viewer account</p>
          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void handleLogin();
            }}
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/80 py-2.5 pl-10 pr-3 text-white outline-none focus:border-[#2E7D9A]"
                  placeholder="admin@itam.local"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/80 py-2.5 pl-10 pr-10 text-white outline-none focus:border-[#2E7D9A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] py-2.5 font-medium text-white hover:bg-[#256f89] disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
