import React, { useState, useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  ChevronRight, 
  Minus,
  Plus,
  Star, 
  Info,
  Check,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

// Services data organized by subcategory
const SERVICES_BY_SUBCATEGORY: Record<string, ServiceItem[]> = {
  "switch-socket": [
    {
      id: "ss-1",
      title: "Switch/socket replacement",
      rating: 4.82,
      reviewCount: "67K",
      price: 79,
      duration: 15,
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=200&q=80",
      features: ["Replacement of faulty switch/socket", "Covers all types"],
    },
    {
      id: "ss-2",
      title: "Switchboard installation",
      rating: 4.79,
      reviewCount: "45K",
      price: 149,
      duration: 30,
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80",
      features: ["New modular switchboard", "Wiring included"],
    },
    {
      id: "ss-3",
      title: "New socket point installation",
      rating: 4.75,
      reviewCount: "32K",
      price: 199,
      duration: 45,
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=200&q=80",
      features: ["New power point", "Concealed/open wiring"],
    },
  ],
  "fan": [
    {
      id: "fan-1",
      title: "Fan installation",
      rating: 4.80,
      reviewCount: "128K",
      price: 179,
      duration: 45,
      image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80",
      features: ["Ceiling/wall/exhaust fan", "All fittings included"],
    },
    {
      id: "fan-2",
      title: "Fan uninstallation",
      rating: 4.76,
      reviewCount: "34K",
      price: 99,
      duration: 20,
      image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80",
      features: ["Safe removal", "Any type of fan"],
    },
    {
      id: "fan-3",
      title: "Fan repair",
      rating: 4.77,
      reviewCount: "89K",
      price: 119,
      originalPrice: 149,
      duration: 30,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80",
      features: ["Noise/speed issues", "Capacitor replacement extra"],
    },
    {
      id: "fan-4",
      title: "Fan regulator replacement",
      rating: 4.74,
      reviewCount: "21K",
      price: 149,
      duration: 20,
      image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80",
      features: ["Electronic/manual regulator", "All brands"],
    },
  ],
  "light": [
    {
      id: "light-1",
      title: "Light installation",
      rating: 4.81,
      reviewCount: "76K",
      price: 99,
      duration: 20,
      image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=200&q=80",
      features: ["Tube/LED/bulb fitting", "All types covered"],
    },
    {
      id: "light-2",
      title: "Chandelier installation",
      rating: 4.78,
      reviewCount: "18K",
      price: 349,
      duration: 60,
      image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=200&q=80",
      features: ["Heavy chandelier", "Secure mounting"],
    },
    {
      id: "light-3",
      title: "Decorative light installation",
      rating: 4.79,
      reviewCount: "23K",
      price: 149,
      duration: 30,
      image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=200&q=80",
      features: ["LED strips/spotlights", "Professional setup"],
    },
  ],
  "wiring": [
    {
      id: "wiring-1",
      title: "Wiring repair (per point)",
      rating: 4.74,
      reviewCount: "52K",
      price: 249,
      duration: 60,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=200&q=80",
      features: ["Fault detection", "30-day warranty"],
    },
    {
      id: "wiring-2",
      title: "Complete room wiring",
      rating: 4.72,
      reviewCount: "15K",
      price: 1499,
      duration: 240,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=200&q=80",
      features: ["Full room rewiring", "Concealed work"],
    },
    {
      id: "wiring-3",
      title: "Short circuit repair",
      rating: 4.85,
      reviewCount: "41K",
      price: 299,
      duration: 45,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=200&q=80",
      features: ["Emergency fix", "Safety check included"],
    },
  ],
  "doorbell-security": [
    {
      id: "door-1",
      title: "Doorbell installation",
      rating: 4.76,
      reviewCount: "19K",
      price: 99,
      duration: 20,
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=200&q=80",
      features: ["Wired/wireless", "All brands"],
    },
    {
      id: "door-2",
      title: "Video doorbell setup",
      rating: 4.82,
      reviewCount: "8K",
      price: 299,
      duration: 45,
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=200&q=80",
      features: ["Smart doorbell", "App configuration"],
    },
  ],
  "mcb-fuse": [
    {
      id: "mcb-1",
      title: "MCB/fuse replacement",
      rating: 4.85,
      reviewCount: "34K",
      price: 199,
      duration: 30,
      image: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?auto=format&fit=crop&w=200&q=80",
      features: ["MCB replacement", "Load testing"],
    },
    {
      id: "mcb-2",
      title: "DB box installation",
      rating: 4.80,
      reviewCount: "12K",
      price: 499,
      duration: 60,
      image: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?auto=format&fit=crop&w=200&q=80",
      features: ["New distribution board", "MCB fitting"],
    },
    {
      id: "mcb-3",
      title: "MCB tripping issue fix",
      rating: 4.83,
      reviewCount: "28K",
      price: 249,
      duration: 45,
      image: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?auto=format&fit=crop&w=200&q=80",
      features: ["Diagnosis", "Root cause fix"],
    },
  ],
  "appliances": [
    {
      id: "app-1",
      title: "Geyser installation",
      rating: 4.78,
      reviewCount: "41K",
      price: 349,
      duration: 60,
      image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=200&q=80",
      features: ["All brands", "Proper earthing"],
    },
    {
      id: "app-2",
      title: "Inverter/UPS installation",
      rating: 4.80,
      reviewCount: "28K",
      price: 399,
      duration: 60,
      image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=200&q=80",
      features: ["Battery connection", "Load setup"],
    },
    {
      id: "app-3",
      title: "Stabilizer installation",
      rating: 4.77,
      reviewCount: "15K",
      price: 199,
      duration: 30,
      image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=200&q=80",
      features: ["AC/fridge stabilizer", "Proper wiring"],
    },
  ],
  "consultation": [
    {
      id: "cons-1",
      title: "Electrical consultation",
      rating: 4.90,
      reviewCount: "5K",
      price: 199,
      duration: 30,
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80",
      features: ["Expert advice", "Site inspection"],
    },
  ],
};

const SUBCATEGORY_NAMES: Record<string, string> = {
  "switch-socket": "Switch & socket",
  "fan": "Fan",
  "light": "Light",
  "wiring": "Wiring",
  "doorbell-security": "Doorbell & security",
  "mcb-fuse": "MCB/fuse",
  "appliances": "Appliances",
  "consultation": "Consultation",
};

interface ServiceItem {
  id: string;
  title: string;
  rating: number;
  reviewCount: string;
  price: number;
  originalPrice?: number;
  duration: number;
  image: string;
  features: string[];
}

interface CartItem {
  id: string;
  quantity: number;
}

export default function ElectricianServicesScreen() {
  const router = useRouter();
  const { id: subcategoryId } = useLocalSearchParams<{ id: string }>();
  const [cart, setCart] = useState<CartItem[]>([]);

  const services = SERVICES_BY_SUBCATEGORY[subcategoryId || "fan"] || [];
  const subcategoryName = SUBCATEGORY_NAMES[subcategoryId || "fan"] || "Services";

  // Cart calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const service = services.find(s => s.id === item.id);
      return total + (service?.price || 0) * item.quantity;
    }, 0);
  }, [cart, services]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const getItemQuantity = (id: string) => {
    return cart.find(item => item.id === id)?.quantity || 0;
  };

  const handleAdd = (id: string) => {
    setCart(prev => [...prev, { id, quantity: 1 }]);
  };

  const handleIncrement = (id: string) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const handleDecrement = (id: string) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (item && item.quantity <= 1) {
        return prev.filter(i => i.id !== id);
      }
      return prev.map(i => 
        i.id === id ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <ArrowLeft size={20} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subcategoryName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Services Count */}
        <Text style={styles.serviceCount}>{services.length} services</Text>

        {/* Services List */}
        {services.map((service, index) => (
          <View key={service.id}>
            <View style={styles.serviceCard}>
              {/* Left - Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: service.image }}
                  style={styles.serviceImage}
                  resizeMode="cover"
                />
              </View>

              {/* Center - Details */}
              <View style={styles.detailsContainer}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                
                <View style={styles.ratingRow}>
                  <Star size={12} color="#000000" fill="#000000" />
                  <Text style={styles.ratingText}>{service.rating.toFixed(2)}</Text>
                  <Text style={styles.reviewCount}>({service.reviewCount})</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{service.price}</Text>
                  {service.originalPrice && (
                    <Text style={styles.originalPrice}>₹{service.originalPrice}</Text>
                  )}
                  <Text style={styles.duration}>• {service.duration} mins</Text>
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                  {service.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Check size={12} color="#059669" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.viewDetailsBtn}>
                  <Text style={styles.viewDetailsText}>View details</Text>
                  <Info size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Right - Add Button */}
              <View style={styles.addContainer}>
                {getItemQuantity(service.id) === 0 ? (
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => handleAdd(service.id)}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => handleDecrement(service.id)}
                    >
                      <Minus size={14} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{getItemQuantity(service.id)}</Text>
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => handleIncrement(service.id)}
                    >
                      <Plus size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Dotted Separator */}
            {index < services.length - 1 && (
              <View style={styles.separator} />
            )}
          </View>
        ))}

        <View style={{ height: cartItemCount > 0 ? 100 : 40 }} />
      </ScrollView>

      {/* Cart Bar */}
      {cartItemCount > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemCount}>{cartItemCount} item{cartItemCount > 1 ? "s" : ""}</Text>
            <Text style={styles.cartTotal}>₹{cartTotal}</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewCartBtn}
            onPress={() => router.push("/cart")}
          >
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
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  serviceCount: {
    fontSize: 14,
    color: "#6B7280",
    marginVertical: 16,
  },
  serviceCard: {
    flexDirection: "row",
    paddingVertical: 16,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 6,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
  },
  reviewCount: {
    fontSize: 12,
    color: "#6B7280",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  originalPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  duration: {
    fontSize: 12,
    color: "#6B7280",
  },
  featuresContainer: {
    marginBottom: 8,
    gap: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: "#374151",
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  addContainer: {
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    backgroundColor: "#FFFFFF",
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    minWidth: 24,
    textAlign: "center",
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderStyle: "dashed",
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
    paddingVertical: 16,
    paddingBottom: 32,
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
    borderRadius: radius.md,
    gap: 4,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
