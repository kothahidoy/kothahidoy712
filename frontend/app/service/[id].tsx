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
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  Share2,
  Star,
} from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { ServiceCard } from "@/src/components/ServiceCard";
import { dataService } from "@/src/data/service";
import { colors, radius, shadow } from "@/src/theme";
import { Service } from "@/src/types";

const FAKE_REVIEWS = [
  {
    name: "Anika Roy",
    rating: 5,
    text: "Came on time, did the job perfectly. Will book again!",
    when: "2 days ago",
  },
  {
    name: "Rahul Mishra",
    rating: 5,
    text: "Polite, fast & cleaned up after the work. Highly recommend.",
    when: "5 days ago",
  },
  {
    name: "Mou Banerjee",
    rating: 4,
    text: "Great service, fair price. Took a bit longer than expected.",
    when: "1 week ago",
  },
];

export default function ServiceDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [related, setRelated] = useState<Service[]>([]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const s = await dataService.getServiceById(id);
      setService(s ?? null);
      if (s) {
        const all = await dataService.getServicesByCategory(s.categoryId);
        setRelated(all.filter((x) => x.id !== s.id).slice(0, 6));
      }
    })();
  }, [id]);

  if (!service) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ padding: 20 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Image source={{ uri: service.image }} style={styles.hero} />
          <SafeAreaView edges={["top"]} style={styles.heroOverlay}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.back()}
              hitSlop={12}
              testID="svc-back-btn"
            >
              <ArrowLeft size={22} color={colors.textMain} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} hitSlop={12} testID="svc-share-btn">
              <Share2 size={20} color={colors.textMain} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{service.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingPill}>
              <Star size={12} color={colors.star} fill={colors.star} />
              <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
              <Text style={styles.reviewText}>· {service.reviewCount} reviews</Text>
            </View>
            <View style={styles.durationPill}>
              <Clock size={12} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.durationText}>{service.durationMins} min</Text>
            </View>
          </View>

          <Text style={styles.desc}>{service.description}</Text>

          {service.inclusions && service.inclusions.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What&apos;s included</Text>
              {service.inclusions.map((inc) => (
                <View key={inc} style={styles.incRow}>
                  <View style={styles.incCheck}>
                    <Check size={12} color={colors.success} strokeWidth={3} />
                  </View>
                  <Text style={styles.incText}>{inc}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Mfixit</Text>
            <View style={styles.trustGrid}>
              {[
                { icon: BadgeCheck, label: "Verified pros" },
                { icon: Clock, label: "On-time arrival" },
                { icon: Star, label: "Top-rated work" },
                { icon: Check, label: "30-day warranty" },
              ].map((t) => (
                <View key={t.label} style={styles.trustCard}>
                  <t.icon size={18} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.trustLabel}>{t.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Customer reviews</Text>
              <Text style={styles.sectionLink}>See all</Text>
            </View>
            {FAKE_REVIEWS.map((r) => (
              <View key={r.name} style={styles.review}>
                <View style={styles.reviewHead}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewInitial}>{r.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>{r.name}</Text>
                    <Text style={styles.reviewWhen}>{r.when}</Text>
                  </View>
                  <View style={styles.reviewStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        color={i < r.rating ? colors.star : colors.border}
                        fill={i < r.rating ? colors.star : "transparent"}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText2}>{r.text}</Text>
              </View>
            ))}
          </View>

          {related.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Related services</Text>
              <FlatList
                data={related}
                keyExtractor={(s) => s.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 12 }}
                renderItem={({ item }) => (
                  <ServiceCard
                    service={item}
                    onPress={() => router.replace(`/service/${item.id}`)}
                  />
                )}
              />
            </View>
          ) : null}

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <SafeAreaView edges={["bottom"]} style={styles.cta}>
        <View style={styles.ctaInner}>
          <View>
            <Text style={styles.ctaLabel}>Starts at</Text>
            <Text style={styles.ctaPrice}>₹{service.startingPrice}</Text>
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <PrimaryButton
              label="Book Now"
              onPress={() =>
                router.push({
                  pathname: "/booking/new",
                  params: { serviceId: service.id },
                })
              }
              testID="svc-book-now-btn"
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { width: "100%", height: 280 },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  body: {
    padding: 20,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.3,
  },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  ratingText: { fontSize: 12, fontWeight: "800", color: colors.success },
  reviewText: { fontSize: 11, color: colors.success, fontWeight: "500" },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  desc: {
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 22,
    marginTop: 16,
  },
  section: { marginTop: 24 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.textMain },
  sectionLink: { fontSize: 12, color: colors.primary, fontWeight: "700" },
  incRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  incCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  incText: { fontSize: 14, color: colors.textMain, fontWeight: "500" },
  trustGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  trustCard: {
    flexBasis: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trustLabel: { fontSize: 13, fontWeight: "600", color: colors.textMain },
  review: {
    marginTop: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewInitial: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  reviewName: { fontWeight: "700", color: colors.textMain, fontSize: 13 },
  reviewWhen: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  reviewStars: { flexDirection: "row", gap: 1 },
  reviewText2: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 19,
  },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.bottomNav,
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
  },
  ctaLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  ctaPrice: { fontSize: 22, fontWeight: "800", color: colors.textMain, marginTop: 2 },
});
