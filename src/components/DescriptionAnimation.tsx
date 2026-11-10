"use client";

import { motion } from "framer-motion";

const text = "Get used to Location-Free notepad.";

export default function DescriptionAnimation() {
  return (
    <div className="pointer-events-none flex h-12 w-full items-center justify-center text-center font-lobster text-2xl">
      <span className="sr-only">{text}</span>

      <span aria-hidden="true" className="inline-block whitespace-nowrap">
        {Array.from(text).map((char, index) => (
          <motion.span
            key={index}
            className="inline-block"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: (index + 1) * 0.07,
              duration: 0.18,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
    </div>
  );
}
