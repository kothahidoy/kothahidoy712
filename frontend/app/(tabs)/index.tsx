import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
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
  Clock,
  MapPin,
  Search,
  ShoppingCart,
  Star,
  Volume2,
  VolumeX,
  ArrowRight,
} from "lucide-react-native";

import { CategoryTile } from "@/src/components/IconBubble";
import { ServiceCard } from "@/src/components/ServiceCard";
import HeroPromoCarousel, { HomePromoSlide } from "@/src/components/HeroPromoCarousel";
import { useSession } from "@/src/context/SessionContext";
import { useCart } from "@/src/context/CartContext";
import { dataService } from "@/src/data/service";
import { colors, radius, shadow } from "@/src/theme";
import {
  Category,
  Offer,
  Professional,
  Service,
} from "@/src/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Hero Banner promo data
const HERO_PROMO = {
  title: "Try InstaHelp at just",
  price: "₹79",
  originalPrice: "₹245",
  discount: "68% OFF",
  image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80",
};

// Mock data for "In the Spotlight" - Large promotional banner cards
const SPOTLIGHT_BANNERS = [
  {
    id: "spot-1",
    title: "Get your AC",
    titleLine2: "summer-ready",
    subtitle: "Foam-jet AC service",
    bgColor: "#F5F5F5",
    textColor: "#1a1a1a",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "spot-2",
    title: "Insta Help",
    titleLine2: "in 10 mins",
    subtitle: "Trained house help when your maid is on leave",
    bgColor: "#7C3AED",
    textColor: "#FFFFFF",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "spot-3",
    title: "Home repairs at",
    titleLine2: "affordable prices",
    subtitle: "Electricians, plumbers, carpenters",
    bgColor: "#2563EB",
    textColor: "#FFFFFF",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "spot-4",
    title: "Expert haircut at",
    titleLine2: "your doorstep",
    subtitle: "Salon for men",
    bgColor: "#0EA5E9",
    textColor: "#FFFFFF",
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80",
  },
];

// Mock data for "Thoughtful Curations" VIDEO section (fallback when CMS is empty)
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
interface VideoCardItem {
  id: string;
  title: string;
  titleLine2?: string;
  thumbnail: string;
  videoUrl: string;
}
interface VideoCardProps {
  item: VideoCardItem;
  isVisible: boolean;
}

function VideoCard({ item, isVisible }: VideoCardProps) {
  const [isMuted, setIsMuted] = useState(true);

  // ─── WEB BRANCH ───────────────────────────────────────────────────────
  // We attach a raw <video> element imperatively via useEffect + a host
  // div ref. This bypasses React's reconciliation (which was causing the
  // <video> element to be unmounted/aborted on every parent re-render
  // triggered by visibility tracking + CMS data swap) and matches what
  // big web video apps do for autoplay reliability.
  const hostRef = useRef<any>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const host: HTMLDivElement | null = hostRef.current;
    if (!host) return;

    // Create the <video> element once per (videoUrl, thumbnail).
    const vid = document.createElement("video");
    // Set crossOrigin BEFORE src so browser uses CORS mode (avoids ORB block).
    vid.crossOrigin = "anonymous";
    if (item.thumbnail) vid.poster = item.thumbnail;
    vid.autoplay = true;
    vid.muted = true; // must be muted BEFORE play() for autoplay policy
    vid.loop = true;
    vid.playsInline = true;
    (vid as any).setAttribute("playsinline", "true");
    (vid as any).setAttribute("webkit-playsinline", "true");
    vid.preload = "auto";
    vid.controls = false;
    vid.style.position = "absolute";
    vid.style.top = "0";
    vid.style.left = "0";
    vid.style.width = "100%";
    vid.style.height = "100%";
    vid.style.objectFit = "cover";
    vid.style.borderRadius = "16px";
    vid.style.backgroundColor = "#000";

    host.appendChild(vid);
    vid.src = item.videoUrl;
    vid.load();
    videoElRef.current = vid;

    // Kick off playback once enough has buffered so it plays smoothly. We
    // listen on `canplaythrough` (browser thinks it can play end-to-end
    // without stalling) and fall back to `canplay` after 2s if the network
    // is slow.
    let played = false;
    const tryPlay = () => {
      if (played) return;
      played = true;
      const p = vid.play();
      if (p && typeof (p as any).catch === "function") {
        (p as any).catch(() => {
          // autoplay rejected — will retry on next user interaction
          played = false;
        });
      }
    };
    vid.addEventListener("canplaythrough", tryPlay, { once: true });
    const fallbackTimer = setTimeout(tryPlay, 2000);
    vid.addEventListener("canplay", () => {
      // If canplaythrough never fires (slow connection), still kick off
      // after a short grace so the user isn't staring at a poster.
      setTimeout(tryPlay, 400);
    }, { once: true });

    return () => {
      clearTimeout(fallbackTimer);
      try {
        vid.pause();
        vid.removeAttribute("src");
        vid.load();
      } catch {}
      if (vid.parentNode) vid.parentNode.removeChild(vid);
      videoElRef.current = null;
    };
  }, [item.videoUrl, item.thumbnail]);

  // Reflect mute state changes onto the element without recreating it.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const v = videoElRef.current;
    if (v) v.muted = isMuted;
  }, [isMuted]);

  // Pause / play based on visibility on web too (saves bandwidth).
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const v = videoElRef.current;
    if (!v) return;
    if (isVisible) {
      const p = v.play();
      if (p && typeof (p as any).catch === "function") {
        (p as any).catch(() => {});
      }
    } else {
      try { v.pause(); } catch {}
    }
  }, [isVisible]);

  if (Platform.OS === "web") {
    return (
      <View style={styles.videoCard} testID={`video-${item.id}`}>
        <View style={styles.videoContainer}>
          {/* @ts-ignore — emit a raw <div> on web to host the imperative <video> */}
          {React.createElement("div", {
            ref: hostRef,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#000",
            } as any,
          })}

          {/* Mute / unmute */}
          <TouchableOpacity
            style={styles.muteButton}
            onPress={() => setIsMuted((m) => !m)}
            activeOpacity={0.8}
          >
            {isMuted ? (
              <VolumeX size={16} color="#FFFFFF" />
            ) : (
              <Volume2 size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={styles.videoGradient}
          >
            <Text style={styles.videoTitle}>{item.title}</Text>
            {!!item.titleLine2 && (
              <Text style={styles.videoTitle}>{item.titleLine2}</Text>
            )}
          </LinearGradient>
        </View>
      </View>
    );
  }

  // ─── NATIVE BRANCH (iOS / Android) ────────────────────────────────────
  // Use expo-video here — it works reliably on native and gives proper
  // hardware-accelerated playback.
  const player = useVideoPlayer(item.videoUrl, (player) => {
    player.loop = true;
    player.muted = true;
  });

  useEffect(() => {
    try {
      player.muted = isMuted;
      if (isVisible) {
        const p: any = player.play();
        if (p && typeof p.then === "function") p.catch(() => {});
      } else {
        player.pause();
      }
    } catch { /* ignore — player may not be ready yet */ }
  }, [isVisible, player, isMuted]);

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
        {/* Thumbnail is ALWAYS rendered behind — visible while loading and
            visible as a fallback if the video URL fails (e.g. a webpage URL
            instead of a direct mp4). */}
        <Image
          source={{ uri: item.thumbnail }}
          style={[styles.videoThumbnail, StyleSheet.absoluteFillObject]}
          resizeMode="cover"
        />
        {/* VideoView is ALWAYS mounted — autoplay (muted) starts immediately
            from the useVideoPlayer init callback. Browser autoplay policy is
            satisfied because muted=true is set BEFORE play() is called. */}
        <VideoView
          style={[styles.videoPlayer, StyleSheet.absoluteFillObject]}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
        {!isVisible && null}
        
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
  const { itemCount } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Service[]>([]);
  const [topRated, setTopRated] = useState<Service[]>([]);
  const [recommended, setRecommended] = useState<Service[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [pros, setPros] = useState<Professional[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [visibleVideoIds, setVisibleVideoIds] = useState<string[]>([]);
  const [heroSlides, setHeroSlides] = useState<HomePromoSlide[]>([]);
  const [curatedVideos, setCuratedVideos] = useState<VideoCardItem[]>(CURATED_VIDEOS);
  const [celebratingPros, setCelebratingPros] = useState<VideoCardItem[]>([]);
  const [celebratingSection, setCelebratingSection] = useState<{
    title: string;
    subtitle: string;
    is_active: boolean;
  }>({ title: "Top rated professionals", subtitle: "Trusted by Mfixit", is_active: true });
  const [visibleCelebIds, setVisibleCelebIds] = useState<string[]>([]);

  const onViewableCelebChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    setVisibleCelebIds(
      viewableItems.filter((it) => it.isViewable).map((it) => it.item.id)
    );
  }).current;

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

  // Fetch hero promo slides from CMS
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = process.env.EXPO_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${base}/api/admin/cms/home-promos?active_only=true`);
        if (!res.ok) return;
        const data: HomePromoSlide[] = await res.json();
        if (!cancelled) {
          setHeroSlides((data || []).filter((s) => s.is_active !== false && !!s.media_url));
        }
      } catch {
        /* fall back to hardcoded card */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch thoughtful curations (videos) from CMS
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = process.env.EXPO_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${base}/api/admin/cms/home-curations?active_only=true`);
        if (!res.ok) return;
        const data: any[] = await res.json();
        const mapped: VideoCardItem[] = (data || [])
          .filter((c) => c?.video_url && c?.thumbnail_url)
          .map((c) => ({
            id: c.id,
            title: c.title,
            titleLine2: c.title_line2 || "",
            thumbnail: c.thumbnail_url,
            videoUrl: c.video_url,
          }));
        if (!cancelled && mapped.length > 0) {
          setCuratedVideos(mapped);
        }
      } catch {
        /* fall back to mock curated videos */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch celebrating professionals (videos + section header) from CMS
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = process.env.EXPO_PUBLIC_BACKEND_URL || "";
        const [vidsRes, secRes] = await Promise.all([
          fetch(`${base}/api/admin/cms/celebrating-pros?active_only=true`),
          fetch(`${base}/api/admin/cms/celebrating-pros-section`),
        ]);
        if (!cancelled && vidsRes.ok) {
          const data: any[] = await vidsRes.json();
          const mapped: VideoCardItem[] = (data || [])
            .filter((c) => c?.video_url)
            .map((c) => ({
              id: c.id,
              title: c.caption || "",
              titleLine2: "",
              thumbnail: c.thumbnail_url || "",
              videoUrl: c.video_url,
            }));
          setCelebratingPros(mapped);
        }
        if (!cancelled && secRes.ok) {
          const sec = await secRes.json();
          setCelebratingSection({
            title: sec?.title || "Top rated professionals",
            subtitle: sec?.subtitle || "Trusted by Mfixit",
            is_active: sec?.is_active !== false,
          });
        }
      } catch {
        /* silently keep defaults */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const cityLabel = profile?.city ?? "Durgapur";
  const firstName = (profile?.name ?? "there").split(" ")[0];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner - Urban Company Style with App Theme */}
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          style={styles.heroBanner}
        >
          {/* Top Row: Location & Cart */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroLocationRow}>
              <View style={styles.heroLocationDot} />
              <View>
                <View style={styles.heroTimeRow}>
                  <Clock size={12} color="#FFFFFF" />
                  <Text style={styles.heroTimeText}>In 19 minutes</Text>
                </View>
                <View style={styles.heroAddressRow}>
                  <Text style={styles.heroAddressText} numberOfLines={1}>
                    {cityLabel} - Block B, Sector 122...
                  </Text>
                  <ChevronRight size={14} color="#FFFFFF" style={{ opacity: 0.7 }} />
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.heroCartBtn} 
              testID="home-cart-btn"
              onPress={() => router.push("/cart")}
            >
              <ShoppingCart size={22} color="#1a1a1a" />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount > 9 ? "9+" : itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.heroSearchBar}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search for 'Kitchen cleaning'"
              placeholderTextColor={colors.textSubtle}
              style={styles.heroSearchInput}
              testID="home-search-input"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Promo Card — auto-swipeable CMS carousel (image + video); falls back to hardcoded card */}
          {heroSlides.length > 0 ? (
            <HeroPromoCarousel slides={heroSlides} />
          ) : (
            <View style={styles.heroPromoCard}>
              <View style={styles.heroPromoContent}>
                <Text style={styles.heroPromoTitle}>{HERO_PROMO.title}</Text>
                <View style={styles.heroPromoPrice}>
                  <Text style={styles.heroPromoPriceValue}>{HERO_PROMO.price}</Text>
                  <Text style={styles.heroPromoOriginalPrice}>{HERO_PROMO.originalPrice}</Text>
                </View>
                <View style={styles.heroPromoDiscount}>
                  <Text style={styles.heroPromoDiscountText}>🏷️ {HERO_PROMO.discount}</Text>
                </View>
                <TouchableOpacity style={styles.heroPromoBookBtn}>
                  <Text style={styles.heroPromoBookBtnText}>Book now</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Image
                source={{ uri: HERO_PROMO.image }}
                style={styles.heroPromoImage}
                resizeMode="cover"
              />
            </View>
          )}
        </LinearGradient>

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
            <View style={{ paddingHorizontal: 20, marginBottom: 16, marginTop: 16 }}>
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

        {/* In the Spotlight Section - Large Promotional Banner Cards */}
        <View style={styles.spotlightSection}>
          <Text style={styles.spotlightTitle}>In the spotlight</Text>
          <FlatList
            data={SPOTLIGHT_BANNERS}
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
                style={[styles.spotlightBannerCard, { backgroundColor: item.bgColor }]}
                activeOpacity={0.95}
                testID={`spotlight-${item.id}`}
              >
                <View style={styles.spotlightBannerContent}>
                  <Text style={[styles.spotlightBannerTitle, { color: item.textColor }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.spotlightBannerTitleBold, { color: item.textColor }]}>
                    {item.titleLine2}
                  </Text>
                  <Text style={[styles.spotlightBannerSubtitle, { color: item.textColor, opacity: 0.85 }]}>
                    {item.subtitle}
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.spotlightBookBtn,
                      { backgroundColor: item.textColor === "#FFFFFF" ? "#FFFFFF" : "#1a1a1a" }
                    ]}
                  >
                    <Text style={[
                      styles.spotlightBookBtnText,
                      { color: item.textColor === "#FFFFFF" ? item.bgColor : "#FFFFFF" }
                    ]}>
                      Book now
                    </Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={{ uri: item.image }}
                  style={styles.spotlightBannerImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />
          {/* Pagination dots */}
          <View style={styles.spotlightPaginationDots}>
            {SPOTLIGHT_BANNERS.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.spotlightDot,
                  index === 0 ? styles.spotlightDotActive : styles.spotlightDotInactive,
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
            data={curatedVideos}
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

        {/* Celebrating Professionals — UC-style video rail (CMS controlled) */}
        {celebratingSection.is_active && (
          <View>
            <View style={styles.celebHeader}>
              <Text style={styles.celebTitle}>{celebratingSection.title}</Text>
              {!!celebratingSection.subtitle && (
                <Text style={styles.celebSubtitle}>{celebratingSection.subtitle}</Text>
              )}
            </View>
            {celebratingPros.length === 0 ? (
              <View style={{ paddingHorizontal: 20 }}>
                <View style={styles.celebEmpty}>
                  <Text style={styles.celebEmptyText}>
                    Videos coming soon — add some from the admin panel.
                  </Text>
                </View>
              </View>
            ) : (
              <FlatList
                data={celebratingPros}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                onViewableItemsChanged={onViewableCelebChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                  <VideoCard
                    item={item}
                    isVisible={visibleCelebIds.includes(item.id)}
                  />
                )}
              />
            )}
          </View>
        )}

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
  
  // Hero Banner Styles
  heroBanner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  heroLocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4ADE80",
    marginTop: 4,
  },
  heroTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroTimeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  heroAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  heroAddressText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    maxWidth: 220,
  },
  heroCartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  heroSearchBar: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 16,
  },
  heroSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textMain,
    paddingVertical: 0,
  },
  heroPromoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 140,
  },
  heroPromoContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  heroPromoTitle: {
    fontSize: 15,
    color: colors.textMain,
    marginBottom: 4,
  },
  heroPromoPrice: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  heroPromoPriceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textMain,
  },
  heroPromoOriginalPrice: {
    fontSize: 16,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  heroPromoDiscount: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  heroPromoDiscountText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "600",
  },
  heroPromoBookBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignSelf: "flex-start",
    marginTop: 12,
    gap: 6,
  },
  heroPromoBookBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  heroPromoImage: {
    width: 140,
    height: "100%",
    minHeight: 140,
  },

  // Legacy header styles (kept for compatibility)
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

  // Spotlight Section Styles - Urban Company Style Large Banner Cards
  spotlightSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  spotlightTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  spotlightBannerCard: {
    width: SCREEN_WIDTH - 52,
    height: 180,
    borderRadius: radius.lg,
    flexDirection: "row",
    overflow: "hidden",
  },
  spotlightBannerContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  spotlightBannerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  spotlightBannerTitleBold: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  spotlightBannerSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  spotlightBookBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  spotlightBookBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  spotlightBannerImage: {
    width: 150,
    height: "100%",
  },
  spotlightPaginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 6,
  },
  spotlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  spotlightDotActive: {
    backgroundColor: "#1a1a1a",
    width: 20,
  },
  spotlightDotInactive: {
    backgroundColor: "#D1D5DB",
  },
  spotlightScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  spotlightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  spotlightItem: {
    alignItems: "center",
    width: 64,
  },
  spotlightIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  spotlightIcon: {
    width: 28,
    height: 28,
  },
  spotlightNotificationDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.background,
  },
  spotlightLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMain,
    textAlign: "center",
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
  celebHeader: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  celebTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.3,
  },
  celebSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  celebEmpty: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
  },
  celebEmptyText: {
    fontSize: 12,
    color: colors.textSubtle,
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
