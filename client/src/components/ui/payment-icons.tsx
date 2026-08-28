"use client";

import React from "react";

/**
 * Authentic Visa Logo SVG
 */
export function VisaLogoSVG({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 32" className={`shrink-0 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M34.8 2.2L22.9 29.8H15.1L8.9 7.7C8.4 5.9 7.9 5.2 6.5 4.5C4.2 3.3 0 2.2 0 2.2L0.2 1.3H12.8C14.4 1.3 15.8 2.5 16.1 4.3L19.2 20.6L27.1 1.3H34.8V2.2ZM65.3 20.3C65.3 12.5 54.6 12.1 54.6 8.7C54.6 7.5 55.7 6.3 58.1 6C59.3 5.9 62.7 5.7 66.2 7.3L67.7 1.9C65.7 1.2 62.9 0.5 59.4 0.5C52.2 0.5 47 4.3 47 9.8C47 13.9 50.7 16.2 53.5 17.6C56.4 19 57.4 19.9 57.4 21.2C57.4 23.1 55.1 24 52.9 24C49.2 24 47.1 22.9 45.4 22.1L43.8 27.8C45.8 28.7 49.3 29.5 53 29.5C60.7 29.5 65.3 25.7 65.3 20.3ZM84.4 29.8H91.1L85.2 1.3H79C77.4 1.3 76.1 2.2 75.5 3.7L64.5 29.8H72.4L74 25.4H83.7L84.4 29.8ZM76.2 19.3L80.2 8.3L82.5 19.3H76.2ZM45.6 1.3L39.4 29.8H32L38.2 1.3H45.6Z"
        fill="#1434CB"
      />
      <path
        d="M6.5 4.5C4.2 3.3 0 2.2 0 2.2L0.2 1.3H12.8C14.4 1.3 15.8 2.5 16.1 4.3L19.2 20.6L8.9 7.7C8.4 5.9 7.9 5.2 6.5 4.5Z"
        fill="#F7B600"
      />
    </svg>
  );
}

/**
 * Authentic Mastercard Logo SVG
 */
export function MastercardLogoSVG({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={`shrink-0 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="60" rx="6" fill="#141416" />
      <circle cx="38" cy="30" r="20" fill="#EB001B" />
      <circle cx="62" cy="30" r="20" fill="#F79E1B" />
      <path
        d="M50 14.1A19.9 19.9 0 0 1 57.7 30A19.9 19.9 0 0 1 50 45.9A19.9 19.9 0 0 1 42.3 30A19.9 19.9 0 0 1 50 14.1Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

/**
 * Authentic UPI (Unified Payments Interface) Logo SVG
 */
export function UPILogoSVG({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" className={`shrink-0 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8L3.5 28.5H11.5L16.2 18.5H23.5L18.8 28.5H26.8L37.3 8H29.3L24.6 18H17.3L22 8H14Z" fill="#F47920" />
      <path d="M40 8L31.5 28.5H39.5L42.8 20.5H53C56.5 20.5 59 18.5 60 14.5C61 10.5 58.5 8 55 8H40ZM48 15.5H45L46.5 12H49.5C50.5 12 51.5 12.5 51 13.5C50.5 14.5 49.5 15.5 48.5 15.5H48Z" fill="#0F783C" />
      <path d="M62 8L53.5 28.5H61.5L70 8H62Z" fill="#F47920" />
      <path d="M78 8L74 16H84L80 24H70L68 28.5H88L96 8H78Z" fill="#0F783C" />
      <path d="M98 8L93.5 18H104.5L100 28.5H108L117 8H98Z" fill="#F47920" />
    </svg>
  );
}

/**
 * Authentic RuPay Logo SVG
 */
export function RuPayLogoSVG({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 32" className={`shrink-0 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 4H22C27 4 30 7 30 11.5C30 16 26.5 18.5 22 18.5H16V28H9V4ZM16 13H21.5C23 13 24 12.3 24 11C24 9.7 23 9 21.5 9H16V13Z" fill="#00A3E0" />
      <path d="M32 14.5H38.5V16C39.5 14.8 41.5 14 43.5 14C47.5 14 49.5 16.5 49.5 21V28H43V21.5C43 19.8 42 19 40.5 19C39 19 38.5 20 38.5 21.5V28H32V14.5Z" fill="#FFFFFF" />
      <path d="M51 14.5H57.5V16.8C58.8 15 61 14 63.5 14C68.5 14 71.5 18 71.5 23.5C71.5 29 68.5 33 63.5 33C61 33 58.8 32 57.5 30.2V36H51V14.5ZM64.5 23.5C64.5 20.8 63.2 18.8 61 18.8C58.8 18.8 57.5 20.8 57.5 23.5C57.5 26.2 58.8 28.2 61 28.2C63.2 28.2 64.5 26.2 64.5 23.5Z" fill="#FFFFFF" />
      <path d="M85 28L83 24.5H74.5L72.5 28H66L75.5 11.5H82L91.5 28H85ZM78.7 17L76 21.5H81.4L78.7 17Z" fill="#F47920" />
      <path d="M92 14.5H99L103.5 23.5L108 14.5H115L107 28.5L102 36H95.5L99.5 30L92 14.5Z" fill="#F47920" />
    </svg>
  );
}
