import React, { useEffect, useState } from "react";
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
  cleaning: {
    name: "Cleaning",
    accentColor: "#16A34A",
    bgColor: "#F0FDF4",
    warrantyDays: 7,
    coverAmount: "₹10,000",
    specialFeatures: [
      "Eco-friendly chemicals only",
      "Deep sanitization included",
      "Trained & verified crew",
    ],
  },
  "pest-control": {
    name: "Pest Control",
    accentColor: "#7C3AED",
    bgColor: "#F5F3FF",
    warrantyDays: 90,
    coverAmount: "₹10,000",
    specialFeatures: [
      "Child & pet safe chemicals",
      "Government approved treatment",
      "Follow-up visit included",
    ],
  },
};

// Rate card items by category - Can be edited from admin panel later
interface RateCardItem {
  service: string;
  description?: string;
  price: number;
  unit?: string;
}

const RATE_CARD_DATA: Record<string, RateCardItem[]> = {
  electrician: [
    { service: "Switch/Socket replacement", price: 49, unit: "per unit" },
    { service: "Fan installation", description: "Ceiling/wall fan", price: 149, unit: "per unit" },
    { service: "MCB repair/replacement", price: 99, unit: "per unit" },
    { service: "Wiring repair", description: "Minor wiring work", price: 199, unit: "per point" },
    { service: "Inverter installation", price: 399 },
    { service: "Doorbell installation", price: 99 },
    { service: "Light fixture installation", price: 99, unit: "per unit" },
  ],
  plumber: [
    { service: "Tap repair/replacement", price: 99, unit: "per tap" },
    { service: "Flush tank repair", price: 149 },
    { service: "Pipe leakage repair", price: 199, unit: "per joint" },
    { service: "Drain blockage removal", price: 249 },
    { service: "Water tank cleaning", description: "Up to 500L", price: 499 },
    { service: "Geyser installation", price: 349 },
    { service: "Basin/sink installation", price: 199 },
  ],
  "ac-appliance": [
    { service: "AC service (split)", description: "Foam jet clean", price: 499 },
    { service: "AC service (window)", price: 399 },
    { service: "AC gas refill", description: "R22/R32/R410", price: 1499 },
    { service: "AC installation", price: 899 },
    { service: "AC uninstallation", price: 499 },
    { service: "Washing machine repair", price: 299, unit: "inspection" },
    { service: "Refrigerator repair", price: 299, unit: "inspection" },
  ],
  painting: [
    { service: "Interior painting", description: "Per sq.ft (2 coats)", price: 18, unit: "per sq.ft" },
    { service: "Exterior painting", description: "Per sq.ft (2 coats)", price: 22, unit: "per sq.ft" },
    { service: "Primer application", price: 8, unit: "per sq.ft" },
    { service: "Putty application", description: "2 coats", price: 12, unit: "per sq.ft" },
    { service: "Texture painting", price: 35, unit: "per sq.ft" },
    { service: "Wood polish", price: 85, unit: "per sq.ft" },
  ],
  carpenter: [
    { service: "Door repair", description: "Hinges, locks etc.", price: 199 },
    { service: "Furniture repair", description: "Minor repairs", price: 299 },
    { service: "Drawer repair/installation", price: 149, unit: "per drawer" },
    { service: "Handle replacement", price: 49, unit: "per handle" },
    { service: "Shelf installation", price: 199, unit: "per shelf" },
    { service: "Bed assembly", price: 399 },
    { service: "Wardrobe repair", price: 399 },
  ],
  cleaning: [
    { service: "Full home cleaning (1BHK)", price: 999 },
    { service: "Full home cleaning (2BHK)", price: 1499 },
    { service: "Full home cleaning (3BHK)", price: 1999 },
    { service: "Bathroom deep cleaning", price: 449, unit: "per bathroom" },
    { service: "Kitchen deep cleaning", price: 549 },
    { service: "Sofa cleaning", price: 349, unit: "per seat" },
    { service: "Carpet cleaning", price: 3, unit: "per sq.ft" },
  ],
  "pest-control": [
    { service: "Cockroach treatment", description: "Gel treatment", price: 699 },
    { service: "Ant control", price: 599 },
    { service: "Mosquito control", price: 599 },
    { service: "Bed bug treatment", price: 1299 },
    { service: "Termite treatment", description: "Drilling method", price: 2499 },
    { service: "General pest control (1BHK)", price: 999 },
    { service: "General pest control (2BHK)", price: 1299 },
  ],
};

function getRateCardItems(category: string): RateCardItem[] {
  return RATE_CARD_DATA[category] || RATE_CARD_DATA.electrician;
}

export default function MfixitCoverScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  
  const config = CATEGORY_CONFIGS[category || "electrician"] || CATEGORY_CONFIGS.electrician;

  // ── CMS overlay: admin-managed sections + rate card ──
  const [cmsSections, setCmsSections] = useState<any[]>([]);
  const [cmsRateCard, setCmsRateCard] = useState<any[]>([]);
  useEffect(() => {
    if (!category) return;
    const base = typeof window !== "undefined" ? "" : (process.env.EXPO_PUBLIC_BACKEND_URL || "");
    fetch(`${base}/api/admin/cms/public/category/${category}/cover`)
      .then((r) => r.json())
      .then((d) => {
        setCmsSections(Array.isArray(d.sections) ? d.sections : []);
        setCmsRateCard(Array.isArray(d.rate_card) ? d.rate_card : []);
      })
      .catch(() => { /* silent fallback */ });
  }, [category]);

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

        {/* ── CMS-managed sections (override / extend the hard-coded ones) ── */}
        {cmsSections.length > 0 && cmsSections.map((sec: any) => (
          <View key={sec.id} style={[styles.section, { backgroundColor: "#F0FDF4" }]}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            {(sec.bullets || []).map((b: string, i: number) => (
              <View key={i} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: "#DCFCE7" }]}>
                  <Check size={18} color="#059669" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureText}>{b}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* ── CMS-managed rate card (replaces the embedded one if items exist) ── */}
        {cmsRateCard.length > 0 && (
          <View style={[styles.section, { backgroundColor: "#FAFAFA" }]}>
            <Text style={styles.sectionTitle}>Rate card</Text>
            {cmsRateCard.map((row: any) => (
              <View key={row.id} style={[styles.featureItem, { borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingVertical: 10 }]}>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureText, { fontWeight: "600" }]}>{row.service_name}</Text>
                  {row.sub_label ? <Text style={{ fontSize: 12, color: "#6B7280" }}>{row.sub_label}</Text> : null}
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: config.accentColor }}>
                  ₹{Number(row.price).toFixed(0)} {row.price_suffix || ""}
                </Text>
              </View>
            ))}
          </View>
        )}

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

        {/* Section 4: Rate Card Items - Editable from Admin */}
        <View style={[styles.section, { backgroundColor: "#FFF" }]}>
          <View style={styles.rateCardHeader}>
            <Text style={styles.sectionTitle}>Rate card</Text>
            <Text style={styles.rateCardSubtitle}>Standard prices for {config.name.toLowerCase()} services</Text>
          </View>

          {/* Rate Card Table */}
          <View style={styles.rateCardTable}>
            {/* Table Header */}
            <View style={styles.rateCardRow}>
              <Text style={styles.rateCardHeaderCell}>Service</Text>
              <Text style={[styles.rateCardHeaderCell, styles.rateCardPriceHeader]}>Price</Text>
            </View>

            {/* Rate Card Items - These can be edited from admin panel */}
            {getRateCardItems(category || "electrician").map((item, index) => (
              <View key={index} style={[styles.rateCardRow, index % 2 === 0 && styles.rateCardRowAlt]}>
                <View style={styles.rateCardServiceCell}>
                  <Text style={styles.rateCardServiceName}>{item.service}</Text>
                  {item.description && (
                    <Text style={styles.rateCardServiceDesc}>{item.description}</Text>
                  )}
                </View>
                <View style={styles.rateCardPriceCell}>
                  <Text style={styles.rateCardPrice}>₹{item.price}</Text>
                  {item.unit && <Text style={styles.rateCardUnit}>{item.unit}</Text>}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.rateCardNote}>
            <Text style={styles.rateCardNoteText}>
              * Prices are indicative and may vary based on complexity
            </Text>
            <Text style={styles.rateCardNoteText}>
              * Parts/materials charged separately if required
            </Text>
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

  // Rate Card Styles
  rateCardHeader: {
    marginBottom: 8,
  },
  rateCardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: -16,
    marginBottom: 20,
  },
  rateCardTable: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rateCardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  rateCardRowAlt: {
    backgroundColor: "#FFF",
  },
  rateCardHeaderCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  rateCardPriceHeader: {
    textAlign: "right",
    flex: 0.4,
  },
  rateCardServiceCell: {
    flex: 1,
  },
  rateCardServiceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  rateCardServiceDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  rateCardPriceCell: {
    flex: 0.4,
    alignItems: "flex-end",
  },
  rateCardPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  rateCardUnit: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  rateCardNote: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  rateCardNoteText: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
  },
});
