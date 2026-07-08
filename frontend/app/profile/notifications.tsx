import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, BellOff } from "lucide-react-native";

import { useSession } from "@/src/context/SessionContext";
import { useNotifications, NotificationRow } from "@/src/hooks/useNotifications";
import { dataService } from "@/src/data/service";
import { colors } from "@/src/theme";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { profile } = useSession();
  const [userId, setUserId] = useState<string | null>(profile?.id || null);

  useEffect(() => {
    if (userId) return;
    (async () => {
      const p = await dataService.getProfile();
      if (p?.id) setUserId(p.id);
    })();
  }, [userId]);

  const { list, markSeen, markAllSeen, reload } = useNotifications({
    targetType: "customer",
    targetId: userId,
  });

  const renderItem = ({ item }: { item: NotificationRow }) => (
    <TouchableOpacity
      style={[styles.card, !item.seen && styles.cardUnseen]}
      activeOpacity={0.8}
      onPress={() => !item.seen && markSeen(item.id)}
    >
      <View style={styles.iconWrap}>
        {item.seen ? <BellOff size={16} color={colors.textMuted} /> : <Bell size={16} color={colors.primary} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardBody} numberOfLines={3}>
          {item.body}
        </Text>
        <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
      </View>
      {!item.seen && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {list.some((n) => !n.seen) ? (
          <TouchableOpacity onPress={() => markAllSeen()}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      {!userId ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={reload}
          refreshing={false}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Bell size={40} color={colors.textSubtle} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Updates about your bookings will show up here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.textMain },
  markAll: { fontSize: 13, fontWeight: "600", color: colors.primary },
  listContent: { padding: 16, flexGrow: 1 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain, marginTop: 14 },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: 6 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardUnseen: { backgroundColor: "#F5F3FF", borderColor: "#EDE9FE" },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  cardBody: { fontSize: 13, color: colors.textBody, marginTop: 2 },
  cardTime: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
});
