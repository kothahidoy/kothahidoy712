import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";

import { ServiceCard } from "@/src/components/ServiceCard";
import { dataService } from "@/src/data/service";
import { colors, radius } from "@/src/theme";
import { Category, Service } from "@/src/types";

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [cats, svc] = await Promise.all([
        dataService.getCategories(),
        dataService.getServicesByCategory(id),
      ]);
      setCategory(cats.find((c) => c.id === id) ?? null);
      setServices(svc);
    })();
  }, [id]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          testID="cat-back-btn"
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.crumb}>Services</Text>
          <Text style={styles.title}>{category?.name ?? "Category"}</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color={colors.textMuted} />
        <Text style={styles.searchPlaceholder}>
          Search within {category?.name?.toLowerCase() ?? "category"}
        </Text>
      </View>

      <FlatList
        data={services}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            variant="wide"
            onPress={() => router.push(`/service/${item.id}`)}
            testID={`cat-service-${item.id}`}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No services in this category yet.
            </Text>
          </View>
        }
      />
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
  crumb: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.3,
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 14,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchPlaceholder: { fontSize: 13, color: colors.textSubtle, fontWeight: "500" },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 14, color: colors.textMuted },
});
