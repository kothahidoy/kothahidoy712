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
  Droplets,
  X,
  Check,
  Info,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

// Plumber service categories
const PLUMBER_SERVICES = [
  {
    id: "tap-mixer",
    name: "Tap & Mixer",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "tap-repair", title: "Tap repair", price: 99, rating: 4.78, reviews: "45K" },
      { id: "tap-install", title: "Tap installation", price: 149, rating: 4.82, reviews: "32K" },
      { id: "mixer-repair", title: "Mixer/diverter repair", price: 199, rating: 4.75, reviews: "18K" },
    ]
  },
  {
    id: "basin-sink",
    name: "Basin & Sink",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "basin-install", title: "Basin installation", price: 299, rating: 4.80, reviews: "22K" },
      { id: "sink-repair", title: "Sink repair", price: 149, rating: 4.76, reviews: "15K" },
    ]
  },
  {
    id: "toilet",
    name: "Toilet",
    image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "flush-repair", title: "Flush tank repair", price: 149, rating: 4.79, reviews: "38K" },
      { id: "toilet-install", title: "Toilet seat installation", price: 199, rating: 4.81, reviews: "25K" },
      { id: "blockage", title: "Toilet blockage removal", price: 249, rating: 4.72, reviews: "42K" },
    ]
  },
  {
    id: "pipe-leakage",
    name: "Pipe & Leakage",
    image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "pipe-leak", title: "Pipe leakage repair", price: 199, rating: 4.77, reviews: "52K" },
      { id: "pipe-replace", title: "Pipe replacement", price: 349, rating: 4.74, reviews: "28K" },
    ]
  },
  {
    id: "drainage",
    name: "Drainage",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "drain-clean", title: "Drain cleaning", price: 179, rating: 4.73, reviews: "35K" },
      { id: "drain-install", title: "Drain installation", price: 299, rating: 4.78, reviews: "12K" },
    ]
  },
  {
    id: "water-tank",
    name: "Water Tank",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "tank-install", title: "Tank installation", price: 499, rating: 4.80, reviews: "8K" },
      { id: "tank-clean", title: "Tank cleaning", price: 599, rating: 4.85, reviews: "15K" },
    ]
  },
  {
    id: "motor-pump",
    name: "Motor & Pump",
    image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "motor-install", title: "Motor installation", price: 399, rating: 4.76, reviews: "18K" },
      { id: "motor-repair", title: "Motor repair", price: 299, rating: 4.72, reviews: "22K" },
    ]
  },
  {
    id: "geyser",
    name: "Geyser",
    image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "geyser-install", title: "Geyser installation", price: 349, rating: 4.82, reviews: "28K" },
      { id: "geyser-repair", title: "Geyser repair", price: 249, rating: 4.78, reviews: "35K" },
    ]
  },
];

const FAQS = [
  { id: "faq1", question: "What if the issue isn't resolved?", answer: "We offer a 30-day warranty on all plumbing services. If the issue persists, we'll fix it free of cost." },
  { id: "faq2", question: "Are spare parts included in the price?", answer: "No, spare parts are charged separately. The professional will inform you about the cost before proceeding." },
  { id: "faq3", question: "How long does a typical repair take?", answer: "Most repairs take 30-60 minutes. Complex issues may take longer." },
];

export default function PlumberServiceScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("tap-mixer");

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
      for (const cat of PLUMBER_SERVICES) {
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
          <Text style={styles.title}>Plumber</Text>
          <View style={styles.ratingRow}>
            <Star size={16} color="#000000" fill="#000000" />
            <Text style={styles.ratingText}>4.78 (3.2 M bookings)</Text>
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
            <Text style={styles.promoTitle}>₹50 off on plumbing</Text>
            <Text style={styles.promoSubtitle}>On orders above ₹399</Text>
          </View>
          <Droplets size={24} color="#0891B2" />
        </View>

        {/* Earliest Slot */}
        <View style={styles.slotContainer}>
          <Clock size={16} color="#059669" />
          <Text style={styles.slotLabel}>Earliest</Text>
          <Text style={styles.slotTime}>Today, 11:00 AM</Text>
        </View>

        {/* Service Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a service</Text>
          
          {PLUMBER_SERVICES.map((category) => (
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
  promoBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, padding: 16, backgroundColor: "#ECFEFF", borderRadius: 12, marginBottom: 12 },
  promoLeft: {},
  promoTitle: { fontSize: 14, fontWeight: "700", color: "#0891B2" },
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
