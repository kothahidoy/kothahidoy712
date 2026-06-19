import React, { useRef, useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  ChevronRight, 
  Search, 
  Share2, 
  Star, 
  Clock,
  Menu,
  Tag,
} from "lucide-react-native";

import { colors } from "@/src/theme";

// Category tabs data
const CATEGORIES = [
  { id: "cupboard-drawer", name: "Cupboard &\ndrawer", image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=200&q=80" },
  { id: "kitchen-fittings", name: "Kitchen\nfittings", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80" },
  { id: "shelves-decor", name: "Shelves &\ndecor", image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=200&q=80" },
  { id: "bath-fittings", name: "Bath fittings\n& mirrors", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=200&q=80" },
  { id: "wooden-door", name: "Wooden door", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80" },
  { id: "window-curtain", name: "Window &\ncurtain", image: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=200&q=80" },
  { id: "bed", name: "Bed", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=200&q=80" },
  { id: "furniture", name: "Furniture\nassembly", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80" },
];

// All services organized by category
const ALL_SERVICES = {
  "cupboard-drawer": {
    title: "Cupboard & drawer",
    services: [
      { id: "hinge-repair", name: "Cupboard hinge repair", rating: 4.78, reviews: "85K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=300&q=80" },
      { id: "drawer-channel", name: "Drawer channel repair", rating: 4.76, reviews: "62K", price: 199, options: 2, image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=300&q=80" },
      { id: "cupboard-lock", name: "Cupboard lock installation", rating: 4.80, reviews: "45K", price: 99, duration: "20 mins", image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "kitchen-fittings": {
    title: "Kitchen fittings",
    services: [
      { id: "cabinet-repair", name: "Kitchen cabinet repair", rating: 4.79, reviews: "72K", price: 249, duration: "45 mins", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80" },
      { id: "kitchen-drawer", name: "Kitchen drawer repair", rating: 4.75, reviews: "48K", price: 199, options: 3, image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80" },
      { id: "shutter-repair", name: "Shutter repair/replacement", rating: 4.77, reviews: "35K", price: 299, duration: "60 mins", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "shelves-decor": {
    title: "Shelves & decor",
    services: [
      { id: "shelf-install", name: "Wall shelf installation", rating: 4.82, reviews: "95K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=300&q=80" },
      { id: "floating-shelf", name: "Floating shelf mounting", rating: 4.85, reviews: "68K", price: 199, options: 2, image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=300&q=80" },
      { id: "photo-frame", name: "Photo frame/art hanging", rating: 4.80, reviews: "42K", price: 99, duration: "20 mins", image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "bath-fittings": {
    title: "Bath fittings & mirrors",
    services: [
      { id: "mirror-install", name: "Mirror installation", rating: 4.81, reviews: "58K", price: 199, duration: "30 mins", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=300&q=80" },
      { id: "towel-rack", name: "Towel rack installation", rating: 4.78, reviews: "42K", price: 99, duration: "20 mins", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=300&q=80" },
      { id: "cabinet-install", name: "Bathroom cabinet installation", rating: 4.76, reviews: "28K", price: 349, duration: "60 mins", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "wooden-door": {
    title: "Wooden door",
    services: [
      { id: "door-repair", name: "Door repair", rating: 4.77, reviews: "75K", price: 249, options: 4, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "door-lock", name: "Door lock installation", rating: 4.82, reviews: "92K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "door-hinge", name: "Door hinge repair", rating: 4.75, reviews: "45K", price: 99, duration: "20 mins", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "window-curtain": {
    title: "Window & curtain",
    services: [
      { id: "curtain-rod", name: "Curtain rod installation", rating: 4.83, reviews: "88K", price: 199, duration: "45 mins", image: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=300&q=80" },
      { id: "window-repair", name: "Window repair", rating: 4.76, reviews: "52K", price: 249, options: 3, image: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=300&q=80" },
      { id: "blind-install", name: "Blind installation", rating: 4.80, reviews: "35K", price: 299, duration: "45 mins", image: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "bed": {
    title: "Bed",
    services: [
      { id: "bed-repair", name: "Bed repair", rating: 4.78, reviews: "65K", price: 299, options: 3, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80" },
      { id: "headboard", name: "Headboard installation", rating: 4.80, reviews: "28K", price: 199, duration: "45 mins", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80" },
      { id: "bed-assembly", name: "Bed assembly", rating: 4.82, reviews: "42K", price: 399, duration: "90 mins", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "furniture": {
    title: "Furniture assembly",
    services: [
      { id: "table-assembly", name: "Table assembly", rating: 4.81, reviews: "55K", price: 249, duration: "45 mins", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80" },
      { id: "chair-repair", name: "Chair repair", rating: 4.77, reviews: "38K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80" },
      { id: "wardrobe-assembly", name: "Wardrobe assembly", rating: 4.85, reviews: "72K", price: 599, duration: "2-3 hours", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80" },
    ],
  },
};

// Service Card Component
const ServiceCard = ({ 
  service, 
  quantity, 
  onAdd, 
  onRemove,
  onViewDetails,
}: { 
  service: typeof ALL_SERVICES["bed"]["services"][0];
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onViewDetails: () => void;
}) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <View style={styles.ratingRow}>
        <Star size={12} color="#000000" fill="#000000" />
        <Text style={styles.ratingText}>{service.rating} ({service.reviews} reviews)</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>Starts at ₹{service.price}</Text>
        {service.duration && <Text style={styles.duration}> • {service.duration}</Text>}
      </View>
      <TouchableOpacity style={styles.viewDetailsBtn} onPress={onViewDetails}>
        <Text style={styles.viewDetailsText}>View details</Text>
      </TouchableOpacity>
    </View>
    
    <View style={styles.serviceRight}>
      <Image source={{ uri: service.image }} style={styles.serviceImage} resizeMode="cover" />
      {quantity === 0 ? (
        <TouchableOpacity style={styles.addButton} onPress={onAdd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={onAdd}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
      {service.options && <Text style={styles.optionsText}>{service.options} options</Text>}
    </View>
  </View>
);

export default function CarpenterFullPageScreen() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState("cupboard-drawer");
  const [sectionPositions, setSectionPositions] = useState<{ [key: string]: number }>({});
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);

  useEffect(() => {
    if (scrollTo && !hasScrolledToInitial && Object.keys(sectionPositions).length > 0) {
      const position = sectionPositions[scrollTo];
      if (position !== undefined && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: position - 120, animated: true });
          setActiveCategory(scrollTo);
          setHasScrolledToInitial(true);
        }, 300);
      }
    }
  }, [scrollTo, sectionPositions, hasScrolledToInitial]);

  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId);
    const position = sectionPositions[categoryId];
    if (position !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: position - 120, animated: true });
    }
  };

  const handleSectionLayout = (categoryId: string, y: number) => {
    setSectionPositions(prev => ({ ...prev, [categoryId]: y }));
  };

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

  const handleViewDetails = (serviceId: string) => {
    router.push(`/carpenter/service/${serviceId}`);
  };

  const getCartTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      Object.values(ALL_SERVICES).forEach(category => {
        const service = category.services.find(s => s.id === id);
        if (service) total += service.price * qty;
      });
    });
    return total;
  };

  const getCartItemCount = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Carpenter</Text>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#16A34A" />
            <Text style={styles.headerSlotText}>Earliest slot: Thu, 9:00 AM</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Search size={20} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Share2 size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Grid */}
      <View style={styles.categoryGridContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categoryItem, activeCategory === cat.id && styles.categoryItemActive]}
              onPress={() => handleCategoryPress(cat.id)}
            >
              <View style={[styles.categoryImageBox, activeCategory === cat.id && styles.categoryImageBoxActive]}>
                <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="contain" />
              </View>
              <Text style={[styles.categoryName, activeCategory === cat.id && styles.categoryNameActive]} numberOfLines={2}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Services ScrollView */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const scrollY = e.nativeEvent.contentOffset.y;
          let currentCategory = "cupboard-drawer";
          Object.entries(sectionPositions).forEach(([id, pos]) => {
            if (scrollY >= pos - 150) currentCategory = id;
          });
          if (currentCategory !== activeCategory) setActiveCategory(currentCategory);
        }}
        scrollEventThrottle={16}
      >
        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View key={categoryId} onLayout={(e) => handleSectionLayout(categoryId, e.nativeEvent.layout.y)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{categoryData.title}</Text>
              <Text style={styles.sectionTitle}>{categoryData.title}</Text>
            </View>
            {categoryData.services.map((service, index) => (
              <View key={service.id}>
                <ServiceCard
                  service={service}
                  quantity={cart[service.id] || 0}
                  onAdd={() => handleAddToCart(service.id)}
                  onRemove={() => handleRemoveFromCart(service.id)}
                  onViewDetails={() => handleViewDetails(service.id)}
                />
                {index < categoryData.services.length - 1 && <View style={styles.serviceDivider} />}
              </View>
            ))}
            <View style={styles.sectionDivider} />
          </View>
        ))}
        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.menuButton}>
        <Menu size={20} color="#FFFFFF" />
        <Text style={styles.menuButtonText}>Menu</Text>
      </TouchableOpacity>

      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}>
        <Tag size={16} color="#16A34A" />
        <Text style={styles.bottomPromoText}>Get visitation fee off on orders above ₹499</Text>
      </View>

      {getCartItemCount() > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000000" },
  headerSlot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerSlotText: { fontSize: 12, color: "#16A34A" },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  categoryGridContainer: { backgroundColor: "#FFFFFF", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  categoryGrid: { paddingHorizontal: 12, gap: 8 },
  categoryItem: { width: 85, alignItems: "center", marginHorizontal: 4 },
  categoryItemActive: {},
  categoryImageBox: { width: 75, height: 75, borderRadius: 12, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  categoryImageBoxActive: { borderWidth: 2, borderColor: "#EA580C" },
  categoryImage: { width: 65, height: 65 },
  categoryName: { fontSize: 12, fontWeight: "500", color: "#6B7280", textAlign: "center", lineHeight: 15 },
  categoryNameActive: { color: "#EA580C", fontWeight: "600" },
  scrollView: { flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: "#F9FAFB" },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#6B7280", marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#000000" },
  serviceCard: { flexDirection: "row", padding: 16, backgroundColor: "#FFFFFF" },
  serviceInfo: { flex: 1, paddingRight: 12 },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#000000", marginBottom: 6, lineHeight: 22 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  ratingText: { fontSize: 13, color: "#6B7280", textDecorationLine: "underline" },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  price: { fontSize: 14, fontWeight: "600", color: "#000000" },
  duration: { fontSize: 14, color: "#6B7280" },
  viewDetailsBtn: {},
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: "#EA580C" },
  serviceRight: { alignItems: "center", width: 120 },
  serviceImage: { width: 110, height: 90, borderRadius: 8, backgroundColor: "#F9FAFB", marginBottom: 10 },
  addButton: { borderWidth: 1.5, borderColor: "#EA580C", borderRadius: 6, paddingHorizontal: 32, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  addButtonText: { fontSize: 14, fontWeight: "700", color: "#EA580C" },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#EA580C", borderRadius: 6, backgroundColor: "#FFFFFF" },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: "#EA580C" },
  qtyValue: { fontSize: 14, fontWeight: "700", color: "#EA580C", minWidth: 24, textAlign: "center" },
  optionsText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  serviceDivider: { height: 1, backgroundColor: "#E5E7EB", marginHorizontal: 16 },
  sectionDivider: { height: 8, backgroundColor: "#F3F4F6" },
  menuButton: { position: "absolute", bottom: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 8 },
  menuButtonText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  bottomPromo: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FEF9C3", paddingVertical: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#FDE68A" },
  bottomPromoText: { fontSize: 14, fontWeight: "600", color: "#16A34A" },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28 },
  cartInfo: {},
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#EA580C", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
