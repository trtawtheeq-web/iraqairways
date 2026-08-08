import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  variant?: "default" | "al-rajhi" | "al-ahli" | "al-awwal" | "nafath" | "filled";
  className?: string;
}

const variantStyles = {
  default: "bg-gradient-to-b from-gray-50 to-gray-100",
  "al-rajhi": "bg-gradient-to-b from-[#004d7a] to-[#003d5c]",
  "al-ahli": "bg-gradient-to-b from-[#006747] to-[#004d35]",
  "al-awwal": "bg-gradient-to-b from-[#1a1a2e] to-[#16213e]",
  nafath: "bg-gradient-to-b from-[#1a5f4a] to-[#134436]",
  filled: "bg-gradient-to-b from-[#201ac8] to-[#1a15a0]",
};

export default function PageLayout({
  children,
  variant = "default",
  className,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen flex flex-col items-center justify-center p-4",
        variantStyles[variant],
        className
      )}
      dir="rtl"
    >
      <div className="w-full max-w-md mx-auto">{children}</div>
    </div>
  );
}
