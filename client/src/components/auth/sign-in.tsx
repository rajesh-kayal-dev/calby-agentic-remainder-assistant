"use client";

import { useEffect, useRef } from "react";
import { Descope } from "@descope/nextjs-sdk";
import { useRouter } from "next/navigation";

const customDescopeBlueStyles = `
  :host, :host * {
    --descope-link-color: #1a73e8 !important;
    --descope-link-text-color: #1a73e8 !important;
    --descope-text-link-color: #1a73e8 !important;
  }

  a, descope-text-link, [class*="link"] {
    color: #1a73e8 !important;
    text-decoration: none !important;
  }

  a:hover, descope-text-link:hover, [class*="link"]:hover {
    text-decoration: underline !important;
  }
`;

function SignInComponent() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyStyles = () => {
      if (!containerRef.current) return;

      const injectToShadow = (parent: Node) => {
        if (!parent) return;
        if (parent instanceof Element) {
          const el = parent as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          if (typeof el.style?.setProperty === "function") {
            el.style.setProperty("--descope-link-color", "#1a73e8");
            el.style.setProperty("--descope-text-link-color", "#1a73e8");
          }

          // Directly style links inside shadow root to match Continue button blue (#1a73e8)
          if (tagName === "descope-text-link" && el.shadowRoot) {
            const innerLink = el.shadowRoot.querySelector("a");
            if (innerLink) {
              innerLink.style.setProperty("color", "#1a73e8", "important");
            }
          }

          if (el.shadowRoot) {
            let styleTag = el.shadowRoot.querySelector("#calby-descope-blue-override");
            if (!styleTag) {
              styleTag = document.createElement("style");
              styleTag.id = "calby-descope-blue-override";
              styleTag.textContent = customDescopeBlueStyles;
              el.shadowRoot.appendChild(styleTag);
            } else {
              styleTag.textContent = customDescopeBlueStyles;
            }
            injectToShadow(el.shadowRoot);
          }
          el.childNodes.forEach((child) => injectToShadow(child));
        } else if (parent instanceof ShadowRoot || parent instanceof DocumentFragment) {
          parent.childNodes.forEach((child) => injectToShadow(child));
        }
      };

      injectToShadow(containerRef.current);
    };

    applyStyles();
    const interval = setInterval(applyStyles, 250);
    return () => clearInterval(interval);
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
