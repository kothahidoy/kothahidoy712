/**
 * useNotifications — subscribes to the Supabase `notifications` table
 * for a given (target_type, target_id) tuple, keeps an ordered list,
 * exposes an unseen count, and rings a bell loop while there are
 * unseen notifications.
 *
 * Usage:
 *   const notif = useNotifications({ targetType: "admin" });   // admins: broadcast
 *   const notif = useNotifications({ targetType: "provider", targetId });
 *   const notif = useNotifications({ targetType: "customer", targetId });
 *
 * Exports: { list, unseen, markSeen, markAllSeen, acknowledgeLatest, ring, ringing }
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/src/lib/supabase";
import {
  playBell,
  startBellLoop,
  stopBellLoop,
  isBellLooping,
  primeAudioContext,
} from "@/src/lib/bell";

export type NotificationRow = {
  id: string;
  target_type: "customer" | "admin" | "provider";
  target_id: string | null;
  booking_id: string | null;
  kind: string;
  title: string;
  body: string;
  seen: boolean;
  acknowledged: boolean;
  data: Record<string, any> | null;
  created_at: string;
};

type Args = {
  targetType: "customer" | "admin" | "provider";
  targetId?: string | null;
  /** When true, ring the bell in a loop while unseen notifications exist. */
  loopBell?: boolean;
  /** When true, silent chime once on new notification (no loop). */
  chimeOnce?: boolean;
};

export function useNotifications({
  targetType,
  targetId,
  loopBell = false,
  chimeOnce = false,
}: Args) {
  const [list, setList] = useState<NotificationRow[]>([]);
  const [ringing, setRinging] = useState<boolean>(false);
  const initialLoadDoneRef = useRef(false);

  // ── Load existing notifications on mount ────────────────
  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    let q = supabase
      .from("notifications")
      .select("*")
      .eq("target_type", targetType)
      .order("created_at", { ascending: false })
      .limit(50);
    if (targetType !== "admin" && targetId) {
      q = q.eq("target_id", targetId);
    }
    const { data, error } = await q;
    if (!error && data) {
      setList(data as NotificationRow[]);
      initialLoadDoneRef.current = true;
    }
  }, [targetType, targetId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Realtime subscription ───────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Filter server-side by target_type; target_id filtering happens
    // client-side (realtime filter syntax only accepts eq on one col).
    const channel = supabase
      .channel(`notif:${targetType}:${targetId || "any"}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (row.target_type !== targetType) return;
          if (targetType !== "admin" && targetId && row.target_id !== targetId) return;
          setList((prev) => [row, ...prev].slice(0, 50));

          // Sound: skip the initial hydration burst.
          if (!initialLoadDoneRef.current) return;
          if (chimeOnce) {
            primeAudioContext();
            playBell();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (row.target_type !== targetType) return;
          if (targetType !== "admin" && targetId && row.target_id !== targetId) return;
          setList((prev) => prev.map((n) => (n.id === row.id ? row : n)));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetType, targetId, chimeOnce]);

  // ── Bell loop while there are unacknowledged critical notifs ────
  const shouldLoop = useMemo(() => {
    if (!loopBell) return false;
    // Loop while any unseen (admin) OR any unacknowledged 'assigned' (provider)
    if (targetType === "admin") {
      return list.some((n) => !n.seen);
    }
    if (targetType === "provider") {
      return list.some((n) => n.kind === "assigned" && !n.acknowledged);
    }
    return false;
  }, [list, loopBell, targetType]);

  useEffect(() => {
    if (shouldLoop) {
      primeAudioContext();
      startBellLoop();
      setRinging(true);
    } else {
      stopBellLoop();
      setRinging(false);
    }
    return () => {
      stopBellLoop();
    };
  }, [shouldLoop]);

  // ── Mutations ────────────────────────────────────────────
  const markSeen = useCallback(async (id: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from("notifications").update({ seen: true }).eq("id", id);
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, seen: true } : n)));
  }, []);

  const markAllSeen = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const ids = list.filter((n) => !n.seen).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").update({ seen: true }).in("id", ids);
    setList((prev) => prev.map((n) => ({ ...n, seen: true })));
  }, [list]);

  /** Provider "Ready to accept" — marks the latest assigned notification. */
  const acknowledgeLatest = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const latest = list.find((n) => n.kind === "assigned" && !n.acknowledged);
    if (!latest) return;
    await supabase
      .from("notifications")
      .update({ acknowledged: true, seen: true })
      .eq("id", latest.id);
    setList((prev) =>
      prev.map((n) =>
        n.id === latest.id ? { ...n, acknowledged: true, seen: true } : n,
      ),
    );
  }, [list]);

  const unseen = useMemo(() => list.filter((n) => !n.seen).length, [list]);

  return {
    list,
    unseen,
    ringing,
    markSeen,
    markAllSeen,
    acknowledgeLatest,
    reload,
    stopRing: () => {
      stopBellLoop();
      setRinging(false);
    },
    isBellLooping,
  };
}
