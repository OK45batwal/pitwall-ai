import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger";

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles = {
    primary: "bg-electricBlue text-carbon shadow-glowBlue hover:bg-cyan-200",
    ghost: "border border-line bg-white/5 text-slate-200 hover:bg-white/10",
    danger: "bg-signalRed text-white shadow-glowRed hover:bg-red-400"
  };

  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition", styles[variant], className)}
      {...props}
    />
  );
}
