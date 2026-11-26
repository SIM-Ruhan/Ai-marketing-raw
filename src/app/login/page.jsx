'use client';

import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { GrGoogle } from "react-icons/gr";
import { FaMeta } from "react-icons/fa6";
import { 
  BiLoaderAlt, 
  BiShow, 
  BiHide, 
  BiLock, 
  BiEnvelope, 
  BiErrorCircle, 
  BiX, 
  BiCheck,
  BiBarChartAlt2,
  BiShareAlt,
  BiCog,
  BiChat
} from "react-icons/bi";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import BrandLogo from "../component/brandLogo";

/* --- Exact Transparent Fluid Blue Ribbon Logo --- */


function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    const email = e.target.email.value;
    const password = e.target.password.value;

    setSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result?.error) {
        const message =
          result.error.message || "Invalid email or password. Please try again.";
        setLoginError(message);
        toast.error(message);
        return;
      }
      toast.success("Login successful!");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error(err);
      const message = "Something went wrong. Please try again.";
      setLoginError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
      if (result?.error) {
        toast.error(result.error.message || "Google login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Google login failed.");
    }
  };

  const handleMetaLogin = async () => {
    try {
      const result = await authClient.signIn.social({
        provider: "facebook", // or "meta" depending on your auth provider setup
        callbackURL: redirectTo,
      });
      if (result?.error) {
        toast.error(result.error.message || "Meta login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Meta login failed.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F8FB] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl border border-blue-50 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        
        {/* --- LEFT COLUMN: Login Form --- */}
        <div className="p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Logo & Brand */}
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-8">
              <BrandLogo />
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                <span className="text-blue-600">AI-</span>Marketing
              </span>
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Sign in to your account to continue
              </p>
            </div>

            {/* Error Alert */}
            {loginError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 animate-shake-in"
              >
                <BiErrorCircle className="text-xl text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 flex-1">{loginError}</p>
                <button
                  type="button"
                  onClick={() => setLoginError("")}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <BiX className="text-lg" />
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <BiEnvelope className="text-lg" />
                  </span>
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  {/* <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forget password?
                  </Link> */}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <BiLock className="text-lg" />
                  </span>
                  <input
                    required
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <BiHide className="text-lg" /> : <BiShow className="text-lg" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <BiLoaderAlt className="animate-spin text-lg" /> Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <span className="relative bg-white px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Or continue with
              </span>
            </div>

            {/* Social Logins */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <GrGoogle className="text-lg text-red-500" />
                Continue with Google
              </button>

              {/* <button
                type="button"
                onClick={handleMetaLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <FaMeta className="text-xl text-blue-600" />
                Continue with Meta
              </button> */}
            </div>
          </div>

          {/* Footer prompt */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/registration"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* --- RIGHT COLUMN: Smarter Marketing Feature Showcase --- */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-sky-50/80 p-8 border-l border-blue-100/60 relative overflow-hidden">
          
          {/* Decorative background blur shapes */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-sky-200/30 blur-3xl pointer-events-none" />

          {/* Illustration / Graphic Box */}
          <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/80 my-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <BiBarChartAlt2 className="text-blue-600 text-xl" />
            </div>

            {/* Floating floating mini badges like in screenshot */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-center shadow-sm">
                <FaMeta className="text-blue-600 text-2xl" />
              </div>
              <div className="bg-red-50 rounded-xl p-3 flex items-center justify-center shadow-sm">
                <GrGoogle className="text-red-500 text-xl" />
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 flex items-center justify-center shadow-sm">
                <BiChat className="text-emerald-600 text-2xl" />
              </div>
              <div className="bg-sky-50 rounded-xl p-3 flex items-center justify-center shadow-sm">
                <BiShareAlt className="text-sky-600 text-xl" />
              </div>
            </div>

            {/* Mock Chart Bar Lines */}
            <div className="space-y-2">
              <div className="h-2 w-3/4 bg-blue-100 rounded-full" />
              <div className="h-2 w-1/2 bg-blue-200 rounded-full" />
            </div>
          </div>

          {/* Value Proposition text & Checklist */}
          <div className="relative z-10 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Smarter Marketing. Higher Sales.
            </h2>
            
            <ul className="mt-6 space-y-4">
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                  <BiCheck className="text-sm font-bold" />
                </span>
                AI Brand Audit &amp; Strategy
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                  <BiCheck className="text-sm font-bold" />
                </span>
                Multi-Channel Campaigns
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                  <BiCheck className="text-sm font-bold" />
                </span>
                CRM &amp; Sales Automation
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                  <BiCheck className="text-sm font-bold" />
                </span>
                Advanced Analytics
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                  <BiCheck className="text-sm font-bold" />
                </span>
                Integrations &amp; More
              </li>
            </ul>
          </div>

        </div>

      </div>

      <style jsx global>{`
        @keyframes shake-in {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        .animate-shake-in {
          animation: shake-in 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F4F8FB] text-gray-500 font-medium">
          Loading login...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}