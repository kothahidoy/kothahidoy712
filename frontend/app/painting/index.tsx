import React, { useRef, useState, useEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight, Search, Star, Clock, Menu, Tag } from "lucide-react-native";
import { useCart } from "@/src/context/CartContext";
import { colors } from "@/src/theme";


const CATEGORIES = [
  { id: "1bhk", name: "1 BHK\npainting", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=200&q=80" },
  { id: "2bhk", name: "2 BHK\npainting", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=200&q=80" },
  { id: "3bhk", name: "3 BHK\npainting", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80" },
  { id: "4bhk", name: "4 BHK\npainting", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=200&q=80" },
  { id: "room-combos", name: "Room\ncombos", image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=200&q=80" },
  { id: "exterior", name: "Exterior full\nhome", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=200&q=80" },
  { id: "waterproofing", name: "Waterproofing", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80" },
  { id: "wood-polish", name: "Wood polish\n& painting", image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=200&q=80" },
];

const ALL_SERVICES = {
  "1bhk": {
    title: "1 BHK painting",
    services: [
      { id: "1bhk-royal", name: "1 BHK - Royal paint", rating: 4.78, reviews: "32K", price: 12999, originalPrice: 15999, duration: "3-4 days", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80" },
      { id: "1bhk-premium", name: "1 BHK - Premium paint", rating: 4.82, reviews: "28K", price: 9999, duration: "2-3 days", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80" },
      { id: "1bhk-economy", name: "1 BHK - Economy paint", rating: 4.72, reviews: "45K", price: 7499, options: 2, image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "2bhk": {
    title: "2 BHK painting",
    services: [
      { id: "2bhk-royal", name: "2 BHK - Royal paint", rating: 4.80, reviews: "45K", price: 22999, originalPrice: 27999, duration: "4-5 days", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80" },
      { id: "2bhk-premium", name: "2 BHK - Premium paint", rating: 4.78, reviews: "38K", price: 17999, duration: "3-4 days", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80" },
      { id: "2bhk-economy", name: "2 BHK - Economy paint", rating: 4.75, reviews: "52K", price: 13999, options: 2, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "3bhk": {
    title: "3 BHK painting",
    services: [
      { id: "3bhk-royal", name: "3 BHK - Royal paint", rating: 4.82, reviews: "28K", price: 34999, originalPrice: 42999, duration: "5-6 days", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "3bhk-premium", name: "3 BHK - Premium paint", rating: 4.78, reviews: "22K", price: 27999, duration: "4-5 days", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "3bhk-economy", name: "3 BHK - Economy paint", rating: 4.72, reviews: "35K", price: 21999, options: 2, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "4bhk": {
    title: "4 BHK painting",
    services: [
      { id: "4bhk-royal", name: "4 BHK - Royal paint", rating: 4.85, reviews: "15K", price: 49999, originalPrice: 59999, duration: "6-7 days", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=300&q=80" },
      { id: "4bhk-premium", name: "4 BHK - Premium paint", rating: 4.80, reviews: "12K", price: 39999, duration: "5-6 days", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "room-combos": {
    title: "Room combos",
    services: [
      { id: "single-room", name: "Single room painting", rating: 4.78, reviews: "85K", price: 3999, duration: "1 day", image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=300&q=80" },
      { id: "2-rooms", name: "2 Rooms combo", rating: 4.82, reviews: "62K", price: 7499, originalPrice: 8999, duration: "1-2 days", image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=300&q=80" },
      { id: "3-rooms", name: "3 Rooms combo", rating: 4.80, reviews: "45K", price: 10999, options: 3, image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "exterior": {
    title: "Exterior full home",
    services: [
      { id: "ext-premium", name: "Exterior - Premium weatherproof", rating: 4.78, reviews: "18K", price: 24999, duration: "4-5 days", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=300&q=80" },
      { id: "ext-economy", name: "Exterior - Economy weatherproof", rating: 4.72, reviews: "25K", price: 17999, duration: "3-4 days", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "waterproofing": {
    title: "Waterproofing",
    services: [
      { id: "terrace-wp", name: "Terrace waterproofing", rating: 4.80, reviews: "28K", price: 14999, duration: "2-3 days", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80" },
      { id: "bathroom-wp", name: "Bathroom waterproofing", rating: 4.78, reviews: "35K", price: 4999, duration: "1 day", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80" },
      { id: "wall-wp", name: "External wall waterproofing", rating: 4.75, reviews: "18K", price: 9999, options: 2, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "wood-polish": {
    title: "Wood polish & painting",
    services: [
      { id: "door-polish", name: "Door polishing", rating: 4.82, reviews: "42K", price: 1499, duration: "per door", image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=300&q=80" },
      { id: "furniture-polish", name: "Furniture polishing", rating: 4.78, reviews: "35K", price: 2999, options: 4, image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=300&q=80" },
      { id: "wood-paint", name: "Wood painting", rating: 4.75, reviews: "28K", price: 1999, duration: "per item", image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=300&q=80" },
    ],
  },
};

const ServiceCard = ({ service, quantity, onAdd, onRemove, onViewDetails }: any) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <View style={styles.ratingRow}><Star size={12} color="#000" fill="#000" /><Text style={styles.ratingText}>{service.rating} ({service.reviews} reviews)</Text></View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{service.price.toLocaleString()}</Text>
        {service.originalPrice && <Text style={styles.originalPrice}>₹{service.originalPrice.toLocaleString()}</Text>}
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

export default function PaintingFullPageScreen() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const { replaceAllItems: __syncGlobalCart } = useCart();
  useEffect(() => {
    const list = Object.entries(cart).map(([id, qty]) => {
      let svc: any = null;
      Object.values(ALL_SERVICES).forEach((cat: any) => {
        const s = cat.services?.find((x: any) => x.id === id);
        if (s) svc = s;
      });
      return { service_id: id, quantity: qty, title: svc?.name, image: svc?.image, price: svc?.price, category: "painting" };
    });
    __syncGlobalCart(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const [activeCategory, setActiveCategory] = useState("1bhk");
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
          <Text style={styles.headerTitle}>Home Painting</Text>
          <View style={styles.headerSlot}><Clock size={12} color="#1D4ED8" /><Text style={styles.headerSlotText}>Earliest slot: Wed, 7:00 PM</Text></View>
        </View>
        <TouchableOpacity style={styles.headerIconBtn}><Search size={20} color="#000" /></TouchableOpacity>
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
        onScroll={(e) => { const scrollY = e.nativeEvent.contentOffset.y; let current = "1bhk"; Object.entries(sectionPositions).forEach(([id, pos]) => { if (scrollY >= pos - 150) current = id; }); if (current !== activeCategory) setActiveCategory(current); }}
        scrollEventThrottle={16}
      >
        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View key={categoryId} onLayout={(e) => setSectionPositions(prev => ({ ...prev, [categoryId]: e.nativeEvent.layout.y }))}>
            <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{categoryData.title}</Text><Text style={styles.sectionTitle}>{categoryData.title}</Text></View>
            {categoryData.services.map((service, index) => (
              <View key={service.id}>
                <ServiceCard service={service} quantity={cart[service.id] || 0} onAdd={() => handleAddToCart(service.id)} onRemove={() => handleRemoveFromCart(service.id)} onViewDetails={() => router.push(`/painting/service/${service.id}`)} />
                {index < categoryData.services.length - 1 && <View style={styles.serviceDivider} />}
              </View>
            ))}
            <View style={styles.sectionDivider} />
          </View>
        ))}

        {/* Mfixit Cover Section */}
        <TouchableOpacity 
          style={styles.coverSection}
          onPress={() => router.push("/cover/painting")}
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
              Up to ₹15,000 cover • 90-day warranty • Fixed rate card
            </Text>
          </View>
          <ChevronRight size={24} color="#D97706" />
        </TouchableOpacity>

        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.menuButton}><Menu size={20} color="#FFF" /><Text style={styles.menuButtonText}>Menu</Text></TouchableOpacity>
      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}><Tag size={16} color="#1D4ED8" /><Text style={styles.bottomPromoText}>Pay only after satisfaction</Text></View>

      {getCartItemCount() > 0 && (
        <View style={styles.cartBar}>
          <View><Text style={styles.cartItemCount}>{getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}</Text><Text style={styles.cartTotal}>₹{getCartTotal().toLocaleString()}</Text></View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={() => router.push("/cart")}><Text style={styles.viewCartText}>View Cart</Text><ChevronRight size={18} color="#FFF" /></TouchableOpacity>
        </View>
      )}</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000" },
  headerSlot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerSlotText: { fontSize: 12, color: "#1D4ED8" },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  categoryGridContainer: { backgroundColor: "#FFF", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  categoryGrid: { paddingHorizontal: 12, gap: 8 },
  categoryItem: { width: 85, alignItems: "center", marginHorizontal: 4 },
  categoryImageBox: { width: 75, height: 75, borderRadius: 12, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "#93C5FD" },
  categoryImageBoxActive: { borderWidth: 2, borderColor: "#1D4ED8" },
  categoryImage: { width: 75, height: 75 },
  categoryName: { fontSize: 12, fontWeight: "500", color: "#6B7280", textAlign: "center", lineHeight: 15 },
  categoryNameActive: { color: "#1D4ED8", fontWeight: "600" },
  scrollView: { flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: "#DBEAFE" },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#1E40AF", marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#000" },
  serviceCard: { flexDirection: "row", padding: 16, backgroundColor: "#FFF" },
  serviceInfo: { flex: 1, paddingRight: 12 },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 6, lineHeight: 22 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  ratingText: { fontSize: 13, color: "#6B7280", textDecorationLine: "underline" },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  price: { fontSize: 14, fontWeight: "600", color: "#000" },
  originalPrice: { fontSize: 13, color: "#9CA3AF", textDecorationLine: "line-through" },
  duration: { fontSize: 14, color: "#6B7280" },
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: "#1D4ED8" },
  serviceRight: { alignItems: "center", width: 120 },
  serviceImage: { width: 110, height: 90, borderRadius: 8, backgroundColor: "#DBEAFE", marginBottom: 10 },
  addButton: { borderWidth: 1.5, borderColor: "#1D4ED8", borderRadius: 6, paddingHorizontal: 32, paddingVertical: 8, backgroundColor: "#FFF" },
  addButtonText: { fontSize: 14, fontWeight: "700", color: "#1D4ED8" },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#1D4ED8", borderRadius: 6, backgroundColor: "#FFF" },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: "#1D4ED8" },
  qtyValue: { fontSize: 14, fontWeight: "700", color: "#1D4ED8", minWidth: 24, textAlign: "center" },
  optionsText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  serviceDivider: { height: 1, backgroundColor: "#93C5FD", marginHorizontal: 16 },
  sectionDivider: { height: 8, backgroundColor: "#DBEAFE" },
  coverSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, marginHorizontal: 16, marginTop: 16, marginBottom: 8, backgroundColor: "#FFFBEB", borderRadius: 16, borderWidth: 1, borderColor: "#FDE68A" },
  coverContent: { flex: 1 },
  coverBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  coverCheckIcon: { width: 24, height: 24, borderRadius: 6, backgroundColor: "#D97706", alignItems: "center", justifyContent: "center" },
  coverCheckText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  coverBrandText: { fontSize: 18, fontWeight: "800", color: "#000" },
  coverBrandAccent: { color: "#D97706" },
  coverTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 4 },
  coverSubtitle: { fontSize: 13, color: "#6B7280" },
  menuButton: { position: "absolute", bottom: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 8 },
  menuButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  bottomPromo: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#DBEAFE", paddingVertical: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#93C5FD" },
  bottomPromoText: { fontSize: 14, fontWeight: "600", color: "#1D4ED8" },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28 },
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#1D4ED8", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
