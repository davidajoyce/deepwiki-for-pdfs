'use client'

import { ReactNode } from 'react'

interface SplitPanelProps {
  children: ReactNode
}

export default function SplitPanel({ children }: SplitPanelProps) {
  const childArray = Array.isArray(children) ? children : [children]
  
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
      {childArray.map((child, index) => (
        <div 
          key={index}
          className="overflow-auto scrollbar-hide"
          style={{ maxHeight: 'calc(100vh - 14rem)' }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}