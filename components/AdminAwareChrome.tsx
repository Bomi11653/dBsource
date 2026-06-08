"use client";

import AiAdvisor from "@/components/AiAdvisor";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";

export default function AdminAwareChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <AiAdvisor />
    </>
  );
}
