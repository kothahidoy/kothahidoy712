import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { ArrowLeft, Search, Share2, Star, X, Zap } from "lucide-react-native";

import { dataService } from "@/src/data/service";
import { AC_APPLIANCE_SUB_SERVICES } from "@/src/data/seed";
import { colors, radius } from "@/src/theme";
import { Category, SubService } from "@/src/types";

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [subServices, setSubServices] = useState<SubService[]>([]);

  // Redirect to dedicated category pages
  if (id === "electrician") {
    return <Redirect href="/category/electrician" />;
  }
  if (id === "salon") {
    return <Redirect href="/category/salon" />;
  }
  if (id === "cleaning") {
    return <Redirect href="/category/cleaning" />;
  }
  if (id === "insta-help") {
    return <Redirect href="/category/insta-help" />;
  }
  if (id === "ac-repair") {
    return <Redirect href="/category/ac-appliance" />;
  }
  if (id === "plumber") {
    return <Redirect href="/category/plumber" />;
  }
  if (id === "carpenter") {
    return <Redirect href="/category/carpenter" />;
  }
  if (id === "women-salon" || id === "womens-salon") {
    return <Redirect href="/category/salon-women" />;
  }
  if (id === "painting" || id === "home-painting") {
    return <Redirect href="/category/painting" />;
  }

  useEffect(() => {
    (async () => {
      if (!id) return;
      const cats = await dataService.getCategories();
      setCategory(cats.find((c) => c.id === id) ?? null);
      
      // Get sub-services for AC & Appliance category
      if (id === "ac-repair") {
        setSubServices(AC_APPLIANCE_SUB_SERVICES);
      }
    })();
  }, [id]);

  const renderSubServiceItem = ({ item }: { item: SubService }) => (
    <TouchableOpacity
      style={styles.subServiceItem}
      onPress={() => router.push(`/subservice/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.subServiceImageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.subServiceImage}
          resizeMode="cover"
        />
        {item.estimatedMins && (
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{item.estimatedMins} mins</Text>
          </View>
        )}
      </View>
      <Text style={styles.subServiceName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Group sub-services into sections
  const largeAppliances = subServices.filter(s => 
    ["sub-ac", "sub-washing", "sub-refrigerator", "sub-tv"].includes(s.id)
  );
  const otherAppliances = subServices.filter(s => 
    ["sub-chimney", "sub-microwave", "sub-geyser", "sub-water-purifier", "sub-cooler", "sub-stove"].includes(s.id)
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Search size={20} color={colors.textMain} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Share2 size={20} color={colors.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Title */}
        <Text style={styles.categoryTitle}>{category?.name ?? "Category"}</Text>

        {/* Large Appliances Section */}
        {largeAppliances.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Large appliances</Text>
            <View style={styles.grid}>
              {largeAppliances.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => router.push(`/subservice/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gridImageContainer}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.gridImage}
                      resizeMode="contain"
                    />
                    {item.estimatedMins && (
                      <View style={styles.gridTimeBadge}>
                        <Text style={styles.gridTimeBadgeText}>{item.estimatedMins} mins</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.gridItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Other Appliances Section */}
        {otherAppliances.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other appliances</Text>
            <View style={styles.grid}>
              {otherAppliances.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => router.push(`/subservice/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gridImageContainer}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.gridImage}
                      resizeMode="contain"
                    />
                    {item.estimatedMins && (
                      <View style={styles.gridTimeBadge}>
                        <Text style={styles.gridTimeBadgeText}>{item.estimatedMins} mins</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.gridItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty state for categories without sub-services */}
        {subServices.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Services coming soon for this category.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 20,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "23%",
    alignItems: "center",
  },
  gridImageContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  gridImage: {
    width: 60,
    height: 60,
  },
  gridTimeBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridTimeBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#2E7D32",
  },
  gridItemName: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMain,
    textAlign: "center",
    lineHeight: 16,
  },
  subServiceItem: {
    width: 100,
    alignItems: "center",
    marginRight: 16,
  },
  subServiceImageContainer: {
    width: 90,
    height: 90,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  subServiceImage: {
    width: 70,
    height: 70,
  },
  timeBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2E7D32",
  },
  subServiceName: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMain,
    textAlign: "center",
    lineHeight: 16,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
