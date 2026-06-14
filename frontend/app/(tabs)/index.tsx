import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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
  BadgeCheck,
  Bell,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react-native";

import { CategoryTile } from "@/src/components/IconBubble";
import { ServiceCard } from "@/src/components/ServiceCard";
import { useSession } from "@/src/context/SessionContext";
import { dataService } from "@/src/data/service";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { Category, Offer, Service } from "@/src/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 40;

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Service[]>([]);
  const [recommended, setRecommended] = useState<Service[]>([]);
  const [recentlyBooked, setRecentlyBooked] = useState<Service[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const [c, p, r, o, all] = await Promise.all([
      dataService.getCategories(),
      dataService.getPopularServices(),
      dataService.getRecommendedServices(),
      dataService.getOffers(),
      dataService.getServices(),
    ]);
    setCategories(c);
    setPopular(p);
    setRecommended(r);
    setOffers(o);
    setAllServices(all);
    // Mock recently booked with first 3 services
    setRecentlyBooked(all.slice(0, 3));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cityLabel = profile?.city ?? "Durgapur";
  const firstName = (profile?.name ?? "User").split(" ")[0];

  // Banner data for carousel
  const banners = [
    {
      id: "1",
      title: "AC Repair in 30 mins",
      subtitle: "Expert technicians at your doorstep",
      emoji: "⚡",
      bgColor: "#1E3A8A",
      ctaText: "Book Now",
    },
    {
      id: "2",
      title: "Flat ₹200 OFF",
      subtitle: "On your first booking",
      emoji: "🎉",
      bgColor: "#7C3AED",
      ctaText: "Claim Offer",
    },
    {
      id: "3",
      title: "Trusted by 10,000+",
      subtitle: "Homes across India",
      emoji: "🏠",
      bgColor: "#059669",
      ctaText: "Learn More",
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER SECTION ===== */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.locRow}>
              <MapPin size={14} color={colors.accent} strokeWidth={2.5} />
              <Text style={styles.locText}>{cityLabel}</Text>
              <ChevronRight size={14} color={colors.textMuted} />
            </View>
            <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} testID="home-notifications-btn">
            <Bell size={22} color={colors.textMain} strokeWidth={2} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* ===== SEARCH BAR ===== */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={colors.textMuted} strokeWidth={2} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search for services..."
              placeholderTextColor={colors.textSubtle}
              style={styles.searchInput}
              testID="home-search-input"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
                <Text style={styles.clearBtn}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ===== SEARCH RESULTS ===== */}
        {search.trim().length > 0 && (
          <SearchResults
            query={search}
            services={allServices}
            categories={categories}
            router={router}
          />
        )}

        {/* ===== BANNER CAROUSEL ===== */}
        {search.trim().length === 0 && (
          <>
            <View style={styles.bannerSection}>
              <FlatList
                data={banners}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={BANNER_WIDTH + 12}
                decelerationRate="fast"
                contentContainerStyle={styles.bannerList}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 12));
                  setBannerIndex(index);
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.banner, { backgroundColor: item.bgColor }]}
                    activeOpacity={0.95}
                  >
                    <View style={styles.bannerContent}>
                      <Text style={styles.bannerEmoji}>{item.emoji}</Text>
                      <Text style={styles.bannerTitle}>{item.title}</Text>
                      <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                      <View style={styles.bannerCta}>
                        <Text style={styles.bannerCtaText}>{item.ctaText}</Text>
                        <ChevronRight size={14} color="#FFF" strokeWidth={2.5} />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
              {/* Pagination dots */}
              <View style={styles.paginationDots}>
                {banners.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      bannerIndex === i && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* ===== TRUST STRIP ===== */}
            <View style={styles.trustStrip}>
              <TrustBadge icon={Shield} label="Verified Experts" />
              <View style={styles.trustDivider} />
              <TrustBadge icon={Star} label="4.8 Rating" />
              <View style={styles.trustDivider} />
              <TrustBadge icon={Users} label="10K+ Jobs" />
            </View>

            {/* ===== CATEGORIES ===== */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>What do you need?</Text>
            </View>
            <View style={styles.categoryGrid}>
              {categories.slice(0, 9).map((cat) => (
                <CategoryTile
                  key={cat.id}
                  name={cat.icon}
                  bg={cat.color}
                  label={cat.name}
                  onPress={() => router.push(`/category/${cat.id}`)}
                  testID={`home-cat-${cat.id}`}
                />
              ))}
            </View>

            {/* ===== RECOMMENDED FOR YOU ===== */}
            <SectionHeader
              title="Recommended for You"
              subtitle="Based on your preferences"
              onSeeAll={() => router.push("/category/cleaning")}
            />
            <FlatList
              data={recommended}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(s) => s.id}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ServiceCard
                  service={item}
                  onPress={() => router.push(`/service/${item.id}`)}
                  testID={`home-recommended-${item.id}`}
                />
              )}
            />

            {/* ===== RECENTLY BOOKED ===== */}
            {recentlyBooked.length > 0 && (
              <>
                <SectionHeader
                  title="Recently Booked"
                  subtitle="Your past services"
                />
                <View style={styles.recentlyBookedList}>
                  {recentlyBooked.map((s) => (
                    <RecentlyBookedCard
                      key={s.id}
                      service={s}
                      onPress={() => router.push(`/service/${s.id}`)}
                    />
                  ))}
                </View>
              </>
            )}

            {/* ===== POPULAR SERVICES ===== */}
            <SectionHeader
              title="Popular Services"
              subtitle="Most booked this week"
              onSeeAll={() => router.push("/category/cleaning")}
            />
            <FlatList
              data={popular}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(s) => s.id}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ServiceCard
                  service={item}
                  onPress={() => router.push(`/service/${item.id}`)}
                  testID={`home-popular-${item.id}`}
                />
              )}
            />

            {/* ===== OFFERS SECTION ===== */}
            {offers.length > 0 && (
              <>
                <SectionHeader title="Special Offers" subtitle="Limited time deals" />
                <FlatList
                  data={offers}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(o) => o.id}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <OfferCard offer={item} />
                  )}
                />
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== STICKY CTA BUTTON ===== */}
      <View style={styles.stickyCta}>
        <TouchableOpacity
          style={styles.stickyCtaButton}
          activeOpacity={0.9}
          onPress={() => router.push("/category/cleaning")}
        >
          <Zap size={20} color="#FFF" strokeWidth={2.5} />
          <Text style={styles.stickyCtaText}>Book a Service</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ===== COMPONENTS =====

function TrustBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.trustBadge}>
      <View style={styles.trustIconWrap}>
        <Icon size={14} color={colors.verified} strokeWidth={2.5} />
      </View>
      <Text style={styles.trustLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {onSeeAll && (
        <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAll}>
          <Text style={styles.seeAllText}>See all</Text>
          <ChevronRight size={14} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function RecentlyBookedCard({
  service,
  onPress,
}: {
  service: Service;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.recentCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: service.image }} style={styles.recentImage} />
      <View style={styles.recentInfo}>
        <Text style={styles.recentTitle} numberOfLines={1}>{service.title}</Text>
        <View style={styles.recentMeta}>
          <Star size={12} color={colors.star} fill={colors.star} />
          <Text style={styles.recentRating}>{service.rating.toFixed(1)}</Text>
          <Text style={styles.recentDot}>•</Text>
          <Clock size={12} color={colors.textMuted} />
          <Text style={styles.recentDuration}>{service.durationMins} min</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.recentBookBtn}>
        <Text style={styles.recentBookText}>Book Again</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  return (
    <TouchableOpacity
      style={[styles.offerCard, { backgroundColor: offer.bgColor }]}
      activeOpacity={0.9}
    >
      <View style={styles.offerContent}>
        <Text style={styles.offerTitle} numberOfLines={2}>{offer.title}</Text>
        <Text style={styles.offerSubtitle} numberOfLines={2}>{offer.subtitle}</Text>
        <View style={styles.offerCode}>
          <Text style={styles.offerCodeText}>USE {offer.code}</Text>
        </View>
      </View>
      {offer.bannerUrl && (
        <Image source={{ uri: offer.bannerUrl }} style={styles.offerImage} />
      )}
    </TouchableOpacity>
  );
}

function SearchResults({
  query,
  services,
  categories,
  router,
}: {
  query: string;
  services: Service[];
  categories: Category[];
  router: any;
}) {
  const q = query.toLowerCase().trim();
  const catMap = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  const results = services
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
    <View style={styles.searchResults}>
      <Text style={styles.searchResultsTitle}>
        {results.length > 0
          ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query.trim()}"`
          : `No services match "${query.trim()}"`}
      </Text>
      {results.length === 0 ? (
        <Text style={styles.searchResultsHint}>
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
}

// ===== STYLES =====

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 30,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  notifDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
  },

  // Search
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchBar: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textMain,
    fontWeight: "500",
  },
  clearBtn: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },

  // Banner
  bannerSection: {
    marginBottom: spacing.lg,
  },
  bannerList: {
    paddingHorizontal: spacing.xl,
  },
  banner: {
    width: BANNER_WIDTH,
    height: 160,
    borderRadius: radius.xxl,
    marginRight: 12,
    overflow: "hidden",
    ...shadow.cardHover,
  },
  bannerContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  bannerEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    fontWeight: "500",
  },
  bannerCta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: 4,
  },
  bannerCtaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },

  // Trust Strip
  trustStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.verifiedLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.verified,
    borderStyle: "dashed",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  trustIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  trustLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.verified,
  },
  trustDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.verified,
    marginHorizontal: spacing.md,
    opacity: 0.3,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.xl,
    justifyContent: "space-between",
  },

  // Horizontal Lists
  horizontalList: {
    paddingHorizontal: spacing.xl,
  },

  // Recently Booked
  recentlyBookedList: {
    paddingHorizontal: spacing.xl,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  recentImage: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  recentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 4,
  },
  recentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recentRating: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textBody,
  },
  recentDot: {
    fontSize: 12,
    color: colors.textMuted,
  },
  recentDuration: {
    fontSize: 12,
    color: colors.textMuted,
  },
  recentBookBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  recentBookText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },

  // Offer Card
  offerCard: {
    width: 280,
    height: 130,
    borderRadius: radius.xl,
    marginRight: 14,
    flexDirection: "row",
    overflow: "hidden",
    ...shadow.card,
  },
  offerContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  offerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  offerCode: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  offerCodeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  offerImage: {
    width: 100,
    height: "100%",
  },

  // Search Results
  searchResults: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: spacing.md,
  },
  searchResultsHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Sticky CTA
  stickyCta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: "transparent",
  },
  stickyCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: radius.lg,
    gap: spacing.sm,
    ...shadow.stickyCta,
  },
  stickyCtaText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
});
