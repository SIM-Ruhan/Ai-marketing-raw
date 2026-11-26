
import React from 'react';
const BrandLogo = () => (
  <svg
    className="w-8 h-8 shrink-0"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="loginBlueGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="50%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="loginBlueGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="60%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="loginHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M64 384C64 384 128 220 180 148C204 114 242 102 268 126C282 139 285 162 272 182C226 250 144 384 144 384H64Z"
      fill="url(#loginBlueGrad1)"
    />
    <path
      d="M120 180L180 148C204 114 242 102 268 126C275 132 279 143 278 155C230 180 160 270 160 270L120 180Z"
      fill="url(#loginHighlight)"
    />
    <path
      d="M192 384C192 384 236 260 264 212C284 178 320 168 344 192C358 206 360 228 346 248C316 294 272 384 272 384H192Z"
      fill="url(#loginBlueGrad1)"
    />
    <path
      d="M264 384C264 384 310 240 356 180C386 142 432 140 456 172C476 198 476 238 460 274C436 328 392 384 376 384C352 384 340 356 360 326C380 296 408 248 408 248C408 248 392 232 376 248C360 264 332 320 312 360C302 380 284 396 264 384Z"
      fill="url(#loginBlueGrad2)"
    />
  </svg>
);

export default BrandLogo;