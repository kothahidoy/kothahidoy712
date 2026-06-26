/**
 * /search?q=...&category=...
 *
 * Live search across services. Filters by title / description / category.
 * Tapping a result opens the service detail / cart flow.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Search, X } from "lucide-react-native";
import { colors, radius } from "@/src/theme";

type Svc = {
  id: string;
  title: string;
  description?: string;
  starting_price: number;
  duration_mins: number;
  rating?: number;
  image?: string;
  category_id: string;
};

export default function SearchScreen() {
  const router = useRouter();
  const { q: initialQ, category } = useLocalSearchParams<{ q?: string; category?: string }>();
  const [query, setQuery] = useState<string>(initialQ || "");
  const [all, setAll] = useState<Svc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const base = typeof window !== "undefined" ? "" : (process.env.EXPO_PUBLIC_BACKEND_URL || "");
        const url = category
          ? `${base}/api/admin/cms/services?category_id=${category}`
          : `${base}/api/admin/cms/services`;
        const r = await fetch(url);
        const data = await r.json();
        setAll(Array.isArray(data) ? data : []);
      } catch {
        setAll([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 50);
    return all
      .filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category_id?.toLowerCase().includes(q),
      )
      .slice(0, 100);
  }, [query, all]);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={s.iconBtn}>
            <ArrowLeft size={22} color={colors.textMain} />
          </TouchableOpacity>
          <View style={s.inputWrap}>
            <Search size={18} color={colors.textSubtle} />
            <TextInput
              autoFocus
              style={s.input}
              placeholder={category ? `Search in ${String(category)}…` : "Search any service…"}
              placeholderTextColor={colors.textSubtle}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                <X size={18} color={colors.textSubtle} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(s) => s.id}
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ color: colors.textSubtle, fontSize: 14 }}>
                  {query ? "No services match your search." : "Start typing to search…"}
                </Text>
              </View>
            }
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.card}
                onPress={() => router.push(`/service/${item.id}`)}
                activeOpacity={0.7}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={s.thumb} />
                ) : (
                  <View style={[s.thumb, { backgroundColor: "#F3F4F6" }]} />
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.title} numberOfLines={1}>{item.title}</Text>
                  <Text style={s.sub} numberOfLines={2}>
                    {item.description || `Starts at ₹${item.starting_price}`}
                  </Text>
                  <Text style={s.meta}>
                    ⭐ {item.rating ?? 4.7} · ₹{item.starting_price} · {item.duration_mins} min
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  iconBtn: { padding: 4 },
  inputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F3F4F6", borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8,
  },
  input: { flex: 1, fontSize: 14, color: colors.textMain },
  card: {
    flexDirection: "row", gap: 12, padding: 12, alignItems: "center",
    backgroundColor: "#fff", borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  thumb: { width: 60, height: 60, borderRadius: 10 },
  title: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  sub: { fontSize: 12, color: colors.textMuted },
  meta: { fontSize: 11, color: colors.textSubtle, marginTop: 2 },
});
