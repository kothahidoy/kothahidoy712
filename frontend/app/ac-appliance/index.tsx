import React, { useRef, useState, useEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight, Search, Share2, Star, Clock, Menu, Tag } from "lucide-react-native";
import { colors } from "@/src/theme";

const CATEGORIES = [
  { id: "ac", name: "AC service\n& repair", image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=200&q=80" },
  { id: "washing-machine", name: "Washing\nmachine", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=200&q=80" },
  { id: "refrigerator", name: "Refrigerator", image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=200&q=80" },
  { id: "geyser", name: "Geyser", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80" },
  { id: "tv", name: "Television", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=200&q=80" },
  { id: "microwave", name: "Microwave", image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=200&q=80" },
  { id: "chimney", name: "Chimney &\nhob", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80" },
  { id: "water-purifier", name: "Water\npurifier", image: "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=200&q=80" },
];

const ALL_SERVICES = {
  "ac": {
    title: "AC service & repair",
    services: [
      { id: "ac-service", name: "AC service (split)", rating: 4.82, reviews: "450K", price: 499, duration: "60 mins", image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=300&q=80" },
      { id: "ac-gas", name: "AC gas refill (split)", rating: 4.78, reviews: "285K", price: 1999, options: 3, image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=300&q=80" },
      { id: "ac-repair", name: "AC repair (split)", rating: 4.76, reviews: "165K", price: 299, duration: "inspection", image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=300&q=80" },
      { id: "ac-install", name: "AC installation (split)", rating: 4.85, reviews: "125K", price: 999, duration: "90 mins", image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "washing-machine": {
    title: "Washing machine",
    services: [
      { id: "wm-repair", name: "Washing machine repair", rating: 4.78, reviews: "185K", price: 299, duration: "inspection", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=300&q=80" },
      { id: "wm-service", name: "Washing machine service", rating: 4.82, reviews: "142K", price: 449, duration: "60 mins", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=300&q=80" },
      { id: "wm-install", name: "Washing machine installation", rating: 4.80, reviews: "95K", price: 399, options: 2, image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "refrigerator": {
    title: "Refrigerator",
    services: [
      { id: "fridge-repair", name: "Refrigerator repair", rating: 4.76, reviews: "165K", price: 299, duration: "inspection", image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=300&q=80" },
      { id: "fridge-gas", name: "Refrigerator gas refill", rating: 4.75, reviews: "85K", price: 1499, options: 3, image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=300&q=80" },
      { id: "fridge-service", name: "Refrigerator service", rating: 4.80, reviews: "72K", price: 399, duration: "45 mins", image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "geyser": {
    title: "Geyser",
    services: [
      { id: "geyser-repair", name: "Geyser repair", rating: 4.78, reviews: "125K", price: 199, duration: "inspection", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "geyser-install", name: "Geyser installation", rating: 4.82, reviews: "95K", price: 349, duration: "45 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "geyser-service", name: "Geyser service", rating: 4.80, reviews: "68K", price: 299, duration: "30 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "tv": {
    title: "Television",
    services: [
      { id: "tv-repair", name: "TV repair", rating: 4.75, reviews: "95K", price: 299, duration: "inspection", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80" },
      { id: "tv-install", name: "TV installation & mounting", rating: 4.85, reviews: "185K", price: 399, duration: "45 mins", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80" },
      { id: "tv-uninstall", name: "TV uninstallation", rating: 4.78, reviews: "42K", price: 199, duration: "30 mins", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "microwave": {
    title: "Microwave",
    services: [
      { id: "mw-repair", name: "Microwave repair", rating: 4.76, reviews: "65K", price: 299, duration: "inspection", image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=300&q=80" },
      { id: "mw-service", name: "Microwave service", rating: 4.80, reviews: "45K", price: 349, duration: "30 mins", image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "chimney": {
    title: "Chimney & hob",
    services: [
      { id: "chimney-clean", name: "Chimney cleaning", rating: 4.82, reviews: "125K", price: 399, duration: "45 mins", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80" },
      { id: "chimney-repair", name: "Chimney repair", rating: 4.78, reviews: "72K", price: 299, duration: "inspection", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80" },
      { id: "hob-repair", name: "Hob repair", rating: 4.76, reviews: "58K", price: 299, duration: "inspection", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "water-purifier": {
    title: "Water purifier",
    services: [
      { id: "wp-service", name: "Water purifier service", rating: 4.80, reviews: "145K", price: 299, duration: "45 mins", image: "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=300&q=80" },
      { id: "wp-repair", name: "Water purifier repair", rating: 4.76, reviews: "85K", price: 199, duration: "inspection", image: "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=300&q=80" },
      { id: "wp-install", name: "Water purifier installation", rating: 4.82, reviews: "62K", price: 349, options: 2, image: "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=300&q=80" },
    ],
  },
};

const ServiceCard = ({ service, quantity, onAdd, onRemove, onViewDetails }: any) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <View style={styles.ratingRow}><Star size={12} color="#000" fill="#000" /><Text style={styles.ratingText}>{service.rating} ({service.reviews} reviews)</Text></View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{service.price}</Text>
        {service.duration && <Text style={styles.duration}> • {service.duration}</Text>}
      </View>
      <TouchableOpacity onPress={onViewDetails}><Text style={styles.viewDetailsText}>View details</Text></TouchableOpacity>
    </View>
    <View style={styles.serviceRight}>
      <Image source={{ uri: service.image }} style={styles.serviceImage} resizeMode="cover" />
      {quantity === 0 ? (
        <TouchableOpacity style={styles.addButton} onPress={onAdd}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity>
      ) : (
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={onAdd}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
        </View>
      )}
      {service.options && <Text style={styles.optionsText}>{service.options} options</Text>}
    </View>
  </View>
);

export default function ACApplianceFullPageScreen() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState("ac");
  const [sectionPositions, setSectionPositions] = useState<{ [key: string]: number }>({});
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);

  useEffect(() => {
    if (scrollTo && !hasScrolledToInitial && Object.keys(sectionPositions).length > 0) {
      const position = sectionPositions[scrollTo];
      if (position !== undefined && scrollViewRef.current) {
        setTimeout(() => { scrollViewRef.current?.scrollTo({ y: position - 120, animated: true }); setActiveCategory(scrollTo); setHasScrolledToInitial(true); }, 300);
      }
    }
  }, [scrollTo, sectionPositions, hasScrolledToInitial]);

  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId);
    const position = sectionPositions[categoryId];
    if (position !== undefined && scrollViewRef.current) scrollViewRef.current.scrollTo({ y: position - 120, animated: true });
  };

  const handleAddToCart = (serviceId: string) => setCart(prev => ({ ...prev, [serviceId]: (prev[serviceId] || 0) + 1 }));
  const handleRemoveFromCart = (serviceId: string) => setCart(prev => { const newQty = (prev[serviceId] || 0) - 1; if (newQty <= 0) { const { [serviceId]: _, ...rest } = prev; return rest; } return { ...prev, [serviceId]: newQty }; });

  const getCartTotal = () => { let total = 0; Object.entries(cart).forEach(([id, qty]) => { Object.values(ALL_SERVICES).forEach(cat => { const s = cat.services.find(x => x.id === id); if (s) total += s.price * qty; }); }); return total; };
  const getCartItemCount = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ArrowLeft size={20} color="#000" /></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AC & Appliance</Text>
          <View style={styles.headerSlot}><Clock size={12} color="#0891B2" /><Text style={styles.headerSlotText}>Earliest slot: Thu, 10:00 AM</Text></View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}><Search size={20} color="#000" /></TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}><Share2 size={20} color="#000" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.categoryGridContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => handleCategoryPress(cat.id)}>
              <View style={[styles.categoryImageBox, activeCategory === cat.id && styles.categoryImageBoxActive]}>
                <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="cover" />
              </View>
              <Text style={[styles.categoryName, activeCategory === cat.id && styles.categoryNameActive]} numberOfLines={2}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}
        onScroll={(e) => { const scrollY = e.nativeEvent.contentOffset.y; let current = "ac"; Object.entries(sectionPositions).forEach(([id, pos]) => { if (scrollY >= pos - 150) current = id; }); if (current !== activeCategory) setActiveCategory(current); }}
        scrollEventThrottle={16}
      >
        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View key={categoryId} onLayout={(e) => setSectionPositions(prev => ({ ...prev, [categoryId]: e.nativeEvent.layout.y }))}>
            <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{categoryData.title}</Text><Text style={styles.sectionTitle}>{categoryData.title}</Text></View>
            {categoryData.services.map((service, index) => (
              <View key={service.id}>
                <ServiceCard service={service} quantity={cart[service.id] || 0} onAdd={() => handleAddToCart(service.id)} onRemove={() => handleRemoveFromCart(service.id)} onViewDetails={() => router.push(`/ac-appliance/service/${service.id}`)} />
                {index < categoryData.services.length - 1 && <View style={styles.serviceDivider} />}
              </View>
            ))}
            <View style={styles.sectionDivider} />
          </View>
        ))}

        {/* Mfixit Cover Section */}
        <TouchableOpacity 
          style={styles.coverSection}
          onPress={() => router.push("/cover/ac-appliance")}
        >
          <View style={styles.coverContent}>
            <View style={styles.coverBadge}>
              <View style={styles.coverCheckIcon}>
                <Text style={styles.coverCheckText}>✓</Text>
              </View>
              <Text style={styles.coverBrandText}>
                <Text style={styles.coverBrandAccent}>mfixit</Text>cover
              </Text>
            </View>
            <Text style={styles.coverTitle}>Mfixit warranty and cover</Text>
            <Text style={styles.coverSubtitle}>
              Up to ₹10,000 cover • 30-day warranty • Fixed rate card
            </Text>
          </View>
          <ChevronRight size={24} color="#0891B2" />
        </TouchableOpacity>

        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.menuButton}><Menu size={20} color="#FFF" /><Text style={styles.menuButtonText}>Menu</Text></TouchableOpacity>
      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}><Tag size={16} color="#0891B2" /><Text style={styles.bottomPromoText}>₹150 off on AC service this summer</Text></View>

      {getCartItemCount() > 0 && (
        <View style={styles.cartBar}>
          <View><Text style={styles.cartItemCount}>{getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}</Text><Text style={styles.cartTotal}>₹{getCartTotal()}</Text></View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={() => router.push("/cart")}><Text style={styles.viewCartText}>View Cart</Text><ChevronRight size={18} color="#FFF" /></TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000" },
  headerSlot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerSlotText: { fontSize: 12, color: "#0891B2" },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  categoryGridContainer: { backgroundColor: "#FFF", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  categoryGrid: { paddingHorizontal: 12, gap: 8 },
  categoryItem: { width: 85, alignItems: "center", marginHorizontal: 4 },
  categoryImageBox: { width: 75, height: 75, borderRadius: 12, backgroundColor: "#ECFEFF", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "#A5F3FC" },
  categoryImageBoxActive: { borderWidth: 2, borderColor: "#0891B2" },
  categoryImage: { width: 75, height: 75 },
  categoryName: { fontSize: 12, fontWeight: "500", color: "#6B7280", textAlign: "center", lineHeight: 15 },
  categoryNameActive: { color: "#0891B2", fontWeight: "600" },
  scrollView: { flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: "#ECFEFF" },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#0E7490", marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#000" },
  serviceCard: { flexDirection: "row", padding: 16, backgroundColor: "#FFF" },
  serviceInfo: { flex: 1, paddingRight: 12 },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 6, lineHeight: 22 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  ratingText: { fontSize: 13, color: "#6B7280", textDecorationLine: "underline" },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  price: { fontSize: 14, fontWeight: "600", color: "#000" },
  duration: { fontSize: 14, color: "#6B7280" },
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: "#0891B2" },
  serviceRight: { alignItems: "center", width: 120 },
  serviceImage: { width: 110, height: 90, borderRadius: 8, backgroundColor: "#ECFEFF", marginBottom: 10 },
  addButton: { borderWidth: 1.5, borderColor: "#0891B2", borderRadius: 6, paddingHorizontal: 32, paddingVertical: 8, backgroundColor: "#FFF" },
  addButtonText: { fontSize: 14, fontWeight: "700", color: "#0891B2" },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#0891B2", borderRadius: 6, backgroundColor: "#FFF" },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: "#0891B2" },
  qtyValue: { fontSize: 14, fontWeight: "700", color: "#0891B2", minWidth: 24, textAlign: "center" },
  optionsText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  serviceDivider: { height: 1, backgroundColor: "#A5F3FC", marginHorizontal: 16 },
  sectionDivider: { height: 8, backgroundColor: "#ECFEFF" },
  coverSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, marginHorizontal: 16, marginTop: 16, marginBottom: 8, backgroundColor: "#ECFEFF", borderRadius: 16, borderWidth: 1, borderColor: "#A5F3FC" },
  coverContent: { flex: 1 },
  coverBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  coverCheckIcon: { width: 24, height: 24, borderRadius: 6, backgroundColor: "#0891B2", alignItems: "center", justifyContent: "center" },
  coverCheckText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  coverBrandText: { fontSize: 18, fontWeight: "800", color: "#000" },
  coverBrandAccent: { color: "#0891B2" },
  coverTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 4 },
  coverSubtitle: { fontSize: 13, color: "#6B7280" },
  menuButton: { position: "absolute", bottom: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 8 },
  menuButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  bottomPromo: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#ECFEFF", paddingVertical: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#CFFAFE" },
  bottomPromoText: { fontSize: 14, fontWeight: "600", color: "#0891B2" },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28 },
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#0891B2", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
