"use client"
import { useEffect, useState } from "react"

export function UnreadBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCount = () =>
      window.fetch("/api/messages/unread")
        .then(r => r.json())
        .then(d => setCount(d.count ?? 0))
        .catch(() => {})

    fetchCount()
    const interval = setInterval(fetchCount, 15000)
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null
  return (
    <span className="ml-auto bg-orange-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
      {count > 99 ? "99+" : count}
    </span>
  )
}
