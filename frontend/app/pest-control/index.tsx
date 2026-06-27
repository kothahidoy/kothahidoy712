import React, { useRef, useState, useEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight, Search, Share2, Star, Clock, Menu, Tag, Shield } from "lucide-react-native";
import { useCart } from "@/src/context/CartContext";
import { useCategoryContent } from "@/src/hooks/useCategoryContent";

const FALLBACK_ALL_SERVICES: Record<string, { title: string; services: any[] }> = {
  "cockroach": {
    title: "Cockroach control",
    services: [
      { id: "cockroach-gel", name: "Cockroach gel treatment", rating: 4.85, reviews: "245K", price: 699, duration: "30 mins", warranty: "60 days", image: "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=300&q=80" },
      { id: "cockroach-spray", name: "Cockroach spray treatment", rating: 4.78, reviews: "165K", price: 499, duration: "45 mins", warranty: "30 days", image: "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=300&q=80" },
      { id: "cockroach-combo", name: "Cockroach gel + spray combo", rating: 4.88, reviews: "95K", price: 999, originalPrice: 1198, duration: "60 mins", warranty: "90 days", image: "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "ant": {
    title: "Ant control",
    services: [
      { id: "ant-gel", name: "Ant gel treatment", rating: 4.82, reviews: "125K", price: 599, duration: "30 mins", warranty: "45 days", image: "https://images.unsplash.com/photo-1597662942557-4087864a1e76?auto=format&fit=crop&w=300&q=80" },
      { id: "ant-spray", name: "Ant spray treatment", rating: 4.78, reviews: "85K", price: 449, duration: "45 mins", warranty: "30 days", image: "https://images.unsplash.com/photo-1597662942557-4087864a1e76?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "termite": {
    title: "Termite control",
    services: [
      { id: "termite-drill", name: "Termite drilling treatment", rating: 4.80, reviews: "78K", price: 2499, duration: "3-4 hours", warranty: "5 years", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "termite-spot", name: "Termite spot treatment", rating: 4.76, reviews: "45K", price: 999, duration: "60 mins", warranty: "1 year", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "termite-pre", name: "Pre-construction termite", rating: 4.85, reviews: "32K", price: 4999, options: 3, warranty: "10 years", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "mosquito": {
    title: "Mosquito control",
    services: [
      { id: "mosquito-spray", name: "Mosquito spray treatment", rating: 4.78, reviews: "142K", price: 599, duration: "45 mins", warranty: "30 days", image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=300&q=80" },
      { id: "mosquito-fog", name: "Mosquito fogging", rating: 4.82, reviews: "95K", price: 899, duration: "60 mins", warranty: "45 days", image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "bed-bug": {
    title: "Bed bug control",
    services: [
      { id: "bedbug-spray", name: "Bed bug spray treatment", rating: 4.80, reviews: "85K", price: 1299, duration: "2 hours", warranty: "60 days", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=300&q=80" },
      { id: "bedbug-heat", name: "Bed bug heat treatment", rating: 4.88, reviews: "42K", price: 2499, duration: "4-5 hours", warranty: "90 days", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "rodent": {
    title: "Rodent control",
    services: [
      { id: "rodent-trap", name: "Rodent trap & bait", rating: 4.78, reviews: "65K", price: 899, duration: "60 mins", warranty: "30 days", image: "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=300&q=80" },
      { id: "rodent-full", name: "Full rodent proofing", rating: 4.82, reviews: "38K", price: 1999, duration: "3-4 hours", warranty: "90 days", image: "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "general": {
    title: "General pest control",
    services: [
      { id: "general-1bhk", name: "1 BHK pest control", rating: 4.82, reviews: "185K", price: 999, duration: "60 mins", warranty: "60 days", image: "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=300&q=80" },
      { id: "general-2bhk", name: "2 BHK pest control", rating: 4.80, reviews: "142K", price: 1299, duration: "90 mins", warranty: "60 days", image: "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=300&q=80" },
      { id: "general-3bhk", name: "3 BHK pest control", rating: 4.78, reviews: "95K", price: 1599, duration: "2 hours", warranty: "60 days", image: "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=300&q=80" },
      { id: "general-annual", name: "Annual pest control package", rating: 4.88, reviews: "65K", price: 3999, originalPrice: 4999, options: 4, warranty: "1 year", image: "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=300&q=80" },
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
        {service.originalPrice && <Text style={styles.originalPrice}>₹{service.originalPrice}</Text>}
        {service.duration && <Text style={styles.duration}> • {service.duration}</Text>}
      </View>
      {service.warranty && (
        <View style={styles.warrantyTag}>
          <Shield size={12} color="#7C3AED" />
          <Text style={styles.warrantyText}>{service.warranty} warranty</Text>
        </View>
      )}
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

export default function PestControlFullPageScreen() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const { replaceAllItems: __syncGlobalCart } = useCart();

  // 🔌 Live CMS-driven content (admin Sub-cats + Services)
  const {
    CATEGORIES: liveCats,
    ALL_SERVICES: liveServices,
    initialActiveId,
  } = useCategoryContent("cleaning-pest");
  const CATEGORIES = liveCats.length ? liveCats : [];
  const ALL_SERVICES: Record<string, { title: string; services: any[] }> =
    Object.keys(liveServices).length ? liveServices : FALLBACK_ALL_SERVICES;

  useEffect(() => {
    const list = Object.entries(cart).map(([id, qty]) => {
      let svc: any = null;
      Object.values(ALL_SERVICES).forEach((cat: any) => {
        const s = cat.services?.find((x: any) => x.id === id);
        if (s) svc = s;
      });
      return { service_id: id, quantity: qty, title: svc?.name, image: svc?.image, price: svc?.price, category: "pest-control" };
    });
    __syncGlobalCart(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const [activeCategory, setActiveCategory] = useState("");

  // Set initial active tab when CMS data finishes loading
  useEffect(() => {
    if (!activeCategory && initialActiveId) setActiveCategory(initialActiveId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialActiveId]);
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
          <Text style={styles.headerTitle}>Pest Control</Text>
          <View style={styles.headerSlot}><Clock size={12} color="#7C3AED" /><Text style={styles.headerSlotText}>Earliest slot: Tomorrow, 10 AM</Text></View>
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
        onScroll={(e) => { const scrollY = e.nativeEvent.contentOffset.y; let current = "cockroach"; Object.entries(sectionPositions).forEach(([id, pos]) => { if (scrollY >= pos - 150) current = id; }); if (current !== activeCategory) setActiveCategory(current); }}
        scrollEventThrottle={16}
      >
        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View key={categoryId} onLayout={(e) => setSectionPositions(prev => ({ ...prev, [categoryId]: e.nativeEvent.layout.y }))}>
            <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{categoryData.title}</Text><Text style={styles.sectionTitle}>{categoryData.title}</Text></View>
            {categoryData.services.map((service, index) => (
              <View key={service.id}>
                <ServiceCard service={service} quantity={cart[service.id] || 0} onAdd={() => handleAddToCart(service.id)} onRemove={() => handleRemoveFromCart(service.id)} onViewDetails={() => router.push(`/pest-control/service/${service.id}`)} />
                {index < categoryData.services.length - 1 && <View style={styles.serviceDivider} />}
              </View>
            ))}
            <View style={styles.sectionDivider} />
          </View>
        ))}

        {/* Mfixit Cover Section */}
        <TouchableOpacity 
          style={styles.coverSection}
          onPress={() => router.push("/cover/pest-control")}
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
            <Text style={styles.coverTitle}>Mfixit warranty & protection</Text>
            <Text style={styles.coverSubtitle}>
              Up to ₹10,000 cover • 90-day warranty • Fixed rate card
            </Text>
          </View>
          <ChevronRight size={24} color="#7C3AED" />
        </TouchableOpacity>

        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.menuButton}><Menu size={20} color="#FFF" /><Text style={styles.menuButtonText}>Menu</Text></TouchableOpacity>
      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}><Tag size={16} color="#7C3AED" /><Text style={styles.bottomPromoText}>Up to 5 years warranty on termite treatment</Text></View>

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
  headerSlotText: { fontSize: 12, color: "#7C3AED" },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  categoryGridContainer: { backgroundColor: "#FFF", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  categoryGrid: { paddingHorizontal: 12, gap: 8 },
  categoryItem: { width: 85, alignItems: "center", marginHorizontal: 4 },
  categoryImageBox: { width: 75, height: 75, borderRadius: 12, backgroundColor: "#F5F3FF", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "#DDD6FE" },
  categoryImageBoxActive: { borderWidth: 2, borderColor: "#7C3AED" },
  categoryImage: { width: 75, height: 75 },
  categoryName: { fontSize: 12, fontWeight: "500", color: "#6B7280", textAlign: "center", lineHeight: 15 },
  categoryNameActive: { color: "#7C3AED", fontWeight: "600" },
  scrollView: { flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: "#F5F3FF" },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#6D28D9", marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#000" },
  serviceCard: { flexDirection: "row", padding: 16, backgroundColor: "#FFF" },
  serviceInfo: { flex: 1, paddingRight: 12 },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 6, lineHeight: 22 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  ratingText: { fontSize: 13, color: "#6B7280", textDecorationLine: "underline" },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
  price: { fontSize: 14, fontWeight: "600", color: "#000" },
  originalPrice: { fontSize: 13, color: "#9CA3AF", textDecorationLine: "line-through" },
  duration: { fontSize: 14, color: "#6B7280" },
  warrantyTag: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8, backgroundColor: "#F5F3FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: "flex-start" },
  warrantyText: { fontSize: 12, color: "#7C3AED", fontWeight: "500" },
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: "#7C3AED" },
  serviceRight: { alignItems: "center", width: 120 },
  serviceImage: { width: 110, height: 90, borderRadius: 8, backgroundColor: "#F5F3FF", marginBottom: 10 },
  addButton: { borderWidth: 1.5, borderColor: "#7C3AED", borderRadius: 6, paddingHorizontal: 32, paddingVertical: 8, backgroundColor: "#FFF" },
  addButtonText: { fontSize: 14, fontWeight: "700", color: "#7C3AED" },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#7C3AED", borderRadius: 6, backgroundColor: "#FFF" },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: "#7C3AED" },
  qtyValue: { fontSize: 14, fontWeight: "700", color: "#7C3AED", minWidth: 24, textAlign: "center" },
  optionsText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  serviceDivider: { height: 1, backgroundColor: "#DDD6FE", marginHorizontal: 16 },
  sectionDivider: { height: 8, backgroundColor: "#F5F3FF" },
  menuButton: { position: "absolute", bottom: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 8 },
  menuButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  bottomPromo: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F3FF", paddingVertical: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#DDD6FE" },
  bottomPromoText: { fontSize: 14, fontWeight: "600", color: "#7C3AED" },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28 },
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#7C3AED", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  coverSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, marginHorizontal: 16, marginTop: 16, marginBottom: 8, backgroundColor: "#F5F3FF", borderRadius: 16, borderWidth: 1, borderColor: "#DDD6FE" },
  coverContent: { flex: 1 },
  coverBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  coverCheckIcon: { width: 24, height: 24, borderRadius: 6, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" },
  coverCheckText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  coverBrandText: { fontSize: 18, fontWeight: "800", color: "#000" },
  coverBrandAccent: { color: "#7C3AED" },
  coverTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 4 },
  coverSubtitle: { fontSize: 13, color: "#6B7280" },
});
