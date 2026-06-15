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
  FileText, Headphones, Search, Shield, Star, 
  Umbrella, X 
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

// Service detail data
const SERVICE_DETAIL_CONFIG: Record<string, {
  title: string;
  rating: number;
  reviews: string;
  heroImage: string;
  options: { id: string; name: string; rating: number; reviews: string; price: number }[];
  process: { step: number; title: string; description: string }[];
  excluded: string[];
  brands: string[];
  faq: { question: string; answer: string }[];
}> = {
  "stove-steam-service": {
    title: "Gas stove steam service",
    rating: 4.69,
    reviews: "35K",
    heroImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
    options: [
      { id: "2-burner", name: "2 burners", rating: 4.73, reviews: "8K", price: 299 },
      { id: "3-burner", name: "3 burners", rating: 4.70, reviews: "12K", price: 349 },
      { id: "4-burner", name: "4+ burners", rating: 4.66, reviews: "6K", price: 399 },
    ],
    process: [
      {
        step: 1,
        title: "Inspection",
        description: "We will assess the gas stove to identify gas leaks, blockages or performance issues",
      },
      {
        step: 2,
        title: "Safe dismantling",
        description: "Turn off supply, dismantle stove, cover area to maintain hygiene during service",
      },
      {
        step: 3,
        title: "Deep steam service",
        description: "Advanced steam servicing of burners, nozzles & parts for better airflow & flame efficiency",
      },
      {
        step: 4,
        title: "Final testing & cleanup",
        description: "Functionality check followed by post-service cleanup",
      },
    ],
    excluded: [
      "Connection-level modifications including connection point changes, pipeline extensions, tapping/branching, and new PNG connections",
      "Alterations to fixed pipelines embedded within walls or forming parts of the building structure",
      "Changing or tampering with gas meters",
      "Modifications to pressure regulation systems",
    ],
    brands: ["Sunflame", "Pigeon", "KAFF", "Elica", "Faber", "Whirlpool", "Borosil", "Hafele", "Hindware", "Glen", "Prestige", "& more"],
    faq: [
      {
        question: "Does the cost include spare parts?",
        answer: "No, spare parts are charged separately at fixed rates. Our technician will provide a quote before any repair work.",
      },
      {
        question: "What is included in steam service?",
        answer: "Deep cleaning of burners, nozzles, drip trays, and internal components using industrial steam machine for thorough degreasing.",
      },
      {
        question: "How long does the service take?",
        answer: "Typically 45-60 minutes depending on the number of burners and condition of the stove.",
      },
      {
        question: "Do you service induction cooktops?",
        answer: "No, this service is specifically for gas stoves. For induction cooktops, please check our appliance repair section.",
      },
    ],
  },
  "stove-checkup": {
    title: "Gas stove check-up",
    rating: 4.77,
    reviews: "39K",
    heroImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
    options: [
      { id: "basic-checkup", name: "Basic check-up", rating: 4.75, reviews: "20K", price: 99 },
      { id: "full-repair", name: "Full repair", rating: 4.78, reviews: "15K", price: 299 },
    ],
    process: [
      {
        step: 1,
        title: "Issue diagnosis",
        description: "Identify the root cause of low flame, gas leakage, knob issues or other faults",
      },
      {
        step: 2,
        title: "Quote approval",
        description: "Share repair quote for your approval before starting any work",
      },
      {
        step: 3,
        title: "Repair work",
        description: "Fix the identified issues using quality spare parts at fixed rates",
      },
      {
        step: 4,
        title: "Testing & warranty",
        description: "Test all burners and activate 30-day warranty on repairs",
      },
    ],
    excluded: [
      "Replacement of entire stove unit",
      "Gas pipeline modifications",
      "Commercial kitchen equipment",
    ],
    brands: ["Sunflame", "Pigeon", "Prestige", "Glen", "Butterfly", "& more"],
    faq: [
      {
        question: "Is the ₹99 visitation fee refundable?",
        answer: "The ₹99 is a diagnosis fee which will be adjusted in the final repair quote if you proceed with the repair.",
      },
      {
        question: "What issues can be repaired?",
        answer: "Low flame, gas leakage, faulty knobs, ignition issues, pipe problems, and burner blockages.",
      },
    ],
  },
};

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const serviceDetail = SERVICE_DETAIL_CONFIG[id as string];

  if (!serviceDetail) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textMain} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Service not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header - overlaid on hero image */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.backBtnOverlay} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnOverlay}>
            <Search size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnOverlay}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: serviceDetail.heroImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroGradient} />
        </View>

        {/* Service Title & Rating */}
        <View style={styles.titleSection}>
          <Text style={styles.serviceTitle}>{serviceDetail.title}</Text>
          <View style={styles.ratingRow}>
            <Star size={14} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>
              {serviceDetail.rating} ({serviceDetail.reviews} reviews)
            </Text>
          </View>
        </View>

        {/* Standard Rate Card */}
        <TouchableOpacity style={styles.rateCard}>
          <View style={styles.rateCardLeft}>
            <Check size={16} color="#7C3AED" />
            <Text style={styles.rateCardBrand}>mfixit cover</Text>
            <Text style={styles.rateCardText}>Standard rate card</Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Option Cards (2 burners, 3 burners, etc.) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
          contentContainerStyle={styles.optionsContent}
        >
          {serviceDetail.options.map((option) => (
            <View key={option.id} style={styles.optionCard}>
              <Text style={styles.optionName}>{option.name}</Text>
              <View style={styles.optionRating}>
                <Star size={12} color="#FBBF24" fill="#FBBF24" />
                <Text style={styles.optionRatingText}>
                  {option.rating} ({option.reviews} reviews)
                </Text>
              </View>
              <Text style={styles.optionPrice}>₹{option.price}</Text>
              <TouchableOpacity style={styles.optionAddBtn}>
                <Text style={styles.optionAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Our Process Section */}
        <View style={styles.processSection}>
          <Text style={styles.sectionTitleWhite}>Our process</Text>
          {serviceDetail.process.map((step, index) => (
            <View key={step.step} style={styles.processStep}>
              <View style={styles.processStepLeft}>
                <View style={styles.processStepNumber}>
                  <Text style={styles.processStepNumberText}>{step.step}</Text>
                </View>
                {index < serviceDetail.process.length - 1 && <View style={styles.processLine} />}
              </View>
              <View style={styles.processStepContent}>
                <Text style={styles.processStepTitle}>{step.title}</Text>
                <Text style={styles.processStepDesc}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* What's Excluded Section */}
        <View style={styles.excludedSection}>
          <Text style={styles.sectionTitleDark}>What's excluded</Text>
          {serviceDetail.excluded.map((item, index) => (
            <View key={index} style={styles.excludedItem}>
              <Text style={styles.excludedX}>✕</Text>
              <Text style={styles.excludedText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* We Service All Brands Section */}
        <View style={styles.brandsSection}>
          <Text style={styles.sectionTitleDark}>We service all brands</Text>
          <View style={styles.brandsGrid}>
            {serviceDetail.brands.map((brand, index) => (
              <View key={index} style={styles.brandCard}>
                <Text style={styles.brandText}>{brand}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.brandsDisclaimer}>
            Logos & trademarks are used for illustrative purposes. We do not claim any affiliation with the respective brand.
          </Text>
        </View>

        {/* Top Technicians Section */}
        <View style={styles.techniciansSection}>
          <Text style={styles.sectionTitleDark}>Top technicians</Text>
          <View style={styles.technicianCard}>
            <View style={styles.technicianFeatures}>
              <View style={styles.technicianFeature}>
                <Shield size={18} color={colors.textMain} />
                <Text style={styles.technicianFeatureText}>Background verified</Text>
              </View>
              <View style={styles.technicianFeature}>
                <Check size={18} color={colors.textMain} />
                <Text style={styles.technicianFeatureText}>Trained across all major brands</Text>
              </View>
              <View style={styles.technicianFeature}>
                <Star size={18} color={colors.textMain} />
                <Text style={styles.technicianFeatureText}>Certified under Skill India Programme</Text>
              </View>
            </View>
            <View style={styles.technicianImageContainer}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" }}
                style={styles.technicianImage}
                resizeMode="cover"
              />
              <View style={styles.mfixitBadge}>
                <Text style={styles.mfixitBadgeText}>MFIXIT</Text>
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

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitleDark}>Frequently asked questions</Text>
          {serviceDetail.faq.map((faq, index) => (
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
        <TouchableOpacity style={styles.bookNowBtn}>
          <Text style={styles.bookNowText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerOverlay: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
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
  backBtnOverlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtnOverlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  heroContainer: {
    height: 250,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  serviceTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textMain,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  rateCard: {
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
  rateCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rateCardBrand: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7C3AED",
  },
  rateCardText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMain,
  },
  optionsScroll: {
    marginTop: 20,
  },
  optionsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  optionCard: {
    width: 150,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  optionName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 6,
  },
  optionRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  optionRatingText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 12,
  },
  optionAddBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  optionAddText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  processSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#1F2937",
  },
  sectionTitleWhite: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  sectionTitleDark: {
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
  excludedSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
  },
  excludedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  excludedX: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
    marginTop: 2,
  },
  excludedText: {
    fontSize: 14,
    color: colors.textMain,
    flex: 1,
    lineHeight: 20,
  },
  brandsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#F8FAFC",
  },
  brandsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  brandCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
  },
  brandText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMain,
  },
  brandsDisclaimer: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  techniciansSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
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
  technicianImageContainer: {
    position: "relative",
  },
  technicianImage: {
    width: 120,
    height: 140,
    borderRadius: radius.lg,
  },
  mfixitBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: "center",
  },
  mfixitBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  promiseSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#F8FAFC",
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
