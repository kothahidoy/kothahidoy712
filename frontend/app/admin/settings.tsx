import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Edit3,
  Gift,
  ImageIcon,
  Package,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  Trash2,
  Upload,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { colors, radius, shadow } from "@/src/theme";
import { useSession } from "@/src/context/SessionContext";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

// Types
interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  offer: string;
  is_active: boolean;
  category_id?: string;
  image?: string;
}

interface Slot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

interface Booking {
  id: string;
  customer_name?: string;
  phone?: string;
  service_id: string;
  service_title?: string;
  status: string;
  scheduled_date: string;
  time_slot: string;
  price: number;
}

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  discount_percent: number;
  valid_until: string;
  bg_color: string;
}

interface Category {
  id: string;
  name: string;
}

type TabType = "services" | "bookings" | "slots" | "offers";

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: "services", label: "Services", icon: Package },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "slots", label: "Slots", icon: Clock },
  { id: "offers", label: "Offers", icon: Gift },
];

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: colors.warningLight, fg: "#B45309" },
  confirmed: { bg: colors.primaryLight, fg: colors.primary },
  assigned: { bg: "#E0E7FF", fg: "#4F46E5" },
  in_progress: { bg: colors.successLight, fg: colors.success },
  completed: { bg: colors.successLight, fg: colors.success },
  cancelled: { bg: colors.errorLight, fg: colors.error },
};

export default function AdminSettings() {
  const router = useRouter();
  const { isAdmin } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("services");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal states
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Form states
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceOffer, setServiceOffer] = useState("");
  const [serviceCategoryId, setServiceCategoryId] = useState<string>("");
  const [serviceImage, setServiceImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  const [offerTitle, setOfferTitle] = useState("");
  const [offerSubtitle, setOfferSubtitle] = useState("");
  const [offerCode, setOfferCode] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("");
  const [offerValidUntil, setOfferValidUntil] = useState("");

  // Fetch data
  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/services`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (e) {
      console.error("Error fetching services:", e);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/bookings`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error("Error fetching bookings:", e);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/slots`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (e) {
      console.error("Error fetching slots:", e);
    }
  };

  const fetchOffers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/offers`);
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch (e) {
      console.error("Error fetching offers:", e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchServices(),
      fetchBookings(),
      fetchSlots(),
      fetchOffers(),
      fetchCategories(),
    ]);
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Service CRUD
  const openServiceModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.name);
      setServicePrice(service.price.toString());
      setServiceDescription(service.description);
      setServiceOffer(service.offer);
      setServiceCategoryId(service.category_id || "");
      setServiceImage(service.image || "");
    } else {
      setEditingService(null);
      setServiceName("");
      setServicePrice("");
      setServiceDescription("");
      setServiceOffer("");
      setServiceCategoryId("");
      setServiceImage("");
    }
    setServiceModalVisible(true);
  };

  // Image picker
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setUploadingImage(true);
          try {
            const res = await fetch(`${API_BASE}/api/admin/upload-image-base64`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                image_data: asset.base64,
                filename: asset.fileName || "image.jpg",
              }),
            });

            if (res.ok) {
              const data = await res.json();
              setServiceImage(data.url);
              Alert.alert("Success", "Image uploaded successfully");
            } else {
              const errorData = await res.text();
              console.error("Upload failed:", errorData);
              // Show option to enter URL manually
              Alert.alert(
                "Upload Failed", 
                "Storage bucket may not exist. You can enter an image URL manually instead.",
                [
                  { text: "OK", style: "default" }
                ]
              );
            }
          } catch (e) {
            console.error("Upload error:", e);
            Alert.alert("Error", "Failed to upload image. Please try entering a URL manually.");
          }
          setUploadingImage(false);
        } else {
          // Web fallback: use URI directly
          setServiceImage(asset.uri);
        }
      }
    } catch (e) {
      setUploadingImage(false);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const saveService = async () => {
    if (!serviceName || !servicePrice) {
      Alert.alert("Error", "Name and price are required");
      return;
    }
    
    // Category is required for new services
    if (!editingService && !serviceCategoryId) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    try {
      const payload: any = {
        name: serviceName,
        price: parseFloat(servicePrice),
        description: serviceDescription,
        category_id: serviceCategoryId || null,
      };
      
      // Include image if provided
      if (serviceImage) {
        payload.image = serviceImage;
      }

      let res;
      if (editingService) {
        res = await fetch(`${API_BASE}/api/admin/services/${editingService.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/api/admin/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setServiceModalVisible(false);
        fetchServices();
        Alert.alert("Success", editingService ? "Service updated" : "Service created");
      } else {
        const error = await res.text();
        Alert.alert("Error", error);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save service");
    }
  };

  const toggleServiceActive = async (service: Service) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active }),
      });

      if (res.ok) {
        fetchServices();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update service");
    }
  };

  const deleteService = async (service: Service) => {
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === 'web') {
          resolve(window.confirm(`Are you sure you want to delete "${service.name}"?`));
        } else {
          Alert.alert("Delete Service", `Are you sure you want to delete "${service.name}"?`, [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Delete", style: "destructive", onPress: () => resolve(true) },
          ]);
        }
      });
    };

    const shouldDelete = await confirmDelete();
    if (shouldDelete) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/services/${service.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          fetchServices();
          Alert.alert("Success", "Service deleted");
        } else {
          const error = await res.text();
          Alert.alert("Error", error);
        }
      } catch (e) {
        Alert.alert("Error", "Failed to delete service");
      }
    }
  };

  // Slot CRUD
  const openSlotModal = () => {
    setSlotDate("");
    setSlotTime("");
    setSlotModalVisible(true);
  };

  const saveSlot = async () => {
    if (!slotDate || !slotTime) {
      Alert.alert("Error", "Date and time are required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: slotDate,
          time: slotTime,
          available: true,
        }),
      });

      if (res.ok) {
        setSlotModalVisible(false);
        fetchSlots();
        Alert.alert("Success", "Slot created");
      } else {
        const error = await res.text();
        Alert.alert("Error", error);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to create slot");
    }
  };

  const toggleSlotAvailability = async (slot: Slot) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !slot.available }),
      });

      if (res.ok) {
        fetchSlots();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update slot");
    }
  };

  const deleteSlot = async (slot: Slot) => {
    Alert.alert("Delete Slot", "Are you sure you want to delete this slot?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/api/admin/slots/${slot.id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              fetchSlots();
              Alert.alert("Success", "Slot deleted");
            }
          } catch (e) {
            Alert.alert("Error", "Failed to delete slot");
          }
        },
      },
    ]);
  };

  // Booking status update
  const updateBookingStatus = async (booking: Booking, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchBookings();
        Alert.alert("Success", `Booking status updated to ${newStatus}`);
      } else {
        const error = await res.text();
        Alert.alert("Error", error);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update booking status");
    }
  };

  // Offer CRUD
  const openOfferModal = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferTitle(offer.title);
      setOfferSubtitle(offer.subtitle);
      setOfferCode(offer.code);
      setOfferDiscount(offer.discount_percent.toString());
      setOfferValidUntil(offer.valid_until);
    } else {
      setEditingOffer(null);
      setOfferTitle("");
      setOfferSubtitle("");
      setOfferCode("");
      setOfferDiscount("");
      setOfferValidUntil("");
    }
    setOfferModalVisible(true);
  };

  const saveOffer = async () => {
    if (!offerTitle || !offerCode || !offerDiscount) {
      Alert.alert("Error", "Title, code and discount are required");
      return;
    }

    try {
      const payload = {
        title: offerTitle,
        subtitle: offerSubtitle,
        code: offerCode,
        discount_percent: parseFloat(offerDiscount),
        valid_until: offerValidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        bg_color: "#2563EB",
      };

      let res;
      if (editingOffer) {
        res = await fetch(`${API_BASE}/api/admin/offers/${editingOffer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/api/admin/offers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setOfferModalVisible(false);
        fetchOffers();
        Alert.alert("Success", editingOffer ? "Offer updated" : "Offer created");
      } else {
        const error = await res.text();
        Alert.alert("Error", error);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save offer");
    }
  };

  const deleteOffer = async (offer: Offer) => {
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === 'web') {
          resolve(window.confirm(`Are you sure you want to delete "${offer.title}"?`));
        } else {
          Alert.alert("Delete Offer", `Are you sure you want to delete "${offer.title}"?`, [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Delete", style: "destructive", onPress: () => resolve(true) },
          ]);
        }
      });
    };

    const shouldDelete = await confirmDelete();
    if (shouldDelete) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/offers/${offer.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          fetchOffers();
          Alert.alert("Success", "Offer deleted");
        } else {
          const error = await res.text();
          Alert.alert("Error", error);
        }
      } catch (e) {
        Alert.alert("Error", "Failed to delete offer");
      }
    }
  };

  // Render functions
  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {/* Service Image */}
        <View style={styles.serviceImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.servicePlaceholder}>
              <ImageIcon size={24} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardPrice}>₹{item.price}</Text>
          {item.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          {item.offer ? (
            <View style={styles.offerBadge}>
              <Gift size={10} color={colors.success} />
              <Text style={styles.offerBadgeText}>{item.offer}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardActions}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{item.is_active ? "Active" : "Inactive"}</Text>
            <Switch
              value={item.is_active}
              onValueChange={() => toggleServiceActive(item)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={item.is_active ? colors.primary : colors.textMuted}
            />
          </View>
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => openServiceModal(item)}
            >
              <Edit3 size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, styles.deleteBtn]}
              onPress={() => deleteService(item)}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    return (
      <View style={styles.card}>
        <View style={styles.bookingHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.service_title || "Service"}</Text>
            <Text style={styles.bookingCustomer}>
              {item.customer_name || "Unknown"} • {item.phone || "No phone"}
            </Text>
            <Text style={styles.bookingMeta}>
              {new Date(item.scheduled_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}{" "}
              • {item.time_slot}
            </Text>
            <Text style={styles.cardPrice}>₹{item.price}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.fg }]}>
              {item.status.replace("_", " ")}
            </Text>
          </View>
        </View>
        <View style={styles.statusButtons}>
          {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusBtn,
                item.status === status && styles.statusBtnActive,
              ]}
              onPress={() => updateBookingStatus(item, status)}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  item.status === status && styles.statusBtnTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSlotItem = ({ item }: { item: Slot }) => (
    <View style={styles.slotCard}>
      <View style={styles.slotInfo}>
        <Calendar size={16} color={colors.textMuted} />
        <Text style={styles.slotDate}>
          {new Date(item.date).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </Text>
        <Clock size={16} color={colors.textMuted} />
        <Text style={styles.slotTime}>{item.time}</Text>
      </View>
      <View style={styles.slotActions}>
        <TouchableOpacity
          style={[
            styles.slotToggle,
            { backgroundColor: item.available ? colors.successLight : colors.errorLight },
          ]}
          onPress={() => toggleSlotAvailability(item)}
        >
          <Text
            style={[
              styles.slotToggleText,
              { color: item.available ? colors.success : colors.error },
            ]}
          >
            {item.available ? "Available" : "Blocked"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, styles.deleteBtn]}
          onPress={() => deleteSlot(item)}
        >
          <Trash2 size={14} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOfferItem = ({ item }: { item: Offer }) => (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.bg_color || colors.primary }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.subtitle ? <Text style={styles.cardDescription}>{item.subtitle}</Text> : null}
          <View style={styles.offerDetails}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
            <Text style={styles.discountText}>{item.discount_percent}% OFF</Text>
          </View>
          <Text style={styles.validUntil}>
            Valid until: {new Date(item.valid_until).toLocaleDateString("en-IN")}
          </Text>
        </View>
        <View style={styles.iconRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => openOfferModal(item)}
          >
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.deleteBtn]}
            onPress={() => deleteOffer(item)}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case "services":
        return (
          <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            renderItem={renderServiceItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Package size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No services yet</Text>
                <Text style={styles.emptySubtext}>Add your first service to get started</Text>
              </View>
            }
          />
        );
      case "bookings":
        return (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={renderBookingItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Calendar size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No bookings yet</Text>
                <Text style={styles.emptySubtext}>Bookings will appear here</Text>
              </View>
            }
          />
        );
      case "slots":
        return (
          <FlatList
            data={slots}
            keyExtractor={(item) => item.id}
            renderItem={renderSlotItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Clock size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No slots yet</Text>
                <Text style={styles.emptySubtext}>Add available time slots for bookings</Text>
              </View>
            }
          />
        );
      case "offers":
        return (
          <FlatList
            data={offers}
            keyExtractor={(item) => item.id}
            renderItem={renderOfferItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Gift size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No offers yet</Text>
                <Text style={styles.emptySubtext}>Create promotional offers for customers</Text>
              </View>
            }
          />
        );
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.centerContainer}>
          <Text style={styles.accessDenied}>Access Denied</Text>
          <Text style={styles.accessDeniedSub}>You need admin privileges to access this page</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerCrumb}>Admin</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshData}>
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <tab.icon
              size={18}
              color={activeTab === tab.id ? colors.primary : colors.textMuted}
            />
            <Text
              style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>{renderTabContent()}</View>

      {/* FAB */}
      {(activeTab === "services" || activeTab === "slots" || activeTab === "offers") && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (activeTab === "services") openServiceModal();
            else if (activeTab === "slots") openSlotModal();
            else if (activeTab === "offers") openOfferModal();
          }}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Service Modal */}
      <Modal
        visible={serviceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setServiceModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? "Edit Service" : "Add Service"}
              </Text>
              <TouchableOpacity onPress={() => setServiceModalVisible(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={serviceName}
                onChangeText={setServiceName}
                placeholder="Service name"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                value={servicePrice}
                onChangeText={setServicePrice}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={serviceDescription}
                onChangeText={setServiceDescription}
                placeholder="Service description"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Offer Text</Text>
              <TextInput
                style={styles.input}
                value={serviceOffer}
                onChangeText={setServiceOffer}
                placeholder="e.g., 20% OFF"
                placeholderTextColor={colors.textSubtle}
              />

              {/* Image Upload Section */}
              <Text style={styles.inputLabel}>Service Image</Text>
              <TouchableOpacity 
                style={styles.imageUploadBtn} 
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : serviceImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: serviceImage }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.changeImageOverlay}>
                      <Camera size={20} color="#FFF" />
                      <Text style={styles.changeImageText}>Change</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Upload size={24} color={colors.textMuted} />
                    <Text style={styles.uploadText}>Tap to upload image</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Manual Image URL Input */}
              <Text style={styles.inputLabel}>Or paste Image URL</Text>
              <TextInput
                style={styles.input}
                value={serviceImage}
                onChangeText={setServiceImage}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
              />

              {categories.length > 0 && (
                <>
                  <Text style={styles.inputLabel}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          serviceCategoryId === cat.id && styles.categoryChipActive,
                        ]}
                        onPress={() => setServiceCategoryId(cat.id)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            serviceCategoryId === cat.id && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={saveService}>
              <Check size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>
                {editingService ? "Update" : "Create"} Service
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Slot Modal */}
      <Modal
        visible={slotModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSlotModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Slot</Text>
              <TouchableOpacity onPress={() => setSlotModalVisible(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                value={slotDate}
                onChangeText={setSlotDate}
                placeholder="2025-06-15"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Time *</Text>
              <TextInput
                style={styles.input}
                value={slotTime}
                onChangeText={setSlotTime}
                placeholder="09:00 AM"
                placeholderTextColor={colors.textSubtle}
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveSlot}>
              <Check size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>Create Slot</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Offer Modal */}
      <Modal
        visible={offerModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingOffer ? "Edit Offer" : "Add Offer"}
              </Text>
              <TouchableOpacity onPress={() => setOfferModalVisible(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={offerTitle}
                onChangeText={setOfferTitle}
                placeholder="Summer Sale"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Subtitle</Text>
              <TextInput
                style={styles.input}
                value={offerSubtitle}
                onChangeText={setOfferSubtitle}
                placeholder="Limited time offer"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Promo Code *</Text>
              <TextInput
                style={styles.input}
                value={offerCode}
                onChangeText={setOfferCode}
                placeholder="SUMMER20"
                autoCapitalize="characters"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Discount (%) *</Text>
              <TextInput
                style={styles.input}
                value={offerDiscount}
                onChangeText={setOfferDiscount}
                placeholder="20"
                keyboardType="numeric"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Valid Until (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={offerValidUntil}
                onChangeText={setOfferValidUntil}
                placeholder="2025-12-31"
                placeholderTextColor={colors.textSubtle}
              />
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={saveOffer}>
              <Check size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>
                {editingOffer ? "Update" : "Create"} Offer
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCrumb: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.3,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  offerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  offerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },
  cardActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  iconRow: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: colors.errorLight,
  },
  bookingHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  bookingCustomer: {
    fontSize: 13,
    color: colors.textBody,
    marginBottom: 2,
  },
  bookingMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
  statusBtnTextActive: {
    color: "#FFF",
  },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  slotInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotDate: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMain,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textBody,
  },
  slotActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  slotToggleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  offerDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  codeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  codeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  discountText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.success,
  },
  validUntil: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMain,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  accessDenied: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.error,
    marginBottom: 8,
  },
  accessDeniedSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  backBtnText: {
    color: "#FFF",
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.floating,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textMain,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textMain,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  categoryChipTextActive: {
    color: colors.primary,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  // Service Image Styles
  serviceImageContainer: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    overflow: "hidden",
    marginRight: 4,
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  servicePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  // Image Upload Styles
  imageUploadBtn: {
    width: "100%",
    height: 150,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 16,
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    gap: 8,
  },
  uploadText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  changeImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  changeImageText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
