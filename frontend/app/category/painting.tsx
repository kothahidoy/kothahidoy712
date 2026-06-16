import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Share2, 
  Star, 
  Clock,
  Shield,
  Paintbrush,
  Check,
  X,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

// Painting service packages
const PAINTING_PACKAGES = [
  {
    id: "1bhk",
    title: "1 BHK Fresh Painting",
    price: 8999,
    originalPrice: 12999,
    discount: "31% OFF",
    rating: 4.82,
    reviews: "15K",
    includes: ["Living room", "1 Bedroom", "Kitchen", "1 Bathroom"],
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "2bhk",
    title: "2 BHK Fresh Painting",
    price: 14999,
    originalPrice: 21999,
    discount: "32% OFF",
    rating: 4.85,
    reviews: "22K",
    includes: ["Living room", "2 Bedrooms", "Kitchen", "2 Bathrooms"],
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "3bhk",
    title: "3 BHK Fresh Painting",
    price: 21999,
    originalPrice: 31999,
    discount: "31% OFF",
    rating: 4.88,
    reviews: "18K",
    includes: ["Living room", "3 Bedrooms", "Kitchen", "3 Bathrooms"],
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=200&q=80",
  },
];

const PAINTING_SERVICES = [
  {
    id: "interior",
    name: "Interior Painting",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "single-wall", title: "Single wall painting", price: 899, rating: 4.78, reviews: "32K", unit: "per wall" },
      { id: "room-paint", title: "Full room painting", price: 2499, rating: 4.82, reviews: "45K", unit: "per room" },
      { id: "ceiling", title: "Ceiling painting", price: 1499, rating: 4.75, reviews: "18K", unit: "per room" },
    ]
  },
  {
    id: "exterior",
    name: "Exterior Painting",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "ext-wall", title: "Exterior wall painting", price: 18, rating: 4.80, reviews: "12K", unit: "per sq ft" },
      { id: "balcony", title: "Balcony painting", price: 1999, rating: 4.76, reviews: "8K", unit: "per balcony" },
    ]
  },
  {
    id: "texture",
    name: "Texture & Design",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "texture-wall", title: "Texture wall painting", price: 45, rating: 4.85, reviews: "15K", unit: "per sq ft" },
      { id: "stencil", title: "Stencil design", price: 65, rating: 4.82, reviews: "10K", unit: "per sq ft" },
      { id: "accent-wall", title: "Accent wall design", price: 3999, rating: 4.88, reviews: "8K", unit: "per wall" },
    ]
  },
  {
    id: "wood",
    name: "Wood & Metal Painting",
    image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "door-paint", title: "Door painting", price: 699, rating: 4.77, reviews: "22K", unit: "per door" },
      { id: "window-paint", title: "Window painting", price: 499, rating: 4.75, reviews: "15K", unit: "per window" },
      { id: "grill-paint", title: "Grill painting", price: 599, rating: 4.78, reviews: "12K", unit: "per grill" },
      { id: "furniture-polish", title: "Furniture polish", price: 150, rating: 4.80, reviews: "18K", unit: "per sq ft" },
    ]
  },
];

const INCLUDED = [
  "Premium quality paint",
  "Surface preparation",
  "2 coats of paint",
  "Furniture covering",
  "Post-work cleanup",
];

const EXCLUDED = [
  "Wall repairs/putty work",
  "Waterproofing",
  "Wallpaper removal",
];

const FAQS = [
  { id: "faq1", question: "What paints do you use?", answer: "We use premium quality paints from Asian Paints, Berger, and Nerolac. You can choose your preferred brand." },
  { id: "faq2", question: "How long does painting take?", answer: "A 2BHK typically takes 4-5 days including drying time. Timeline varies based on scope of work." },
  { id: "faq3", question: "Do I need to move out?", answer: "No, our team works room by room. You can stay in the house during the painting work." },
];

export default function PaintingServiceScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("interior");

  const handleAddToCart = (serviceId: string) => {
    setCart(prev => ({ ...prev, [serviceId]: (prev[serviceId] || 0) + 1 }));
  };

  const handleRemoveFromCart = (serviceId: string) => {
    setCart(prev => {
      const newQty = (prev[serviceId] || 0) - 1;
      if (newQty <= 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQty };
    });
  };

  const getCartTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      // Check packages
      const pkg = PAINTING_PACKAGES.find(p => p.id === id);
      if (pkg) { total += pkg.price * qty; return; }
      // Check services
      for (const cat of PAINTING_SERVICES) {
        const service = cat.services.find(s => s.id === id);
        if (service) { total += service.price * qty; return; }
      }
    });
    return total;
  };

  const getCartItemCount = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Share2 size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Home Painting</Text>
          <View style={styles.ratingRow}>
            <Star size={16} color="#000000" fill="#000000" />
            <Text style={styles.ratingText}>4.82 (1.5 M bookings)</Text>
          </View>
        </View>

        {/* Warranty Card */}
        <TouchableOpacity style={styles.warrantyCard}>
          <View style={styles.warrantyLeft}>
            <Shield size={20} color="#6B7280" />
            <Text style={styles.warrantyText}>Mfixit warranty & protection</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoTitle}>Up to 35% off on painting</Text>
            <Text style={styles.promoSubtitle}>+ Free color consultation</Text>
          </View>
          <Paintbrush size={24} color="#7C3AED" />
        </View>

        {/* Earliest Slot */}
        <View style={styles.slotContainer}>
          <Clock size={16} color="#059669" />
          <Text style={styles.slotLabel}>Earliest</Text>
          <Text style={styles.slotTime}>Tomorrow, 10:00 AM</Text>
        </View>

        {/* BHK Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Complete home packages</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PAINTING_PACKAGES.map((pkg) => (
              <View key={pkg.id} style={styles.packageCard}>
                <Image source={{ uri: pkg.image }} style={styles.packageImage} />
                <Text style={styles.packageTitle}>{pkg.title}</Text>
                <View style={styles.packageRating}>
                  <Star size={12} color="#000" fill="#000" />
                  <Text style={styles.packageRatingText}>{pkg.rating} ({pkg.reviews})</Text>
                </View>
                <View style={styles.packagePriceRow}>
                  <Text style={styles.packagePrice}>₹{pkg.price}</Text>
                  <Text style={styles.packageOriginalPrice}>₹{pkg.originalPrice}</Text>
                </View>
                <View style={styles.packageDiscount}>
                  <Text style={styles.packageDiscountText}>{pkg.discount}</Text>
                </View>
                <Text style={styles.packageIncludes}>Includes: {pkg.includes.join(", ")}</Text>
                {!cart[pkg.id] ? (
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(pkg.id)}>
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleRemoveFromCart(pkg.id)}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{cart[pkg.id]}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleAddToCart(pkg.id)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Individual Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual services</Text>
          
          {PAINTING_SERVICES.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <TouchableOpacity 
                style={styles.categoryHeader}
                onPress={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
              >
                <Image source={{ uri: category.image }} style={styles.categoryImage} />
                <Text style={styles.categoryName}>{category.name}</Text>
                {expandedCategory === category.id ? 
                  <ChevronUp size={20} color="#6B7280" /> : 
                  <ChevronDown size={20} color="#6B7280" />
                }
              </TouchableOpacity>
              
              {expandedCategory === category.id && (
                <View style={styles.servicesList}>
                  {category.services.map((service) => (
                    <View key={service.id} style={styles.serviceItem}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        <View style={styles.serviceRating}>
                          <Star size={12} color="#000" fill="#000" />
                          <Text style={styles.serviceRatingText}>{service.rating} ({service.reviews})</Text>
                        </View>
                        <Text style={styles.servicePrice}>₹{service.price} <Text style={styles.serviceUnit}>{service.unit}</Text></Text>
                      </View>
                      {!cart[service.id] ? (
                        <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(service.id)}>
                          <Text style={styles.addBtnText}>Add</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.qtyRow}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => handleRemoveFromCart(service.id)}>
                            <Text style={styles.qtyBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{cart[service.id]}</Text>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => handleAddToCart(service.id)}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* What's Included/Excluded */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's included</Text>
          {INCLUDED.map((item, i) => (
            <View key={i} style={styles.includeRow}>
              <Check size={16} color="#16A34A" />
              <Text style={styles.includeText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's excluded</Text>
          {EXCLUDED.map((item, i) => (
            <View key={i} style={styles.excludeRow}>
              <X size={16} color="#DC2626" />
              <Text style={styles.excludeText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Mfixit Cover */}
        <View style={styles.coverSection}>
          <View style={styles.coverContent}>
            <Text style={styles.coverTitle}>Stay stress free with Mfixit cover</Text>
            <Text style={styles.coverSubtitle}>Up to ₹10,000 cover if any damage happens</Text>
          </View>
          <Shield size={40} color="#16A34A" fill="#16A34A" />
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          {FAQS.map((faq) => (
            <TouchableOpacity key={faq.id} style={styles.faqItem} onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedFaq === faq.id ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
              </View>
              {expandedFaq === faq.id && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: getCartItemCount() > 0 ? 100 : 40 }} />
      </ScrollView>

      {/* Cart Bar */}
      {getCartItemCount() > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartItemCount}>{getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}</Text>
            <Text style={styles.cartTotal}>₹{getCartTotal()}</Text>
          </View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={() => router.push("/booking/new")}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollView: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  titleSection: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#000000", marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { fontSize: 14, color: "#374151" },
  warrantyCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 12 },
  warrantyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  warrantyText: { fontSize: 14, fontWeight: "500", color: "#374151" },
  promoBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, padding: 16, backgroundColor: "#EDE9FE", borderRadius: 12, marginBottom: 12 },
  promoLeft: {},
  promoTitle: { fontSize: 14, fontWeight: "700", color: "#7C3AED" },
  promoSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  slotContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  slotLabel: { fontSize: 14, fontWeight: "600", color: "#059669" },
  slotTime: { fontSize: 14, fontWeight: "700", color: "#059669" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#000000", marginBottom: 16 },
  packageCard: { width: 220, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, marginRight: 12 },
  packageImage: { width: "100%", height: 100, borderRadius: 8, marginBottom: 10 },
  packageTitle: { fontSize: 15, fontWeight: "700", color: "#000000", marginBottom: 6 },
  packageRating: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  packageRatingText: { fontSize: 12, color: "#6B7280" },
  packagePriceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  packagePrice: { fontSize: 18, fontWeight: "700", color: "#000000" },
  packageOriginalPrice: { fontSize: 14, color: "#9CA3AF", textDecorationLine: "line-through" },
  packageDiscount: { backgroundColor: "#DCFCE7", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 8 },
  packageDiscountText: { fontSize: 11, fontWeight: "600", color: "#16A34A" },
  packageIncludes: { fontSize: 12, color: "#6B7280", marginBottom: 12, lineHeight: 16 },
  categoryCard: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 12, overflow: "hidden" },
  categoryHeader: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  categoryImage: { width: 50, height: 50, borderRadius: 8 },
  categoryName: { flex: 1, fontSize: 16, fontWeight: "600", color: "#000000" },
  servicesList: { borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  serviceItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  serviceInfo: { flex: 1 },
  serviceTitle: { fontSize: 14, fontWeight: "600", color: "#000000", marginBottom: 4 },
  serviceRating: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  serviceRatingText: { fontSize: 12, color: "#6B7280" },
  servicePrice: { fontSize: 14, fontWeight: "700", color: "#000000" },
  serviceUnit: { fontSize: 12, fontWeight: "400", color: "#6B7280" },
  addBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 6, paddingHorizontal: 20, paddingVertical: 8 },
  addBtnText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  qtyRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.primary, borderRadius: 6 },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  qtyBtnText: { fontSize: 16, fontWeight: "600", color: colors.primary },
  qtyText: { fontSize: 14, fontWeight: "700", color: colors.primary, minWidth: 24, textAlign: "center" },
  includeRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  includeText: { fontSize: 14, color: "#374151" },
  excludeRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  excludeText: { fontSize: 14, color: "#374151" },
  coverSection: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#F0FDF4", marginHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  coverContent: { flex: 1 },
  coverTitle: { fontSize: 16, fontWeight: "700", color: "#000000", marginBottom: 4 },
  coverSubtitle: { fontSize: 13, color: "#6B7280" },
  faqItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faqQuestion: { fontSize: 14, fontWeight: "600", color: "#000000", flex: 1, paddingRight: 12 },
  faqAnswer: { fontSize: 14, color: "#6B7280", marginTop: 12, lineHeight: 20 },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32 },
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
