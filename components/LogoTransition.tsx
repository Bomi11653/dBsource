"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

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
          <Image
            src="/brand/logo.png"
            alt="dBsource"
            width={200}
            height={80}
            className="h-16 w-auto object-contain"
            priority
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
