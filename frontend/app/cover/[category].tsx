import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  X,
  Search,
  Shield,
  Check,
  Wrench,
  MessageCircle,
  FileText,
  Headphones,
  BadgeCheck,
  RefreshCw,
  Banknote,
  Clock,
  Star,
} from "lucide-react-native";

// Category-specific configurations
const CATEGORY_CONFIGS: Record<string, {
  name: string;
  accentColor: string;
  bgColor: string;
  warrantyDays: number;
  coverAmount: string;
  specialFeatures: string[];
}> = {
  electrician: {
    name: "Electrician",
    accentColor: "#059669",
    bgColor: "#F0FDF4",
    warrantyDays: 30,
    coverAmount: "₹10,000",
    specialFeatures: [
      "ISI certified spare parts",
      "Safety inspection included",
      "MCB/fuse testing",
    ],
  },
  plumber: {
    name: "Plumber",
    accentColor: "#0284C7",
    bgColor: "#F0F9FF",
    warrantyDays: 30,
    coverAmount: "₹10,000",
    specialFeatures: [
      "Leak-proof guarantee",
      "Quality pipe fittings",
      "Pressure testing included",
    ],
  },
  "ac-appliance": {
    name: "AC & Appliance",
    accentColor: "#0891B2",
    bgColor: "#ECFEFF",
    warrantyDays: 30,
    coverAmount: "₹10,000",
    specialFeatures: [
      "Genuine spare parts",
      "Gas top-up warranty",
      "Cooling performance guarantee",
    ],
  },
  painting: {
    name: "Painting",
    accentColor: "#D97706",
    bgColor: "#FFFBEB",
    warrantyDays: 90,
    coverAmount: "₹15,000",
    specialFeatures: [
      "Premium brand paints only",
      "No peeling guarantee",
      "Color consistency assured",
    ],
  },
  carpenter: {
    name: "Carpenter",
    accentColor: "#B45309",
    bgColor: "#FEF3C7",
    warrantyDays: 30,
    coverAmount: "₹10,000",
    specialFeatures: [
      "Quality wood materials",
      "Termite treatment included",
      "Proper finishing guarantee",
    ],
  },
};

export default function MfixitCoverScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  
  const config = CATEGORY_CONFIGS[category || "electrician"] || CATEGORY_CONFIGS.electrician;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mfixit Cover</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Search size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <X size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section - Mfixit Cover Branding */}
        <View style={styles.heroSection}>
          <View style={styles.brandRow}>
            <View style={[styles.brandIcon, { backgroundColor: config.accentColor }]}>
              <Check size={20} color="#FFF" strokeWidth={3} />
            </View>
            <Text style={styles.brandName}>
              <Text style={[styles.brandNameAccent, { color: config.accentColor }]}>mfixit</Text>cover
            </Text>
          </View>
          <Text style={styles.brandTagline}>End-to-end service protection</Text>
        </View>

        {/* Section 1: Warranty on Repairs (Green themed) */}
        <View style={[styles.section, { backgroundColor: "#F0FDF4" }]}>
          <Text style={styles.sectionTitle}>{config.warrantyDays}-day warranty on repairs</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#DCFCE7" }]}>
              <RefreshCw size={20} color="#059669" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Free repairs if the same issue arises</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#DCFCE7" }]}>
              <BadgeCheck size={20} color="#059669" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>One-click hassle free claims</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#DCFCE7" }]}>
              <Shield size={20} color="#059669" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>
                Up to {config.coverAmount} cover if anything is damaged during the repair
              </Text>
            </View>
          </View>

          {/* Shield Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={[styles.illustration3D, { backgroundColor: "#DCFCE7" }]}>
              <View style={[styles.illustrationIcon, { backgroundColor: "#059669" }]}>
                <Shield size={40} color="#FFF" fill="#FFF" />
                <View style={styles.illustrationCheck}>
                  <Check size={24} color="#059669" strokeWidth={3} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Expert Verified Repair Quotes (Purple themed) */}
        <View style={[styles.section, { backgroundColor: "#F5F3FF" }]}>
          <Text style={styles.sectionTitle}>Expert verified repair quotes</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#EDE9FE" }]}>
              <FileText size={20} color="#7C3AED" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>
                We will verify the repair quote shared by the professional
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#EDE9FE" }]}>
              <MessageCircle size={20} color="#7C3AED" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>
                If you're still unsure, you can ask an expert for a second opinion
              </Text>
            </View>
          </View>

          {/* Badge Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={[styles.illustration3D, { backgroundColor: "#EDE9FE" }]}>
              <View style={[styles.illustrationBadge, { backgroundColor: "#7C3AED" }]}>
                <Star size={32} color="#FFF" fill="#FFF" />
              </View>
            </View>
          </View>
        </View>

        {/* Section 3: Fixed Rate Card (Blue themed) */}
        <View style={[styles.section, { backgroundColor: "#F0F9FF" }]}>
          <Text style={styles.sectionTitle}>Fixed rate card</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#DBEAFE" }]}>
              <Banknote size={20} color="#2563EB" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>
                All our prices are decided basis market standards
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#DBEAFE" }]}>
              <Headphones size={20} color="#2563EB" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>
                If you are charged different from the rate card, you can reach out to our help centre
              </Text>
            </View>
          </View>

          {/* Price Tag Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={[styles.illustration3D, { backgroundColor: "#DBEAFE" }]}>
              <View style={[styles.illustrationPrice, { backgroundColor: "#2563EB" }]}>
                <Text style={styles.illustrationPriceText}>₹</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 4: Category-specific features */}
        <View style={[styles.section, { backgroundColor: config.bgColor }]}>
          <Text style={styles.sectionTitle}>{config.name} specific benefits</Text>
          
          {config.specialFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${config.accentColor}20` }]}>
                <Check size={20} color={config.accentColor} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 5: 24/7 Support */}
        <View style={[styles.section, { backgroundColor: "#FFF" }]}>
          <Text style={styles.sectionTitle}>24/7 Customer support</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#FEE2E2" }]}>
              <Headphones size={20} color="#DC2626" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>
                Our support team is available round the clock to help you
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#FEE2E2" }]}>
              <Clock size={20} color="#DC2626" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>
                Quick resolution within 24 hours for all warranty claims
              </Text>
            </View>
          </View>
        </View>

        {/* Trust Badge */}
        <View style={styles.trustSection}>
          <View style={styles.trustBadge}>
            <Shield size={24} color={config.accentColor} />
            <Text style={styles.trustText}>
              Protected by <Text style={{ fontWeight: "800" }}>Mfixit Cover</Text>
            </Text>
          </View>
          <Text style={styles.trustSubtext}>
            All services booked through Mfixit are covered under our protection plan
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  headerRight: { flexDirection: "row", gap: 8 },
  scrollView: { flex: 1 },

  // Hero Section
  heroSection: {
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000",
  },
  brandNameAccent: {
    fontWeight: "800",
  },
  brandTagline: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },

  // Section Styles
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: {
    flex: 1,
    justifyContent: "center",
  },
  featureText: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
  },

  // Illustration
  illustrationContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  illustration3D: {
    width: 160,
    height: 120,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  illustrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transform: [{ rotate: "-10deg" }],
  },
  illustrationCheck: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationBadge: {
    width: 70,
    height: 80,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-5deg" }],
  },
  illustrationPrice: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationPriceText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFF",
  },

  // Trust Section
  trustSection: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  trustText: {
    fontSize: 16,
    color: "#374151",
  },
  trustSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
