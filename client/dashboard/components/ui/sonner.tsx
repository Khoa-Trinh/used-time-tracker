"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XOctagon,
  Loader2,
  Bell
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      hotkey={["alt", "t"]}
      expand={false}
      richColors
      closeButton
      icons={{
        success: <CheckCircle2 className="size-5 text-emerald-500" />,
        info: <Info className="size-5 text-blue-500" />,
        warning: <AlertTriangle className="size-5 text-amber-500" />,
        error: <XOctagon className="size-5 text-rose-500" />,
        loading: <Loader2 className="size-5 text-indigo-500 animate-spin" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "group !bg-card/85 !backdrop-blur-xl !border-border/50 !rounded-2xl !p-4 !shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3)] !flex !items-center !gap-3 !font-medium !text-sm !tracking-tight",
          title: "!text-foreground !font-bold !text-[14px]",
          description: "!text-muted-foreground !text-[12px] !font-medium !mt-0.5",
          actionButton: "group-hover:!bg-primary !bg-primary/90 !text-primary-foreground !rounded-xl !transition-all !duration-200",
          cancelButton: "!bg-muted !text-muted-foreground !rounded-xl !transition-all !duration-200",
          closeButton: "!bg-background/50 !backdrop-blur-sm !border-border/50 !opacity-0 group-hover:!opacity-100 !transition-all !duration-200",
          success: "!border-emerald-500/20 !bg-emerald-500/[0.03]",
          error: "!border-rose-500/20 !bg-rose-500/[0.03]",
          info: "!border-blue-500/20 !bg-blue-500/[0.03]",
          warning: "!border-amber-500/20 !bg-amber-500/[0.03]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

