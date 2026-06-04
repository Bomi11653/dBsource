"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";

/** 路由切换后页面内容淡入 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFirst = useRef(true);

  if (isFirst.current) {
    isFirst.current = false;
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}
