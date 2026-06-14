import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  MapPin,
  Search,
  Star,
} from "lucide-react-native";

import { CategoryTile } from "@/src/components/IconBubble";
import { ServiceCard } from "@/src/components/ServiceCard";
import { useSession } from "@/src/context/SessionContext";
import { dataService } from "@/src/data/service";
import { colors, radius, shadow } from "@/src/theme";
import {
  Category,
  Offer,
  Professional,
  Service,
} from "@/src/types";

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Service[]>([]);
  const [topRated, setTopRated] = useState<Service[]>([]);
  const [recommended, setRecommended] = useState<Service[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [pros, setPros] = useState<Professional[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const [c, p, t, r, o, pr, all] = await Promise.all([
      dataService.getCategories(),
      dataService.getPopularServices(),
      dataService.getTopRatedServices(),
      dataService.getRecommendedServices(),
      dataService.getOffers(),
      dataService.getTopProfessionals(),
      dataService.getServices(),
    ]);
    setCategories(c);
    setPopular(p);
    setTopRated(t);
    setRecommended(r);
    setOffers(o);
    setPros(pr);
    setAllServices(all);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cityLabel = profile?.city ?? "Durgapur";
  const firstName = (profile?.name ?? "there").split(" ")[0];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.locRow}>
              <MapPin size={14} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.locText}>{cityLabel}</Text>
            </View>
            <Text style={styles.hello}>Hi {firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            testID="home-notifications-btn"
          >
            <Bell size={20} color={colors.textMain} />
            <View style={styles.dot} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search for AC service, cleaning..."
            placeholderTextColor={colors.textSubtle}
            style={styles.searchInput}
            testID="home-search-input"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearch("")}
              hitSlop={10}
              testID="home-search-clear"
            >
              <Text style={styles.searchClear}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Search results — show filtered services while typing */}
        {search.trim().length > 0 ? (() => {
          const q = search.toLowerCase().trim();
          const catMap = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
          const results = allServices
            .filter((s) => {
              const catName = catMap.get(s.categoryId) ?? "";
              return (
                s.title.toLowerCase().includes(q) ||
                (s.description ?? "").toLowerCase().includes(q) ||
                catName.includes(q)
              );
            })
            .slice(0, 12);
          return (
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text style={styles.h2}>
                {results.length > 0
                  ? `${results.length} result${results.length === 1 ? "" : "s"} for "${search.trim()}"`
                  : `No services match "${search.trim()}"`}
              </Text>
              {results.length === 0 ? (
                <Text style={[styles.sectionSub, { marginTop: 6 }]}>
                  Try searching for AC, cleaning, plumbing, salon, etc.
                </Text>
              ) : (
                results.map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    variant="wide"
                    onPress={() => router.push(`/service/${s.id}`)}
                    testID={`home-search-result-${s.id}`}
                  />
                ))
              )}
            </View>
          );
        })() : null}

        {/* Hero offer banner */}
        <FlatList
          data={offers}
          keyExtractor={(o) => o.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.offer, { backgroundColor: item.bgColor }]}
              activeOpacity={0.9}
              testID={`home-offer-${item.id}`}
            >
              <View style={styles.offerBody}>
                <Text style={styles.offerTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.offerSub} numberOfLines={2}>
                  {item.subtitle}
                </Text>
                <View style={styles.offerCode}>
                  <Text style={styles.offerCodeText}>USE {item.code}</Text>
                </View>
              </View>
              <Image source={{ uri: item.bannerUrl }} style={styles.offerImg} />
            </TouchableOpacity>
          )}
        />

        {/* Categories */}
        <View style={styles.sectionHead}>
          <Text style={styles.h2}>What do you need?</Text>
        </View>
        <View style={styles.catGrid}>
          {categories.map((c) => (
            <CategoryTile
              key={c.id}
              name={c.icon}
              bg={c.color}
              label={c.name}
              imageUrl={c.imageUrl}
              onPress={() => router.push(`/category/${c.id}`)}
              testID={`home-cat-${c.id}`}
            />
          ))}
        </View>

        {/* Popular services */}
        <SectionHeader
          title="Popular services"
          subtitle="Most booked this week"
          onSeeAll={() => router.push("/category/cleaning")}
          testID="home-popular-section"
        />
        <FlatList
          data={popular}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onPress={() => router.push(`/service/${item.id}`)}
              testID={`home-popular-${item.id}`}
            />
          )}
        />

        {/* Top rated pros */}
        <SectionHeader title="Top-rated professionals" subtitle="Trusted by Mfixit" />
        <FlatList
          data={pros}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => <ProCard pro={item} />}
        />

        {/* Recommended */}
        <SectionHeader
          title="Recommended for you"
          subtitle="Based on your city"
        />
        <View style={{ paddingHorizontal: 20 }}>
          {recommended.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              variant="wide"
              onPress={() => router.push(`/service/${s.id}`)}
              testID={`home-recommended-${s.id}`}
            />
          ))}
        </View>

        {/* Top rated */}
        <SectionHeader title="Top rated services" />
        <FlatList
          data={topRated}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onPress={() => router.push(`/service/${item.id}`)}
            />
          )}
        />

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  testID,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  testID?: string;
}) {
  return (
    <View style={styles.sectionHead} testID={testID}>
      <View style={{ flex: 1 }}>
        <Text style={styles.h2}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
      {onSeeAll ? (
        <TouchableOpacity
          onPress={onSeeAll}
          style={styles.seeAll}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <ChevronRight size={14} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ProCard({ pro }: { pro: Professional }) {
  return (
    <View style={styles.pro}>
      <Image
        source={{ uri: pro.avatar ?? "https://i.pravatar.cc/200" }}
        style={styles.proAvatar}
      />
      <Text style={styles.proName} numberOfLines={1}>
        {pro.name}
      </Text>
      <View style={styles.proRow}>
        <Star size={12} color={colors.star} fill={colors.star} />
        <Text style={styles.proRating}>{pro.rating.toFixed(1)}</Text>
        <Text style={styles.proSub}>· {pro.experienceYears}y</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  hello: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  searchBar: {
    marginHorizontal: 20,
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textMain,
    paddingVertical: 0,
  },
  searchClear: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    paddingHorizontal: 6,
  },
  offer: {
    width: 320,
    height: 130,
    borderRadius: radius.xl,
    flexDirection: "row",
    overflow: "hidden",
    ...shadow.card,
  },
  offerBody: { flex: 1, padding: 16, justifyContent: "center" },
  offerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  offerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  offerCode: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  offerCodeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  offerImg: { width: 130, height: "100%" },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
  },
  h2: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.2,
  },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, color: colors.primary, fontWeight: "700" },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  pro: {
    width: 120,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: 12,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  proAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 8 },
  proName: { fontSize: 13, fontWeight: "700", color: colors.textMain },
  proRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  proRating: { fontSize: 12, fontWeight: "700", color: colors.textMain },
  proSub: { fontSize: 11, color: colors.textMuted },
});
