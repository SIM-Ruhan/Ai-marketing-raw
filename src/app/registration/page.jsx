'use client';

import { Suspense, useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { GrGoogle } from "react-icons/gr";
import { FaMeta } from "react-icons/fa6";
import {
  BiCamera,
  BiLoaderAlt,
  BiShow,
  BiHide,
  BiUser,
  BiLock,
  BiEnvelope,
  BiPhone,
  BiMap,
  BiWorld,
  BiCheck,
  BiBarChartAlt2,
  BiShareAlt,
  BiChat,
} from "react-icons/bi";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

/* --- Exact Transparent Fluid Blue Ribbon Logo --- */
const BrandLogo = () => (
  <svg
    className="w-8 h-8 shrink-0"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="regBlueGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="50%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="regBlueGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="60%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="regHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M64 384C64 384 128 220 180 148C204 114 242 102 268 126C282 139 285 162 272 182C226 250 144 384 144 384H64Z"
      fill="url(#regBlueGrad1)"
    />
    <path
      d="M120 180L180 148C204 114 242 102 268 126C275 132 279 143 278 155C230 180 160 270 160 270L120 180Z"
      fill="url(#regHighlight)"
    />
    <path
      d="M192 384C192 384 236 260 264 212C284 178 320 168 344 192C358 206 360 228 346 248C316 294 272 384 272 384H192Z"
      fill="url(#regBlueGrad1)"
    />
    <path
      d="M264 384C264 384 310 240 356 180C386 142 432 140 456 172C476 198 476 238 460 274C436 328 392 384 376 384C352 384 340 356 360 326C380 296 408 248 408 248C408 248 392 232 376 248C360 264 332 320 312 360C302 380 284 396 264 384Z"
      fill="url(#regBlueGrad2)"
    />
  </svg>
);

const uploadToImgBB = async (file) => {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) throw new Error("ImgBB API key is missing.");

  const imgFormData = new FormData();
  imgFormData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: imgFormData,
  });

  const result = await response.json();
  if (result.success) return result.data.url;
  throw new Error("ImgBB Upload Failed");
};

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const fileInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const url = await uploadToImgBB(file);
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed. Please try again.");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const phone = e.target.phone.value;
    const addressLine = e.target.addressLine.value;
    const state = e.target.state.value;
    const country = e.target.country.value;

    if (uploading) {
      toast.info("Please wait for the image to finish uploading.");
      return;
    }

    setSubmitting(true);

    try {
      const formattedAddress = `${addressLine}, ${state}, ${country}`;

      const result = await authClient.signUp.email({
        name,
        email,
        password,
        image: imageUrl,
        phone,
        address: formattedAddress,
      });

      if (result?.error) {
        toast.error(result.error.message || "Registration failed");
        return;
      }

      await authClient.signOut();

      toast.success("Registration successful! Please login.");
      router.push("/login");

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      }).catch((err) => console.error("Welcome email failed to send:", err));
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
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
        provider: "facebook",
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
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-xl border border-blue-50 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        
        {/* --- LEFT COLUMN: Registration Form --- */}
        <div className="p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Logo & Brand Header */}
            <Link className="inline-flex items-center gap-2.5 group mb-6" href="/">
              <BrandLogo />
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                AI-<span className="text-blue-600">MarketOS</span>
              </span>
            </Link>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Create Your Account
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Start your AI-powered marketing journey today.
              </p>
            </div>

            {/* Avatar Profile Photo Upload */}
            <div className="flex flex-col items-center justify-center mb-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full group focus:outline-none"
                aria-label="Upload profile photo"
              >
                <div
                  className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                    imagePreview ? "border-transparent" : "border-blue-200 bg-blue-50/50 group-hover:border-blue-400 group-hover:bg-blue-100/50"
                  }`}
                >
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BiUser className="text-3xl text-blue-400" />
                  )}
                </div>

                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white">
                  {uploading ? (
                    <BiLoaderAlt className="animate-spin text-xs" />
                  ) : (
                    <BiCamera className="text-xs" />
                  )}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {uploading && (
                <p className="text-xs text-blue-600 mt-1 font-medium">Uploading photo…</p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <BiUser className="text-lg" />
                  </span>
                  <input
                    required
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Email address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <BiLock className="text-lg" />
                  </span>
                  <input
                    required
                    minLength={6}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
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

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <BiPhone className="text-lg" />
                  </span>
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Contact Address Section */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Street Address
                </label>
                <div className="relative mb-3">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <BiMap className="text-lg" />
                  </span>
                  <input
                    required
                    name="addressLine"
                    type="text"
                    placeholder="123 Business Street, Suite 100"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State / Division</label>
                    <input
                      required
                      name="state"
                      type="text"
                      placeholder="California"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <BiWorld className="text-base" />
                      </span>
                      <input
                        required
                        name="country"
                        type="text"
                        placeholder="United States"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-lg" /> Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </button>

                <button
                  type="reset"
                  onClick={() => {
                    setImagePreview(null);
                    setImageUrl("");
                  }}
                  className="py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all"
                >
                  Reset
                </button>
              </div>
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
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <GrGoogle className="text-lg text-red-500" />
                Continue with Google
              </button>

              <button
                type="button"
                onClick={handleMetaLogin}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <FaMeta className="text-xl text-blue-600" />
                Continue with Meta
              </button>
            </div>
          </div>

          {/* Footer prompt */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Already registered?{" "}
            <Link className="text-blue-600 font-semibold hover:text-blue-700 transition-colors" href="/login">
              Sign in
            </Link>
          </p>
        </div>

        {/* --- RIGHT COLUMN: Feature Showcase --- */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-sky-50/80 p-12 border-l border-blue-100/60 relative overflow-hidden">
          
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-sky-200/30 blur-3xl pointer-events-none" />

          {/* Graphic Box */}
          <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/80 my-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <BiBarChartAlt2 className="text-blue-600 text-xl" />
            </div>

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
                <BiShareAlt className="text-sky-600 text-2xl" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-2 w-3/4 bg-blue-100 rounded-full" />
              <div className="h-2 w-1/2 bg-blue-200 rounded-full" />
            </div>
          </div>

          {/* Checklist */}
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
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F4F8FB] text-gray-500 font-medium">
          Loading registration...
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}