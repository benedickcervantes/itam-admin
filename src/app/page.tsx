"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Grainient from "@/components/Grainient";
import LoginHeroVisual from "@/components/LoginHeroVisual";
import LoginSuccessOverlay from "@/components/LoginSuccessOverlay";
import SessionLoadingOverlay from "@/components/SessionLoadingOverlay";
import TextType from "@/components/TextType";
import { fetchProfile, login } from "@/lib/api/auth";
import {
  buildSupportMailto,
  buildSupportTel,
  fetchPortalConfig,
  type PortalConfig,
} from "@/lib/api/public";
import {
  clearSession,
  getAccessToken,
  getRememberMePreference,
  getStoredUser,
  markSkipSessionOverlay,
  persistSession,
} from "@/lib/auth/session";

const FEATURES = ["Asset Monitoring", "Hardware Inventory", "Initial Asset Audit"] as const;

const GREETINGS = ["Welcome Back!", "Good to See You!", "Let's Get to Work."] as const;

function WelcomeHeading() {
  return (
    <h1 className="text-center text-2xl font-bold leading-tight tracking-tight text-white min-[375px]:text-3xl sm:text-4xl md:text-[2.5rem] lg:text-5xl xl:text-6xl">
      <TextType
        as="span"
        text={[...GREETINGS]}
        variableSpeed={{ min: 55, max: 120 }}
        deletingSpeed={35}
        pauseDuration={2600}
        className="inline-block align-baseline"
        showCursor
        cursorCharacter="|"
        cursorClassName="text-[1em] font-light leading-none text-[#4FB0CE]"
        loop
        renderText={(txt) => (
          <span className="bg-gradient-to-r from-white via-[#9fdcef] to-[#2E7D9A] bg-clip-text text-transparent">
            {txt}
          </span>
        )}
      />
    </h1>
  );
}

function FeaturePills() {
  return (
    <div className="mt-6 flex w-full max-w-xl flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-2.5 md:mt-10 md:gap-3 lg:mt-10">
      {FEATURES.map((feature) => (
        <span
          key={feature}
          className="rounded-full border border-slate-700/30 bg-slate-800/30 px-3 py-1.5 text-xs font-medium text-slate-400 shadow-sm backdrop-blur-sm transition-all duration-300 min-[375px]:px-4 min-[375px]:py-2 min-[375px]:text-sm sm:px-5 sm:py-2.5 hover:border-[#2E7D9A]/40 hover:bg-[#1E3A5F]/40 hover:text-white"
        >
          {feature}
        </span>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [support, setSupport] = useState<PortalConfig | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [restoringSession, setRestoringSession] = useState(false);
  const [sessionRestoreReady, setSessionRestoreReady] = useState(false);
  const [sessionOverlayDone, setSessionOverlayDone] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setRememberMe(getRememberMePreference());
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    setRestoringSession(true);
    const stored = getStoredUser();
    if (stored?.fullName) setSuccessName(stored.fullName);
    fetchProfile()
      .then((profile) => {
        persistSession(token, profile);
        setSuccessName(profile.fullName ?? null);
        setSessionRestoreReady(true);
      })
      .catch(() => {
        clearSession();
        setRestoringSession(false);
        setCheckingSession(false);
      });
  }, []);

  useEffect(() => {
    if (!sessionRestoreReady || !sessionOverlayDone) return;
    markSkipSessionOverlay();
    router.replace("/dashboard");
  }, [sessionRestoreReady, sessionOverlayDone, router]);

  const handleSessionOverlayComplete = useCallback(() => {
    setSessionOverlayDone(true);
  }, []);

  useEffect(() => {
    void fetchPortalConfig()
      .then(setSupport)
      .catch(() => {
        /* portal config is optional on login */
      });
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const result = await login(email.trim(), password, rememberMe);
      persistSession(result.accessToken, result.user, rememberMe);
      router.prefetch("/dashboard");
      setSuccessName(result.user.fullName ?? null);
      markSkipSessionOverlay();
      setLoginSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setIsSubmitting(false);
    }
  };

  const supportEmail = support?.supportEmail ?? null;
  const supportPhone = support?.supportPhone ?? null;
  const supportHref =
    (supportEmail ? buildSupportMailto(supportEmail) : null) ??
    (supportPhone ? buildSupportTel(supportPhone) : null);
  const SupportTag = supportHref ? "a" : "button";

  if (checkingSession) {
    return (
      <div className="relative min-h-dvh w-full bg-[#0F172A]">
        {restoringSession && (
          <SessionLoadingOverlay
            userName={successName}
            onComplete={handleSessionOverlayComplete}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#0F172A] text-white">
      {loginSuccess && (
        <LoginSuccessOverlay
          userName={successName}
          onComplete={() => router.replace("/dashboard")}
        />
      )}

      <div className="pointer-events-none fixed inset-0 z-0 opacity-85">
        <Grainient
          color1="#1E3A5F"
          color2="#2E7D9A"
          color3="#0F172A"
          timeSpeed={2.5}
          colorBalance={-0.1}
          warpStrength={0.8}
          warpFrequency={4.0}
          warpSpeed={1.5}
          warpAmplitude={40.0}
          blendAngle={30.0}
          blendSoftness={0.1}
          rotationAmount={300.0}
          noiseScale={1.5}
          grainAmount={0.08}
          grainScale={1.5}
          grainAnimated
          contrast={1.3}
          gamma={0.9}
          saturation={1.2}
          centerX={0.0}
          centerY={0.0}
          zoom={0.8}
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-tr from-[#0F172A] via-[#0F172A]/50 to-[#0F172A]/30" />

      <div className="relative z-20 mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col lg:flex-row lg:items-stretch">
        {/* Hero — stacked on mobile/tablet, side panel on laptop+ */}
        <div className="flex shrink-0 flex-col items-center justify-center px-4 pb-2 pt-6 text-center min-[375px]:px-5 min-[375px]:pt-7 sm:px-6 sm:pb-4 sm:pt-8 md:px-8 md:pt-10 lg:flex-1 lg:items-end lg:justify-center lg:px-10 lg:pb-8 lg:pt-12 lg:pr-6 xl:px-14 xl:pr-10 2xl:pr-16">
          <div className="flex w-full max-w-lg flex-col items-center lg:max-w-xl">
            <LoginHeroVisual />
            <WelcomeHeading />
            <p className="mt-2 flex min-h-[20px] max-w-md items-center justify-center px-2 text-center text-xs leading-relaxed text-slate-400 min-[375px]:mt-3 min-[375px]:min-h-[24px] min-[375px]:text-sm sm:mt-4 sm:text-base md:max-w-lg lg:min-h-[28px] lg:text-lg">
              <TextType
                as="span"
                text="Sign in to monitor your IT hardware assets"
                typingSpeed={80}
                initialDelay={1800}
                loop={false}
                showCursor={false}
              />
            </p>
            <FeaturePills />
          </div>
        </div>

        {/* Sign-in form */}
        <section className="flex w-full shrink-0 items-start justify-center px-4 pb-8 pt-2 min-[375px]:px-5 sm:px-6 sm:pb-10 md:px-8 md:pb-12 lg:w-1/2 lg:max-w-none lg:items-center lg:justify-start lg:px-10 lg:py-10 lg:pl-6 xl:px-12 xl:py-12 xl:pl-10 2xl:px-14">
          <div className="w-full max-w-[480px] rounded-2xl border border-white/10 bg-[#1E293B]/75 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_40px_rgba(46,125,154,0.06)] backdrop-blur-xl transition-all duration-500 min-[375px]:p-6 sm:p-8 md:p-9 lg:p-10 xl:p-12">
            <h2 className="text-2xl font-bold text-white min-[375px]:text-[1.65rem] sm:text-3xl">Sign in</h2>
            <p className="mt-1.5 text-sm text-slate-400 min-[375px]:mt-2 sm:text-base">
              Access your IT asset monitoring portal
            </p>

            <form
              className="mt-6 space-y-4 min-[375px]:mt-8 min-[375px]:space-y-5 sm:mt-10 sm:space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                void handleLogin();
              }}
            >
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200 sm:mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="admin@itam.local"
                    suppressHydrationWarning
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-[#2E7D9A]/50 focus:bg-slate-950 focus:ring-1 focus:ring-[#2E7D9A]/20 min-[375px]:py-3.5 sm:py-4 sm:pl-11 sm:pr-4 sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-200 sm:mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                    onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLockOn(false)}
                    placeholder="Enter your password"
                    suppressHydrationWarning
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-10 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-[#2E7D9A]/50 focus:bg-slate-950 focus:ring-1 focus:ring-[#2E7D9A]/20 min-[375px]:py-3.5 sm:py-4 sm:pl-11 sm:pr-11 sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {capsLockOn && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-300">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Caps Lock is on
                  </p>
                )}
              </div>

              <div className="flex w-full items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-300 transition-colors hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-600 bg-slate-900 text-[#2E7D9A] focus:ring-[#2E7D9A]/30"
                  />
                  Remember me
                </label>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                suppressHydrationWarning
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D9A] py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#256f89] hover:shadow-[0_0_25px_rgba(46,125,154,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base lg:hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 sm:mt-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-700" />
                <span className="text-xs font-medium text-slate-500">Need help?</span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>
              <div className="mt-3 flex flex-col items-center gap-2 sm:mt-4">
                <SupportTag
                  {...(supportHref
                    ? { href: supportHref }
                    : { type: "button" as const, disabled: true })}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition-all duration-300 hover:border-[#2E7D9A]/40 hover:bg-[#1E3A5F]/25 hover:text-white hover:shadow-[0_0_20px_rgba(46,125,154,0.15)] min-[375px]:w-auto min-[375px]:px-6 min-[375px]:py-3 sm:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Headphones className="h-4 w-4 text-slate-400 transition-colors group-hover:text-white" />
                  <span>Contact IT Support</span>
                </SupportTag>
                {(supportEmail || supportPhone) && (
                  <p className="text-center text-xs text-slate-500">
                    {supportEmail && (
                      <a
                        href={buildSupportMailto(supportEmail)}
                        className="text-slate-400 transition-colors hover:text-[#2E7D9A]"
                      >
                        {supportEmail}
                      </a>
                    )}
                    {supportEmail && supportPhone && (
                      <span className="mx-2 text-slate-600">·</span>
                    )}
                    {supportPhone && (
                      <a
                        href={buildSupportTel(supportPhone) ?? undefined}
                        className="text-slate-400 transition-colors hover:text-[#2E7D9A]"
                      >
                        {supportPhone}
                      </a>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
