import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from "react-native";
import { Play, Pause } from "lucide-react-native";
import { useVideoPlayer, VideoView } from "expo-video";

export type HeroMediaItem =
  | { type: "image"; uri: string; caption?: string }
  | { type: "video"; uri: string; poster?: string; caption?: string };

interface HeroMediaBannerProps {
  items: HeroMediaItem[];
  height?: number;
  autoPlayInterval?: number; // ms between slides; 0 disables
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const VideoSlide = ({
  item,
  width,
  height,
  active,
}: {
  item: Extract<HeroMediaItem, { type: "video" }>;
  width: number;
  height: number;
  active: boolean;
}) => {
  const player = useVideoPlayer(item.uri, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback(() => {
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  }, [playing, player]);

  // Auto-pause when slide moves away
  React.useEffect(() => {
    if (!active && playing) {
      player.pause();
      setPlaying(false);
    }
  }, [active, playing, player]);

  return (
    <View style={{ width, height, backgroundColor: "#000" }}>
      <VideoView
        style={{ width, height }}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={toggle}
        style={styles.playOverlay}
      >
        <View style={styles.playCircle}>
          {playing ? (
            <Pause size={26} color="#FFF" fill="#FFF" />
          ) : (
            <Play size={26} color="#FFF" fill="#FFF" style={{ marginLeft: 3 }} />
          )}
        </View>
      </TouchableOpacity>
      {item.caption ? (
        <View style={styles.captionBox}>
          <Text style={styles.captionText} numberOfLines={2}>
            {item.caption}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export const HeroMediaBanner: React.FC<HeroMediaBannerProps> = ({
  items,
  height = 240,
  autoPlayInterval = 4500,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const width = SCREEN_WIDTH;

  // Auto-advance — skip if current slide is a video and is playing (no easy way to know),
  // but keeping simple: just rotate when more than 1 item.
  React.useEffect(() => {
    if (!autoPlayInterval || items.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((curr) => {
        const next = (curr + 1) % items.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlayInterval, items.length, width]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  if (!items.length) return null;

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {items.map((item, idx) => {
          if (item.type === "video") {
            return (
              <VideoSlide
                key={`${item.uri}-${idx}`}
                item={item}
                width={width}
                height={height}
                active={activeIndex === idx}
              />
            );
          }
          return (
            <View key={`${item.uri}-${idx}`} style={{ width, height }}>
              <Image
                source={{ uri: item.uri }}
                style={{ width, height }}
                resizeMode="cover"
              />
              {item.caption ? (
                <View style={styles.captionBox}>
                  <Text style={styles.captionText} numberOfLines={2}>
                    {item.caption}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Pagination dots */}
      {items.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {items.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                activeIndex === idx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  captionBox: {
    position: "absolute",
    left: 20,
    bottom: 28,
    maxWidth: "70%",
  },
  captionText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
});

export default HeroMediaBanner;
