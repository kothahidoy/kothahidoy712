/**
 * HeroPromoCarousel
 * ──────────────────────────────────────────────────────────────────────
 * Auto-swipeable carousel of promo slides for the customer home screen.
 * Supports IMAGE and VIDEO slides, sourced from `/api/admin/cms/home-promos`.
 *
 * - Auto-advances every 4s (pauses 8s after user touch)
 * - Page indicator dots
 * - Tap any slide → router.push(link_url) (internal route)
 * - Returns null (empty) when no active slides exist (caller can show fallback)
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { VideoView, useVideoPlayer } from "expo-video";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32; // matches existing heroPromoCard margin of 16 each side
const AUTO_ADVANCE_MS = 4000;
const PAUSE_AFTER_TOUCH_MS = 8000;

export type HomePromoSlide = {
  id: string;
  title: string;
  subtitle?: string | null;
  price?: string | null;
  original_price?: string | null;
  discount_label?: string | null;
  badge_emoji?: string | null;
  cta_text?: string | null;
  link_url?: string | null;
  media_type?: "image" | "video" | null;
  media_url: string;
  poster_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  /** When false, hide title/subtitle/price/discount/CTA and render the media full-bleed. */
  show_overlay?: boolean;
};

interface Props {
  slides: HomePromoSlide[];
}

export default function HeroPromoCarousel({ slides }: Props) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const pausedUntilRef = useRef<number>(0);

  const goTo = useCallback((idx: number, animated = true) => {
    if (!slides.length) return;
    const safe = ((idx % slides.length) + slides.length) % slides.length;
    scrollRef.current?.scrollTo({ x: safe * CARD_WIDTH, animated });
    setActiveIndex(safe);
  }, [slides.length]);

  // Auto-advance interval
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      if (Date.now() < pausedUntilRef.current) return;
      goTo(activeIndex + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [activeIndex, slides.length, goTo]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / CARD_WIDTH);
    if (idx !== activeIndex && idx >= 0 && idx < slides.length) setActiveIndex(idx);
  };

  const onTouchStart = () => {
    pausedUntilRef.current = Date.now() + PAUSE_AFTER_TOUCH_MS;
  };

  const handlePress = (s: HomePromoSlide) => {
    if (!s.link_url) return;
    try {
      router.push(s.link_url as any);
    } catch {
      /* invalid route */
    }
  };

  if (!slides || slides.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onTouchStart={onTouchStart}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
      >
        {slides.map((s) => (
          <Slide key={s.id} slide={s} onPress={() => handlePress(s)} />
        ))}
      </ScrollView>

      {slides.length > 1 && (
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface SlideProps {
  slide: HomePromoSlide;
  onPress: () => void;
}

function Slide({ slide, onPress }: SlideProps) {
  const isVideo = slide.media_type === "video";
  // Default: overlay shown. Explicit false hides title/price/Book button and
  // makes the media fill the whole card.
  const overlayOn = slide.show_overlay !== false;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { width: CARD_WIDTH }]}
    >
      {overlayOn && (
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {slide.title}
          </Text>

          {!!slide.subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {slide.subtitle}
            </Text>
          )}

          {!!slide.price && (
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>{slide.price}</Text>
              {!!slide.original_price && (
                <Text style={styles.originalPrice}>{slide.original_price}</Text>
              )}
            </View>
          )}

          {!!slide.discount_label && (
            <View style={styles.discountRow}>
              <Text style={styles.discountText}>
                {(slide.badge_emoji || "🏷️") + " " + slide.discount_label}
              </Text>
            </View>
          )}

          {!!slide.cta_text && (
            <View style={styles.ctaBtn}>
              <Text style={styles.ctaText}>{slide.cta_text}</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </View>
          )}
        </View>
      )}

      {isVideo ? (
        <SlideVideo
          uri={slide.media_url}
          poster={slide.poster_url || undefined}
          fullBleed={!overlayOn}
        />
      ) : (
        <Image
          source={{ uri: slide.media_url }}
          style={overlayOn ? styles.media : styles.mediaFull}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
}

function SlideVideo({
  uri,
  poster,
  fullBleed = false,
}: {
  uri: string;
  poster?: string;
  fullBleed?: boolean;
}) {
  // ─── WEB BRANCH ───────────────────────────────────────────────────────
  // Use an imperatively-attached <video> DOM element — avoids the expo-video
  // autoplay race on web that left the banner blank.
  const hostRef = useRef<any>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const host: HTMLDivElement | null = hostRef.current;
    if (!host) return;

    const vid = document.createElement("video");
    if (poster) vid.poster = poster;
    vid.autoplay = true;
    vid.muted = true;
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
    vid.style.backgroundColor = "#E5E7EB";

    host.appendChild(vid);
    vid.src = uri;
    vid.load();
    videoElRef.current = vid;

    let played = false;
    const tryPlay = () => {
      if (played) return;
      played = true;
      const p = vid.play();
      if (p && typeof (p as any).catch === "function") {
        (p as any).catch(() => { played = false; });
      }
    };
    vid.addEventListener("canplaythrough", tryPlay, { once: true });
    const fb1 = setTimeout(tryPlay, 1500);
    const fb2 = setTimeout(tryPlay, 4000);

    return () => {
      clearTimeout(fb1);
      clearTimeout(fb2);
      try {
        vid.pause();
        vid.removeAttribute("src");
        vid.load();
      } catch {}
      if (vid.parentNode) vid.parentNode.removeChild(vid);
      videoElRef.current = null;
    };
  }, [uri, poster]);

  if (Platform.OS === "web") {
    return (
      <View style={fullBleed ? styles.mediaFull : styles.media}>
        {/* @ts-ignore — raw div host for imperative <video> */}
        {React.createElement("div", {
          ref: hostRef,
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            backgroundColor: "#E5E7EB",
          } as any,
        })}
      </View>
    );
  }

  // ─── NATIVE BRANCH (iOS / Android) ────────────────────────────────────
  return <NativeSlideVideo uri={uri} poster={poster} fullBleed={fullBleed} />;
}

function NativeSlideVideo({
  uri,
  poster,
  fullBleed = false,
}: {
  uri: string;
  poster?: string;
  fullBleed?: boolean;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={fullBleed ? styles.mediaFull : styles.media}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject as any}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
      {!!poster && (
        <Image
          source={{ uri: poster }}
          style={[StyleSheet.absoluteFillObject as any, { opacity: 0 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 130,
    marginRight: 0, // pagingEnabled handles spacing
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  originalPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discountRow: {
    marginTop: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  ctaBtn: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  media: {
    width: 140,
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  mediaFull: {
    width: "100%",
    height: "100%",
    minHeight: 160,
    backgroundColor: "#E5E7EB",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    width: 18,
    backgroundColor: "#FFFFFF",
  },
});
