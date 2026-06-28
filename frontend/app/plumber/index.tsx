import React, { useRef, useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
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
import { useCart } from "@/src/context/CartContext";
import { useCategoryContent } from "@/src/hooks/useCategoryContent";

import { colors, radius } from "@/src/theme";
import { SuperSaverPackages, PackageData } from "@/src/components/SuperSaverPackages";
import { PackageCustomizerModal } from "@/src/components/PackageCustomizerModal";

const THEME_COLOR = "#2563EB";

// Category tabs data
// All services organized by category
const FALLBACK_ALL_SERVICES: Record<string, { title: string; services: any[] }> = {
  "tap-mixer": {
    title: "Tap & mixer",
    services: [
      { id: "tap-repair", name: "Tap repair", rating: 4.80, reviews: "200K", price: 99, options: 4, image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80" },
      { id: "tap-install", name: "Tap installation", rating: 4.82, reviews: "120K", price: 149, duration: "45 mins", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80" },
      { id: "mixer-repair", name: "Mixer/diverter repair", rating: 4.78, reviews: "85K", price: 249, options: 3, image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "toilet": {
    title: "Toilet",
    services: [
      { id: "jet-spray", name: "Jet spray repair/replacement", rating: 4.82, reviews: "136K", price: 149, options: 2, image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=300&q=80" },
      { id: "toilet-seat", name: "Toilet seat cover installation", rating: 4.79, reviews: "38K", price: 99, duration: "30 mins", image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=300&q=80" },
      { id: "flush-repair", name: "Flush tank repair", rating: 4.76, reviews: "137K", price: 99, options: 3, image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=300&q=80" },
      { id: "toilet-blockage", name: "Toilet blockage removal", rating: 4.72, reviews: "95K", price: 249, duration: "45 mins", image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "bath-shower": {
    title: "Bath & shower",
    services: [
      { id: "shower-repair", name: "Shower repair", rating: 4.77, reviews: "52K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80" },
      { id: "shower-install", name: "Shower installation", rating: 4.82, reviews: "38K", price: 299, options: 2, image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80" },
      { id: "rain-shower", name: "Rain shower installation", rating: 4.88, reviews: "18K", price: 599, duration: "90 mins", image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "bath-accessories": {
    title: "Bath accessories",
    services: [
      { id: "towel-rod", name: "Towel rod installation", rating: 4.75, reviews: "28K", price: 99, duration: "20 mins", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=300&q=80" },
      { id: "soap-dish", name: "Soap dish/holder installation", rating: 4.78, reviews: "22K", price: 79, duration: "15 mins", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=300&q=80" },
      { id: "mirror-install", name: "Mirror installation", rating: 4.80, reviews: "35K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "basin-sink": {
    title: "Basin & sink",
    services: [
      { id: "basin-install", name: "Basin installation", rating: 4.80, reviews: "42K", price: 299, duration: "60 mins", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
      { id: "sink-repair", name: "Sink repair", rating: 4.76, reviews: "35K", price: 149, duration: "30 mins", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
      { id: "sink-blockage", name: "Sink blockage removal", rating: 4.73, reviews: "58K", price: 199, duration: "30 mins", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "drainage": {
    title: "Drainage & blockage",
    services: [
      { id: "drain-clean", name: "Drain cleaning", rating: 4.73, reviews: "65K", price: 179, duration: "30 mins", image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=80" },
      { id: "floor-drain", name: "Floor drain cleaning", rating: 4.78, reviews: "42K", price: 249, duration: "45 mins", image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=80" },
      { id: "main-line", name: "Main line blockage", rating: 4.70, reviews: "28K", price: 499, options: 2, image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "leakage": {
    title: "Leakage & connections",
    services: [
      { id: "pipe-leak", name: "Pipe leakage repair", rating: 4.77, reviews: "72K", price: 199, duration: "45 mins", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "pipe-replace", name: "Pipe replacement", rating: 4.74, reviews: "38K", price: 349, options: 3, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
      { id: "connection", name: "New pipe connection", rating: 4.79, reviews: "25K", price: 249, duration: "60 mins", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "water-tank": {
    title: "Water tank & motor",
    services: [
      { id: "tank-clean", name: "Water tank cleaning", rating: 4.85, reviews: "45K", price: 599, options: 3, image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "motor-install", name: "Motor installation", rating: 4.76, reviews: "28K", price: 399, duration: "90 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "motor-repair", name: "Motor repair", rating: 4.72, reviews: "35K", price: 299, duration: "60 mins", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "consultation": {
    title: "Book a consultation",
    services: [
      { id: "consult", name: "Expert consultation", rating: 4.88, reviews: "15K", price: 49, duration: "30 mins", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80" },
    ],
  },
};

const SUPER_SAVER_PACKAGES: PackageData[] = [
  {
    id: "bathroom-complete",
    name: "Complete bathroom renovation",
    rating: 4.85,
    reviewCount: "425K",
    price: 1999,
    originalPrice: 2499,
    duration: "4-5 hrs",
    discount: 20,
    items: [
      { category: "Tap & Mixer", description: "2 tap installations + 1 mixer repair" },
      { category: "Toilet", description: "Flush tank repair + jet spray" },
      { category: "Shower", description: "Shower installation" },
      { category: "Accessories", description: "Towel rod + soap dish" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Tap & Mixer",
        items: [
          { id: "p1", name: "Tap installation (x2)", price: 298, selected: true },
          { id: "p2", name: "Mixer repair", price: 249, selected: true },
          { id: "p3", name: "Tap repair", price: 99 },
        ],
      },
      {
        category: "Toilet & Shower",
        items: [
          { id: "p4", name: "Flush tank repair", price: 99, selected: true },
          { id: "p5", name: "Jet spray repair", price: 149, selected: true },
          { id: "p6", name: "Shower installation", price: 299, selected: true },
        ],
      },
      {
        category: "Accessories",
        items: [
          { id: "p7", name: "Towel rod installation", price: 99, selected: true },
          { id: "p8", name: "Soap dish installation", price: 79, selected: true },
          { id: "p9", name: "Mirror installation", price: 149 },
        ],
      },
    ],
  },
  {
    id: "drainage-blockage",
    name: "Full drainage solution",
    rating: 4.78,
    reviewCount: "185K",
    price: 799,
    originalPrice: 899,
    duration: "2-3 hrs",
    discount: 11,
    items: [
      { category: "Drain cleaning", description: "All drains cleaned" },
      { category: "Blockage removal", description: "Toilet + sink blockage" },
    ],
    customizable: false,
  },
  {
    id: "water-tank-motor",
    name: "Water tank & motor service",
    rating: 4.82,
    reviewCount: "95K",
    price: 899,
    originalPrice: 1098,
    duration: "3 hrs",
    discount: 18,
    items: [
      { category: "Tank cleaning", description: "Up to 1000L tank cleaning" },
      { category: "Motor check", description: "Motor inspection & minor repair" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Water Tank & Motor",
        items: [
          { id: "wt1", name: "Tank cleaning (up to 500L)", price: 599 },
          { id: "wt2", name: "Tank cleaning (500-1000L)", price: 799, selected: true },
          { id: "wt3", name: "Motor inspection", price: 99, selected: true },
          { id: "wt4", name: "Motor repair", price: 299 },
        ],
      },
    ],
  },
];

// Service Card Component
const ServiceCard = ({ 
  service, 
  quantity, 
  onAdd, 
  onRemove,
  onViewDetails,
}: { 
  service: typeof ALL_SERVICES["tap-mixer"]["services"][0];
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
      {service.shortDescription ? (
        <Text style={styles.serviceShortDesc} numberOfLines={2}>{service.shortDescription}</Text>
      ) : null}
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

export default function PlumberFullPageScreen() {
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
  } = useCategoryContent("plumber");
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
      return { service_id: id, quantity: qty, title: svc?.name, image: svc?.image, price: svc?.price, category: "plumber" };
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
  const [showMenu, setShowMenu] = useState(false);
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);

  // Handle initial scroll when coming from category page with scrollTo param
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
    router.push(`/plumber/service/${serviceId}`);
  };

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
          <Text style={styles.headerTitle}>Plumber</Text>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#16A34A" />
            <Text style={styles.headerSlotText}>Earliest slot: Thu, 8:00 AM</Text>
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
          // Update active category based on scroll position
          let currentCategory = "tap-mixer";
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
        {/* Super Saver Packages Section */}
        <SuperSaverPackages
          packages={SUPER_SAVER_PACKAGES}
          themeColor={THEME_COLOR}
          onAddPackage={handleAddPackage}
          onEditPackage={handleEditPackage}
        />
        <View style={styles.sectionDivider} />

        {/* All Service Sections */}
        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View 
            key={categoryId}
            onLayout={(e) => handleSectionLayout(categoryId, e.nativeEvent.layout.y)}
          >
            {/* Category Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{categoryData.title}</Text>
              <Text style={styles.sectionTitle}>{categoryData.title}</Text>
            </View>

            {/* Services in this category */}
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

            {/* Section Divider */}
            <View style={styles.sectionDivider} />
          </View>
        ))}

        {/* Mfixit Cover Section */}
        <TouchableOpacity 
          style={styles.coverSection}
          onPress={() => router.push("/cover/plumber")}
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
          <ChevronRight size={24} color={THEME_COLOR} />
        </TouchableOpacity>

        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      {/* Floating Menu Button */}
      <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
        <Menu size={20} color="#FFFFFF" />
        <Text style={styles.menuButtonText}>Menu</Text>
      </TouchableOpacity>

      {/* Package Customizer Modal */}
      <PackageCustomizerModal
        visible={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        packageData={selectedPackage}
        themeColor={THEME_COLOR}
        onAddToCart={handlePackageAddToCart}
      />

      {/* Bottom Promo Bar */}
      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}>
        <Tag size={16} color={THEME_COLOR} />
        <Text style={styles.bottomPromoText}>Get visitation fee off on orders above ₹499</Text>
      </View>

      {/* Cart Bar */}
      {getCartItemCount() > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemCount}>{getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}</Text>
            <Text style={styles.cartTotal}>₹{getCartTotal()}</Text>
          </View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={() => router.push("/cart")}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  headerSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  headerSlotText: {
    fontSize: 12,
    color: "#16A34A",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryGridContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  categoryGrid: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryItem: {
    width: 85,
    alignItems: "center",
    marginHorizontal: 4,
  },
  categoryItemActive: {},
  categoryImageBox: {
    width: 75,
    height: 75,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryImageBoxActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  categoryImage: {
    width: 65,
    height: 65,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 15,
  },
  categoryNameActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
  },
  serviceCard: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 6,
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    color: "#6B7280",
    textDecorationLine: "underline",
  serviceShortDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 8 },
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  duration: {
    fontSize: 14,
    color: "#6B7280",
  },
  viewDetailsBtn: {},
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  serviceRight: {
    alignItems: "center",
    width: 120,
  },
  serviceImage: {
    width: 110,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginBottom: 10,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 32,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  qtyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    minWidth: 24,
    textAlign: "center",
  },
  optionsText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  serviceDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  sectionDivider: {
    height: 8,
    backgroundColor: "#F3F4F6",
  },
  coverSection: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    padding: 20, 
    marginHorizontal: 16, 
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "#F0F9FF", 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  coverContent: { flex: 1 },
  coverBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  coverCheckIcon: { width: 24, height: 24, borderRadius: 6, backgroundColor: THEME_COLOR, alignItems: "center", justifyContent: "center" },
  coverCheckText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  coverBrandText: { fontSize: 18, fontWeight: "800", color: "#000" },
  coverBrandAccent: { color: THEME_COLOR },
  coverTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 4 },
  coverSubtitle: { fontSize: 13, color: "#6B7280" },
  menuButton: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomPromo: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF9C3",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
  },
  bottomPromoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
  },
  cartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
  },
  cartInfo: {},
  cartItemCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 4,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
