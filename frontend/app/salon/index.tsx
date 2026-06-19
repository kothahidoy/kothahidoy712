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
import { colors } from "@/src/theme";
import { SuperSaverPackages, PackageData } from "@/src/components/SuperSaverPackages";
import { PackageCustomizerModal, PackageItem } from "@/src/components/PackageCustomizerModal";
import { HeroMediaBanner, HeroMediaItem } from "@/src/components/HeroMediaBanner";

const CATEGORIES = [
  { id: "haircut", name: "Haircut &\nstyling", image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=200&q=80" },
  { id: "shave", name: "Shave &\nbeard", image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=200&q=80" },
  { id: "facial", name: "Facial &\ncleanup", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80" },
  { id: "massage", name: "Massage", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=200&q=80" },
  { id: "hair-color", name: "Hair\ncolour", image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=200&q=80" },
  { id: "detan", name: "Detan &\nbleach", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=200&q=80" },
  { id: "pedicure", name: "Pedicure", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=200&q=80" },
  { id: "packages", name: "Grooming\npackages", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=200&q=80" },
];

const ALL_SERVICES = {
  "haircut": {
    title: "Haircut & styling",
    services: [
      { id: "basic-haircut", name: "Basic haircut", rating: 4.85, reviews: "320K", price: 199, duration: "30 mins", image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80" },
      { id: "premium-haircut", name: "Premium haircut", rating: 4.88, reviews: "185K", price: 349, duration: "45 mins", image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80" },
      { id: "hair-styling", name: "Hair styling", rating: 4.82, reviews: "95K", price: 299, options: 3, image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "shave": {
    title: "Shave & beard",
    services: [
      { id: "clean-shave", name: "Clean shave", rating: 4.80, reviews: "245K", price: 149, duration: "20 mins", image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80" },
      { id: "beard-trim", name: "Beard trimming & styling", rating: 4.85, reviews: "178K", price: 199, duration: "25 mins", image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80" },
      { id: "beard-color", name: "Beard color", rating: 4.78, reviews: "62K", price: 249, options: 4, image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "facial": {
    title: "Facial & cleanup",
    services: [
      { id: "basic-facial", name: "Basic cleanup", rating: 4.78, reviews: "142K", price: 399, duration: "30 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
      { id: "charcoal-facial", name: "Charcoal facial", rating: 4.82, reviews: "95K", price: 599, duration: "45 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
      { id: "anti-acne", name: "Anti-acne facial", rating: 4.85, reviews: "68K", price: 799, duration: "60 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "massage": {
    title: "Massage",
    services: [
      { id: "head-massage", name: "Head massage", rating: 4.88, reviews: "165K", price: 199, duration: "20 mins", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&q=80" },
      { id: "body-massage", name: "Full body massage", rating: 4.85, reviews: "125K", price: 899, duration: "60 mins", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&q=80" },
      { id: "foot-massage", name: "Foot massage", rating: 4.82, reviews: "78K", price: 299, duration: "30 mins", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "hair-color": {
    title: "Hair colour",
    services: [
      { id: "global-color", name: "Global hair color", rating: 4.80, reviews: "85K", price: 699, duration: "60 mins", image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80" },
      { id: "root-touchup", name: "Root touch up", rating: 4.82, reviews: "62K", price: 449, duration: "45 mins", image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80" },
      { id: "highlights", name: "Highlights", rating: 4.85, reviews: "45K", price: 999, options: 3, image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "detan": {
    title: "Detan & bleach",
    services: [
      { id: "face-detan", name: "Face de-tan", rating: 4.78, reviews: "92K", price: 299, duration: "20 mins", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=300&q=80" },
      { id: "face-bleach", name: "Face bleach", rating: 4.75, reviews: "75K", price: 199, duration: "15 mins", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "pedicure": {
    title: "Pedicure",
    services: [
      { id: "classic-pedi-men", name: "Classic pedicure", rating: 4.80, reviews: "68K", price: 349, duration: "30 mins", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80" },
      { id: "spa-pedi-men", name: "Spa pedicure", rating: 4.85, reviews: "42K", price: 549, duration: "45 mins", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "packages": {
    title: "Grooming packages",
    services: [
      { id: "grooming-basic", name: "Basic grooming package", rating: 4.85, reviews: "125K", price: 599, originalPrice: 799, duration: "60 mins", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80" },
      { id: "grooming-premium", name: "Premium grooming package", rating: 4.88, reviews: "85K", price: 999, originalPrice: 1299, duration: "90 mins", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80" },
      { id: "groom-special", name: "Groom special package", rating: 4.92, reviews: "35K", price: 1999, options: 2, image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80" },
    ],
  },
};

// Hero banner media — easy to swap with admin-managed list later.
// Mix of images and a sample video that shows the play overlay.
const HERO_MEDIA: HeroMediaItem[] = [
  {
    type: "video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    caption: "Mess free experience",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
    caption: "Salon at home",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80",
    caption: "Trusted pros",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=80",
    caption: "Premium grooming",
  },
];

// Super Saver Packages Data — Urban Company–style packages for Men's Salon
const SUPER_SAVER_PACKAGES: PackageData[] = [
  {
    id: "haircut-massage",
    name: "Haircut & massage",
    rating: 4.86,
    reviewCount: "749K",
    price: 368,
    duration: "40 mins",
    items: [
      { category: "Haircut", description: "Haircut for men" },
      { category: "Massage", description: "10 min Relaxing Head massage" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Haircut",
        items: [
          { id: "hm-hc1", name: "Haircut for men", price: 199, selected: true, variants: ["Classic", "Fade", "Crew cut"] },
          { id: "hm-hc2", name: "Premium haircut", price: 349, variants: ["Textured", "Undercut"] },
        ],
      },
      {
        category: "Massage",
        items: [
          { id: "hm-ms1", name: "10 min head massage", price: 169, selected: true },
          { id: "hm-ms2", name: "20 min head & shoulder", price: 269 },
        ],
      },
    ],
  },
  {
    id: "grooming-essentials",
    name: "Grooming essentials",
    rating: 4.85,
    reviewCount: "993K",
    price: 567,
    duration: "1 hr 5 mins",
    items: [
      { category: "Haircut", description: "Haircut for men" },
      { category: "Beard or shaving grooming", description: "Beard trimming & styling" },
      { category: "Massage", description: "Head massage (10 mins)" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Haircut",
        items: [
          { id: "ge-hc1", name: "Haircut for men", price: 199, selected: true, variants: ["Classic", "Fade", "Modern"] },
        ],
      },
      {
        category: "Shave & Beard",
        items: [
          { id: "ge-sh1", name: "Beard trim & styling", price: 199, selected: true, variants: ["Short trim", "Designer", "Shape up"] },
          { id: "ge-sh2", name: "Clean shave", price: 149 },
        ],
      },
      {
        category: "Massage",
        items: [
          { id: "ge-ms1", name: "Head massage (10 mins)", price: 169, selected: true },
        ],
      },
    ],
  },
  {
    id: "haircut-color",
    name: "Haircut & color",
    rating: 4.86,
    reviewCount: "537K",
    price: 508,
    originalPrice: 558,
    duration: "60 mins",
    items: [
      { category: "Haircut or color", description: "Haircut for men" },
      { category: "Hair color (Garnier)", description: "Brown black (shade 3)" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Haircut",
        items: [
          { id: "hcc-hc1", name: "Haircut for men", price: 199, selected: true, variants: ["Classic", "Fade", "Modern"] },
        ],
      },
      {
        category: "Hair color",
        items: [
          { id: "hcc-col1", name: "Garnier — Brown black", price: 359, selected: true, variants: ["Shade 1", "Shade 2", "Shade 3"] },
          { id: "hcc-col2", name: "Garnier — Black", price: 359, variants: ["Shade 1", "Shade 2"] },
        ],
      },
    ],
  },
  {
    id: "hair-and-care",
    name: "Hair & care",
    rating: 4.85,
    reviewCount: "832K",
    price: 758,
    originalPrice: 808,
    duration: "1 hr 5 mins",
    items: [
      { category: "Haircut", description: "Haircut for men" },
      { category: "Pedicure", description: "Brightening lemon express pedicure" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Haircut",
        items: [
          { id: "hac-hc1", name: "Haircut for men", price: 199, selected: true, variants: ["Classic", "Fade", "Modern"] },
        ],
      },
      {
        category: "Pedicure",
        items: [
          { id: "hac-pd1", name: "Brightening lemon express pedicure", price: 559, selected: true },
          { id: "hac-pd2", name: "Classic pedicure", price: 349 },
        ],
      },
    ],
  },
  {
    id: "face-care-beyond",
    name: "Face care & beyond",
    rating: 4.85,
    reviewCount: "1.1M",
    price: 858,
    duration: "1 hr 5 mins",
    items: [
      { category: "Haircut", description: "Haircut for men" },
      { category: "Facial or cleanup", description: "Charcoal De-toxifying Cleanup" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Haircut",
        items: [
          { id: "fcb-hc1", name: "Haircut for men", price: 199, selected: true, variants: ["Classic", "Fade", "Modern"] },
        ],
      },
      {
        category: "Facial or cleanup",
        items: [
          { id: "fcb-fc1", name: "Charcoal de-toxifying cleanup", price: 659, selected: true, variants: ["VLCC", "Lotus", "O3+"] },
          { id: "fcb-fc2", name: "Brightening cleanup", price: 599 },
        ],
      },
    ],
  },
  {
    id: "make-your-own",
    name: "Make your own package",
    rating: 4.84,
    reviewCount: "1.2M",
    price: 1445,
    originalPrice: 1606,
    duration: "2 hrs 5 mins",
    discount: 10,
    items: [
      { category: "Haircut", description: "Haircut for men" },
      { category: "Shave or beard grooming", description: "Beard trimming & styling" },
      { category: "Facial or cleanup", description: "Charcoal de-toxifying cleanup" },
      { category: "Pedicure", description: "Brightening lemon express pedicure" },
    ],
    customizable: true,
    customizableItems: [
      {
        category: "Haircut & Styling",
        items: [
          { id: "myo-hc1", name: "Basic haircut", price: 199, selected: true, variants: ["Classic", "Fade", "Crew cut"] },
          { id: "myo-hc2", name: "Premium haircut", price: 349, variants: ["Textured", "Undercut", "Pompadour"] },
          { id: "myo-hc3", name: "Hair styling", price: 299, variants: ["Gel finish", "Matte finish", "Natural"] },
        ],
      },
      {
        category: "Shave & Beard",
        items: [
          { id: "myo-sh1", name: "Clean shave", price: 149 },
          { id: "myo-sh2", name: "Beard trim & styling", price: 199, selected: true, variants: ["Short trim", "Designer", "Shape up"] },
          { id: "myo-sh3", name: "Beard color", price: 249, variants: ["Black", "Brown", "Grey blend"] },
        ],
      },
      {
        category: "Facial & Skincare",
        items: [
          { id: "myo-fc1", name: "Basic cleanup", price: 399 },
          { id: "myo-fc2", name: "Charcoal de-toxifying cleanup", price: 599, selected: true, variants: ["VLCC", "Lotus", "O3+"] },
          { id: "myo-fc3", name: "Anti-acne treatment", price: 799 },
        ],
      },
      {
        category: "Pedicure",
        items: [
          { id: "myo-pd1", name: "Brightening lemon express pedicure", price: 559, selected: true },
          { id: "myo-pd2", name: "Classic pedicure", price: 349 },
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

export default function SalonMenFullPageScreen() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState("haircut");
  const [sectionPositions, setSectionPositions] = useState<{ [key: string]: number }>({});
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);

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
        // Add non-customizable package directly to cart
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
          <Text style={styles.headerTitle}>Men's Salon</Text>
          <View style={styles.headerSlot}><Clock size={12} color="#EA580C" /><Text style={styles.headerSlotText}>Earliest slot: Today, 2:00 PM</Text></View>
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
        onScroll={(e) => { const scrollY = e.nativeEvent.contentOffset.y; let current = "haircut"; Object.entries(sectionPositions).forEach(([id, pos]) => { if (scrollY >= pos - 150) current = id; }); if (current !== activeCategory) setActiveCategory(current); }}
        scrollEventThrottle={16}
      >
        {/* Hero Media Banner — swipeable images + video */}
        <HeroMediaBanner items={HERO_MEDIA} height={240} />

        {/* Packages Section (Urban Company–style) */}
        <SuperSaverPackages
          packages={SUPER_SAVER_PACKAGES}
          themeColor="#7C3AED"
          sectionTitle="Packages"
          onAddPackage={handleAddPackage}
          onEditPackage={handleEditPackage}
        />
        <View style={styles.sectionDivider} />

        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View key={categoryId} onLayout={(e) => setSectionPositions(prev => ({ ...prev, [categoryId]: e.nativeEvent.layout.y }))}>
            <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{categoryData.title}</Text><Text style={styles.sectionTitle}>{categoryData.title}</Text></View>
            {categoryData.services.map((service, index) => (
              <View key={service.id}>
                <ServiceCard service={service} quantity={cart[service.id] || 0} onAdd={() => handleAddToCart(service.id)} onRemove={() => handleRemoveFromCart(service.id)} onViewDetails={() => router.push(`/salon/service/${service.id}`)} />
                {index < categoryData.services.length - 1 && <View style={styles.serviceDivider} />}
              </View>
            ))}
            <View style={styles.sectionDivider} />
          </View>
        ))}
        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      {/* Package Customizer Modal */}
      <PackageCustomizerModal
        visible={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        packageData={selectedPackage}
        themeColor="#EA580C"
        onAddToCart={handlePackageAddToCart}
      />

      <TouchableOpacity style={styles.menuButton}><Menu size={20} color="#FFF" /><Text style={styles.menuButtonText}>Menu</Text></TouchableOpacity>
      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}><Tag size={16} color="#EA580C" /><Text style={styles.bottomPromoText}>Flat 20% off on first salon booking</Text></View>

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
  headerSlotText: { fontSize: 12, color: "#EA580C" },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  categoryGridContainer: { backgroundColor: "#FFF", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  categoryGrid: { paddingHorizontal: 12, gap: 8 },
  categoryItem: { width: 85, alignItems: "center", marginHorizontal: 4 },
  categoryImageBox: { width: 75, height: 75, borderRadius: 12, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "#FED7AA" },
  categoryImageBoxActive: { borderWidth: 2, borderColor: "#EA580C" },
  categoryImage: { width: 75, height: 75 },
  categoryName: { fontSize: 12, fontWeight: "500", color: "#6B7280", textAlign: "center", lineHeight: 15 },
  categoryNameActive: { color: "#EA580C", fontWeight: "600" },
  scrollView: { flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: "#FFF7ED" },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#C2410C", marginBottom: 4 },
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
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: "#EA580C" },
  serviceRight: { alignItems: "center", width: 120 },
  serviceImage: { width: 110, height: 90, borderRadius: 8, backgroundColor: "#FFF7ED", marginBottom: 10 },
  addButton: { borderWidth: 1.5, borderColor: "#EA580C", borderRadius: 6, paddingHorizontal: 32, paddingVertical: 8, backgroundColor: "#FFF" },
  addButtonText: { fontSize: 14, fontWeight: "700", color: "#EA580C" },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#EA580C", borderRadius: 6, backgroundColor: "#FFF" },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: "#EA580C" },
  qtyValue: { fontSize: 14, fontWeight: "700", color: "#EA580C", minWidth: 24, textAlign: "center" },
  optionsText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  serviceDivider: { height: 1, backgroundColor: "#FED7AA", marginHorizontal: 16 },
  sectionDivider: { height: 8, backgroundColor: "#FFF7ED" },
  menuButton: { position: "absolute", bottom: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 8 },
  menuButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  bottomPromo: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF7ED", paddingVertical: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#FED7AA" },
  bottomPromoText: { fontSize: 14, fontWeight: "600", color: "#EA580C" },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28 },
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#EA580C", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
