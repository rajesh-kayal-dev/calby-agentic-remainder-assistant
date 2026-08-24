"use client";

export function GoogleCalendarLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="4" width="18" height="17" rx="3" fill="#ffffff" />
      <path
        d="M19 4H5C3.89543 4 3 4.89543 3 6V9H21V6C21 4.89543 20.1046 4 19 4Z"
        fill="#EA4335"
      />
      <path d="M3 9H9V21H5C3.89543 21 3 20.1046 3 19V9Z" fill="#4285F4" />
      <path d="M9 9H15V21H9V9Z" fill="#34A853" />
      <path d="M15 9H21V19C21 20.1046 20.1046 21 19 21H15V9Z" fill="#FBBC04" />
      <rect x="7" y="12" width="10" height="6" rx="1.5" fill="#ffffff" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fill="#1a73e8"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        31
      </text>
    </svg>
  );
}
