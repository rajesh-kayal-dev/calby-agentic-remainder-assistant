import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 transition-colors outline-none focus-visible:border-lime-400/50 focus-visible:ring-2 focus-visible:ring-lime-400/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
