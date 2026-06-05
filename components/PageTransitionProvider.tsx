"use client";

import LogoTransition from "@/components/LogoTransition";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface TransitionContextValue {
  navigateWithTransition: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function usePageTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error("usePageTransition must be used within PageTransitionProvider");
  }
  return ctx;
}

export default function PageTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  const navigateWithTransition = useCallback(
    (href: string) => {
      setShow(true);
      window.setTimeout(() => {
        router.push(href);
        window.setTimeout(() => setShow(false), 350);
      }, 420);
    },
    [router]
  );

  return (
    <TransitionContext.Provider value={{ navigateWithTransition }}>
      <LogoTransition show={show} />
      {children}
    </TransitionContext.Provider>
  );
}
