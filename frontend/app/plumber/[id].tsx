import React, { useState } from "react";
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
  Star, 
  Clock,
  Shield,
  Info,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

// Service data for each plumber sub-category
const PLUMBER_SERVICES: { [key: string]: { 
  title: string;
  services: Array<{
    id: string;
    name: string;
    rating: number;
    reviews: string;
    price: number;
    originalPrice?: number;
    duration: string;
    image: string;
    description: string;
    includes?: string[];
  }>;
}} = {
  "tap-mixer": {
    title: "Tap & Mixer",
    services: [
      {
        id: "tap-repair",
        name: "Tap repair",
        rating: 4.78,
        reviews: "45K",
        price: 99,
        duration: "30 mins",
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80",
        description: "Repair of leaking or malfunctioning taps",
        includes: ["Inspection", "Washer replacement", "Tightening"],
      },
      {
        id: "tap-install",
        name: "Tap installation",
        rating: 4.82,
        reviews: "32K",
        price: 149,
        duration: "45 mins",
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80",
        description: "Installation of new tap (tap not included)",
        includes: ["Old tap removal", "New tap fitting", "Leak testing"],
      },
      {
        id: "tap-replacement",
        name: "Tap replacement",
        rating: 4.75,
        reviews: "28K",
        price: 199,
        originalPrice: 299,
        duration: "45 mins",
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80",
        description: "Complete tap replacement service",
        includes: ["Old tap removal", "New tap installation", "Testing"],
      },
      {
        id: "mixer-repair",
        name: "Mixer/diverter repair",
        rating: 4.80,
        reviews: "18K",
        price: 249,
        duration: "45 mins",
        image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80",
        description: "Repair of bathroom mixer or diverter",
        includes: ["Diagnosis", "Cartridge check", "Repair/replacement"],
      },
      {
        id: "mixer-install",
        name: "Mixer installation",
        rating: 4.85,
        reviews: "15K",
        price: 349,
        originalPrice: 449,
        duration: "60 mins",
        image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80",
        description: "Installation of new mixer (mixer not included)",
        includes: ["Wall preparation", "Mixer fitting", "Connection & testing"],
      },
      {
        id: "sensor-tap",
        name: "Sensor tap installation",
        rating: 4.88,
        reviews: "8K",
        price: 499,
        duration: "60 mins",
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80",
        description: "Installation of automatic sensor tap",
        includes: ["Wiring", "Tap installation", "Sensor calibration"],
      },
    ],
  },
  "toilet": {
    title: "Toilet",
    services: [
      {
        id: "flush-repair",
        name: "Flush tank repair",
        rating: 4.79,
        reviews: "38K",
        price: 149,
        duration: "30 mins",
        image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=300&q=80",
        description: "Repair of flush tank mechanism",
        includes: ["Inspection", "Float valve repair", "Testing"],
      },
      {
        id: "toilet-seat",
        name: "Toilet seat installation",
        rating: 4.81,
        reviews: "25K",
        price: 199,
        duration: "30 mins",
        image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=300&q=80",
        description: "Installation of new toilet seat",
        includes: ["Old seat removal", "New seat fitting", "Adjustment"],
      },
      {
        id: "blockage",
        name: "Toilet blockage removal",
        rating: 4.72,
        reviews: "42K",
        price: 249,
        duration: "45 mins",
        image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=300&q=80",
        description: "Clearing of toilet blockage",
        includes: ["Plunging", "Snake cleaning", "Flow testing"],
      },
      {
        id: "western-install",
        name: "Western toilet installation",
        rating: 4.85,
        reviews: "12K",
        price: 799,
        originalPrice: 999,
        duration: "2-3 hours",
        image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=300&q=80",
        description: "Complete western toilet installation",
        includes: ["Old toilet removal", "New toilet fitting", "Sealing & testing"],
      },
    ],
  },
  "bath-shower": {
    title: "Bath & Shower",
    services: [
      {
        id: "shower-repair",
        name: "Shower repair",
        rating: 4.77,
        reviews: "22K",
        price: 149,
        duration: "30 mins",
        image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80",
        description: "Repair of shower head or hose",
        includes: ["Inspection", "Washer replacement", "Leak fix"],
      },
      {
        id: "shower-install",
        name: "Shower installation",
        rating: 4.82,
        reviews: "18K",
        price: 299,
        duration: "45 mins",
        image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80",
        description: "Installation of new shower set",
        includes: ["Wall mounting", "Hose connection", "Flow testing"],
      },
      {
        id: "rain-shower",
        name: "Rain shower installation",
        rating: 4.88,
        reviews: "10K",
        price: 599,
        originalPrice: 799,
        duration: "90 mins",
        image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80",
        description: "Installation of overhead rain shower",
        includes: ["Ceiling/wall mounting", "Piping", "Pressure testing"],
      },
    ],
  },
  "drainage": {
    title: "Drainage & Blockage",
    services: [
      {
        id: "drain-clean",
        name: "Drain cleaning",
        rating: 4.73,
        reviews: "35K",
        price: 179,
        duration: "30 mins",
        image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=80",
        description: "Cleaning of clogged drains",
        includes: ["Chemical treatment", "Manual cleaning", "Flow check"],
      },
      {
        id: "sink-blockage",
        name: "Sink blockage removal",
        rating: 4.75,
        reviews: "28K",
        price: 199,
        duration: "30 mins",
        image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=80",
        description: "Removal of kitchen/bathroom sink blockage",
        includes: ["P-trap cleaning", "Pipe snake", "Testing"],
      },
      {
        id: "floor-drain",
        name: "Floor drain cleaning",
        rating: 4.78,
        reviews: "20K",
        price: 249,
        duration: "45 mins",
        image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=80",
        description: "Deep cleaning of floor drains",
        includes: ["Grate removal", "Pipe cleaning", "Deodorizing"],
      },
    ],
  },
};

// Default services for unknown categories
const DEFAULT_SERVICES = {
  title: "Services",
  services: [
    {
      id: "consultation",
      name: "Book a consultation",
      rating: 4.85,
      reviews: "10K",
      price: 49,
      duration: "30 mins",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
      description: "Speak with an expert about your requirements",
      includes: ["Assessment", "Quotation", "Recommendations"],
    },
  ],
};

// Service Card Component
const ServiceCard = ({ 
  service, 
  quantity, 
  onAdd, 
  onRemove,
  onViewDetails,
}: { 
  service: typeof PLUMBER_SERVICES["tap-mixer"]["services"][0];
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onViewDetails: () => void;
}) => {
  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceMain}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={styles.ratingRow}>
            <Star size={12} color="#000000" fill="#000000" />
            <Text style={styles.ratingText}>{service.rating} ({service.reviews} reviews)</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{service.price}</Text>
            {service.originalPrice && (
              <Text style={styles.originalPrice}>₹{service.originalPrice}</Text>
            )}
          </View>
          <View style={styles.durationRow}>
            <Clock size={12} color="#6B7280" />
            <Text style={styles.durationText}>{service.duration}</Text>
          </View>
          
          {/* View details - navigates to detail page */}
          <TouchableOpacity 
            style={styles.viewDetailsBtn}
            onPress={onViewDetails}
          >
            <Text style={styles.viewDetailsText}>View details</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Image and Add button */}
        <View style={styles.serviceRight}>
          <Image
            source={{ uri: service.image }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
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
        </View>
      </View>
    </View>
  );
};

export default function PlumberServiceListScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  // Get services for this category
  const categoryData = PLUMBER_SERVICES[id || ""] || DEFAULT_SERVICES;

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

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const service = categoryData.services.find(s => s.id === id);
      return total + (service?.price || 0) * qty;
    }, 0);
  };

  const getCartItemCount = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

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
        <Text style={styles.headerTitle}>{categoryData.title}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Warranty Card */}
        <TouchableOpacity style={styles.warrantyCard}>
          <View style={styles.warrantyLeft}>
            <Shield size={20} color="#6B7280" />
            <Text style={styles.warrantyText}>Mfixit warranty & protection</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info size={16} color="#0891B2" />
          <Text style={styles.infoBannerText}>
            Prices may vary based on actual work required
          </Text>
        </View>

        {/* Services List */}
        <View style={styles.servicesList}>
          <Text style={styles.sectionTitle}>Select a service</Text>
          {categoryData.services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              quantity={cart[service.id] || 0}
              onAdd={() => handleAddToCart(service.id)}
              onRemove={() => handleRemoveFromCart(service.id)}
              onViewDetails={() => handleViewDetails(service.id)}
            />
          ))}
        </View>

        <View style={{ height: getCartItemCount() > 0 ? 100 : 40 }} />
      </ScrollView>

      {/* Cart Bar */}
      {getCartItemCount() > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemCount}>
              {getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}
            </Text>
            <Text style={styles.cartTotal}>₹{getCartTotal()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewCartBtn}
            onPress={() => router.push("/booking/new")}
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  headerPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  warrantyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  warrantyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  warrantyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#ECFEFF",
    borderRadius: 8,
    gap: 10,
  },
  infoBannerText: {
    fontSize: 13,
    color: "#0891B2",
    flex: 1,
  },
  servicesList: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 16,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  serviceMain: {
    flexDirection: "row",
    padding: 16,
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
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    color: "#6B7280",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  originalPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  durationText: {
    fontSize: 12,
    color: "#6B7280",
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
  serviceRight: {
    alignItems: "center",
    width: 110,
  },
  serviceImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 28,
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
  expandedDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  includesList: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  includesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  includeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  includeText: {
    fontSize: 13,
    color: "#6B7280",
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
    borderRadius: 10,
    gap: 4,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
