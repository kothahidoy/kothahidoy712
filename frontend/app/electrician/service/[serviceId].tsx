import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, X, Search, Star, Clock, ChevronDown, ChevronUp, Shield, CheckCircle2, Wrench, Award, Share2, Umbrella, ThumbsUp, MessageCircle } from "lucide-react-native";
import { colors } from "@/src/theme";

// Service data with reviews
const SERVICES_DATA: { [key: string]: any } = {
  "switch-repair": {
    title: "Switch/socket repair",
    rating: 4.82,
    reviews: "180K",
    categoryName: "Electrician",
    categoryColor: "#059669",
    variants: [
      { id: "regular", name: "Regular switch", rating: 4.82, reviews: "145K", price: 69, image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=80" },
      { id: "modular", name: "Modular switch", rating: 4.80, reviews: "35K", price: 99, image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=80" },
    ],
    process: [
      { step: 1, title: "Inspection", description: "Technician inspects the switch/socket issue" },
      { step: 2, title: "Quote approval", description: "You approve the repair quote or pay visitation charge" },
      { step: 3, title: "Repair work", description: "Expert completes the repair with quality parts" },
      { step: 4, title: "Warranty", description: "30-day warranty activated on repair" },
    ],
    reviews: [
      { id: 1, name: "Rajesh Kumar", rating: 5, date: "2 days ago", comment: "Excellent service! The electrician was very professional and fixed my faulty switch within 20 minutes. Highly recommended.", helpful: 45, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
      { id: 2, name: "Priya Sharma", rating: 5, date: "1 week ago", comment: "Very happy with the service. The technician arrived on time and explained the issue clearly before fixing. Good work!", helpful: 32, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
      { id: 3, name: "Amit Patel", rating: 4, date: "2 weeks ago", comment: "Good service overall. The repair was done quickly. Only suggestion - they could have cleaned up a bit better after the work.", helpful: 18, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" },
      { id: 4, name: "Sneha Reddy", rating: 5, date: "3 weeks ago", comment: "Third time using Mfixit for electrical work. Never disappointed! The technician was knowledgeable and courteous.", helpful: 56, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" },
    ],
    faqs: [
      { id: "faq1", question: "Does the cost include spare parts?", answer: "No, the service cost covers labor only. Spare parts will be charged separately after approval." },
      { id: "faq2", question: "What if the issue recurs?", answer: "We offer 30-day warranty. If the same issue recurs, we'll fix it free of cost." },
    ],
  },
  "fan-install": {
    title: "Ceiling fan installation",
    rating: 4.85,
    reviews: "220K",
    categoryName: "Electrician",
    categoryColor: "#059669",
    variants: [
      { id: "standard", name: "Standard fan", rating: 4.85, reviews: "180K", price: 299, image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { id: "designer", name: "Designer fan", rating: 4.88, reviews: "40K", price: 399, image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
    ],
    process: [
      { step: 1, title: "Hook check", description: "Verify ceiling hook and electrical connection" },
      { step: 2, title: "Assembly", description: "Assemble fan blades and motor unit" },
      { step: 3, title: "Installation", description: "Mount fan securely and connect wiring" },
      { step: 4, title: "Testing", description: "Test all speeds and ensure smooth operation" },
    ],
    reviews: [
      { id: 1, name: "Vikram Singh", rating: 5, date: "3 days ago", comment: "Fantastic installation! The technician was very careful with the wiring and tested everything thoroughly. Fan is running perfectly.", helpful: 67, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" },
      { id: 2, name: "Anita Desai", rating: 5, date: "1 week ago", comment: "Very professional service. Installed 3 fans in my new flat. All working great. Would definitely recommend.", helpful: 43, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" },
      { id: 3, name: "Mohammed Ali", rating: 4, date: "2 weeks ago", comment: "Good work done. Only minor issue was slight delay in arrival but installation was perfect.", helpful: 21, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" },
    ],
    faqs: [
      { id: "faq1", question: "Do you bring the ceiling hook?", answer: "Basic hooks are included. Specialized hooks may be charged extra." },
      { id: "faq2", question: "Can you install fans with remote?", answer: "Yes, we can install fans with remote control functionality." },
    ],
  },
};

const DEFAULT_SERVICE = {
  title: "Service",
  rating: 4.75,
  reviews: "50K",
  categoryName: "Service",
  categoryColor: "#059669",
  variants: [{ id: "standard", name: "Standard", rating: 4.75, reviews: "50K", price: 149, image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=80" }],
  process: [
    { step: 1, title: "Inspection", description: "We inspect and provide a quote" },
    { step: 2, title: "Approval", description: "You approve the quote" },
    { step: 3, title: "Service", description: "Expert completes the work" },
    { step: 4, title: "Warranty", description: "30-day warranty activated" },
  ],
  reviews: [
    { id: 1, name: "Customer", rating: 5, date: "Recently", comment: "Great service! Very professional and completed on time.", helpful: 25, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
  ],
  faqs: [{ id: "faq1", question: "What's included?", answer: "Labor charges and basic inspection are included." }],
};

const VariantCard = ({ variant, quantity, onAdd, onRemove, accentColor }: any) => (
  <View style={styles.variantCard}>
    <Image source={{ uri: variant.image }} style={styles.variantImage} resizeMode="cover" />
    <Text style={styles.variantName}>{variant.name}</Text>
    <View style={styles.variantRating}>
      <Star size={12} color="#000" fill="#000" />
      <Text style={styles.variantRatingText}>{variant.rating} ({variant.reviews} reviews)</Text>
    </View>
    <Text style={styles.variantPrice}>₹{variant.price}</Text>
    {quantity === 0 ? (
      <TouchableOpacity style={[styles.variantAddBtn, { borderColor: accentColor }]} onPress={onAdd}>
        <Text style={[styles.variantAddText, { color: accentColor }]}>Add</Text>
      </TouchableOpacity>
    ) : (
      <View style={[styles.variantQtyRow, { borderColor: accentColor }]}>
        <TouchableOpacity style={styles.variantQtyBtn} onPress={onRemove}><Text style={[styles.variantQtyBtnText, { color: accentColor }]}>−</Text></TouchableOpacity>
        <Text style={[styles.variantQtyValue, { color: accentColor }]}>{quantity}</Text>
        <TouchableOpacity style={styles.variantQtyBtn} onPress={onAdd}><Text style={[styles.variantQtyBtnText, { color: accentColor }]}>+</Text></TouchableOpacity>
      </View>
    )}
  </View>
);

const ProcessStep = ({ step, title, description, isLast }: any) => (
  <View style={styles.processStep}>
    <View style={styles.processStepLeft}>
      <View style={styles.processStepNumber}><Text style={styles.processStepNumberText}>{step}</Text></View>
      {!isLast && <View style={styles.processStepLine} />}
    </View>
    <View style={styles.processStepContent}>
      <Text style={styles.processStepTitle}>{title}</Text>
      <Text style={styles.processStepDesc}>{description}</Text>
    </View>
  </View>
);

const ReviewCard = ({ review }: any) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
      <View style={styles.reviewInfo}>
        <Text style={styles.reviewName}>{review.name}</Text>
        <View style={styles.reviewMeta}>
          <View style={styles.reviewStars}>
            {[...Array(5)].map((_, i) => (<Star key={i} size={12} color={i < review.rating ? "#FBBF24" : "#E5E7EB"} fill={i < review.rating ? "#FBBF24" : "#E5E7EB"} />))}
          </View>
          <Text style={styles.reviewDate}>{review.date}</Text>
        </View>
      </View>
    </View>
    <Text style={styles.reviewComment}>{review.comment}</Text>
    <TouchableOpacity style={styles.reviewHelpful}>
      <ThumbsUp size={14} color="#6B7280" />
      <Text style={styles.reviewHelpfulText}>Helpful ({review.helpful})</Text>
    </TouchableOpacity>
  </View>
);

const FAQItem = ({ question, answer }: any) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setExpanded(!expanded)}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        {expanded ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
      </View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
};

export default function ElectricianServiceDetailScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showAllReviews, setShowAllReviews] = useState(false);

  const serviceData = SERVICES_DATA[serviceId || ""] || DEFAULT_SERVICE;
  const displayedReviews = showAllReviews ? serviceData.reviews : serviceData.reviews.slice(0, 2);

  const handleAddToCart = (variantId: string) => setCart(prev => ({ ...prev, [variantId]: (prev[variantId] || 0) + 1 }));
  const handleRemoveFromCart = (variantId: string) => setCart(prev => { const newQty = (prev[variantId] || 0) - 1; if (newQty <= 0) { const { [variantId]: _, ...rest } = prev; return rest; } return { ...prev, [variantId]: newQty }; });
  const getCartTotal = () => Object.entries(cart).reduce((total, [id, qty]) => { const variant = serviceData.variants.find((v: any) => v.id === id); return total + (variant?.price || 0) * qty; }, 0);
  const getCartItemCount = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: "#F0FDF4" }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}><ArrowLeft size={20} color="#000" /></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{serviceData.categoryName}</Text>
          <View style={styles.headerSlot}><Clock size={12} color={serviceData.categoryColor} /><Text style={[styles.headerSlotText, { color: serviceData.categoryColor }]}>Earliest slot: Wed, 8:00 AM</Text></View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}><Search size={20} color="#000" /></TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}><X size={20} color="#000" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.serviceTitle}>{serviceData.title}</Text>
          <View style={styles.serviceRating}><Star size={16} color="#000" fill="#000" /><Text style={styles.serviceRatingText}>{serviceData.rating} ({serviceData.reviews} reviews)</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantsContainer}>
          {serviceData.variants.map((variant: any) => (<VariantCard key={variant.id} variant={variant} quantity={cart[variant.id] || 0} onAdd={() => handleAddToCart(variant.id)} onRemove={() => handleRemoveFromCart(variant.id)} accentColor={serviceData.categoryColor} />))}
        </ScrollView>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our process</Text>
          {serviceData.process.map((step: any, index: number) => (<ProcessStep key={step.step} step={step.step} title={step.title} description={step.description} isLast={index === serviceData.process.length - 1} />))}
        </View>

        <View style={styles.sectionDivider} />

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Customer reviews</Text>
            <View style={styles.reviewsSummary}>
              <Star size={18} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.reviewsSummaryText}>{serviceData.rating} • {serviceData.reviews} reviews</Text>
            </View>
          </View>
          
          {displayedReviews.map((review: any) => (<ReviewCard key={review.id} review={review} />))}
          
          {serviceData.reviews.length > 2 && (
            <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllReviews(!showAllReviews)}>
              <Text style={[styles.showMoreText, { color: serviceData.categoryColor }]}>{showAllReviews ? "Show less" : `View all ${serviceData.reviews.length} reviews`}</Text>
              {showAllReviews ? <ChevronUp size={18} color={serviceData.categoryColor} /> : <ChevronDown size={18} color={serviceData.categoryColor} />}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <View style={styles.coverHeader}>
            <Shield size={24} color={serviceData.categoryColor} />
            <Text style={styles.coverTitle}><Text style={[styles.coverBrand, { color: serviceData.categoryColor }]}>Mfixit cover</Text> promise</Text>
          </View>
          <View style={styles.coverFeature}><CheckCircle2 size={20} color="#6B7280" /><Text style={styles.coverFeatureText}>Up to 30 days of warranty</Text></View>
          <View style={styles.coverFeature}><Umbrella size={20} color="#6B7280" /><Text style={styles.coverFeatureText}>Up to ₹10,000 damage cover</Text></View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          {serviceData.faqs.map((faq: any) => (<FAQItem key={faq.id} question={faq.question} answer={faq.answer} />))}
        </View>

        <View style={{ height: getCartItemCount() > 0 ? 100 : 40 }} />
      </ScrollView>

      {getCartItemCount() > 0 && (
        <View style={styles.cartBar}>
          <View><Text style={styles.cartItemCount}>{getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}</Text><Text style={styles.cartTotal}>₹{getCartTotal()}</Text></View>
          <TouchableOpacity style={[styles.viewCartBtn, { backgroundColor: serviceData.categoryColor }]} onPress={() => router.push("/booking/new")}><Text style={styles.viewCartText}>View Cart</Text></TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  headerBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  headerSlot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerSlotText: { fontSize: 12 },
  headerRight: { flexDirection: "row", gap: 8 },
  scrollView: { flex: 1 },
  titleSection: { padding: 16, paddingBottom: 12 },
  serviceTitle: { fontSize: 24, fontWeight: "800", color: "#000", marginBottom: 8 },
  serviceRating: { flexDirection: "row", alignItems: "center", gap: 6 },
  serviceRatingText: { fontSize: 14, color: "#6B7280", textDecorationLine: "underline" },
  variantsContainer: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  variantCard: { width: 180, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, marginRight: 12, backgroundColor: "#FFF" },
  variantImage: { width: "100%", height: 100, borderRadius: 8, backgroundColor: "#F9FAFB", marginBottom: 12 },
  variantName: { fontSize: 15, fontWeight: "700", color: "#000", marginBottom: 6 },
  variantRating: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  variantRatingText: { fontSize: 12, color: "#6B7280" },
  variantPrice: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 12 },
  variantAddBtn: { borderWidth: 1.5, borderRadius: 6, paddingVertical: 10, alignItems: "center" },
  variantAddText: { fontSize: 14, fontWeight: "700" },
  variantQtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderRadius: 6 },
  variantQtyBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  variantQtyBtnText: { fontSize: 18, fontWeight: "600" },
  variantQtyValue: { fontSize: 14, fontWeight: "700", minWidth: 24, textAlign: "center" },
  sectionDivider: { height: 8, backgroundColor: "#F3F4F6" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#000", marginBottom: 20 },
  processStep: { flexDirection: "row", marginBottom: 4 },
  processStepLeft: { alignItems: "center", marginRight: 16 },
  processStepNumber: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  processStepNumberText: { fontSize: 14, fontWeight: "700", color: "#000" },
  processStepLine: { width: 2, flex: 1, backgroundColor: "#E5E7EB", marginVertical: 4, minHeight: 40 },
  processStepContent: { flex: 1, paddingBottom: 24 },
  processStepTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 4 },
  processStepDesc: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  reviewsHeader: { marginBottom: 16 },
  reviewsSummary: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  reviewsSummaryText: { fontSize: 14, color: "#6B7280" },
  reviewCard: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 12 },
  reviewHeader: { flexDirection: "row", marginBottom: 12 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  reviewInfo: { flex: 1 },
  reviewName: { fontSize: 15, fontWeight: "600", color: "#000", marginBottom: 4 },
  reviewMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewDate: { fontSize: 12, color: "#9CA3AF" },
  reviewComment: { fontSize: 14, color: "#374151", lineHeight: 22, marginBottom: 12 },
  reviewHelpful: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewHelpfulText: { fontSize: 13, color: "#6B7280" },
  showMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12 },
  showMoreText: { fontSize: 14, fontWeight: "600" },
  coverHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  coverTitle: { fontSize: 20, fontWeight: "800", color: "#000" },
  coverBrand: {},
  coverFeature: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  coverFeatureText: { fontSize: 15, color: "#000" },
  faqItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faqQuestion: { fontSize: 15, fontWeight: "600", color: "#000", flex: 1, paddingRight: 12 },
  faqAnswer: { fontSize: 14, color: "#6B7280", marginTop: 12, lineHeight: 20 },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32 },
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  viewCartBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
