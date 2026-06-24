import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Share2, 
  Star, 
  Clock,
  Zap,
  Info,
  X,
  Check,
  Shield,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";
import { HeroMediaBanner, HeroMediaItem } from "@/src/components/HeroMediaBanner";

// Hero banner media — swipeable images + tap-to-play video.
const HERO_MEDIA: HeroMediaItem[] = [
  {
    type: "video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    caption: "Help in minutes",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80",
    caption: "On-demand handyman",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1572177812156-58036aae439c?auto=format&fit=crop&w=900&q=80",
    caption: "Any odd job",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1581094289810-adf5d25690e3?auto=format&fit=crop&w=900&q=80",
    caption: "Fast & friendly",
  },
];

// Time-based pricing options
const TIME_OPTIONS = [
  {
    id: "1hr",
    duration: "1 hour",
    price: 79,
    originalPrice: 245,
    discount: "68% OFF",
  },
  {
    id: "1.5hr",
    duration: "1.5 hours",
    price: 119,
    originalPrice: 369,
    discount: "68% OFF",
  },
  {
    id: "2hr",
    duration: "2 hours",
    price: 179,
    originalPrice: 559,
    discount: "68% OFF",
  },
  {
    id: "3hr",
    duration: "3 hours",
    price: 269,
    originalPrice: 839,
    discount: "68% OFF",
  },
];

// Task categories - "One help who can do it all"
const TASK_CATEGORIES = [
  {
    id: "kitchen",
    name: "Kitchen & utensil cleaning",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80",
    inclusions: [
      "Crockery & lunch boxes",
      "Wiping cabinet exterior",
      "Sink cleaning",
      "Gas stove wiping",
    ],
    exclusions: [
      "Hard food stains",
      "Chimney cleaning",
      "Heavy appliance cleaning",
    ],
  },
  {
    id: "meal-prep",
    name: "Meal prep & serving",
    image: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=200&q=80",
    inclusions: [
      "Veggies chopping & salad prep",
      "Meat marination",
      "Serving food",
      "Table setting",
    ],
    exclusions: [
      "Cooking full meals",
      "Non-veg cooking",
      "Baking",
    ],
  },
  {
    id: "mopping",
    name: "Mopping, dusting & wiping",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80",
    inclusions: [
      "Dusting & Mopping floor",
      "Wet wiping furniture",
      "Bed making",
      "Organizing items",
    ],
    exclusions: [
      "Wiping walls",
      "Hard to reach areas",
      "Ceiling fans",
    ],
  },
  {
    id: "bathroom",
    name: "Bathroom cleaning",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80",
    inclusions: [
      "Toilet seat cleaning",
      "Sink & Taps",
      "Floor mopping",
      "Mirror cleaning",
    ],
    exclusions: [
      "Walls scrubbing",
      "Hard stains removal",
      "Ceiling cleaning",
    ],
  },
  {
    id: "laundry",
    name: "Laundry & Ironing",
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=200&q=80",
    inclusions: [
      "Machine-wash & drying",
      "Ironing clothes",
      "Folding & arranging",
      "Sorting clothes",
    ],
    exclusions: [
      "Hand-washing delicates",
      "Dry cleaning items",
      "Stain removal",
    ],
  },
  {
    id: "packing",
    name: "Packing & un-packing",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80",
    inclusions: [
      "Move-in / move-out help",
      "Vacation packing",
      "Wardrobe organizing",
      "Labeling boxes",
    ],
    exclusions: [
      "Lifting heavy objects",
      "Moving full homes",
      "Furniture assembly",
    ],
  },
];

// Time estimates for tasks
const TIME_ESTIMATES = [
  {
    id: "kitchen-time",
    icon: "kitchen",
    title: "Kitchen & Dishwashing",
    subtitle: "For 3-4 members",
    time: "25 mins",
  },
  {
    id: "bathroom-time",
    icon: "bathroom",
    title: "1 Bathroom cleaning",
    subtitle: "Mopping & toilet seat cleaning",
    time: "15 mins",
  },
  {
    id: "mopping-time",
    icon: "mopping",
    title: "Mopping, dusting & wiping",
    subtitle: "For 3 bedrooms & living room",
    time: "55 mins",
  },
];

// Excluded items
const EXCLUDED_ITEMS = [
  "Removal of hard stains",
  "Cleaning of any heavy appliances",
  "Cooking meals",
  "Hand-washing clothes",
];

// FAQs
const FAQS = [
  {
    id: "faq1",
    question: "Is the professional trained and verified?",
    answer: "Yes, all our professionals undergo thorough background verification and are trained to deliver quality service.",
  },
  {
    id: "faq2",
    question: "Will the professional bring cleaning supplies?",
    answer: "No, you need to provide cleaning equipment and supplies. The professional will use your materials.",
  },
  {
    id: "faq3",
    question: "What if the cleaning isn't complete within the selected time?",
    answer: "You can extend the service by paying for additional time, or reschedule the remaining tasks.",
  },
  {
    id: "faq4",
    question: "Can I request the same professional for my booking?",
    answer: "Yes, you can add preferred professionals to your favorites and request them for future bookings.",
  },
  {
    id: "faq5",
    question: "Can I schedule the service instead of booking instantly?",
    answer: "Yes, you can choose 'Later' option and select a convenient time slot for your booking.",
  },
];

export default function InstaHelpServiceScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"instant" | "later">("later");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<typeof TASK_CATEGORIES[0] | null>(null);

  const handleTaskPress = (task: typeof TASK_CATEGORIES[0]) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleAddToCart = (optionId: string) => {
    setCart(prev => ({
      ...prev,
      [optionId]: (prev[optionId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (optionId: string) => {
    setCart(prev => {
      const newQty = (prev[optionId] || 0) - 1;
      if (newQty <= 0) {
        const { [optionId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [optionId]: newQty };
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const option = TIME_OPTIONS.find(o => o.id === id);
      return total + (option?.price || 0) * qty;
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(prev => prev === faqId ? null : faqId);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Media Banner — swipeable images + tap-to-play video */}
        <View style={styles.heroWrapper}>
          <HeroMediaBanner items={HERO_MEDIA} height={260} />
          <View style={styles.heroHeaderOverlay} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <ArrowLeft size={20} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroIconBtn}>
              <Share2 size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>InstaHelp</Text>
          <View style={styles.ratingRow}>
            <Star size={16} color="#000000" fill="#000000" />
            <Text style={styles.ratingText}>4.72 (7.9 M bookings)</Text>
          </View>
        </View>

        {/* Dotted separator */}
        <View style={styles.dottedSeparator} />

        {/* Instant/Later Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[
              styles.toggleBtn,
              selectedTab === "instant" && styles.toggleBtnActive,
            ]}
            onPress={() => setSelectedTab("instant")}
          >
            <View style={styles.toggleContent}>
              <Zap size={14} color={selectedTab === "instant" ? "#000000" : "#6B7280"} />
              <Text style={[
                styles.toggleText,
                selectedTab === "instant" && styles.toggleTextActive,
              ]}>Instant</Text>
            </View>
            <Text style={styles.toggleSubtext}>Not available</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.toggleBtn,
              selectedTab === "later" && styles.toggleBtnActiveBlack,
            ]}
            onPress={() => setSelectedTab("later")}
          >
            <Text style={[
              styles.toggleText,
              selectedTab === "later" && styles.toggleTextWhite,
            ]}>Later</Text>
          </TouchableOpacity>
        </View>

        {/* Time-based pricing cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pricingContainer}
        >
          {TIME_OPTIONS.map((option) => (
            <View key={option.id} style={styles.pricingCard}>
              <Text style={styles.durationText}>{option.duration}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>₹{option.price}</Text>
                <Text style={styles.originalPriceText}>₹{option.originalPrice}</Text>
              </View>
              <View style={styles.discountBadge}>
                <View style={styles.discountDot} />
                <Text style={styles.discountText}>{option.discount}</Text>
              </View>
              
              {/* Add Button */}
              {!cart[option.id] ? (
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => handleAddToCart(option.id)}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.quantityRow}>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => handleRemoveFromCart(option.id)}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{cart[option.id]}</Text>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => handleAddToCart(option.id)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Earliest available slot */}
        <View style={styles.slotContainer}>
          <Clock size={18} color="#6B7280" />
          <Text style={styles.slotText}>Earliest available slot : Today, 9:15 AM</Text>
        </View>

        {/* Super Saver Pack Banner */}
        <View style={styles.saverBanner}>
          <View style={styles.extraOffBadge}>
            <Text style={styles.extraOffText}>EXTRA 80% OFF</Text>
          </View>
          <View style={styles.saverContent}>
            <View style={styles.saverLeft}>
              <View style={styles.saverPriceRow}>
                <Text style={styles.saverTitle}>3-visits pack at </Text>
                <Text style={styles.saverOriginalPrice}>₹245</Text>
              </View>
              <Text style={styles.saverPrice}>₹49/visit</Text>
              <Text style={styles.saverValidity}>Valid till 1 month</Text>
              <TouchableOpacity style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.saverRight}>
              <Text style={styles.superSaverText}>SUPER{'\n'}SAVER{'\n'}PACK</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* One help who can do it all */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>One help who can do it all</Text>
          <View style={styles.taskGrid}>
            {TASK_CATEGORIES.map((task) => (
              <TouchableOpacity 
                key={task.id} 
                style={styles.taskCard}
                onPress={() => handleTaskPress(task)}
              >
                <View style={styles.taskHeader}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  <View style={styles.taskArrow}>
                    <ChevronRight size={14} color="#6B7280" />
                  </View>
                </View>
                <Image
                  source={{ uri: task.image }}
                  style={styles.taskImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Info note */}
          <View style={styles.infoNote}>
            <Info size={16} color="#6B7280" />
            <Text style={styles.infoNoteText}>
              Please provide cleaning equipment & supplies to the help
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* How long does it take */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How long does it take?</Text>
          <Text style={styles.sectionSubtitle}>
            These approximate time for a 3BHK home, you can ask the help to customise as per your need
          </Text>
          
          {TIME_ESTIMATES.map((estimate, index) => (
            <View key={estimate.id}>
              <View style={styles.estimateRow}>
                <View style={styles.estimateIcon}>
                  {estimate.icon === "kitchen" && <Text style={styles.iconText}>🍳</Text>}
                  {estimate.icon === "bathroom" && <Text style={styles.iconText}>🚽</Text>}
                  {estimate.icon === "mopping" && <Text style={styles.iconText}>🧹</Text>}
                </View>
                <View style={styles.estimateContent}>
                  <Text style={styles.estimateTitle}>{estimate.title}</Text>
                  <Text style={styles.estimateSubtitle}>{estimate.subtitle}</Text>
                </View>
                <Text style={styles.estimateTime}>{estimate.time}</Text>
              </View>
              {index < TIME_ESTIMATES.length - 1 && <View style={styles.estimateDivider} />}
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* What's excluded */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's excluded</Text>
          {EXCLUDED_ITEMS.map((item, index) => (
            <View key={index} style={styles.excludedRow}>
              <X size={16} color="#DC2626" />
              <Text style={styles.excludedText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Mfixit Cover */}
        <View style={styles.coverSection}>
          <View style={styles.coverContent}>
            <Text style={styles.coverTitle}>Stay stress free with Mfixit cover</Text>
            <Text style={styles.coverSubtitle}>
              Up to ₹10,000 cover if any damage happens during the job
            </Text>
          </View>
          <View style={styles.coverIcon}>
            <Shield size={40} color="#FFFFFF" fill="#16A34A" />
            <Check size={20} color="#FFFFFF" style={styles.coverCheck} />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          {FAQS.map((faq) => (
            <TouchableOpacity 
              key={faq.id} 
              style={styles.faqItem}
              onPress={() => toggleFaq(faq.id)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedFaq === faq.id ? (
                  <ChevronUp size={20} color="#6B7280" />
                ) : (
                  <ChevronDown size={20} color="#6B7280" />
                )}
              </View>
              {expandedFaq === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
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
            onPress={() => router.push("/cart")}
          >
            <Text style={styles.viewCartText}>View Cart</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Task Details Modal - Similar to Urban Company */}
      <Modal
        visible={showTaskDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTaskDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowTaskDetails(false)}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedTask && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Task Title with Image */}
                <View style={styles.taskDetailHeader}>
                  <View style={styles.taskDetailInfo}>
                    <Text style={styles.taskDetailTitle}>{selectedTask.name}</Text>
                    <View style={styles.taskDetailMeta}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.taskDetailMetaText}>Approx. 20-30 mins</Text>
                    </View>
                  </View>
                  <Image
                    source={{ uri: selectedTask.image }}
                    style={styles.taskDetailImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Inclusions */}
                <View style={styles.taskDetailSection}>
                  <Text style={styles.taskDetailSectionTitle}>Inclusions</Text>
                  {selectedTask.inclusions.map((item, index) => (
                    <View key={index} style={styles.taskDetailItem}>
                      <View style={styles.taskDetailCheckIcon}>
                        <Check size={14} color="#16A34A" strokeWidth={3} />
                      </View>
                      <Text style={styles.taskDetailItemText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* Exclusions */}
                <View style={styles.taskDetailSection}>
                  <Text style={styles.taskDetailSectionTitle}>Exclusions</Text>
                  {selectedTask.exclusions.map((item, index) => (
                    <View key={index} style={styles.taskDetailItem}>
                      <View style={styles.taskDetailXIcon}>
                        <X size={14} color="#DC2626" strokeWidth={3} />
                      </View>
                      <Text style={styles.taskDetailItemText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* Info Note */}
                <View style={styles.taskDetailNote}>
                  <Info size={16} color="#6B7280" />
                  <Text style={styles.taskDetailNoteText}>
                    Please provide cleaning equipment & supplies to the help
                  </Text>
                </View>

                <View style={{ height: 100 }} />
              </ScrollView>
            )}

            {/* Confirm Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => setShowTaskDetails(false)}
              >
                <Text style={styles.modalConfirmText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  heroWrapper: {
    position: "relative",
  },
  heroHeaderOverlay: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  heroIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.15)",
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    color: "#374151",
  },
  dottedSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderStyle: "dashed",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  toggleBtnActive: {
    backgroundColor: "#F3F4F6",
  },
  toggleBtnActiveBlack: {
    backgroundColor: "#1F2937",
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#000000",
  },
  toggleTextWhite: {
    color: "#FFFFFF",
  },
  toggleSubtext: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  pricingContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pricingCard: {
    width: 160,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  durationText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  originalPriceText: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  discountDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    overflow: "hidden",
  },
  qtyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    minWidth: 30,
    textAlign: "center",
  },
  slotContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  slotText: {
    fontSize: 14,
    color: "#374151",
  },
  saverBanner: {
    marginHorizontal: 16,
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  extraOffBadge: {
    backgroundColor: "#16A34A",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomRightRadius: 8,
  },
  extraOffText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  saverContent: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 12,
  },
  saverLeft: {
    flex: 1,
  },
  saverPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  saverTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  saverOriginalPrice: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textDecorationLine: "line-through",
  },
  saverPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  saverValidity: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    marginBottom: 12,
  },
  bookBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  saverRight: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  superSaverText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FDE047",
    textAlign: "right",
    lineHeight: 28,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  taskGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  taskCard: {
    width: "31%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 10,
    paddingBottom: 0,
  },
  taskName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
    lineHeight: 16,
  },
  taskArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  taskImage: {
    width: "100%",
    height: 80,
    marginTop: 8,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 10,
  },
  infoNoteText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  estimateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  estimateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  estimateContent: {
    flex: 1,
  },
  estimateTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  estimateSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  estimateTime: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
  },
  estimateDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  excludedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  excludedText: {
    fontSize: 14,
    color: "#374151",
  },
  coverSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  coverContent: {
    flex: 1,
  },
  coverTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  coverSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  coverIcon: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  coverCheck: {
    position: "absolute",
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
    fontSize: 14,
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
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  taskDetailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  },
  taskDetailInfo: {
    flex: 1,
  },
  taskDetailTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
    marginBottom: 8,
  },
  taskDetailMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taskDetailMetaText: {
    fontSize: 14,
    color: "#6B7280",
  },
  taskDetailImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  taskDetailSection: {
    marginBottom: 24,
  },
  taskDetailSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  taskDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  taskDetailCheckIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  taskDetailXIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  taskDetailItemText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  taskDetailNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginTop: 8,
  },
  taskDetailNoteText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  modalConfirmBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
