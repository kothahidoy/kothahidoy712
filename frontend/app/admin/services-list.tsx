import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Edit3, Search } from "lucide-react-native";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

interface ServiceRow {
  id: string;
  category_id: string;
  title: string;
  starting_price: number;
  image: string;
  is_active: boolean;
  rating?: number;
  review_count?: number;
}

export default function AdminServicesList() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/services`);
      if (res.ok) {
        const data = (await res.json()) as ServiceRow[];
        setServices(data.map((s: any) => ({
          ...s,
          title: s.title || s.name || "",
          starting_price: Number(s.starting_price ?? s.price ?? 0),
        })));
      }
    } catch (err) {
      console.warn("Failed to load services", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [fetchServices])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, [fetchServices]);

  const filtered = services.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.category_id || "").toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce<Record<string, ServiceRow[]>>((acc, s) => {
    const k = s.category_id || "Other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(s);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services Editor</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, id, or category..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={sortedKeys}
          keyExtractor={(k) => k}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item: catId }) => (
            <View style={styles.categoryGroup}>
              <Text style={styles.categoryHeader}>{catId}</Text>
              {grouped[catId].map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={styles.row}
                  onPress={() =>
                    router.push(`/admin/service-editor/${svc.id}` as any)
                  }
                >
                  {svc.image ? (
                    <Image
                      source={{ uri: svc.image }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]}>
                      <Text style={styles.thumbLetter}>
                        {svc.title?.[0]?.toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}
                  <View style={styles.rowContent}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {svc.title}
                    </Text>
                    <Text style={styles.rowMeta}>
                      ₹{svc.starting_price}
                      {svc.review_count
                        ? ` · ${svc.review_count} reviews`
                        : ""}
                      {!svc.is_active ? " · INACTIVE" : ""}
                    </Text>
                  </View>
                  <Edit3 size={18} color="#059669" />
                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: "#6B7280" }}>No services found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  backBtn: { padding: 4 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },
  categoryGroup: { marginBottom: 16 },
  categoryHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#F3F4F6" },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  thumbLetter: { fontSize: 18, fontWeight: "700", color: "#6B7280" },
  rowContent: { flex: 1, marginLeft: 12 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  rowMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
});
