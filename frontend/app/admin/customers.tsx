import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Mail, MapPin, Phone, Users } from "lucide-react-native";

import { adminService, AdminCustomer } from "@/src/data/admin";
import { colors, radius, shadow } from "@/src/theme";

export default function AdminCustomers() {
  const router = useRouter();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);

  useFocusEffect(
    useCallback(() => {
      adminService.listAllCustomers().then(setCustomers);
    }, []),
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          testID="ac-back-btn"
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.crumb}>Admin</Text>
          <Text style={styles.title}>Customers · {customers.length}</Text>
        </View>
      </View>

      {customers.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Users size={32} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>No customers yet</Text>
          <Text style={styles.emptySub}>
            Customers will appear here once they sign up and complete profile
            setup.
          </Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card} testID={`ac-card-${item.id}`}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>
                  {(item.name?.[0] ?? "?").toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name ?? "Unnamed user"}
                </Text>
                <View style={styles.row}>
                  <MapPin size={11} color={colors.textMuted} strokeWidth={2} />
                  <Text style={styles.meta}>{item.city ?? "—"}</Text>
                </View>
                {item.phone ? (
                  <View style={styles.row}>
                    <Phone size={11} color={colors.textMuted} strokeWidth={2} />
                    <Text style={styles.meta}>{item.phone}</Text>
                  </View>
                ) : null}
                {item.email ? (
                  <View style={styles.row}>
                    <Mail size={11} color={colors.textMuted} strokeWidth={2} />
                    <Text style={styles.meta} numberOfLines={1}>{item.email}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.joined}>
                {new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  crumb: { fontSize: 11, color: colors.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  list: { paddingHorizontal: 20, paddingBottom: 30, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 18, fontWeight: "800", color: colors.primary },
  name: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 11, color: colors.textMuted, flex: 1 },
  joined: { fontSize: 10, color: colors.textSubtle, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.textMain },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
});
