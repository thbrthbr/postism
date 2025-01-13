"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function DescriptionAnimation() {
  const text = `Get used to Location-Free notepad.`;
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    let newText = "";
    const interval = setInterval(() => {
      newText += text[index];
      setDisplayText(newText);
      index += 1;
      if (index === text.length) {
        clearInterval(interval);
      }
    }, 70); // 타이핑 속도 (밀리초)
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-12 w-[375px] items-center justify-center text-center font-lobster text-2xl">
      {displayText.split("").map((char, index) => {
        return (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        );
      })}
    </div>
  );
}
