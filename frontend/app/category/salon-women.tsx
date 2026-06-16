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
  Sparkles,
  Heart,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

// Women's Salon service categories
const SALON_SERVICES = [
  {
    id: "waxing",
    name: "Waxing",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "full-arms", title: "Full arms waxing", price: 149, rating: 4.82, reviews: "125K" },
      { id: "full-legs", title: "Full legs waxing", price: 249, rating: 4.85, reviews: "142K" },
      { id: "underarms", title: "Underarms waxing", price: 49, rating: 4.78, reviews: "185K" },
      { id: "full-body", title: "Full body waxing", price: 799, rating: 4.88, reviews: "68K" },
      { id: "bikini", title: "Bikini waxing", price: 299, rating: 4.75, reviews: "45K" },
    ]
  },
  {
    id: "facial",
    name: "Facial & Cleanup",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "gold-facial", title: "Gold facial", price: 999, rating: 4.85, reviews: "52K" },
      { id: "fruit-facial", title: "Fruit facial", price: 599, rating: 4.82, reviews: "78K" },
      { id: "cleanup", title: "Face cleanup", price: 399, rating: 4.79, reviews: "95K" },
      { id: "detan-facial", title: "Detan facial", price: 499, rating: 4.80, reviews: "65K" },
    ]
  },
  {
    id: "manicure",
    name: "Manicure & Pedicure",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "classic-mani", title: "Classic manicure", price: 299, rating: 4.78, reviews: "42K" },
      { id: "classic-pedi", title: "Classic pedicure", price: 349, rating: 4.82, reviews: "55K" },
      { id: "spa-mani", title: "Spa manicure", price: 499, rating: 4.85, reviews: "32K" },
      { id: "spa-pedi", title: "Spa pedicure", price: 599, rating: 4.87, reviews: "38K" },
    ]
  },
  {
    id: "hair",
    name: "Hair Care",
    image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "haircut", title: "Haircut", price: 299, rating: 4.75, reviews: "85K" },
      { id: "hair-spa", title: "Hair spa", price: 699, rating: 4.82, reviews: "45K" },
      { id: "hair-color", title: "Hair color (root touch-up)", price: 499, rating: 4.78, reviews: "38K" },
      { id: "keratin", title: "Keratin treatment", price: 2499, rating: 4.88, reviews: "22K" },
      { id: "straightening", title: "Hair straightening", price: 1999, rating: 4.85, reviews: "28K" },
    ]
  },
  {
    id: "bleach",
    name: "Bleach & Detan",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "face-bleach", title: "Face bleach", price: 199, rating: 4.76, reviews: "68K" },
      { id: "full-body-bleach", title: "Full body bleach", price: 599, rating: 4.78, reviews: "35K" },
      { id: "face-detan", title: "Face detan", price: 249, rating: 4.80, reviews: "72K" },
      { id: "full-body-detan", title: "Full body detan", price: 699, rating: 4.82, reviews: "42K" },
    ]
  },
  {
    id: "threading",
    name: "Threading",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "eyebrows", title: "Eyebrows threading", price: 29, rating: 4.85, reviews: "225K" },
      { id: "upper-lip", title: "Upper lip threading", price: 19, rating: 4.82, reviews: "185K" },
      { id: "full-face", title: "Full face threading", price: 99, rating: 4.80, reviews: "145K" },
    ]
  },
  {
    id: "makeup",
    name: "Makeup",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=80",
    services: [
      { id: "party-makeup", title: "Party makeup", price: 1499, rating: 4.85, reviews: "28K" },
      { id: "bridal-makeup", title: "Bridal makeup", price: 4999, rating: 4.90, reviews: "15K" },
      { id: "engagement", title: "Engagement makeup", price: 2999, rating: 4.88, reviews: "12K" },
    ]
  },
];

const FAQS = [
  { id: "faq1", question: "Are products safe and hygienic?", answer: "Yes, we use only branded products and maintain strict hygiene protocols. Single-use items are disposed after each service." },
  { id: "faq2", question: "Can I choose my beautician?", answer: "Yes, you can add beauticians to favorites and request them for future bookings." },
  { id: "faq3", question: "What if I'm not satisfied?", answer: "We offer a satisfaction guarantee. Contact us within 24 hours for resolution." },
];

export default function WomenSalonServiceScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("waxing");

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
      for (const cat of SALON_SERVICES) {
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
          <Text style={styles.title}>Women's Salon & Spa</Text>
          <View style={styles.ratingRow}>
            <Star size={16} color="#000000" fill="#000000" />
            <Text style={styles.ratingText}>4.85 (8.5 M bookings)</Text>
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
            <Text style={styles.promoTitle}>Flat 30% off on first booking</Text>
            <Text style={styles.promoSubtitle}>Use code: GLOW30</Text>
          </View>
          <Sparkles size={24} color="#DB2777" />
        </View>

        {/* Earliest Slot */}
        <View style={styles.slotContainer}>
          <Clock size={16} color="#059669" />
          <Text style={styles.slotLabel}>Earliest</Text>
          <Text style={styles.slotTime}>Today, 2:00 PM</Text>
        </View>

        {/* Service Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a service</Text>
          
          {SALON_SERVICES.map((category) => (
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
  title: { fontSize: 26, fontWeight: "800", color: "#000000", marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { fontSize: 14, color: "#374151" },
  warrantyCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 12 },
  warrantyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  warrantyText: { fontSize: 14, fontWeight: "500", color: "#374151" },
  promoBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, padding: 16, backgroundColor: "#FCE7F3", borderRadius: 12, marginBottom: 12 },
  promoLeft: {},
  promoTitle: { fontSize: 14, fontWeight: "700", color: "#DB2777" },
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
