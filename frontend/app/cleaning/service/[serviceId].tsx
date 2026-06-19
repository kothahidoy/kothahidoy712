import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, X, Search, Star, Clock, ChevronDown, ChevronUp, Shield, CheckCircle2, Umbrella, ThumbsUp } from "lucide-react-native";
import { colors } from "@/src/theme";

const SERVICES_DATA: { [key: string]: any } = {
  "1bhk-deep": {
    title: "1 BHK deep cleaning",
    rating: 4.82,
    reviews: "185K",
    categoryName: "Cleaning",
    categoryColor: "#16A34A",
    variants: [
      { id: "standard", name: "Standard cleaning", rating: 4.80, reviews: "145K", price: 2499, image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80" },
      { id: "premium", name: "Premium with sanitization", rating: 4.88, reviews: "40K", price: 2999, image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80" },
    ],
    process: [
      { step: 1, title: "Arrival", description: "Team arrives with all equipment and supplies" },
      { step: 2, title: "Assessment", description: "Quick walkthrough to understand cleaning needs" },
      { step: 3, title: "Deep cleaning", description: "Thorough cleaning of all rooms, kitchen, bathrooms" },
      { step: 4, title: "Final inspection", description: "Quality check and handover" },
    ],
    reviews: [
      { id: 1, name: "Neha Gupta", rating: 5, date: "1 day ago", comment: "Amazing deep cleaning service! My 1 BHK looks brand new. The team was very thorough and cleaned every corner. Highly satisfied!", helpful: 89, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
      { id: 2, name: "Rahul Mehta", rating: 5, date: "3 days ago", comment: "Excellent work! They spent 4 hours and cleaned everything - from ceiling fans to floor tiles. Worth every penny.", helpful: 67, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
      { id: 3, name: "Kavitha Nair", rating: 4, date: "1 week ago", comment: "Good cleaning overall. Kitchen and bathroom looked spotless. Could have done better with the balcony though.", helpful: 34, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" },
      { id: 4, name: "Suresh Kumar", rating: 5, date: "2 weeks ago", comment: "Used for move-in cleaning. The flat was dusty and dirty, but after their service it looked showroom ready. Professional team!", helpful: 92, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" },
    ],
    faqs: [
      { id: "faq1", question: "What's included in deep cleaning?", answer: "Includes cleaning of all rooms, kitchen, bathrooms, balcony, fans, windows, and furniture surfaces." },
      { id: "faq2", question: "Do I need to provide anything?", answer: "No, our team brings all cleaning equipment and supplies." },
    ],
  },
  "bathroom-classic": {
    title: "Classic bathroom cleaning",
    rating: 4.80,
    reviews: "245K",
    categoryName: "Cleaning",
    categoryColor: "#16A34A",
    variants: [
      { id: "single", name: "1 Bathroom", rating: 4.80, reviews: "200K", price: 449, image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
      { id: "double", name: "2 Bathrooms", rating: 4.82, reviews: "45K", price: 799, image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
    ],
    process: [
      { step: 1, title: "Surface cleaning", description: "Clean tiles, walls, and floor" },
      { step: 2, title: "Fixture cleaning", description: "Scrub toilet, basin, taps" },
      { step: 3, title: "Deep scrubbing", description: "Remove stains and deposits" },
      { step: 4, title: "Finishing", description: "Final wipe and freshening" },
    ],
    reviews: [
      { id: 1, name: "Priyanka Das", rating: 5, date: "2 days ago", comment: "My bathroom was looking dull for months. After this service, it's sparkling clean! The tiles look brand new.", helpful: 56, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" },
      { id: 2, name: "Arun Sharma", rating: 5, date: "5 days ago", comment: "Very impressed with the thorough cleaning. They removed all the hard water stains which I couldn't for years!", helpful: 78, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" },
      { id: 3, name: "Meena Iyer", rating: 4, date: "1 week ago", comment: "Good service. Bathroom looks much better now. Slight smell of cleaning products remained for a day.", helpful: 23, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" },
    ],
    faqs: [
      { id: "faq1", question: "How long does it take?", answer: "45 minutes for standard bathroom cleaning." },
      { id: "faq2", question: "Is it safe for marble?", answer: "Yes, we use marble-safe cleaning products." },
    ],
  },
};

const DEFAULT_SERVICE = {
  title: "Cleaning Service",
  rating: 4.80,
  reviews: "100K",
  categoryName: "Cleaning",
  categoryColor: "#16A34A",
  variants: [{ id: "standard", name: "Standard", rating: 4.80, reviews: "100K", price: 499, image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80" }],
  process: [
    { step: 1, title: "Arrival", description: "Team arrives with equipment" },
    { step: 2, title: "Cleaning", description: "Thorough cleaning completed" },
    { step: 3, title: "Inspection", description: "Quality check" },
    { step: 4, title: "Handover", description: "Service completed" },
  ],
  reviews: [
    { id: 1, name: "Customer", rating: 5, date: "Recently", comment: "Great cleaning service! Very thorough and professional.", helpful: 25, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
  ],
  faqs: [{ id: "faq1", question: "What's included?", answer: "Complete cleaning of the selected area." }],
};

const VariantCard = ({ variant, quantity, onAdd, onRemove, accentColor }: any) => (
  <View style={styles.variantCard}>
    <Image source={{ uri: variant.image }} style={styles.variantImage} resizeMode="cover" />
    <Text style={styles.variantName}>{variant.name}</Text>
    <View style={styles.variantRating}><Star size={12} color="#000" fill="#000" /><Text style={styles.variantRatingText}>{variant.rating} ({variant.reviews})</Text></View>
    <Text style={styles.variantPrice}>₹{variant.price}</Text>
    {quantity === 0 ? (
      <TouchableOpacity style={[styles.variantAddBtn, { borderColor: accentColor }]} onPress={onAdd}><Text style={[styles.variantAddText, { color: accentColor }]}>Add</Text></TouchableOpacity>
    ) : (
      <View style={[styles.variantQtyRow, { borderColor: accentColor }]}>
        <TouchableOpacity style={styles.variantQtyBtn} onPress={onRemove}><Text style={[styles.variantQtyBtnText, { color: accentColor }]}>−</Text></TouchableOpacity>
        <Text style={[styles.variantQtyValue, { color: accentColor }]}>{quantity}</Text>
        <TouchableOpacity style={styles.variantQtyBtn} onPress={onAdd}><Text style={[styles.variantQtyBtnText, { color: accentColor }]}>+</Text></TouchableOpacity>
      </View>
    )}
  </View>
);

const ReviewCard = ({ review }: any) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
      <View style={styles.reviewInfo}>
        <Text style={styles.reviewName}>{review.name}</Text>
        <View style={styles.reviewMeta}>
          <View style={styles.reviewStars}>{[...Array(5)].map((_, i) => (<Star key={i} size={12} color={i < review.rating ? "#FBBF24" : "#E5E7EB"} fill={i < review.rating ? "#FBBF24" : "#E5E7EB"} />))}</View>
          <Text style={styles.reviewDate}>{review.date}</Text>
        </View>
      </View>
    </View>
    <Text style={styles.reviewComment}>{review.comment}</Text>
    <TouchableOpacity style={styles.reviewHelpful}><ThumbsUp size={14} color="#6B7280" /><Text style={styles.reviewHelpfulText}>Helpful ({review.helpful})</Text></TouchableOpacity>
  </View>
);

const FAQItem = ({ question, answer }: any) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setExpanded(!expanded)}>
      <View style={styles.faqHeader}><Text style={styles.faqQuestion}>{question}</Text>{expanded ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}</View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
};

export default function CleaningServiceDetailScreen() {
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
      <View style={[styles.header, { backgroundColor: "#ECFDF5" }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}><ArrowLeft size={20} color="#000" /></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{serviceData.categoryName}</Text>
          <View style={styles.headerSlot}><Clock size={12} color={serviceData.categoryColor} /><Text style={[styles.headerSlotText, { color: serviceData.categoryColor }]}>Earliest: Tomorrow 9 AM</Text></View>
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
          {serviceData.process.map((step: any, index: number) => (
            <View key={step.step} style={styles.processStep}>
              <View style={styles.processStepLeft}>
                <View style={styles.processStepNumber}><Text style={styles.processStepNumberText}>{step.step}</Text></View>
                {index < serviceData.process.length - 1 && <View style={styles.processStepLine} />}
              </View>
              <View style={styles.processStepContent}><Text style={styles.processStepTitle}>{step.title}</Text><Text style={styles.processStepDesc}>{step.description}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Customer reviews</Text>
            <View style={styles.reviewsSummary}><Star size={18} color="#FBBF24" fill="#FBBF24" /><Text style={styles.reviewsSummaryText}>{serviceData.rating} • {serviceData.reviews} reviews</Text></View>
          </View>
          {displayedReviews.map((review: any) => (<ReviewCard key={review.id} review={review} />))}
          {serviceData.reviews.length > 2 && (
            <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllReviews(!showAllReviews)}>
              <Text style={[styles.showMoreText, { color: serviceData.categoryColor }]}>{showAllReviews ? "Show less" : `View all ${serviceData.reviews.length} reviews`}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <View style={styles.coverHeader}><Shield size={24} color={serviceData.categoryColor} /><Text style={styles.coverTitle}><Text style={[styles.coverBrand, { color: serviceData.categoryColor }]}>Mfixit cover</Text> promise</Text></View>
          <View style={styles.coverFeature}><CheckCircle2 size={20} color="#6B7280" /><Text style={styles.coverFeatureText}>Satisfaction guaranteed</Text></View>
          <View style={styles.coverFeature}><Umbrella size={20} color="#6B7280" /><Text style={styles.coverFeatureText}>Up to ₹10,000 damage cover</Text></View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>
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
  variantsContainer: { paddingHorizontal: 16, paddingBottom: 20 },
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
