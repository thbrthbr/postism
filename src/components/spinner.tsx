'use client'

import { motion } from 'framer-motion'

export default function Spinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <motion.div
        style={{
          width: 0,
          height: 0,
          borderLeft: '100px solid transparent',
          borderRight: '100px solid transparent',
          borderBottom: '100px solid #FFFFFF',
        }}
        animate={{
          scale: [0.5],
          rotateX: [0, 180, 180, 0, 0],
          rotateY: [0, 0, 180, 180, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: 'loop',
          times: [0, 0.25, 0.5, 1],
        }}
      />
    </div>
  )
}
