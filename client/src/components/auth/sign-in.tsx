"use client";

import { useEffect, useRef } from "react";
import { Descope } from "@descope/nextjs-sdk";
import { useRouter } from "next/navigation";

const customDescopeDarkStyles = `
  :host, .descope-container, .descope-card, [class*="container"], [class*="card"], [class*="screen"], [class*="wrapper"] {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
    color: #f4f4f5 !important;
  }

  h1, h2, h3, h4, h5, h6, p, span, label, [class*="text"], [class*="title"], [class*="subtitle"], [class*="label"] {
    color: #f4f4f5 !important;
  }

  input, [class*="input"], [class*="text-input"] {
    background-color: #18181b !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 0.75rem !important;
    padding: 0.75rem 1rem !important;
  }

  input:focus, [class*="input"]:focus {
    border-color: #a3e635 !important;
    outline: none !important;
    box-shadow: 0 0 0 2px rgba(163, 230, 53, 0.25) !important;
  }

  button[type="submit"], [class*="primary-button"], button.primary, [data-id="submit"], button:not([class*="social"]):not([class*="secondary"]) {
    background-color: #a3e635 !important;
    color: #09090b !important;
    font-weight: 600 !important;
    border-radius: 9999px !important;
    border: none !important;
    box-shadow: 0 0 20px rgba(163, 230, 53, 0.25) !important;
    transition: all 0.2s ease !important;
  }

  button[type="submit"]:hover, [class*="primary-button"]:hover {
    background-color: #bef264 !important;
    box-shadow: 0 0 25px rgba(163, 230, 53, 0.4) !important;
  }

  [class*="social-button"], [class*="secondary-button"], button.secondary, [data-id*="google"] {
    background-color: #18181b !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 9999px !important;
    transition: all 0.2s ease !important;
  }

  [class*="social-button"]:hover, [class*="secondary-button"]:hover {
    background-color: #27272a !important;
    border-color: rgba(255, 255, 255, 0.25) !important;
  }

  [class*="divider"], hr {
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  a, [class*="link"] {
    color: #a3e635 !important;
    text-decoration: none !important;
  }
  
  a:hover, [class*="link"]:hover {
    text-decoration: underline !important;
  }
`;

function SignInComponent() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyStyles = () => {
      if (!containerRef.current) return;
      const descopeElement = containerRef.current.querySelector("descope-wc");
      if (descopeElement && descopeElement.shadowRoot) {
        let styleTag = descopeElement.shadowRoot.querySelector("#calby-custom-descope-style");
        if (!styleTag) {
          styleTag = document.createElement("style");
          styleTag.id = "calby-custom-descope-style";
          styleTag.textContent = customDescopeDarkStyles;
          descopeElement.shadowRoot.appendChild(styleTag);
        }
      }
    };

    applyStyles();
    const interval = setInterval(applyStyles, 250);

    const observer = new MutationObserver(() => {
      applyStyles();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="descope-wrap">
      <Descope
        flowId="sign-up-or-in"
        theme="dark"
        autoFocus="skipFirstScreen"
        redirectAfterSuccess="/dashboard"
        onSuccess={() => router.replace("/dashboard")}
        onError={(event) => console.error("sign in failed", event.detail)}
      />
    </div>
  );
}

export default SignInComponent;
