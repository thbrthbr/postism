'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="test">
      <button onClick={() => setTheme('light')}>라이트</button>
      <button onClick={() => setTheme('dark')}>다크</button>
    </div>
  )
}
