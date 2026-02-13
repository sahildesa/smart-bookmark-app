"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface Bookmark {
  id: string
  title: string
  url: string
  created_at: string
}

interface BookmarkListProps {
  userId: string
}

export default function BookmarkList({ userId }: BookmarkListProps) {
  const supabase = createClient()

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // -----------------------------
  // Fetch + Realtime
  // -----------------------------
  useEffect(() => {
    let channel: RealtimeChannel

    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (!error) setBookmarks(data || [])
      else console.error(error)

      setLoading(false)
    }

    fetchBookmarks()

    channel = supabase
      .channel("bookmarks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => [
              payload.new as Bookmark,
              ...prev,
            ])
          }

          if (payload.eventType === "DELETE") {
            setBookmarks((prev) =>
              prev.filter((b) => b.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // -----------------------------
  // Delete Handler
  // -----------------------------
  const handleDelete = async (id: string) => {
    setDeletingId(id)

    // Optimistic UI
    setBookmarks((prev) => prev.filter((b) => b.id !== id))

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)

    if (error) {
      console.error(error)
      alert("Failed to delete bookmark")

      // Rollback
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      setBookmarks(data || [])
    }

    setDeletingId(null)
  }

  // -----------------------------
  // UI
  // -----------------------------
  if (loading) {
    return (
      <p className="text-center text-gray-500 py-8">
        Loading bookmarks...
      </p>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        No bookmarks yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">
              {bookmark.title}
            </h3>

            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:underline block truncate"
            >
              {bookmark.url}
            </a>

            <p className="text-xs text-gray-500 mt-1">
              Added{" "}
              {new Date(
                bookmark.created_at
              ).toLocaleDateString()}
            </p>
          </div>

          <button
            disabled={deletingId === bookmark.id}
            onClick={() => handleDelete(bookmark.id)}
            className="ml-4 text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
          >
            {deletingId === bookmark.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      ))}
    </div>
  )
}
