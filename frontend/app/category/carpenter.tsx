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
  Tag,
  Hammer,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

// Carpenter service categories
const CARPENTER_SERVICES = [
  {
    id: "bed",
    name: "Bed",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "bed-repair", title: "Bed repair", price: 249, rating: 4.75, reviews: "28K" },
      { id: "bed-assembly", title: "Bed assembly", price: 399, rating: 4.80, reviews: "35K" },
      { id: "headboard-fix", title: "Headboard fixing", price: 199, rating: 4.72, reviews: "12K" },
    ]
  },
  {
    id: "door",
    name: "Door",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "door-repair", title: "Door repair", price: 199, rating: 4.78, reviews: "42K" },
      { id: "door-install", title: "Door installation", price: 499, rating: 4.82, reviews: "25K" },
      { id: "hinge-repair", title: "Hinge repair/replace", price: 149, rating: 4.76, reviews: "32K" },
      { id: "door-lock", title: "Door lock installation", price: 179, rating: 4.79, reviews: "38K" },
    ]
  },
  {
    id: "wardrobe",
    name: "Wardrobe & Cupboard",
    image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "wardrobe-repair", title: "Wardrobe repair", price: 299, rating: 4.74, reviews: "22K" },
      { id: "wardrobe-assembly", title: "Wardrobe assembly", price: 599, rating: 4.81, reviews: "18K" },
      { id: "shelf-install", title: "Shelf installation", price: 199, rating: 4.77, reviews: "28K" },
    ]
  },
  {
    id: "window",
    name: "Window",
    image: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "window-repair", title: "Window repair", price: 199, rating: 4.73, reviews: "15K" },
      { id: "window-install", title: "Window installation", price: 449, rating: 4.78, reviews: "10K" },
    ]
  },
  {
    id: "furniture",
    name: "Furniture Assembly",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "table-assembly", title: "Table assembly", price: 249, rating: 4.79, reviews: "32K" },
      { id: "chair-repair", title: "Chair repair", price: 149, rating: 4.75, reviews: "25K" },
      { id: "sofa-repair", title: "Sofa repair", price: 349, rating: 4.77, reviews: "18K" },
    ]
  },
  {
    id: "drilling",
    name: "Drilling & Hanging",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "wall-drill", title: "Wall drilling (per hole)", price: 49, rating: 4.82, reviews: "85K" },
      { id: "tv-mount", title: "TV wall mount", price: 349, rating: 4.85, reviews: "42K" },
      { id: "curtain-install", title: "Curtain rod installation", price: 199, rating: 4.78, reviews: "35K" },
      { id: "photo-hang", title: "Photo frame hanging", price: 99, rating: 4.80, reviews: "28K" },
    ]
  },
];

const FAQS = [
  { id: "faq1", question: "Does the carpenter bring tools?", answer: "Yes, our carpenters come fully equipped with all necessary tools." },
  { id: "faq2", question: "Is wood/material included?", answer: "No, wood and materials are charged separately based on requirement." },
  { id: "faq3", question: "What's the warranty period?", answer: "We provide a 30-day warranty on all carpentry work." },
];

export default function CarpenterServiceScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("bed");

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
    return Object.entries(cart).reduce((total, [id, qty]) => {
      for (const cat of CARPENTER_SERVICES) {
        const service = cat.services.find(s => s.id === id);
        if (service) return total + service.price * qty;
      }
      return total;
    }, 0);
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
          <Text style={styles.title}>Carpenter</Text>
          <View style={styles.ratingRow}>
            <Star size={16} color="#000000" fill="#000000" />
            <Text style={styles.ratingText}>4.76 (2.8 M bookings)</Text>
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
            <Text style={styles.promoTitle}>₹75 off on carpentry</Text>
            <Text style={styles.promoSubtitle}>On orders above ₹499</Text>
          </View>
          <Hammer size={24} color="#B45309" />
        </View>

        {/* Earliest Slot */}
        <View style={styles.slotContainer}>
          <Clock size={16} color="#059669" />
          <Text style={styles.slotLabel}>Earliest</Text>
          <Text style={styles.slotTime}>Tomorrow, 9:00 AM</Text>
        </View>

        {/* Service Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a service</Text>
          
          {CARPENTER_SERVICES.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <TouchableOpacity 
                style={styles.categoryHeader}
                onPress={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
              >
                <Image source={{ uri: category.image }} style={styles.categoryImage} />
                <Text style={styles.categoryName}>{category.name}</Text>
                <View style={styles.categoryArrow}>
                  {expandedCategory === category.id ? 
                    <ChevronUp size={20} color="#6B7280" /> : 
                    <ChevronDown size={20} color="#6B7280" />
                  }
                </View>
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
                        <Text style={styles.servicePrice}>₹{service.price}</Text>
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
  promoBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, padding: 16, backgroundColor: "#FEF3C7", borderRadius: 12, marginBottom: 12 },
  promoLeft: {},
  promoTitle: { fontSize: 14, fontWeight: "700", color: "#B45309" },
  promoSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  slotContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  slotLabel: { fontSize: 14, fontWeight: "600", color: "#059669" },
  slotTime: { fontSize: 14, fontWeight: "700", color: "#059669" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#000000", marginBottom: 16 },
  categoryCard: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 12, overflow: "hidden" },
  categoryHeader: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  categoryImage: { width: 50, height: 50, borderRadius: 8 },
  categoryName: { flex: 1, fontSize: 16, fontWeight: "600", color: "#000000" },
  categoryArrow: {},
  servicesList: { borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  serviceItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  serviceInfo: { flex: 1 },
  serviceTitle: { fontSize: 14, fontWeight: "600", color: "#000000", marginBottom: 4 },
  serviceRating: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  serviceRatingText: { fontSize: 12, color: "#6B7280" },
  servicePrice: { fontSize: 14, fontWeight: "700", color: "#000000" },
  addBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 6, paddingHorizontal: 20, paddingVertical: 8 },
  addBtnText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  qtyRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.primary, borderRadius: 6 },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  qtyBtnText: { fontSize: 16, fontWeight: "600", color: colors.primary },
  qtyText: { fontSize: 14, fontWeight: "700", color: colors.primary, minWidth: 24, textAlign: "center" },
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
