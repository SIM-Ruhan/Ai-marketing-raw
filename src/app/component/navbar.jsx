'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  HiHome,
  HiTag,
  HiInformationCircle,
  HiEnvelope,
  HiSquares2X2,
  HiArrowRightOnRectangle,
  HiBars3,
  HiXMark,
} from 'react-icons/hi2';
import { authClient } from '@/lib/auth-client';

/* --- Brand Logo --- */
const BrandLogo = () => (
  <svg
    className="w-9 h-9 shrink-0"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="navBlueGrad1"
        x1="0%"
        y1="100%"
        x2="100%"
        y2="0%"
      >
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="50%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>

      <linearGradient
        id="navBlueGrad2"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="60%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>

      <linearGradient
        id="navHighlight"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
      </linearGradient>
    </defs>

    <path
      d="M64 384C64 384 128 220 180 148C204 114 242 102 268 126C282 139 285 162 272 182C226 250 144 384 144 384H64Z"
      fill="url(#navBlueGrad1)"
    />

    <path
      d="M120 180L180 148C204 114 242 102 268 126C275 132 279 143 278 155C230 180 160 270 160 270L120 180Z"
      fill="url(#navHighlight)"
    />

    <path
      d="M192 384C192 384 236 260 264 212C284 178 320 168 344 192C358 206 360 228 346 248C316 294 272 384 272 384H192Z"
      fill="url(#navBlueGrad1)"
    />

    <path
      d="M264 384C264 384 310 240 356 180C386 142 432 140 456 172C476 198 476 238 460 274C436 328 392 384 376 384C352 384 340 356 360 326C380 296 408 248 408 248C408 248 392 232 376 248C360 264 332 320 312 360C302 380 284 396 264 384Z"
      fill="url(#navBlueGrad2)"
    />
  </svg>
);

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  // Close the user dropdown when clicking outside it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Hide the navbar on dashboard routes.
  if (pathname.includes('/dashboard')) {
    return null;
  }

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
          router.refresh();
        },
      },
    });
  };

  // Home is active on both "/" and "/home".
  const isHomeActive = pathname === '/' || pathname === '/home';

  const isActive = (path) => {
    if (path === '/') {
      return isHomeActive;
    }
    return pathname === path;
  };

  const getLinkClasses = (path) =>
    isActive(path)
      ? 'bg-blue-50 text-blue-600 font-semibold px-3.5 py-2 rounded-lg transition-all shadow-sm shadow-blue-500/5'
      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-3.5 py-2 rounded-lg font-medium transition-all';

  const dashboardHref = user?.role
    ? `/dashboard/${user.role}`
    : '/dashboard';

  return (
    <>
      {/* ================= DESKTOP / TOP NAVBAR ================= */}
      <nav className="relative z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-sm lg:sticky lg:top-0">
        <div className="max-w-[95%] mx-auto px-4">
          <div className="flex items-center justify-between py-4">

            {/* Brand / Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <BrandLogo />
              </div>

              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-gray-900 leading-none">
                  <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                    Ai-
                  </span>
                  Marketing
                </span>

                <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400 mt-1">
                  Ai powered Business Setup
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-2">
              <Link href="/" className={getLinkClasses('/')}>
                Home
              </Link>

              <Link href="/pricing" className={getLinkClasses('/pricing')}>
                Pricing
              </Link>

              <Link href="/about" className={getLinkClasses('/about')}>
                About
              </Link>

              <Link href="/contact" className={getLinkClasses('/contact')}>
                Contact
              </Link>
            </div>

            {/* Desktop Authentication */}
            <div className="hidden lg:flex items-center gap-4">
              {!isPending && !session ? (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>

                  <Link
                    href="/registration"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-blue-700 via-sky-600 to-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    Register
                  </Link>
                </>
              ) : session ? (
                <div className="flex items-center gap-4">
                  <Link
                    href={dashboardHref}
                    className={getLinkClasses('/dashboard')}
                  >
                    Dashboard
                  </Link>

                  {/* User Avatar and Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      aria-label="Open user menu"
                      aria-expanded={isDropdownOpen}
                      onClick={() =>
                        setIsDropdownOpen((previous) => !previous)
                      }
                      className="flex items-center gap-2 rounded-full ring-2 ring-blue-500/30 p-0.5 hover:ring-blue-600 transition-all focus:outline-none"
                    >
                      <Image
                        unoptimized
                        width={40}
                        height={40}
                        src={
                          user?.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`
                        }
                        alt={user?.name || 'Avatar'}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl py-2 border border-gray-100 z-50 animate-fadeIn">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {user?.name}
                          </p>

                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {user?.email}
                          </p>
                        </div>

                        <Link
                          href={dashboardHref}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
                        >
                          Dashboard
                        </Link>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden items-center">
              <button
                type="button"
                aria-label={
                  isMobileMenuOpen
                    ? 'Close navigation menu'
                    : 'Open navigation menu'
                }
                aria-expanded={isMobileMenuOpen}
                onClick={() =>
                  setIsMobileMenuOpen((previous) => !previous)
                }
                className="p-2 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <HiXMark className="h-7 w-7" />
                ) : (
                  <HiBars3 className="h-7 w-7" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ================= MOBILE DROPDOWN MENU ================= */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 shadow-lg">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={getLinkClasses('/')}
              >
                Home
              </Link>

              <Link
                href="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className={getLinkClasses('/pricing')}
              >
                Pricing
              </Link>

              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={getLinkClasses('/about')}
              >
                About
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={getLinkClasses('/contact')}
              >
                Contact
              </Link>

              <div className="my-2 border-t border-gray-100" />

              {!session ? (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Login
                  </Link>

                  <Link
                    href="/registration"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-700 text-white font-semibold shadow-md shadow-blue-500/20"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href={dashboardHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-semibold"
                  >
                    <Image
                      unoptimized
                      width={32}
                      height={32}
                      src={
                        user?.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`
                      }
                      alt={user?.name || 'Avatar'}
                      className="h-8 w-8 rounded-full object-cover"
                    />

                    <span>Dashboard</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ================= MOBILE FIXED BOTTOM NAVBAR ================= */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="grid grid-cols-5 py-1">

          {/* Home */}
          <Link
            href="/"
            aria-current={isHomeActive ? 'page' : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5"
          >
            <span
              className={`p-1.5 rounded-full ${
                isHomeActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <HiHome className="h-5 w-5" />
            </span>

            <span
              className={`text-[10px] ${
                isHomeActive
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-500'
              }`}
            >
              Home
            </span>
          </Link>

          {/* Pricing */}
          <Link
            href="/pricing"
            aria-current={pathname === '/pricing' ? 'page' : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5"
          >
            <span
              className={`p-1.5 rounded-full ${
                pathname === '/pricing'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <HiTag className="h-5 w-5" />
            </span>

            <span
              className={`text-[10px] ${
                pathname === '/pricing'
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-500'
              }`}
            >
              Pricing
            </span>
          </Link>

          {/* About */}
          <Link
            href="/about"
            aria-current={pathname === '/about' ? 'page' : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5"
          >
            <span
              className={`p-1.5 rounded-full ${
                pathname === '/about'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <HiInformationCircle className="h-5 w-5" />
            </span>

            <span
              className={`text-[10px] ${
                pathname === '/about'
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-500'
              }`}
            >
              About
            </span>
          </Link>

          {/* Contact */}
          <Link
            href="/contact"
            aria-current={pathname === '/contact' ? 'page' : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5"
          >
            <span
              className={`p-1.5 rounded-full ${
                pathname === '/contact'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <HiEnvelope className="h-5 w-5" />
            </span>

            <span
              className={`text-[10px] ${
                pathname === '/contact'
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-500'
              }`}
            >
              Contact
            </span>
          </Link>

          {/* Dashboard or Login */}
          {session ? (
            <Link
              href={dashboardHref}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-0.5 py-1.5"
            >
              <span
                className={`p-1.5 rounded-full ${
                  pathname.startsWith('/dashboard')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500'
                }`}
              >
                <HiSquares2X2 className="h-5 w-5" />
              </span>

              <span
                className={`text-[10px] ${
                  pathname.startsWith('/dashboard')
                    ? 'text-blue-600 font-bold'
                    : 'text-gray-500'
                }`}
              >
                Dashboard
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              aria-current={pathname === '/login' ? 'page' : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-0.5 py-1.5"
            >
              <span
                className={`p-1.5 rounded-full ${
                  pathname === '/login'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500'
                }`}
              >
                <HiArrowRightOnRectangle className="h-5 w-5" />
              </span>

              <span
                className={`text-[10px] ${
                  pathname === '/login'
                    ? 'text-blue-600 font-bold'
                    : 'text-gray-500'
                }`}
              >
                Login
              </span>
            </Link>
          )}

        </div>
      </div>
    </>
  );
};

export default Navbar;