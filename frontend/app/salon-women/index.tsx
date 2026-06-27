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
import { ArrowLeft, ChevronRight, Search, Share2, Star, Clock, Menu, Tag } from "lucide-react-native";
import { useCart } from "@/src/context/CartContext";
import { colors } from "@/src/theme";
import { SuperSaverPackages, PackageData } from "@/src/components/SuperSaverPackages";
import { PackageCustomizerModal } from "@/src/components/PackageCustomizerModal";
import { useCategoryContent } from "@/src/hooks/useCategoryContent";

const THEME_COLOR = "#EC4899";

// Fallback content used only if Supabase / CMS fetch returns nothing — keeps the screen
// usable when the backend is unreachable. Live data from the admin CMS overrides this.
const FALLBACK_ALL_SERVICES: Record<string, { title: string; services: any[] }> = {
  "waxing": {
    title: "Waxing",
    services: [
      { id: "full-arms", name: "Full arms waxing", rating: 4.85, reviews: "320K", price: 249, duration: "20 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
      { id: "full-legs", name: "Full legs waxing", rating: 4.82, reviews: "285K", price: 349, duration: "30 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
      { id: "underarms", name: "Underarms waxing", rating: 4.88, reviews: "195K", price: 79, duration: "10 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
      { id: "full-body-wax", name: "Full body waxing", rating: 4.80, reviews: "125K", price: 1199, originalPrice: 1499, duration: "90 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "facial": {
    title: "Facials",
    services: [
      { id: "gold-facial", name: "Gold facial", rating: 4.88, reviews: "245K", price: 999, duration: "60 mins", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&q=80" },
      { id: "korean-glass", name: "Korean glass skin facial", rating: 4.92, reviews: "185K", price: 1499, duration: "75 mins", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&q=80" },
      { id: "diamond-facial", name: "Diamond facial", rating: 4.85, reviews: "142K", price: 1199, duration: "60 mins", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&q=80" },
      { id: "bridal-facial", name: "Bridal glow facial", rating: 4.90, reviews: "95K", price: 1999, duration: "90 mins", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "cleanup": {
    title: "Cleanup",
    services: [
      { id: "basic-cleanup", name: "Basic cleanup", rating: 4.78, reviews: "165K", price: 449, duration: "30 mins", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=300&q=80" },
      { id: "fruit-cleanup", name: "Fruit cleanup", rating: 4.82, reviews: "125K", price: 549, duration: "35 mins", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=300&q=80" },
      { id: "charcoal-cleanup", name: "Charcoal cleanup", rating: 4.85, reviews: "95K", price: 599, duration: "40 mins", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "pedicure": {
    title: "Pedicure & Manicure",
    services: [
      { id: "classic-mani", name: "Classic manicure", rating: 4.82, reviews: "185K", price: 399, duration: "30 mins", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80" },
      { id: "classic-pedi", name: "Classic pedicure", rating: 4.85, reviews: "195K", price: 499, duration: "40 mins", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80" },
      { id: "spa-mani-pedi", name: "Spa manicure + pedicure", rating: 4.88, reviews: "125K", price: 1199, originalPrice: 1398, duration: "75 mins", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "threading": {
    title: "Threading & Face",
    services: [
      { id: "eyebrow", name: "Eyebrow threading", rating: 4.90, reviews: "425K", price: 49, duration: "10 mins", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80" },
      { id: "upper-lip", name: "Upper lip threading", rating: 4.88, reviews: "385K", price: 29, duration: "5 mins", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80" },
      { id: "full-face", name: "Full face threading", rating: 4.85, reviews: "245K", price: 149, duration: "20 mins", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "hair-care": {
    title: "Hair Care",
    services: [
      { id: "haircut-women", name: "Women's haircut", rating: 4.82, reviews: "185K", price: 399, duration: "30 mins", image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80" },
      { id: "hair-spa", name: "Hair spa", rating: 4.85, reviews: "165K", price: 699, duration: "45 mins", image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80" },
      { id: "keratin", name: "Keratin treatment", rating: 4.78, reviews: "85K", price: 2499, options: 3, image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "makeup": {
    title: "Makeup & Styling",
    services: [
      { id: "party-makeup", name: "Party makeup", rating: 4.88, reviews: "125K", price: 1499, duration: "60 mins", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80" },
      { id: "bridal-makeup", name: "Bridal makeup", rating: 4.92, reviews: "65K", price: 4999, options: 3, image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80" },
      { id: "engagement-makeup", name: "Engagement makeup", rating: 4.90, reviews: "45K", price: 3499, duration: "90 mins", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "bleach": {
    title: "Bleach & Detan",
    services: [
      { id: "face-bleach", name: "Face bleach", rating: 4.78, reviews: "145K", price: 299, duration: "20 mins", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=300&q=80" },
      { id: "face-detan", name: "Face de-tan", rating: 4.82, reviews: "165K", price: 399, duration: "25 mins", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=300&q=80" },
      { id: "full-body-detan", name: "Full body de-tan", rating: 4.80, reviews: "85K", price: 1299, duration: "60 mins", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=300&q=80" },
    ],
  },
};

const SUPER_SAVER_PACKAGES: PackageData[] = [
  {
    id: "make-your-own-women",
    name: "Make your own package",
    rating: 4.90,
    reviewCount: "1.3M",
    price: 5387,
    originalPrice: 6734,
    duration: "5 hrs",
    discount: 20,
    items: [
      { category: "Waxing", description: "Full arms (including underarms) - RICA gold, Fu..." },
      { category: "Facial & cleanup", description: "Korean glass skin facial" },
      { category: "Manicure", description: "Ice cream delight manicure" },
      { category: "Pedicure", description: "Ice-cream delight pedicure" },
      { category: "Facial hair removal", description: "Eyebrows - Threading" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Waxing",
        items: [
          { id: "w1", name: "Full arms (including underarms)", price: 819, selected: true, variants: ["RICA gold", "Chocolate", "Honey"] },
          { id: "w2", name: "Full legs", price: 769, selected: true, variants: ["RICA gold", "Chocolate", "Aloe vera"] },
          { id: "w3", name: "Back", price: 899, variants: ["Cirepil", "RICA gold"] },
          { id: "w4", name: "Stomach", price: 619, variants: ["RICA gold", "Chocolate"] },
          { id: "w5", name: "Half legs", price: 439, variants: ["Crystal", "RICA"] },
          { id: "w6", name: "Full body", price: 2519, variants: ["RICA gold", "Premium"] },
          { id: "w7", name: "Underarms", price: 269, variants: ["Cirepil", "RICA"] },
          { id: "w8", name: "Bikini line", price: 899, variants: ["Cirepil", "RICA"] },
        ],
      },
      {
        category: "Facial & Cleanup",
        items: [
          { id: "f1", name: "Korean glass skin facial", price: 1499, selected: true },
          { id: "f2", name: "Gold radiance facial", price: 999 },
          { id: "f3", name: "Diamond glow facial", price: 1199 },
          { id: "f4", name: "Fruit cleanup", price: 549 },
        ],
      },
      {
        category: "Manicure & Pedicure",
        items: [
          { id: "m1", name: "Ice cream delight manicure", price: 599, selected: true },
          { id: "m2", name: "Ice cream delight pedicure", price: 699, selected: true },
          { id: "m3", name: "Classic manicure", price: 399 },
          { id: "m4", name: "Classic pedicure", price: 499 },
        ],
      },
    ],
  },
  {
    id: "monthly-maintenance",
    name: "Monthly maintenance package",
    rating: 4.90,
    reviewCount: "947K",
    price: 3001,
    originalPrice: 3335,
    duration: "2 hrs 25 mins",
    discount: 10,
    items: [
      { category: "Cleanup", description: "Hydra Mud Glow Cleanup" },
      { category: "Waxing", description: "Full arms (including underarms) - Rica Gold Tin, Fu..." },
      { category: "Facial hair removal", description: "Eyebrows - Threading" },
    ],
    customizable: false,
  },
  {
    id: "bridal-glow",
    name: "Bridal glow package",
    rating: 4.92,
    reviewCount: "425K",
    price: 7999,
    originalPrice: 9999,
    duration: "6 hrs",
    discount: 20,
    items: [
      { category: "Bridal facial", description: "Premium bridal glow facial" },
      { category: "Full body waxing", description: "RICA gold premium wax" },
      { category: "Manicure & Pedicure", description: "Spa manicure + pedicure" },
      { category: "Hair spa", description: "Deep conditioning treatment" },
      { category: "Bleach & Detan", description: "Full body de-tan" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Bridal Services",
        items: [
          { id: "b1", name: "Bridal glow facial", price: 1999, selected: true },
          { id: "b2", name: "Full body waxing", price: 2519, selected: true },
          { id: "b3", name: "Spa manicure + pedicure", price: 1199, selected: true },
          { id: "b4", name: "Hair spa", price: 699, selected: true },
          { id: "b5", name: "Full body de-tan", price: 1299, selected: true },
        ],
      },
    ],
  },
];

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

export default function SalonWomenFullPageScreen() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const { replaceAllItems: __syncGlobalCart } = useCart();

  // 🔌 Live CMS-driven content (admin Sub-cats + Services for category "salon-women")
  const {
    CATEGORIES: liveCats,
    ALL_SERVICES: liveServices,
    initialActiveId,
    loading: cmsLoading,
  } = useCategoryContent("salon-women");
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
      return { service_id: id, quantity: qty, title: svc?.name, image: svc?.image, price: svc?.price, category: "salon-women" };
    });
    __syncGlobalCart(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const [activeCategory, setActiveCategory] = useState("");
  const [sectionPositions, setSectionPositions] = useState<{ [key: string]: number }>({});
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);

  // Set initial active tab when CMS data finishes loading
  useEffect(() => {
    if (!activeCategory && initialActiveId) setActiveCategory(initialActiveId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialActiveId]);

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

  const handleAddPackage = (packageId: string) => {
    const pkg = SUPER_SAVER_PACKAGES.find(p => p.id === packageId);
    if (pkg) {
      if (pkg.customizable) {
        setSelectedPackage(pkg);
        setShowPackageModal(true);
      } else {
        setCart(prev => ({ ...prev, [`pkg-${packageId}`]: (prev[`pkg-${packageId}`] || 0) + 1 }));
      }
    }
  };

  const handleEditPackage = (packageId: string) => {
    const pkg = SUPER_SAVER_PACKAGES.find(p => p.id === packageId);
    if (pkg) {
      setSelectedPackage(pkg);
      setShowPackageModal(true);
    }
  };

  const handlePackageAddToCart = (packageId: string, selectedItems: any[], totalPrice: number) => {
    setCart(prev => ({ ...prev, [`pkg-${packageId}`]: 1 }));
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ArrowLeft size={20} color="#000" /></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Salon for Women</Text>
          <View style={styles.headerSlot}><Clock size={12} color={THEME_COLOR} /><Text style={styles.headerSlotText}>Earliest slot: Today, 11:00 AM</Text></View>
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
        onScroll={(e) => { const scrollY = e.nativeEvent.contentOffset.y; let current = "waxing"; Object.entries(sectionPositions).forEach(([id, pos]) => { if (scrollY >= pos - 150) current = id; }); if (current !== activeCategory) setActiveCategory(current); }}
        scrollEventThrottle={16}
      >
        <SuperSaverPackages
          packages={SUPER_SAVER_PACKAGES}
          themeColor={THEME_COLOR}
          onAddPackage={handleAddPackage}
          onEditPackage={handleEditPackage}
        />
        <View style={styles.sectionDivider} />

        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View key={categoryId} onLayout={(e) => setSectionPositions(prev => ({ ...prev, [categoryId]: e.nativeEvent.layout.y }))}>
            <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{categoryData.title}</Text><Text style={styles.sectionTitle}>{categoryData.title}</Text></View>
            {categoryData.services.map((service, index) => (
              <View key={service.id}>
                <ServiceCard service={service} quantity={cart[service.id] || 0} onAdd={() => handleAddToCart(service.id)} onRemove={() => handleRemoveFromCart(service.id)} onViewDetails={() => router.push(`/salon-women/service/${service.id}`)} />
                {index < categoryData.services.length - 1 && <View style={styles.serviceDivider} />}
              </View>
            ))}
            <View style={styles.sectionDivider} />
          </View>
        ))}
        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      <PackageCustomizerModal
        visible={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        packageData={selectedPackage}
        themeColor={THEME_COLOR}
        onAddToCart={handlePackageAddToCart}
      />

      <TouchableOpacity style={styles.menuButton}><Menu size={20} color="#FFF" /><Text style={styles.menuButtonText}>Menu</Text></TouchableOpacity>
      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}><Tag size={16} color={THEME_COLOR} /><Text style={styles.bottomPromoText}>Flat ₹200 off on orders above ₹1999</Text></View>

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
  headerSlotText: { fontSize: 12, color: THEME_COLOR },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  categoryGridContainer: { backgroundColor: "#FFF", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  categoryGrid: { paddingHorizontal: 12, gap: 8 },
  categoryItem: { width: 85, alignItems: "center", marginHorizontal: 4 },
  categoryImageBox: { width: 75, height: 75, borderRadius: 12, backgroundColor: "#FDF2F8", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "#FBCFE8" },
  categoryImageBoxActive: { borderWidth: 2, borderColor: THEME_COLOR },
  categoryImage: { width: 75, height: 75 },
  categoryName: { fontSize: 12, fontWeight: "500", color: "#6B7280", textAlign: "center", lineHeight: 15 },
  categoryNameActive: { color: THEME_COLOR, fontWeight: "600" },
  scrollView: { flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: "#FDF2F8" },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#BE185D", marginBottom: 4 },
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
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: THEME_COLOR },
  serviceRight: { alignItems: "center", width: 120 },
  serviceImage: { width: 110, height: 90, borderRadius: 8, backgroundColor: "#FDF2F8", marginBottom: 10 },
  addButton: { borderWidth: 1.5, borderColor: THEME_COLOR, borderRadius: 6, paddingHorizontal: 32, paddingVertical: 8, backgroundColor: "#FFF" },
  addButtonText: { fontSize: 14, fontWeight: "700", color: THEME_COLOR },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: THEME_COLOR, borderRadius: 6, backgroundColor: "#FFF" },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: THEME_COLOR },
  qtyValue: { fontSize: 14, fontWeight: "700", color: THEME_COLOR, minWidth: 24, textAlign: "center" },
  optionsText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  serviceDivider: { height: 1, backgroundColor: "#FBCFE8", marginHorizontal: 16 },
  sectionDivider: { height: 8, backgroundColor: "#FDF2F8" },
  menuButton: { position: "absolute", bottom: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 8 },
  menuButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  bottomPromo: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FDF2F8", paddingVertical: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#FBCFE8" },
  bottomPromoText: { fontSize: 14, fontWeight: "600", color: THEME_COLOR },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28 },
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: THEME_COLOR, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
