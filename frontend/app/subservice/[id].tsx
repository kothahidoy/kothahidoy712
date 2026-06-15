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
import { 
  ArrowLeft, Check, ChevronDown, ChevronRight, ChevronUp, 
  FileText, Headphones, Search, Share2, Shield, Star, 
  Umbrella, Wrench, Zap 
} from "lucide-react-native";

import { AC_APPLIANCE_SUB_SERVICES, SERVICES } from "@/src/data/seed";
import { colors, radius } from "@/src/theme";
import { Service, SubService } from "@/src/types";

// Different service types for each appliance
const SERVICE_TYPES_CONFIG: Record<string, { id: string; label: string; image?: string }[]> = {
  "sub-ac": [
    { id: "annual", label: "Annual plan" },
    { id: "service", label: "Service" },
    { id: "repair", label: "Repair & gas refill" },
    { id: "install", label: "Installation/ uninstallation" },
  ],
  "sub-washing": [
    { id: "repair", label: "Repair" },
  ],
  "sub-refrigerator": [
    { id: "repair", label: "Repair" },
  ],
  "sub-tv": [
    { id: "repair", label: "Repair" },
    { id: "install", label: "Installation" },
  ],
  "sub-chimney": [
    { id: "service", label: "Service" },
    { id: "repair", label: "Repair" },
  ],
  "sub-microwave": [
    { id: "repair", label: "Repair" },
  ],
  "sub-geyser": [
    { id: "repair", label: "Repair" },
    { id: "install", label: "Installation" },
  ],
  "sub-water-purifier": [
    { id: "service", label: "Service" },
    { id: "repair", label: "Repair" },
    { id: "install", label: "Installation" },
  ],
  "sub-cooler": [
    { id: "service", label: "Service" },
    { id: "repair", label: "Repair" },
  ],
  "sub-stove": [
    { id: "service", label: "Service" },
    { id: "repair", label: "Repair" },
  ],
};

// Hero banner config for each appliance
const HERO_BANNER_CONFIG: Record<string, { label: string; title: string; subtitle: string; image: string }> = {
  "sub-ac": {
    label: "FREE GAS CHECK",
    title: "AC diagnosis\nwith Co-pilot",
    subtitle: "No gas refill without a reading",
    image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=200&q=80",
  },
  "sub-washing": {
    label: "EXPERT REPAIR",
    title: "Washing Machine\nRepair",
    subtitle: "₹199 visitation fee adjusted in final quote",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=200&q=80",
  },
  "sub-refrigerator": {
    label: "QUICK FIX",
    title: "Refrigerator\nCheck-up",
    subtitle: "Same day service available",
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=200&q=80",
  },
  "sub-tv": {
    label: "PROFESSIONAL",
    title: "TV Installation\n& Repair",
    subtitle: "Wall mounting & troubleshooting",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=200&q=80",
  },
  "sub-cooler": {
    label: "SUMMER SPECIAL",
    title: "Air Cooler\nService",
    subtitle: "Complete cleaning & repair",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80",
  },
};

// Quick service cards for different appliances (like No power, No cooling)
const QUICK_SERVICES: Record<string, { id: string; name: string; rating: number; reviews: string; price: number }[]> = {
  "sub-refrigerator": [
    { id: "no-power", name: "No power", rating: 4.80, reviews: "14K", price: 199 },
    { id: "no-cooling", name: "No cooling", rating: 4.80, reviews: "27K", price: 199 },
    { id: "frost-forming", name: "Excess frost", rating: 4.82, reviews: "8K", price: 199 },
    { id: "water-leak", name: "Water leakage", rating: 4.75, reviews: "5K", price: 199 },
  ],
  "sub-washing": [
    { id: "top-load", name: "Top load check-up", rating: 4.77, reviews: "375K", price: 199 },
    { id: "front-load", name: "Front load check-up", rating: 4.75, reviews: "164K", price: 199 },
  ],
};

// Stove-specific services data
const STOVE_SERVICES = {
  service: [
    {
      id: "stove-steam-service",
      title: "Gas stove steam service",
      rating: 4.69,
      reviews: "35K",
      price: 299,
      description: "Cleanup of burners, nozzles & internal parts with steam machine",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80",
      options: 3,
    },
  ],
  repair: [
    {
      id: "stove-checkup",
      title: "Gas stove check-up",
      rating: 4.77,
      reviews: "39K",
      price: 99,
      duration: 45,
      description: "Repairs for issues like low flame, gas leakage, knob, pipe issues & other faults",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80",
      options: 5,
    },
  ],
};

// FAQ data
const FAQ_DATA = [
  {
    question: "Does the cost include spare parts?",
    answer: "No, spare parts are charged separately at fixed rates. Our technician will provide a quote before any repair work.",
  },
  {
    question: "What if the issue is not resolved?",
    answer: "We offer up to 30 days warranty on repairs. If the same issue persists, we'll fix it free of cost.",
  },
  {
    question: "How do I reschedule or cancel?",
    answer: "You can reschedule or cancel your booking from the 'My Bookings' section up to 2 hours before the scheduled time.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept Cash, UPI, Credit/Debit cards, and Razorpay for secure online payments.",
  },
];

// Our Process steps
const PROCESS_STEPS = [
  {
    step: 1,
    title: "Inspection & quote",
    description: "We inspect the appliance & share a repair quote for approval",
  },
  {
    step: 2,
    title: "Approval or expert review",
    description: "Repair begins after your approval, if you are unsure you can call our expert",
  },
  {
    step: 3,
    title: "Repair & spare parts",
    description: "If needed, we will source spare parts at fixed rates for the repair",
  },
  {
    step: 4,
    title: "Warranty activation",
    description: "Your appliance will automatically come under 30 days warranty after the repair",
  },
];

export default function SubServiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [subService, setSubService] = useState<SubService | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const found = AC_APPLIANCE_SUB_SERVICES.find((s) => s.id === id);
    setSubService(found ?? null);
    
    if (found?.categoryId === "ac-repair") {
      const acServices = SERVICES.filter((s) => s.categoryId === "ac-repair");
      setServices(acServices);
    }
  }, [id]);

  const serviceTypes = SERVICE_TYPES_CONFIG[id as string] || [{ id: "repair", label: "Repair" }];
  const heroBanner = HERO_BANNER_CONFIG[id as string];
  const quickServices = QUICK_SERVICES[id as string];
  const hasHeroBanner = !!heroBanner;

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
          {subService?.estimatedMins && (
            <View style={styles.instantBadge}>
              <Zap size={12} color="#059669" fill="#059669" />
              <Text style={styles.instantText}>Pro arrives in {subService.estimatedMins} mins</Text>
            </View>
          )}
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
        {/* Hero Banner - Changeable per appliance */}
        {hasHeroBanner && (
          <View style={styles.heroBanner}>
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>{heroBanner.label}</Text>
              <Text style={styles.heroTitle}>{heroBanner.title}</Text>
              <Text style={styles.heroSubtitle}>{heroBanner.subtitle}</Text>
            </View>
            <Image
              source={{ uri: heroBanner.image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
        )}

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
            <Text style={styles.instantCardTime}>In {subService?.estimatedMins ?? 45} mins</Text>
          </View>
        </View>

        {/* Warranty/Standard Rate Card */}
        <TouchableOpacity style={styles.warrantyCard}>
          <View style={styles.warrantyLeft}>
            <View style={styles.warrantyIcon}>
              <Check size={14} color="#059669" />
            </View>
            <View>
              <Text style={styles.warrantyLabel}>MFIXIT COVER</Text>
              <Text style={styles.warrantyText}>Standard rate card</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Service Types - Different per appliance */}
        {serviceTypes.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.serviceTypesScroll}
            contentContainerStyle={styles.serviceTypesContent}
          >
            {serviceTypes.map((type, index) => (
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
                  {index === 0 && (
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
        )}

        {/* Quick Service Cards (for Refrigerator, Washing Machine style) */}
        {quickServices && (
          <View style={styles.quickServicesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickServicesScroll}
            >
              {quickServices.map((qs) => (
                <TouchableOpacity 
                  key={qs.id} 
                  style={styles.quickServiceCard}
                  onPress={() => router.push(`/service/${qs.id}`)}
                >
                  <Text style={styles.quickServiceName}>{qs.name}</Text>
                  <View style={styles.quickServiceRating}>
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.quickServiceRatingText}>
                      {qs.rating} ({qs.reviews} reviews)
                    </Text>
                  </View>
                  <Text style={styles.quickServicePrice}>₹{qs.price}</Text>
                  <TouchableOpacity style={styles.quickServiceAddBtn}>
                    <Text style={styles.quickServiceAddText}>Add</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stove-specific Services (Service + Repair sections) */}
        {id === "sub-stove" && (
          <>
            {/* Service Section */}
            <View style={styles.servicesSection}>
              <Text style={styles.servicesSectionTitle}>Service</Text>
              {STOVE_SERVICES.service.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceCardContent}>
                    <View style={styles.serviceDetailsLeft}>
                      <Text style={styles.serviceTitle}>{service.title}</Text>
                      <View style={styles.serviceRatingRow}>
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text style={styles.serviceRating}>
                          {service.rating} ({service.reviews} reviews)
                        </Text>
                      </View>
                      <Text style={styles.serviceStartsAt}>₹{service.price}</Text>
                      <View style={styles.inclusionsList}>
                        <View style={styles.inclusionItem}>
                          <Text style={styles.inclusionBullet}>•</Text>
                          <Text style={styles.inclusionText}>{service.description}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => router.push(`/servicedetail/${service.id}`)}>
                        <Text style={styles.viewDetailsText}>View details</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.serviceCardRight}>
                      <Image
                        source={{ uri: service.image }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => router.push(`/servicedetail/${service.id}`)}
                      >
                        <Text style={styles.addButtonText}>Add</Text>
                      </TouchableOpacity>
                      <Text style={styles.optionsText}>{service.options} options</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Repair Section */}
            <View style={styles.servicesSection}>
              <Text style={styles.servicesSectionTitle}>Repair</Text>
              {STOVE_SERVICES.repair.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceCardContent}>
                    <View style={styles.serviceDetailsLeft}>
                      <Text style={styles.serviceTitle}>{service.title}</Text>
                      <View style={styles.serviceRatingRow}>
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text style={styles.serviceRating}>
                          {service.rating} ({service.reviews} reviews)
                        </Text>
                      </View>
                      <Text style={styles.serviceStartsAt}>₹{service.price} • {service.duration} mins</Text>
                      <View style={styles.inclusionsList}>
                        <View style={styles.inclusionItem}>
                          <Text style={styles.inclusionBullet}>•</Text>
                          <Text style={styles.inclusionText}>{service.description}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => router.push(`/servicedetail/${service.id}`)}>
                        <Text style={styles.viewDetailsText}>View details</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.serviceCardRight}>
                      <Image
                        source={{ uri: service.image }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => router.push(`/servicedetail/${service.id}`)}
                      >
                        <Text style={styles.addButtonText}>Add</Text>
                      </TouchableOpacity>
                      <Text style={styles.optionsText}>{service.options} options</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Services List */}
        <View style={styles.servicesSection}>
          <Text style={styles.servicesSectionTitle}>
            {selectedServiceType === "all" ? "All Services" : serviceTypes.find(t => t.id === selectedServiceType)?.label || "Services"}
          </Text>
          
          {services.map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceCard}
              onPress={() => router.push(`/service/${service.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.serviceCardContent}>
                <View style={styles.serviceDetailsLeft}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <View style={styles.serviceRatingRow}>
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.serviceRating}>
                      {service.rating} ({formatReviewCount(service.reviewCount)} reviews)
                    </Text>
                  </View>
                  <Text style={styles.serviceStartsAt}>Starts at ₹{service.startingPrice}</Text>
                  
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
                  
                  <TouchableOpacity onPress={() => router.push(`/service/${service.id}`)}>
                    <Text style={styles.viewDetailsText}>View details</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.serviceCardRight}>
                  <Image
                    source={{ uri: service.image }}
                    style={styles.serviceImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => router.push(`/service/${service.id}`)}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                  <Text style={styles.optionsText}>6 options</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Our Process Section */}
        <View style={styles.processSection}>
          <Text style={styles.sectionTitle}>Our process</Text>
          {PROCESS_STEPS.map((step, index) => (
            <View key={step.step} style={styles.processStep}>
              <View style={styles.processStepLeft}>
                <View style={styles.processStepNumber}>
                  <Text style={styles.processStepNumberText}>{step.step}</Text>
                </View>
                {index < PROCESS_STEPS.length - 1 && <View style={styles.processLine} />}
              </View>
              <View style={styles.processStepContent}>
                <Text style={styles.processStepTitle}>{step.title}</Text>
                <Text style={styles.processStepDesc}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top Technicians Section */}
        <View style={styles.techniciansSection}>
          <Text style={styles.sectionTitle}>Top technicians</Text>
          <View style={styles.technicianCard}>
            <View style={styles.technicianFeatures}>
              <View style={styles.technicianFeature}>
                <Shield size={18} color={colors.textMain} />
                <Text style={styles.technicianFeatureText}>Background verified</Text>
              </View>
              <View style={styles.technicianFeature}>
                <Wrench size={18} color={colors.textMain} />
                <Text style={styles.technicianFeatureText}>Trained across all major brands</Text>
              </View>
              <View style={styles.technicianFeature}>
                <Check size={18} color={colors.textMain} />
                <Text style={styles.technicianFeatureText}>Certified under Skill India Programme</Text>
              </View>
            </View>
            <View style={styles.technicianImageWrapper}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" }}
                style={styles.technicianImage}
                resizeMode="cover"
              />
              {/* Blue T-shirt with MFIXIT logo overlay */}
              <View style={styles.mfixitTshirtBadge}>
                <Text style={styles.mfixitTshirtText}>MFIXIT</Text>
              </View>
            </View>
          </View>
        </View>

        {/* MFIXIT Cover Promise */}
        <View style={styles.promiseSection}>
          <View style={styles.promiseHeader}>
            <Check size={18} color="#7C3AED" />
            <Text style={styles.promiseTitle}>
              <Text style={styles.promiseBrand}>mfixit cover</Text> promise
            </Text>
          </View>
          <View style={styles.promiseList}>
            <View style={styles.promiseItem}>
              <Shield size={18} color={colors.textMain} />
              <Text style={styles.promiseText}>Up to 30 days warranty</Text>
            </View>
            <View style={styles.promiseItem}>
              <Umbrella size={18} color={colors.textMain} />
              <Text style={styles.promiseText}>Up to ₹10,000 damage cover</Text>
            </View>
            <View style={styles.promiseItem}>
              <FileText size={18} color={colors.textMain} />
              <Text style={styles.promiseText}>Fixed rate card</Text>
            </View>
            <View style={styles.promiseItem}>
              <Headphones size={18} color={colors.textMain} />
              <Text style={styles.promiseText}>On call repair quote verification</Text>
            </View>
          </View>
        </View>

        {/* What is not included */}
        <View style={styles.notIncludedSection}>
          <Text style={styles.sectionTitle}>What is not included</Text>
          <View style={styles.notIncludedItem}>
            <Text style={styles.notIncludedX}>✕</Text>
            <Text style={styles.notIncludedText}>Replacement or installation of switchboard</Text>
          </View>
          <View style={styles.notIncludedItem}>
            <Text style={styles.notIncludedX}>✕</Text>
            <Text style={styles.notIncludedText}>Repair of commercial appliances</Text>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          {FAQ_DATA.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedFaq === index ? (
                  <ChevronUp size={20} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={20} color={colors.textMuted} />
                )}
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
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
    backgroundColor: "#F1F5F9",
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
    borderRadius: radius.lg,
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
    color: "#7C3AED",
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
    width: 85,
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
    width: 72,
    height: 72,
    borderRadius: radius.lg,
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
  quickServicesSection: {
    marginTop: 24,
  },
  quickServicesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  quickServiceCard: {
    width: 160,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  quickServiceName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 6,
  },
  quickServiceRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  quickServiceRatingText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  quickServicePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 12,
  },
  quickServiceAddBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 8,
    alignItems: "center",
  },
  quickServiceAddText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  servicesSection: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  servicesSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textMain,
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    padding: 16,
  },
  serviceCardContent: {
    flexDirection: "row",
  },
  serviceDetailsLeft: {
    flex: 1,
    paddingRight: 12,
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
  serviceStartsAt: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMain,
    marginBottom: 12,
  },
  inclusionsList: {
    marginBottom: 12,
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
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  serviceCardRight: {
    alignItems: "center",
    width: 100,
  },
  serviceImage: {
    width: 90,
    height: 90,
    borderRadius: radius.lg,
    marginBottom: 8,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  optionsText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  processSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#1F2937",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textMain,
    marginBottom: 20,
  },
  processStep: {
    flexDirection: "row",
    marginBottom: 20,
  },
  processStepLeft: {
    alignItems: "center",
    width: 40,
  },
  processStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  processStepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  processLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#374151",
    marginTop: 8,
  },
  processStepContent: {
    flex: 1,
    paddingLeft: 12,
  },
  processStepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  processStepDesc: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
  },
  techniciansSection: {
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#F8FAFC",
  },
  technicianCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  technicianFeatures: {
    flex: 1,
  },
  technicianFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  technicianFeatureText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMain,
  },
  technicianImageWrapper: {
    position: "relative",
  },
  technicianImage: {
    width: 120,
    height: 140,
    borderRadius: radius.lg,
  },
  mfixitTshirtBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: "center",
  },
  mfixitTshirtText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  promiseSection: {
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
  },
  promiseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  promiseTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textMain,
  },
  promiseBrand: {
    color: "#7C3AED",
  },
  promiseList: {},
  promiseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  promiseText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textMain,
  },
  notIncludedSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#F8FAFC",
  },
  notIncludedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  notIncludedX: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
  },
  notIncludedText: {
    fontSize: 14,
    color: colors.textMain,
    flex: 1,
  },
  faqSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 16,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMain,
    flex: 1,
    paddingRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
    lineHeight: 20,
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
