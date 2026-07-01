/**
 * NotificationBell — bell icon + unseen badge + tap-to-open list.
 *
 * Drop this into any header. Ringing is handled by the parent's
 * useNotifications({ loopBell: true }) — the bell just VISUALLY pulses
 * while `ringing` is true and lets the user dismiss.
 */
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Bell, X } from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { colors, radius } from "@/src/theme";
import type { NotificationRow } from "@/src/hooks/useNotifications";

export function NotificationBell({
  list,
  unseen,
  ringing,
  onMarkSeen,
  onMarkAllSeen,
  onStopRing,
  color = "#111",
  title = "Notifications",
}: {
  list: NotificationRow[];
  unseen: number;
  ringing: boolean;
  onMarkSeen: (id: string) => void;
  onMarkAllSeen: () => void;
  onStopRing?: () => void;
  color?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          setOpen(true);
          onStopRing?.();
        }}
        style={styles.bellBtn}
        hitSlop={10}
      >
        <View style={ringing ? styles.pulse : undefined}>
          <Bell size={22} color={color} />
        </View>
        {unseen > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unseen > 99 ? "99+" : unseen}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title}</Text>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                {unseen > 0 ? (
                  <TouchableOpacity onPress={onMarkAllSeen}>
                    <Text style={styles.markAllLink}>Mark all read</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                  <X size={20} color="#111" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ padding: 12, gap: 8 }}>
              {list.length === 0 ? (
                <View style={styles.empty}>
                  <Bell size={28} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
              ) : (
                list.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => onMarkSeen(n.id)}
                    style={[styles.item, !n.seen && styles.itemUnseen]}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.itemTitle}>{n.title}</Text>
                      {n.body ? <Text style={styles.itemBody}>{n.body}</Text> : null}
                      <Text style={styles.itemTime}>
                        {(() => {
                          try {
                            return formatDistanceToNow(new Date(n.created_at), { addSuffix: true });
                          } catch {
                            return "just now";
                          }
                        })()}
                      </Text>
                    </View>
                    {!n.seen ? <View style={styles.unseenDot} /> : null}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.85)",
    position: "relative",
  },
  pulse: {
    // Subtle wiggle-lite feel using ring shadow; keeps 60fps on web.
    shadowColor: colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-start",
    padding: 12,
  },
  sheet: {
    marginTop: 60,
    alignSelf: "flex-end",
    width: 340,
    maxWidth: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: colors.textMain },
  markAllLink: { fontSize: 12, color: colors.primary, fontWeight: "700" },

  empty: { alignItems: "center", padding: 40, gap: 8 },
  emptyText: { color: "#6B7280", fontSize: 13 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  itemUnseen: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  itemTitle: { fontSize: 13, fontWeight: "700", color: colors.textMain },
  itemBody: { fontSize: 12, color: "#4B5563" },
  itemTime: { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
  unseenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
});
