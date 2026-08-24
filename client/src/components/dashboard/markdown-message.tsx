"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import Link from "next/link";

const styles = {
  root: "markdown-body min-w-0 max-w-full overflow-hidden text-[14px] leading-relaxed text-zinc-200 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 space-y-2.5",
  rootUser:
    "text-zinc-100 font-normal [&_a]:text-lime-300 [&_a]:underline",
  p: "leading-relaxed text-zinc-200 mb-2 last:mb-0",
  ul: "mb-2.5 list-none space-y-1.5 pl-0 last:mb-0",
  ol: "mb-2.5 list-decimal space-y-1.5 pl-5 last:mb-0 text-zinc-300",
  li: "relative pl-5 before:content-['•'] before:absolute before:left-1 before:text-lime-400 before:font-bold leading-relaxed text-zinc-300",
  strong: "font-semibold text-white tracking-tight",
  em: "italic text-zinc-300",
  codeBlock:
    "block overflow-x-auto rounded-xl bg-zinc-950/90 border border-zinc-800/80 p-3 text-[13px] font-mono leading-6 text-zinc-200 shadow-inner",
  codeInline:
    "rounded-md bg-zinc-800/80 border border-zinc-700/50 px-1.5 py-0.5 text-[12px] font-mono text-lime-400 font-medium",
  pre: "mb-3 max-w-full overflow-x-auto rounded-xl bg-zinc-950 border border-zinc-800/80 p-3.5 last:mb-0",
  h1: "mb-2.5 text-base font-semibold text-white tracking-tight",
  h2: "mb-2 text-sm font-semibold text-white tracking-tight",
  h3: "mb-1.5 text-xs font-semibold text-zinc-200 uppercase tracking-wider",
  blockquote:
    "my-2 rounded-r-xl border-l-2 border-lime-400 bg-lime-400/5 px-3.5 py-2 text-xs text-zinc-300 italic",
  table:
    "my-2 w-full border-collapse text-left text-xs text-zinc-300 overflow-hidden rounded-xl border border-zinc-800",
  th: "border-b border-zinc-800 bg-zinc-800/60 p-2.5 font-semibold text-white",
  td: "border-b border-zinc-800/50 p-2.5 text-zinc-300",
} as const;

type Props = {
  content: string;
  className?: string;
  tone?: "assistant" | "user" | "system";
};

export function MarkdownMessage({
  content,
  className,
  tone = "assistant",
}: Props) {
  return (
    <div
      className={cn(styles.root, tone === "user" && styles.rootUser, className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <Link
              href={href ?? "#"}
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2 transition-colors font-medium"
            >
              {children}
            </Link>
          ),
          p: ({ children }) => <p className={styles.p}>{children}</p>,
          ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
          li: ({ children }) => <li className={styles.li}>{children}</li>,
          strong: ({ children }) => (
            <strong className={styles.strong}>{children}</strong>
          ),
          em: ({ children }) => <em className={styles.em}>{children}</em>,
          code: ({ children, className: codeClassName }) => {
            const isBlock = Boolean(codeClassName);
            return (
              <code className={isBlock ? styles.codeBlock : styles.codeInline}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className={styles.pre}>{children}</pre>,
          h1: ({ children }) => <h3 className={styles.h1}>{children}</h3>,
          h2: ({ children }) => <h3 className={styles.h2}>{children}</h3>,
          h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className={styles.blockquote}>{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl border border-zinc-800 my-2">
              <table className={styles.table}>{children}</table>
            </div>
          ),
          th: ({ children }) => <th className={styles.th}>{children}</th>,
          td: ({ children }) => <td className={styles.td}>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
