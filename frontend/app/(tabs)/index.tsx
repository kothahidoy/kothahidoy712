import { useCallback, useEffect, useState, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Bell,
  ChevronRight,
  MapPin,
  Search,
  Star,
  Volume2,
  VolumeX,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Mock data for "In the Spotlight" section - Urban Company style
const SPOTLIGHT_DATA = [
  {
    id: "spot-1",
    title: "Get your AC",
    titleLine2: "summer-ready",
    subtitle: "Foam-jet AC service",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80",
    bgColor: "#F5F5F5",
  },
  {
    id: "spot-2",
    title: "Instant home",
    titleLine2: "repairs",
    subtitle: "Plumber & Electrician",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    bgColor: "#EEF2FF",
  },
  {
    id: "spot-3",
    title: "Transform your",
    titleLine2: "space",
    subtitle: "Deep home cleaning",
    image: "https://images.pexels.com/photos/6195274/pexels-photo-6195274.jpeg?auto=compress&cs=tinysrgb&w=600",
    bgColor: "#F0FDF4",
  },
];

// Mock data for "Thoughtful Curations" VIDEO section
const CURATED_VIDEOS = [
  {
    id: "vid-1",
    title: "Roll-on",
    titleLine2: "waxing",
    thumbnail: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: "vid-2",
    title: "MEN'S",
    titleLine2: "HAIRCUT",
    thumbnail: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
  {
    id: "vid-3",
    title: "Bathroom",
    titleLine2: "Deep clean",
    thumbnail: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=400&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  },
  {
    id: "vid-4",
    title: "AC",
    titleLine2: "Service",
    thumbnail: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=400&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  },
];

// VideoCard component with auto-play on visibility
interface VideoCardProps {
  item: typeof CURATED_VIDEOS[0];
  isVisible: boolean;
}

function VideoCard({ item, isVisible }: VideoCardProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  
  const player = useVideoPlayer(item.videoUrl, (player) => {
    player.loop = true;
    player.muted = true;
  });

  useEffect(() => {
    if (isVisible) {
      // Small delay before showing video
      const timer = setTimeout(() => {
        setShowVideo(true);
        player.play();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowVideo(false);
      player.pause();
    }
  }, [isVisible, player]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <TouchableOpacity
      style={styles.videoCard}
      activeOpacity={0.95}
      testID={`video-${item.id}`}
    >
      <View style={styles.videoContainer}>
        {showVideo && isVisible ? (
          <VideoView
            style={styles.videoPlayer}
            player={player}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
        )}
        
        {/* Mute/Unmute button */}
        <TouchableOpacity
          style={styles.muteButton}
          onPress={toggleMute}
          activeOpacity={0.8}
        >
          {isMuted ? (
            <VolumeX size={16} color="#FFFFFF" />
          ) : (
            <Volume2 size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Title overlay at bottom */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={styles.videoGradient}
        >
          <Text style={styles.videoTitle}>{item.title}</Text>
          <Text style={styles.videoTitleLine2}>{item.titleLine2}</Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

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
  const [visibleVideoIds, setVisibleVideoIds] = useState<string[]>([]);

  const onViewableVideosChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visibleIds = viewableItems
      .filter((item) => item.isViewable)
      .map((item) => item.item.id);
    setVisibleVideoIds(visibleIds);
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

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

        {/* In the Spotlight Section - Urban Company Style */}
        <View style={styles.spotlightSection}>
          <Text style={styles.spotlightTitle}>In the spotlight</Text>
          <FlatList
            data={SPOTLIGHT_DATA}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={SCREEN_WIDTH - 40}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.spotlightCard, { backgroundColor: item.bgColor }]}
                activeOpacity={0.95}
                testID={`spotlight-${item.id}`}
              >
                <View style={styles.spotlightContent}>
                  <View style={styles.spotlightTextArea}>
                    <Text style={styles.spotlightCardTitle}>{item.title}</Text>
                    <Text style={styles.spotlightCardTitle}>{item.titleLine2}</Text>
                    <Text style={styles.spotlightCardSubtitle}>{item.subtitle}</Text>
                    <TouchableOpacity style={styles.spotlightBookBtn}>
                      <Text style={styles.spotlightBookBtnText}>Book now</Text>
                    </TouchableOpacity>
                  </View>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.spotlightImage}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
            )}
          />
          {/* Pagination dots */}
          <View style={styles.paginationDots}>
            {SPOTLIGHT_DATA.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === 0 ? styles.paginationDotActive : styles.paginationDotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Thoughtful Curations - Video Section */}
        <View style={styles.curationSection}>
          <View style={styles.curationHeader}>
            <Text style={styles.curationTitle}>Thoughtful curations</Text>
            <Text style={styles.curationSubtitle}>of our finest experiences</Text>
          </View>
          <FlatList
            data={CURATED_VIDEOS}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            onViewableItemsChanged={onViewableVideosChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
              <VideoCard
                item={item}
                isVisible={visibleVideoIds.includes(item.id)}
              />
            )}
          />
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

  // Spotlight Section Styles - Urban Company Style
  spotlightSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  spotlightTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textMain,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  spotlightCard: {
    width: SCREEN_WIDTH - 52,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  spotlightContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  spotlightTextArea: {
    flex: 1,
    paddingRight: 12,
  },
  spotlightCardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textMain,
    lineHeight: 28,
  },
  spotlightCardSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  spotlightBookBtn: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
    marginTop: 16,
  },
  spotlightBookBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  spotlightImage: {
    width: 140,
    height: 140,
    borderRadius: radius.md,
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    backgroundColor: "#1a1a1a",
    width: 24,
  },
  paginationDotInactive: {
    backgroundColor: "#D1D5DB",
  },

  // Video Curation Section Styles
  curationSection: {
    marginTop: 28,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: "#F7F7F7",
  },
  curationHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  curationTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textMain,
  },
  curationSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 2,
  },
  videoCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 260,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: radius.lg,
  },
  videoThumbnailImage: {
    borderRadius: radius.lg,
  },
  muteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  playButtonOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -40 }],
    zIndex: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 12,
    borderRightWidth: 0,
    borderBottomWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "#1a1a1a",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    marginLeft: 4,
  },
  videoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 40,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  videoTitleLine2: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
});
