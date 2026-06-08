"use client";

import BrandLogo from "@/components/BrandLogo";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  show: boolean;
}

export default function LogoTransition({ show }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
        >
          <BrandLogo variant="transition" priority />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
