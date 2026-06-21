import React, { useRef, useState, useEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight, Search, Share2, Star, Clock, Menu, Tag } from "lucide-react-native";

const THEME_COLOR = "#16A34A";

const CATEGORIES = [
  { id: "full-home", name: "Full home\ncleaning", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80" },
  { id: "bathroom", name: "Bathroom\ncleaning", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80" },
  { id: "kitchen", name: "Kitchen\ncleaning", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80" },
  { id: "sofa", name: "Sofa\ncleaning", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80" },
  { id: "carpet", name: "Carpet\ncleaning", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80" },
  { id: "mattress", name: "Mattress\ncleaning", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=200&q=80" },
  { id: "tank", name: "Tank\ncleaning", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80" },
  { id: "ac-cleaning", name: "AC\ncleaning", image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=200&q=80" },
];

const ALL_SERVICES = {
  "full-home": {
    title: "Full home cleaning",
    services: [
      { id: "1bhk-deep", name: "1 BHK deep cleaning", rating: 4.82, reviews: "185K", price: 2499, originalPrice: 2999, duration: "4-5 hours", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80" },
      { id: "2bhk-deep", name: "2 BHK deep cleaning", rating: 4.80, reviews: "142K", price: 3499, originalPrice: 3999, duration: "5-6 hours", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80" },
      { id: "3bhk-deep", name: "3 BHK deep cleaning", rating: 4.78, reviews: "95K", price: 4499, originalPrice: 5499, duration: "6-7 hours", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80" },
      { id: "move-in", name: "Move-in cleaning", rating: 4.85, reviews: "68K", price: 3999, options: 3, image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "bathroom": {
    title: "Bathroom cleaning",
    services: [
      { id: "bathroom-classic", name: "Classic bathroom cleaning", rating: 4.80, reviews: "245K", price: 449, duration: "45 mins", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
      { id: "bathroom-intense", name: "Intense bathroom cleaning", rating: 4.85, reviews: "165K", price: 649, duration: "60 mins", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
      { id: "bathroom-2", name: "2 Bathrooms combo", rating: 4.82, reviews: "92K", price: 799, originalPrice: 898, duration: "90 mins", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "kitchen": {
    title: "Kitchen cleaning",
    services: [
      { id: "kitchen-classic", name: "Classic kitchen cleaning", rating: 4.78, reviews: "185K", price: 699, duration: "60 mins", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80" },
      { id: "kitchen-deep", name: "Deep kitchen cleaning", rating: 4.82, reviews: "125K", price: 999, duration: "90 mins", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80" },
      { id: "chimney-clean", name: "Chimney deep cleaning", rating: 4.80, reviews: "78K", price: 399, duration: "45 mins", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "sofa": {
    title: "Sofa cleaning",
    services: [
      { id: "sofa-3", name: "3 seater sofa cleaning", rating: 4.82, reviews: "142K", price: 549, duration: "45 mins", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80" },
      { id: "sofa-5", name: "5 seater sofa cleaning", rating: 4.80, reviews: "98K", price: 849, duration: "60 mins", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80" },
      { id: "sofa-7", name: "7 seater sofa cleaning", rating: 4.78, reviews: "65K", price: 1099, duration: "75 mins", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80" },
      { id: "sofa-l", name: "L-shape sofa cleaning", rating: 4.85, reviews: "45K", price: 1299, options: 2, image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "carpet": {
    title: "Carpet cleaning",
    services: [
      { id: "carpet-small", name: "Small carpet (up to 25 sqft)", rating: 4.80, reviews: "85K", price: 299, duration: "30 mins", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "carpet-medium", name: "Medium carpet (25-50 sqft)", rating: 4.78, reviews: "62K", price: 499, duration: "45 mins", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "carpet-large", name: "Large carpet (50-100 sqft)", rating: 4.82, reviews: "45K", price: 799, duration: "60 mins", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "mattress": {
    title: "Mattress cleaning",
    services: [
      { id: "mattress-single", name: "Single mattress cleaning", rating: 4.82, reviews: "125K", price: 399, duration: "30 mins", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=300&q=80" },
      { id: "mattress-double", name: "Double mattress cleaning", rating: 4.80, reviews: "95K", price: 549, duration: "45 mins", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=300&q=80" },
      { id: "mattress-king", name: "King size mattress cleaning", rating: 4.78, reviews: "68K", price: 699, duration: "60 mins", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "tank": {
    title: "Tank cleaning",
    services: [
      { id: "tank-500", name: "Tank cleaning (up to 500L)", rating: 4.78, reviews: "65K", price: 599, duration: "60 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "tank-1000", name: "Tank cleaning (500-1000L)", rating: 4.80, reviews: "48K", price: 799, duration: "75 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "tank-2000", name: "Tank cleaning (1000-2000L)", rating: 4.76, reviews: "32K", price: 999, duration: "90 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "ac-cleaning": {
    title: "AC cleaning",
    services: [
      { id: "ac-split-clean", name: "Split AC deep cleaning", rating: 4.85, reviews: "285K", price: 549, duration: "45 mins", image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=300&q=80" },
      { id: "ac-window-clean", name: "Window AC deep cleaning", rating: 4.80, reviews: "142K", price: 449, duration: "45 mins", image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=300&q=80" },
      { id: "ac-2-clean", name: "2 AC combo cleaning", rating: 4.82, reviews: "95K", price: 999, originalPrice: 1098, duration: "90 mins", image: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=300&q=80" },
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

export default function CleaningFullPageScreen() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState("full-home");
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
          <Text style={styles.headerTitle}>Cleaning</Text>
          <View style={styles.headerSlot}><Clock size={12} color="#16A34A" /><Text style={styles.headerSlotText}>Earliest slot: Tomorrow, 9 AM</Text></View>
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
        onScroll={(e) => { const scrollY = e.nativeEvent.contentOffset.y; let current = "full-home"; Object.entries(sectionPositions).forEach(([id, pos]) => { if (scrollY >= pos - 150) current = id; }); if (current !== activeCategory) setActiveCategory(current); }}
        scrollEventThrottle={16}
      >
        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View key={categoryId} onLayout={(e) => setSectionPositions(prev => ({ ...prev, [categoryId]: e.nativeEvent.layout.y }))}>
            <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{categoryData.title}</Text><Text style={styles.sectionTitle}>{categoryData.title}</Text></View>
            {categoryData.services.map((service, index) => (
              <View key={service.id}>
                <ServiceCard service={service} quantity={cart[service.id] || 0} onAdd={() => handleAddToCart(service.id)} onRemove={() => handleRemoveFromCart(service.id)} onViewDetails={() => router.push(`/cleaning/service/${service.id}`)} />
                {index < categoryData.services.length - 1 && <View style={styles.serviceDivider} />}
              </View>
            ))}
            <View style={styles.sectionDivider} />
          </View>
        ))}
        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.menuButton}><Menu size={20} color="#FFF" /><Text style={styles.menuButtonText}>Menu</Text></TouchableOpacity>
      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}><Tag size={16} color={THEME_COLOR} /><Text style={styles.bottomPromoText}>₹200 off on 2+ rooms deep cleaning</Text></View>

      {getCartItemCount() > 0 && (
        <View style={styles.cartBar}>
          <View><Text style={styles.cartItemCount}>{getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}</Text><Text style={styles.cartTotal}>₹{getCartTotal()}</Text></View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={() => router.push("/booking/new")}><Text style={styles.viewCartText}>View Cart</Text><ChevronRight size={18} color="#FFF" /></TouchableOpacity>
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
  headerSlotText: { fontSize: 12, color: "#16A34A" },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  categoryGridContainer: { backgroundColor: "#FFF", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  categoryGrid: { paddingHorizontal: 12, gap: 8 },
  categoryItem: { width: 85, alignItems: "center", marginHorizontal: 4 },
  categoryImageBox: { width: 75, height: 75, borderRadius: 12, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "#D1FAE5" },
  categoryImageBoxActive: { borderWidth: 2, borderColor: "#16A34A" },
  categoryImage: { width: 75, height: 75 },
  categoryName: { fontSize: 12, fontWeight: "500", color: "#6B7280", textAlign: "center", lineHeight: 15 },
  categoryNameActive: { color: "#16A34A", fontWeight: "600" },
  scrollView: { flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: "#ECFDF5" },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#166534", marginBottom: 4 },
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
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: "#16A34A" },
  serviceRight: { alignItems: "center", width: 120 },
  serviceImage: { width: 110, height: 90, borderRadius: 8, backgroundColor: "#ECFDF5", marginBottom: 10 },
  addButton: { borderWidth: 1.5, borderColor: "#16A34A", borderRadius: 6, paddingHorizontal: 32, paddingVertical: 8, backgroundColor: "#FFF" },
  addButtonText: { fontSize: 14, fontWeight: "700", color: "#16A34A" },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#16A34A", borderRadius: 6, backgroundColor: "#FFF" },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: "#16A34A" },
  qtyValue: { fontSize: 14, fontWeight: "700", color: "#16A34A", minWidth: 24, textAlign: "center" },
  optionsText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  serviceDivider: { height: 1, backgroundColor: "#D1FAE5", marginHorizontal: 16 },
  sectionDivider: { height: 8, backgroundColor: "#ECFDF5" },
  menuButton: { position: "absolute", bottom: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 8 },
  menuButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  bottomPromo: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#ECFDF5", paddingVertical: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#D1FAE5" },
  bottomPromoText: { fontSize: 14, fontWeight: "600", color: "#16A34A" },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28 },
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#16A34A", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
