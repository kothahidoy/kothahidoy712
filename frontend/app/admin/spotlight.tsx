import React, { useCallback, useState } from "react";
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
  Check,
  Edit3,
  ImageIcon,
  Megaphone,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { useSession } from "@/src/context/SessionContext";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

interface SpotlightBanner {
  id: string;
  title: string;
  title_line2?: string;
  subtitle?: string;
  bg_color: string;
  text_color: string;
  image?: string;
  link_to?: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminSpotlight() {
  const router = useRouter();
  const { isAdmin } = useSession();
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<SpotlightBanner[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SpotlightBanner | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [titleLine2, setTitleLine2] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [bgColor, setBgColor] = useState("#7C3AED");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [image, setImage] = useState("");
  const [linkTo, setLinkTo] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/spotlight-banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (e) {
      console.error("Error fetching spotlight banners:", e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchBanners();
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const openModal = (banner?: SpotlightBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setTitle(banner.title);
      setTitleLine2(banner.title_line2 || "");
      setSubtitle(banner.subtitle || "");
      setBgColor(banner.bg_color);
      setTextColor(banner.text_color);
      setImage(banner.image || "");
      setLinkTo(banner.link_to || "");
      setSortOrder(banner.sort_order.toString());
    } else {
      setEditingBanner(null);
      setTitle("");
      setTitleLine2("");
      setSubtitle("");
      setBgColor("#7C3AED");
      setTextColor("#FFFFFF");
      setImage("");
      setLinkTo("");
      setSortOrder("0");
    }
    setModalVisible(true);
  };

  const saveBanner = async () => {
    if (!title) {
      Alert.alert("Error", "Title is required");
      return;
    }

    try {
      const payload = {
        title,
        title_line2: titleLine2,
        subtitle,
        bg_color: bgColor,
        text_color: textColor,
        image,
        link_to: linkTo,
        sort_order: parseInt(sortOrder) || 0,
      };

      let res;
      if (editingBanner) {
        res = await fetch(`${API_BASE}/api/admin/spotlight-banners/${editingBanner.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/api/admin/spotlight-banners`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setModalVisible(false);
        fetchBanners();
        Alert.alert("Success", editingBanner ? "Banner updated" : "Banner created");
      } else {
        const error = await res.text();
        Alert.alert("Error", error);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save banner");
    }
  };

  const toggleActive = async (banner: SpotlightBanner) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/spotlight-banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !banner.is_active }),
      });
      if (res.ok) {
        fetchBanners();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update banner");
    }
  };

  const deleteBanner = async (banner: SpotlightBanner) => {
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === "web") {
          resolve(window.confirm(`Delete "${banner.title}"?`));
        } else {
          Alert.alert("Delete Banner", `Delete "${banner.title}"?`, [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Delete", style: "destructive", onPress: () => resolve(true) },
          ]);
        }
      });
    };

    if (await confirmDelete()) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/spotlight-banners/${banner.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          fetchBanners();
          Alert.alert("Success", "Banner deleted");
        }
      } catch (e) {
        Alert.alert("Error", "Failed to delete banner");
      }
    }
  };

  const BG_COLORS = ["#F5F5F5", "#7C3AED", "#2563EB", "#0EA5E9", "#16A34A", "#F59E0B", "#E11D48"];
  const TEXT_COLORS = ["#1a1a1a", "#FFFFFF"];

  const renderItem = ({ item }: { item: SpotlightBanner }) => (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.bg_color }]}>
      <View style={styles.cardHeader}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: item.bg_color }]}>
            <Megaphone size={20} color={item.text_color} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.title_line2 && <Text style={styles.cardTitleBold}>{item.title_line2}</Text>}
          {item.subtitle && <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>}
          <Text style={styles.cardMeta}>Order: {item.sort_order} • {item.link_to || "No link"}</Text>
        </View>
        <View style={styles.cardActions}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{item.is_active ? "On" : "Off"}</Text>
            <Switch
              value={item.is_active}
              onValueChange={() => toggleActive(item)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={item.is_active ? colors.primary : colors.textMuted}
            />
          </View>
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openModal(item)}>
              <Edit3 size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, styles.deleteBtn]} onPress={() => deleteBanner(item)}>
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.accessDenied}>Access Denied</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerCrumb}>Admin</Text>
          <Text style={styles.headerTitle}>Spotlight Banners</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={banners}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Megaphone size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No spotlight banners</Text>
              <Text style={styles.emptySubtext}>Create banners to display on home screen</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBanner ? "Edit Banner" : "Add Banner"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Title Line 1 *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Get your AC"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Title Line 2 (Bold)</Text>
              <TextInput
                style={styles.input}
                value={titleLine2}
                onChangeText={setTitleLine2}
                placeholder="e.g., summer-ready"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Subtitle</Text>
              <TextInput
                style={styles.input}
                value={subtitle}
                onChangeText={setSubtitle}
                placeholder="e.g., Foam-jet AC service"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Background Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                {BG_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorOption, { backgroundColor: c }, bgColor === c && styles.colorSelected]}
                    onPress={() => setBgColor(c)}
                  >
                    {bgColor === c && <Check size={16} color={c === "#F5F5F5" ? "#1a1a1a" : "#FFF"} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Text Color</Text>
              <View style={styles.textColorRow}>
                {TEXT_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.textColorOption, { backgroundColor: c }, textColor === c && styles.textColorSelected]}
                    onPress={() => setTextColor(c)}
                  >
                    <Text style={{ color: c === "#FFFFFF" ? "#1a1a1a" : "#FFF", fontWeight: "700" }}>
                      {c === "#FFFFFF" ? "White" : "Black"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Image URL</Text>
              <TextInput
                style={styles.input}
                value={image}
                onChangeText={setImage}
                placeholder="https://..."
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Link To (Route)</Text>
              <TextInput
                style={styles.input}
                value={linkTo}
                onChangeText={setLinkTo}
                placeholder="/category/cat-ac-appliance"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Sort Order</Text>
              <TextInput
                style={styles.input}
                value={sortOrder}
                onChangeText={setSortOrder}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textSubtle}
              />
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={saveBanner}>
              <Check size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>{editingBanner ? "Update" : "Create"} Banner</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  headerCrumb: { fontSize: 11, color: colors.textMuted, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.textMain, letterSpacing: -0.3 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: 20, paddingBottom: 100, gap: 12 },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardHeader: { flexDirection: "row", gap: 12 },
  cardImage: { width: 60, height: 60, borderRadius: radius.md },
  cardImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.textMain },
  cardTitleBold: { fontSize: 18, fontWeight: "800", color: colors.textMain },
  cardSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cardMeta: { fontSize: 11, color: colors.textSubtle, marginTop: 4 },
  cardActions: { alignItems: "flex-end", gap: 8 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchLabel: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  iconRow: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: { backgroundColor: colors.errorLight },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", justifyContent: "center", padding: 40, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: "700", color: colors.textMain },
  emptySubtext: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  accessDenied: { fontSize: 22, fontWeight: "800", color: colors.error, marginBottom: 20 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 999 },
  backBtnText: { color: "#FFF", fontWeight: "700" },
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
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: "90%" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  modalBody: { padding: 20, maxHeight: 450 },
  inputLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
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
  colorRow: { marginBottom: 16 },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorSelected: { borderWidth: 3, borderColor: colors.primary },
  textColorRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  textColorOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  textColorSelected: { borderWidth: 2, borderColor: colors.primary },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 14,
    borderRadius: 999,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
});
