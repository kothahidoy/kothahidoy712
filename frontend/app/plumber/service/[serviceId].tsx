import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  X,
  Search,
  Star, 
  Clock,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle2,
  Wrench,
  Award,
  Share2,
  Umbrella,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

// Service variants for tap repair
const SERVICE_VARIANTS = {
  "tap-repair": {
    title: "Tap repair",
    rating: 4.80,
    reviews: "200K",
    variants: [
      {
        id: "regular",
        name: "Regular",
        rating: 4.81,
        reviews: "148K",
        price: 99,
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "swan",
        name: "Swan Tap Repair",
        rating: 4.80,
        reviews: "23K",
        price: 99,
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "hot-cold",
        name: "Hot & cold",
        rating: 4.76,
        reviews: "18K",
        price: 298,
        image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sensor",
        name: "Sensor tap",
        rating: 4.85,
        reviews: "8K",
        price: 399,
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80",
      },
    ],
    process: [
      {
        step: 1,
        title: "Inspection & quote",
        description: "We inspect your tap & share a repair quote for approval",
      },
      {
        step: 2,
        title: "Quote approval",
        description: "You can approve the quote to proceed, or pay a visitation charge if declined",
      },
      {
        step: 3,
        title: "Repair & spare parts",
        description: "If needed, we will source spare parts from the local market",
      },
      {
        step: 4,
        title: "Warranty activation",
        description: "The service is covered by a 30-day warranty for any issues after repair",
      },
    ],
    faqs: [
      {
        id: "faq1",
        question: "Does the cost include spare parts?",
        answer: "No, the service cost covers labor only. Spare parts, if required, will be charged separately after your approval.",
      },
      {
        id: "faq2",
        question: "What if the same issue occurs again?",
        answer: "We offer a 30-day warranty on all repairs. If the same issue recurs within this period, we'll fix it free of cost.",
      },
      {
        id: "faq3",
        question: "What if anything gets damaged?",
        answer: "We provide up to ₹10,000 damage cover under Mfixit Cover. Any accidental damage during service will be compensated.",
      },
      {
        id: "faq4",
        question: "Are spare parts covered under warranty?",
        answer: "Yes, spare parts installed by our technicians are covered under the 30-day warranty along with the service.",
      },
    ],
  },
};

// Default service data
const DEFAULT_SERVICE = {
  title: "Service",
  rating: 4.75,
  reviews: "50K",
  variants: [
    {
      id: "standard",
      name: "Standard",
      rating: 4.75,
      reviews: "50K",
      price: 149,
      image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80",
    },
  ],
  process: [
    { step: 1, title: "Inspection", description: "We inspect and provide a quote" },
    { step: 2, title: "Approval", description: "You approve the quote to proceed" },
    { step: 3, title: "Service", description: "Our expert completes the work" },
    { step: 4, title: "Warranty", description: "30-day warranty activated" },
  ],
  faqs: [
    { id: "faq1", question: "What's included in the service?", answer: "Labor charges and basic inspection are included." },
  ],
};

// Variant Card Component
const VariantCard = ({ 
  variant, 
  quantity, 
  onAdd, 
  onRemove 
}: { 
  variant: typeof SERVICE_VARIANTS["tap-repair"]["variants"][0];
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) => (
  <View style={styles.variantCard}>
    <Image
      source={{ uri: variant.image }}
      style={styles.variantImage}
      resizeMode="contain"
    />
    <Text style={styles.variantName}>{variant.name}</Text>
    <View style={styles.variantRating}>
      <Star size={12} color="#000000" fill="#000000" />
      <Text style={styles.variantRatingText}>{variant.rating} ({variant.reviews} reviews)</Text>
    </View>
    <Text style={styles.variantPrice}>₹{variant.price}</Text>
    
    {quantity === 0 ? (
      <TouchableOpacity style={styles.variantAddBtn} onPress={onAdd}>
        <Text style={styles.variantAddText}>Add</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.variantQtyRow}>
        <TouchableOpacity style={styles.variantQtyBtn} onPress={onRemove}>
          <Text style={styles.variantQtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.variantQtyValue}>{quantity}</Text>
        <TouchableOpacity style={styles.variantQtyBtn} onPress={onAdd}>
          <Text style={styles.variantQtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

// Process Step Component
const ProcessStep = ({ step, title, description, isLast }: { 
  step: number; 
  title: string; 
  description: string;
  isLast: boolean;
}) => (
  <View style={styles.processStep}>
    <View style={styles.processStepLeft}>
      <View style={styles.processStepNumber}>
        <Text style={styles.processStepNumberText}>{step}</Text>
      </View>
      {!isLast && <View style={styles.processStepLine} />}
    </View>
    <View style={styles.processStepContent}>
      <Text style={styles.processStepTitle}>{title}</Text>
      <Text style={styles.processStepDesc}>{description}</Text>
    </View>
  </View>
);

// FAQ Item Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <TouchableOpacity 
      style={styles.faqItem} 
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        {expanded ? (
          <ChevronUp size={20} color="#6B7280" />
        ) : (
          <ChevronDown size={20} color="#6B7280" />
        )}
      </View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
};

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  // Get service data
  const serviceData = SERVICE_VARIANTS[serviceId || ""] || DEFAULT_SERVICE;

  const handleAddToCart = (variantId: string) => {
    setCart(prev => ({ ...prev, [variantId]: (prev[variantId] || 0) + 1 }));
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCart(prev => {
      const newQty = (prev[variantId] || 0) - 1;
      if (newQty <= 0) {
        const { [variantId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [variantId]: newQty };
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const variant = serviceData.variants.find(v => v.id === id);
      return total + (variant?.price || 0) * qty;
    }, 0);
  };

  const getCartItemCount = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${serviceData.title} service on Mfixit! Starting at ₹${serviceData.variants[0]?.price}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
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
          <TouchableOpacity style={styles.headerBtn}>
            <Search size={20} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <X size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Service Title */}
        <View style={styles.titleSection}>
          <Text style={styles.serviceTitle}>{serviceData.title}</Text>
          <View style={styles.serviceRating}>
            <Star size={16} color="#000000" fill="#000000" />
            <Text style={styles.serviceRatingText}>{serviceData.rating} ({serviceData.reviews} reviews)</Text>
          </View>
        </View>

        {/* Service Variants - Horizontal Scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.variantsContainer}
        >
          {serviceData.variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              quantity={cart[variant.id] || 0}
              onAdd={() => handleAddToCart(variant.id)}
              onRemove={() => handleRemoveFromCart(variant.id)}
            />
          ))}
        </ScrollView>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Our Process */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our process</Text>
          {serviceData.process.map((step, index) => (
            <ProcessStep
              key={step.step}
              step={step.step}
              title={step.title}
              description={step.description}
              isLast={index === serviceData.process.length - 1}
            />
          ))}
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Top Technicians */}
        <View style={styles.section}>
          <View style={styles.technicianSection}>
            <View style={styles.technicianLeft}>
              <Text style={styles.sectionTitle}>Top technicians</Text>
              
              <View style={styles.techFeature}>
                <CheckCircle2 size={20} color="#6B7280" />
                <Text style={styles.techFeatureText}>Background verified</Text>
              </View>
              
              <View style={styles.techFeature}>
                <Wrench size={20} color="#6B7280" />
                <Text style={styles.techFeatureText}>Trained across all major brands</Text>
              </View>
              
              <View style={styles.techFeature}>
                <Award size={20} color="#6B7280" />
                <Text style={styles.techFeatureText}>Certified under Skill India Programme</Text>
              </View>
            </View>
            
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80" }}
              style={styles.technicianImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Mfixit Cover Promise */}
        <View style={styles.section}>
          <View style={styles.coverHeader}>
            <Shield size={24} color={colors.primary} />
            <Text style={styles.coverTitle}>
              <Text style={styles.coverBrand}>Mfixit cover</Text> promise
            </Text>
          </View>
          
          <View style={styles.coverFeature}>
            <CheckCircle2 size={20} color="#6B7280" />
            <Text style={styles.coverFeatureText}>Up to 30 days of warranty</Text>
          </View>
          
          <View style={styles.coverFeature}>
            <Umbrella size={20} color="#6B7280" />
            <Text style={styles.coverFeatureText}>Up to ₹10,000 damage cover</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          {serviceData.faqs.map((faq) => (
            <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
          ))}
        </View>

        {/* Share Section */}
        <View style={styles.shareSection}>
          <Text style={styles.shareText}>Share this service with your loved ones</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share</Text>
            <Share2 size={18} color={colors.primary} />
          </TouchableOpacity>
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
    backgroundColor: "#F9FAFB",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
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
  scrollView: {
    flex: 1,
  },
  titleSection: {
    padding: 16,
    paddingBottom: 12,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 8,
  },
  serviceRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serviceRatingText: {
    fontSize: 14,
    color: "#6B7280",
    textDecorationLine: "underline",
  },
  variantsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  variantCard: {
    width: 180,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
  },
  variantImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
  },
  variantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 6,
  },
  variantRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  variantRatingText: {
    fontSize: 12,
    color: "#6B7280",
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  variantAddBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  variantAddText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  variantQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 6,
  },
  variantQtyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  variantQtyBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
  },
  variantQtyValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    minWidth: 24,
    textAlign: "center",
  },
  sectionDivider: {
    height: 8,
    backgroundColor: "#F3F4F6",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 20,
  },
  processStep: {
    flexDirection: "row",
    marginBottom: 4,
  },
  processStepLeft: {
    alignItems: "center",
    marginRight: 16,
  },
  processStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  processStepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  processStepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
    minHeight: 40,
  },
  processStepContent: {
    flex: 1,
    paddingBottom: 24,
  },
  processStepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  processStepDesc: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  technicianSection: {
    flexDirection: "row",
  },
  technicianLeft: {
    flex: 1,
  },
  techFeature: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  techFeatureText: {
    fontSize: 15,
    color: "#000000",
    flex: 1,
    lineHeight: 22,
  },
  technicianImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
  },
  coverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
  },
  coverBrand: {
    color: colors.primary,
  },
  coverFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  coverFeatureText: {
    fontSize: 15,
    color: "#000000",
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
    paddingRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    lineHeight: 20,
  },
  shareSection: {
    alignItems: "center",
    padding: 24,
  },
  shareText: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 16,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
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
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
