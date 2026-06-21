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
import { SuperSaverPackages, PackageData } from "@/src/components/SuperSaverPackages";
import { PackageCustomizerModal, PackageItem } from "@/src/components/PackageCustomizerModal";


// Category tabs data
const CATEGORIES = [
  { id: "switch-socket", name: "Switch &\nsocket", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=200&q=80" },
  { id: "fan", name: "Fan", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80" },
  { id: "light", name: "Light", image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=200&q=80" },
  { id: "wiring", name: "Wiring", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=200&q=80" },
  { id: "doorbell-security", name: "Doorbell &\nsecurity", image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=200&q=80" },
  { id: "mcb-fuse", name: "MCB/fuse", image: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?auto=format&fit=crop&w=200&q=80" },
  { id: "appliances", name: "Appliances", image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=200&q=80" },
  { id: "consultation", name: "Book a\nconsultation", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80" },
];

const SUPER_SAVER_PACKAGES: PackageData[] = [
  {
    id: "home-safety-check",
    name: "Home safety check",
    rating: 4.87,
    reviewCount: "324K",
    price: 499,
    originalPrice: 599,
    duration: "1 hr",
    discount: 17,
    customizable: true,
    items: [
      { category: "Switch & socket", description: "Inspection of up to 10 switches" },
      { category: "MCB", description: "MCB & earth check" },
      { category: "Wiring", description: "Loose wiring fix" },
    ],
    customizableItems: [
      {
        category: "Switch & Socket",
        items: [
          { id: "hsc-s1", name: "Switch / socket inspection", price: 199, selected: true, variants: ["Up to 10", "11-20"] },
          { id: "hsc-s2", name: "Switch replacement", price: 149, variants: ["Modular", "Heavy duty"] },
        ],
      },
      {
        category: "Power & Safety",
        items: [
          { id: "hsc-m1", name: "MCB & earth check", price: 199, selected: true },
          { id: "hsc-w1", name: "Loose wiring fix", price: 249, selected: true },
        ],
      },
    ],
  },
  {
    id: "fan-light-combo",
    name: "Fan & light combo",
    rating: 4.85,
    reviewCount: "278K",
    price: 599,
    originalPrice: 749,
    duration: "1 hr 15 mins",
    discount: 20,
    customizable: true,
    items: [
      { category: "Fan", description: "Ceiling fan install / repair" },
      { category: "Light", description: "Tube light / LED installation" },
    ],
    customizableItems: [
      {
        category: "Fan",
        items: [
          { id: "flc-f1", name: "Ceiling fan install", price: 399, selected: true, variants: ["Regular", "BLDC", "Designer"] },
          { id: "flc-f2", name: "Fan capacitor replacement", price: 249 },
        ],
      },
      {
        category: "Light",
        items: [
          { id: "flc-l1", name: "Tube light / LED install", price: 199, selected: true, variants: ["Single", "Double"] },
          { id: "flc-l2", name: "Chandelier install", price: 599 },
        ],
      },
    ],
  },
];

// All services organized by category
const ALL_SERVICES = {
  "switch-socket": {
    title: "Switch & socket",
    services: [
      { id: "switch-repair", name: "Switch/socket repair", rating: 4.82, reviews: "180K", price: 69, duration: "30 mins", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=80" },
      { id: "switch-install", name: "Switch/socket installation", rating: 4.80, reviews: "145K", price: 99, options: 3, image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=80" },
      { id: "switch-replace", name: "Switch/socket replacement", rating: 4.78, reviews: "92K", price: 149, duration: "45 mins", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "fan": {
    title: "Fan",
    services: [
      { id: "fan-install", name: "Ceiling fan installation", rating: 4.85, reviews: "220K", price: 299, duration: "45 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "fan-repair", name: "Fan repair", rating: 4.79, reviews: "165K", price: 149, options: 4, image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "fan-uninstall", name: "Fan uninstallation", rating: 4.75, reviews: "45K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "exhaust-fan", name: "Exhaust fan installation", rating: 4.82, reviews: "78K", price: 199, duration: "45 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "light": {
    title: "Light",
    services: [
      { id: "light-install", name: "Light installation", rating: 4.83, reviews: "195K", price: 99, options: 5, image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=300&q=80" },
      { id: "light-repair", name: "Light repair", rating: 4.78, reviews: "125K", price: 79, duration: "30 mins", image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=300&q=80" },
      { id: "chandelier", name: "Chandelier installation", rating: 4.88, reviews: "32K", price: 499, duration: "90 mins", image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "wiring": {
    title: "Wiring",
    services: [
      { id: "new-wiring", name: "New wiring installation", rating: 4.76, reviews: "85K", price: 199, options: 3, image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=300&q=80" },
      { id: "wiring-repair", name: "Wiring repair", rating: 4.74, reviews: "62K", price: 149, duration: "60 mins", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=300&q=80" },
      { id: "concealed-wiring", name: "Concealed wiring", rating: 4.80, reviews: "28K", price: 349, duration: "2-3 hours", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "doorbell-security": {
    title: "Doorbell & security",
    services: [
      { id: "doorbell-install", name: "Doorbell installation", rating: 4.81, reviews: "72K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&q=80" },
      { id: "video-doorbell", name: "Video doorbell setup", rating: 4.85, reviews: "35K", price: 299, duration: "60 mins", image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&q=80" },
      { id: "cctv-install", name: "CCTV installation", rating: 4.78, reviews: "48K", price: 499, options: 4, image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "mcb-fuse": {
    title: "MCB/fuse",
    services: [
      { id: "mcb-install", name: "MCB installation", rating: 4.79, reviews: "58K", price: 199, duration: "45 mins", image: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?auto=format&fit=crop&w=300&q=80" },
      { id: "mcb-repair", name: "MCB repair/replacement", rating: 4.77, reviews: "42K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?auto=format&fit=crop&w=300&q=80" },
      { id: "fuse-box", name: "Fuse box repair", rating: 4.75, reviews: "35K", price: 249, duration: "60 mins", image: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "appliances": {
    title: "Appliances",
    services: [
      { id: "inverter-install", name: "Inverter installation", rating: 4.82, reviews: "65K", price: 349, duration: "60 mins", image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=300&q=80" },
      { id: "geyser-install", name: "Geyser installation", rating: 4.80, reviews: "88K", price: 299, duration: "45 mins", image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=300&q=80" },
      { id: "tv-mount", name: "TV mounting", rating: 4.85, reviews: "125K", price: 399, options: 2, image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "consultation": {
    title: "Book a consultation",
    services: [
      { id: "consult", name: "Expert consultation", rating: 4.88, reviews: "25K", price: 49, duration: "30 mins", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80" },
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
  service: typeof ALL_SERVICES["fan"]["services"][0];
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

export default function ElectricianFullPageScreen() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState("switch-socket");
  const [sectionPositions, setSectionPositions] = useState<{ [key: string]: number }>({});
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

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

  const handlePackageAdd = (packageId: string) => {
    const pkg = SUPER_SAVER_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;
    if (pkg.customizable) {
      setSelectedPackageId(packageId);
      setPackageModalVisible(true);
    } else {
      // Add the whole package as a single cart item
      setCart((prev) => ({ ...prev, [`pkg-${packageId}`]: (prev[`pkg-${packageId}`] || 0) + 1 }));
    }
  };

  const handlePackageEdit = (packageId: string) => {
    setSelectedPackageId(packageId);
    setPackageModalVisible(true);
  };

  const handlePackageAddToCart = (packageId: string, _items: PackageItem[], totalPrice: number) => {
    // Store package as a synthetic cart entry; price is encoded in the id via getCartTotal override
    setCart((prev) => ({ ...prev, [`pkg-${packageId}-${totalPrice}`]: 1 }));
  };

  const handleViewDetails = (serviceId: string) => {
    router.push(`/electrician/service/${serviceId}`);
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
          <Text style={styles.headerTitle}>Electrician</Text>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#059669" />
            <Text style={styles.headerSlotText}>Earliest slot: Wed, 8:00 AM</Text>
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

      {/* Category Grid - Sticky at top */}
      <View style={styles.categoryGridContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryGrid}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[
                styles.categoryItem,
                activeCategory === cat.id && styles.categoryItemActive,
              ]}
              onPress={() => handleCategoryPress(cat.id)}
            >
              <View style={[
                styles.categoryImageBox,
                activeCategory === cat.id && styles.categoryImageBoxActive,
              ]}>
                <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="contain" />
              </View>
              <Text style={[
                styles.categoryName,
                activeCategory === cat.id && styles.categoryNameActive,
              ]} numberOfLines={2}>{cat.name}</Text>
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
          let currentCategory = "switch-socket";
          Object.entries(sectionPositions).forEach(([id, pos]) => {
            if (scrollY >= pos - 150) {
              currentCategory = id;
            }
          });
          if (currentCategory !== activeCategory) {
            setActiveCategory(currentCategory);
          }
        }}
        scrollEventThrottle={16}
      >
        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View 
            key={categoryId}
            onLayout={(e) => handleSectionLayout(categoryId, e.nativeEvent.layout.y)}
          >
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

        {/* Urban-Company-style Packages */}
        <SuperSaverPackages
          packages={SUPER_SAVER_PACKAGES}
          themeColor="#F59E0B"
          sectionTitle="Packages"
          onAddPackage={handlePackageAdd}
          onEditPackage={handlePackageEdit}
        />
        <View style={styles.sectionDivider} />
        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      {/* Floating Menu Button */}
      <TouchableOpacity style={styles.menuButton}>
        <Menu size={20} color="#FFFFFF" />
        <Text style={styles.menuButtonText}>Menu</Text>
      </TouchableOpacity>

      {/* Bottom Promo Bar */}
      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}>
        <Tag size={16} color="#059669" />
        <Text style={styles.bottomPromoText}>Get visitation fee off on orders above ₹499</Text>
      </View>

      {/* Cart Bar */}
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
          <PackageCustomizerModal
        visible={packageModalVisible}
        onClose={() => setPackageModalVisible(false)}
        packageData={SUPER_SAVER_PACKAGES.find((p) => p.id === selectedPackageId) || null}
        themeColor="#F59E0B"
        onAddToCart={handlePackageAddToCart}
      />
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
  headerSlotText: { fontSize: 12, color: "#059669" },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  categoryGridContainer: { backgroundColor: "#FFFFFF", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  categoryGrid: { paddingHorizontal: 12, gap: 8 },
  categoryItem: { width: 85, alignItems: "center", marginHorizontal: 4 },
  categoryItemActive: {},
  categoryImageBox: { width: 75, height: 75, borderRadius: 12, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  categoryImageBoxActive: { borderWidth: 2, borderColor: "#059669" },
  categoryImage: { width: 65, height: 65 },
  categoryName: { fontSize: 12, fontWeight: "500", color: "#6B7280", textAlign: "center", lineHeight: 15 },
  categoryNameActive: { color: "#059669", fontWeight: "600" },
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
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: "#059669" },
  serviceRight: { alignItems: "center", width: 120 },
  serviceImage: { width: 110, height: 90, borderRadius: 8, backgroundColor: "#F9FAFB", marginBottom: 10 },
  addButton: { borderWidth: 1.5, borderColor: "#059669", borderRadius: 6, paddingHorizontal: 32, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  addButtonText: { fontSize: 14, fontWeight: "700", color: "#059669" },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#059669", borderRadius: 6, backgroundColor: "#FFFFFF" },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: "#059669" },
  qtyValue: { fontSize: 14, fontWeight: "700", color: "#059669", minWidth: 24, textAlign: "center" },
  optionsText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  serviceDivider: { height: 1, backgroundColor: "#E5E7EB", marginHorizontal: 16 },
  sectionDivider: { height: 8, backgroundColor: "#F3F4F6" },
  menuButton: { position: "absolute", bottom: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 8 },
  menuButtonText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  bottomPromo: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#ECFDF5", paddingVertical: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#D1FAE5" },
  bottomPromoText: { fontSize: 14, fontWeight: "600", color: "#059669" },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28 },
  cartInfo: {},
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#059669", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
