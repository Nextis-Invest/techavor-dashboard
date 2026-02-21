"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ProjectChatProps {
  intakeId: string
  currentUserEmail: string
  currentUserName: string
  senderType: "ADMIN" | "CLIENT"
  placeholder?: string
}

interface Message {
  id: string
  createdAt: string
  content: string
  senderType: "ADMIN" | "CLIENT"
  senderName: string | null
  senderEmail: string
  intakeId: string
  readAt: string | null
}

export function ProjectChat({
  intakeId,
  currentUserEmail,
  currentUserName,
  senderType,
  placeholder = "Écrivez un message...",
}: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?intakeId=${intakeId}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [intakeId])

  const markRead = useCallback(async () => {
    try {
      await fetch("/api/messages/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeId }),
      })
    } catch {
      // silent
    }
  }, [intakeId])

  useEffect(() => {
    fetchMessages()
    if (senderType === "ADMIN") {
      markRead()
    }
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages, markRead, senderType])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeId,
          content: trimmed,
          senderType,
          senderName: currentUserName,
          senderEmail: currentUserEmail,
        }),
      })
      setInput("")
      await fetchMessages()
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border rounded-lg flex flex-col overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto max-h-96 p-4 space-y-3 bg-muted/20">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div className="h-14 w-56 rounded-lg bg-muted animate-pulse" />
              </div>
            ))}
          </>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Aucun message pour l&apos;instant. Soyez le premier à écrire !
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderType === senderType
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.senderType === "ADMIN"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-xs font-medium opacity-70 mb-1">
                    {msg.senderName ?? msg.senderEmail}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-50 mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex gap-2 items-end bg-background">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className="resize-none flex-1 text-sm"
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          size="sm"
          className="shrink-0"
        >
          {sending ? "..." : "Envoyer"}
        </Button>
      </div>
    </div>
  )
}
