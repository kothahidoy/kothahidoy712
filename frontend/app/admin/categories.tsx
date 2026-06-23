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
  Check,
  ChevronRight,
  Edit3,
  FolderOpen,
  ImageIcon,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { useSession } from "@/src/context/SessionContext";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  image_url?: string;
}

export default function AdminCategories() {
  const router = useRouter();
  const { isAdmin } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#2563EB");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

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
    await fetchCategories();
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setIcon(category.icon || "");
      setColor(category.color || "#2563EB");
      setDescription(category.description || "");
      setImageUrl(category.image_url || "");
    } else {
      setEditingCategory(null);
      setName("");
      setIcon("");
      setColor("#2563EB");
      setDescription("");
      setImageUrl("");
    }
    setModalVisible(true);
  };

  const saveCategory = async () => {
    if (!name) {
      Alert.alert("Error", "Name is required");
      return;
    }

    try {
      const payload = {
        name,
        icon,
        color,
        description,
        image_url: imageUrl,
      };

      let res;
      if (editingCategory) {
        res = await fetch(`${API_BASE}/api/admin/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/api/admin/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: `cat-${Date.now()}`, ...payload }),
        });
      }

      if (res.ok) {
        setModalVisible(false);
        fetchCategories();
        Alert.alert("Success", editingCategory ? "Category updated" : "Category created");
      } else {
        const error = await res.text();
        Alert.alert("Error", error);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save category");
    }
  };

  const deleteCategory = async (category: Category) => {
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === "web") {
          resolve(window.confirm(`Delete "${category.name}"?`));
        } else {
          Alert.alert("Delete Category", `Delete "${category.name}"?`, [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Delete", style: "destructive", onPress: () => resolve(true) },
          ]);
        }
      });
    };

    if (await confirmDelete()) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/categories/${category.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          fetchCategories();
          Alert.alert("Success", "Category deleted");
        }
      } catch (e) {
        Alert.alert("Error", "Failed to delete category");
      }
    }
  };

  const PRESET_COLORS = [
    "#E11D48", "#2563EB", "#16A34A", "#F59E0B", "#0EA5E9",
    "#EAB308", "#7C3AED", "#06B6D4", "#A16207", "#DC2626"
  ];

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.card}>
      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.description && (
          <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
        )}
        <Text style={styles.cardId}>ID: {item.id}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => openModal(item)}>
          <Edit3 size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, styles.deleteBtn]} onPress={() => deleteCategory(item)}>
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Categories</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshData}>
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FolderOpen size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No categories yet</Text>
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
              <Text style={styles.modalTitle}>{editingCategory ? "Edit Category" : "Add Category"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Category name"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Icon Name</Text>
              <TextInput
                style={styles.input}
                value={icon}
                onChangeText={setIcon}
                placeholder="e.g., Scissors, Wrench"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorSelected]}
                    onPress={() => setColor(c)}
                  >
                    {color === c && <Check size={16} color="#FFF" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Category description"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.inputLabel}>Image URL</Text>
              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
              />
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={saveCategory}>
              <Check size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>{editingCategory ? "Update" : "Create"} Category</Text>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadow.card,
  },
  colorDot: { width: 40, height: 40, borderRadius: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  cardDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cardId: { fontSize: 11, color: colors.textSubtle, marginTop: 4 },
  actions: { flexDirection: "row", gap: 8 },
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
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: "85%" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  modalBody: { padding: 20, maxHeight: 400 },
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
  textArea: { minHeight: 80, textAlignVertical: "top" },
  colorRow: { marginBottom: 16 },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSelected: { borderWidth: 3, borderColor: "#FFF" },
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
