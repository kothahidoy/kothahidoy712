import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, ChevronRight, Search, Share2, Star, Zap } from "lucide-react-native";

import { AC_APPLIANCE_SUB_SERVICES, SERVICES } from "@/src/data/seed";
import { colors, radius } from "@/src/theme";
import { Service, SubService } from "@/src/types";

export default function SubServiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [subService, setSubService] = useState<SubService | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");

  useEffect(() => {
    if (!id) return;
    
    // Find the sub-service
    const found = AC_APPLIANCE_SUB_SERVICES.find((s) => s.id === id);
    setSubService(found ?? null);
    
    // Get services for this sub-service (for now, use AC services as placeholder)
    if (found?.categoryId === "ac-repair") {
      const acServices = SERVICES.filter((s) => s.categoryId === "ac-repair");
      setServices(acServices);
    }
  }, [id]);

  const serviceTypes = [
    { id: "all", label: "All" },
    { id: "service", label: "Service" },
    { id: "repair", label: "Repair & gas refill" },
    { id: "install", label: "Installation" },
  ];

  const formatReviewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{subService?.name ?? "Service"}</Text>
          <View style={styles.instantBadge}>
            <Zap size={12} color="#059669" fill="#059669" />
            <Text style={styles.instantText}>Pro arrives in 48 mins</Text>
          </View>
        </View>
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
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>FREE GAS CHECK</Text>
            <Text style={styles.heroTitle}>
              {subService?.name} diagnosis{"\n"}with Co-pilot
            </Text>
            <Text style={styles.heroSubtitle}>No gas refill without a reading</Text>
          </View>
          <Image
            source={{ uri: subService?.imageUrl }}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* Rating & Booking Section */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingLeft}>
            <Text style={styles.serviceName}>{subService?.name}</Text>
            <View style={styles.ratingRow}>
              <Star size={14} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.ratingText}>
                {subService?.rating ?? 4.7} ({subService?.bookingCount ?? "1M"} bookings)
              </Text>
            </View>
          </View>
          <View style={styles.instantCard}>
            <View style={styles.instantCardBadge}>
              <Zap size={10} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.instantCardBadgeText}>Instant</Text>
            </View>
            <Text style={styles.instantCardTime}>In 48 mins</Text>
          </View>
        </View>

        {/* Warranty Section */}
        <TouchableOpacity style={styles.warrantyCard}>
          <View style={styles.warrantyLeft}>
            <View style={styles.warrantyIcon}>
              <Check size={14} color="#059669" />
            </View>
            <View>
              <Text style={styles.warrantyLabel}>MFIXIT COVER</Text>
              <Text style={styles.warrantyText}>Upto 30 days warranty on repairs</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Service Types Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.serviceTypesScroll}
          contentContainerStyle={styles.serviceTypesContent}
        >
          {serviceTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.serviceTypeCard,
                selectedServiceType === type.id && styles.serviceTypeCardActive,
              ]}
              onPress={() => setSelectedServiceType(type.id)}
            >
              <View style={styles.serviceTypeImageContainer}>
                <Image
                  source={{ uri: subService?.imageUrl }}
                  style={styles.serviceTypeImage}
                  resizeMode="cover"
                />
                {type.id === "all" && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>Upto</Text>
                    <Text style={styles.discountBadgePercent}>30%</Text>
                    <Text style={styles.discountBadgeText}>OFF</Text>
                  </View>
                )}
              </View>
              <Text style={styles.serviceTypeLabel} numberOfLines={2}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Services List */}
        <View style={styles.servicesSection}>
          <Text style={styles.servicesSectionTitle}>Service</Text>
          
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              {/* Service Header Banner */}
              <View style={styles.serviceCardBanner}>
                <View style={styles.freeCheckBadge}>
                  <Text style={styles.freeCheckText}>Free gas check</Text>
                </View>
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTextContent}>
                    <Text style={styles.bannerTitle}>Foam-jet{"\n"}AC service</Text>
                    <Text style={styles.bannerSubtitle}>Deep clean AC vents{"\n"}for efficient cooling</Text>
                  </View>
                  <Image
                    source={{ uri: service.image }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Service Details */}
              <View style={styles.serviceDetails}>
                <View style={styles.serviceDetailsLeft}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <View style={styles.serviceRatingRow}>
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.serviceRating}>
                      {service.rating} ({formatReviewCount(service.reviewCount)} reviews)
                    </Text>
                  </View>
                  <View style={styles.servicePriceRow}>
                    <Text style={styles.servicePrice}>₹{service.startingPrice}</Text>
                    <Text style={styles.serviceOriginalPrice}>
                      ₹{Math.round(service.startingPrice * 1.1)}
                    </Text>
                    <Text style={styles.serviceDuration}>• {service.durationMins} mins</Text>
                  </View>
                  {service.startingPrice > 400 && (
                    <Text style={styles.servicePricePerUnit}>
                      ₹{Math.round(service.startingPrice / 2)}/AC
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => router.push(`/service/${service.id}`)}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Service Inclusions */}
              {service.inclusions && (
                <View style={styles.inclusionsList}>
                  {service.inclusions.slice(0, 2).map((inc, idx) => (
                    <View key={idx} style={styles.inclusionItem}>
                      <Text style={styles.inclusionBullet}>•</Text>
                      <Text style={styles.inclusionText}>{inc}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* View Details Link */}
              <TouchableOpacity 
                style={styles.viewDetailsBtn}
                onPress={() => router.push(`/service/${service.id}`)}
              >
                <Text style={styles.viewDetailsText}>View details</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.bookNowBtn}
          onPress={() => {
            if (services.length > 0) {
              router.push(`/service/${services[0].id}`);
            }
          }}
        >
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
  },
  instantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  instantText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
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
  },
  heroBanner: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: radius.xl,
    alignItems: "center",
  },
  heroContent: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textMain,
    lineHeight: 26,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  heroImage: {
    width: 100,
    height: 100,
  },
  ratingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  ratingLeft: {},
  serviceName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textMain,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  instantCard: {
    alignItems: "flex-end",
  },
  instantCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  instantCardBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  instantCardTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  warrantyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warrantyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  warrantyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  warrantyLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  warrantyText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMain,
  },
  serviceTypesScroll: {
    marginTop: 20,
  },
  serviceTypesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  serviceTypeCard: {
    alignItems: "center",
    width: 80,
  },
  serviceTypeCardActive: {},
  serviceTypeImageContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  serviceTypeImage: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
  },
  discountBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
  },
  discountBadgeText: {
    fontSize: 9,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  discountBadgePercent: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  serviceTypeLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMain,
    textAlign: "center",
    lineHeight: 14,
  },
  servicesSection: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  servicesSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  serviceCardBanner: {
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  freeCheckBadge: {
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  freeCheckText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerTextContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textMain,
    lineHeight: 26,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  bannerImage: {
    width: 100,
    height: 80,
    borderRadius: radius.md,
  },
  serviceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
  },
  serviceDetailsLeft: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 6,
  },
  serviceRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  serviceRating: {
    fontSize: 12,
    color: colors.textMuted,
  },
  servicePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
  },
  serviceOriginalPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  serviceDuration: {
    fontSize: 12,
    color: colors.textMuted,
  },
  servicePricePerUnit: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
    marginTop: 4,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  inclusionsList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  inclusionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  inclusionBullet: {
    fontSize: 14,
    color: colors.textMuted,
  },
  inclusionText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  viewDetailsBtn: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    paddingBottom: 32,
  },
  bookNowBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  bookNowText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
