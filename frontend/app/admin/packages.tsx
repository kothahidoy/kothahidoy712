import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { notify, confirmAsync } from "@/src/utils/dialogs";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

interface CategoryRow {
  id: string;
  name: string;
  show_packages?: boolean;
}

interface PackageItem {
  category: string;
  description: string;
}

interface PackageRow {
  id: string;
  category_id: string;
  name: string;
  rating: number;
  review_count: string;
  price: number;
  original_price?: number;
  duration?: string;
  discount?: number;
  items: PackageItem[];
  sort_order: number;
  is_active: boolean;
}

const EMPTY_PKG = (categoryId: string): Omit<PackageRow, "id"> => ({
  category_id: categoryId,
  name: "",
  rating: 4.8,
  review_count: "1.0 K reviews",
  price: 0,
  original_price: undefined,
  duration: "",
  discount: undefined,
  items: [{ category: "", description: "" }],
  sort_order: 0,
  is_active: true,
});

export default function AdminPackages() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PackageRow | (Omit<PackageRow, "id"> & { id?: undefined }) | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/cms/categories`);
      if (r.ok) {
        const data = await r.json();
        setCategories(data);
        if (data.length > 0 && !selectedCat) setSelectedCat(data[0].id);
      }
    } catch {}
  };

  const loadPackages = async (categoryId: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/cms/packages?category_id=${categoryId}`);
      if (r.ok) setPackages(await r.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCat) loadPackages(selectedCat);
  }, [selectedCat]);

  const togglePackagesForCategory = async (cat: CategoryRow) => {
    const nextVal = !cat.show_packages;
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, show_packages: nextVal } : c)));
    try {
      const r = await fetch(`${API_BASE}/api/admin/cms/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cat.name, show_packages: nextVal }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, show_packages: !nextVal } : c)));
      notify("Couldn't update", "Please try again.");
    }
  };

  const onSavePackage = async () => {
    if (!editing || !selectedCat) return;
    if (!editing.name.trim() || !editing.price) {
      notify("Missing info", "Please enter a package name and price.");
      return;
    }
    setSaving(true);
    try {
      const isNew = !("id" in editing) || !editing.id;
      const url = isNew
        ? `${API_BASE}/api/admin/cms/packages`
        : `${API_BASE}/api/admin/cms/packages/${(editing as PackageRow).id}`;
      const r = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editing, items: editing.items.filter((i) => i.description.trim()) }),
      });
      if (!r.ok) throw new Error(await r.text());
      setEditing(null);
      loadPackages(selectedCat);
      notify("Saved", "Package updated.");
    } catch (e: any) {
      notify("Couldn't save", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onDeletePackage = async (pkg: PackageRow) => {
    const ok = await confirmAsync("Delete package?", `Remove "${pkg.name}"?`, "Delete", "Cancel");
    if (!ok || !selectedCat) return;
    try {
      const r = await fetch(`${API_BASE}/api/admin/cms/packages/${pkg.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      loadPackages(selectedCat);
    } catch {
      notify("Couldn't delete", "Please try again.");
    }
  };

  const currentCat = categories.find((c) => c.id === selectedCat);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>Super Saver Packages</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catChip, selectedCat === c.id && styles.catChipActive]}
            onPress={() => setSelectedCat(c.id)}
          >
            <Text style={[styles.catChipText, selectedCat === c.id && styles.catChipTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {currentCat && (
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Show packages for {currentCat.name}</Text>
            <Text style={styles.toggleSub}>Turn off to hide the whole section on this category's page</Text>
          </View>
          <Switch
            value={!!currentCat.show_packages}
            onValueChange={() => togglePackagesForCategory(currentCat)}
            trackColor={{ true: colors.primary }}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {packages.map((pkg) => (
            <View key={pkg.id} style={styles.pkgCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pkgName}>{pkg.name}</Text>
                <Text style={styles.pkgMeta}>
                  ₹{pkg.price} {pkg.original_price ? `(was ₹${pkg.original_price})` : ""} · {pkg.duration || "—"}
                </Text>
                <Text style={styles.pkgMeta}>{pkg.items.length} item(s) · {pkg.is_active ? "Active" : "Hidden"}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditing(pkg)} style={styles.pkgEditBtn}>
                <Text style={styles.pkgEditBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeletePackage(pkg)} style={{ padding: 6 }}>
                <Trash2 size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => selectedCat && setEditing(EMPTY_PKG(selectedCat))}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addBtnText}>Add package</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalCardWrap}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editing && "id" in editing && editing.id ? "Edit package" : "New package"}</Text>
                <TouchableOpacity onPress={() => setEditing(null)}>
                  <X size={20} color={colors.textMain} />
                </TouchableOpacity>
              </View>
              {editing && (
                <ScrollView style={{ maxHeight: 480 }}>
                  <Field label="Name" value={editing.name} onChangeText={(t) => setEditing({ ...editing, name: t })} />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Price (₹)"
                        value={String(editing.price || "")}
                        onChangeText={(t) => setEditing({ ...editing, price: Number(t) || 0 })}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Original price (₹)"
                        value={String(editing.original_price ?? "")}
                        onChangeText={(t) => setEditing({ ...editing, original_price: Number(t) || undefined })}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Duration"
                        value={editing.duration || ""}
                        onChangeText={(t) => setEditing({ ...editing, duration: t })}
                        placeholder="e.g. 5 hrs"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Discount %"
                        value={String(editing.discount ?? "")}
                        onChangeText={(t) => setEditing({ ...editing, discount: Number(t) || undefined })}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Included items</Text>
                  {editing.items.map((item, i) => (
                    <View key={i} style={styles.itemRow}>
                      <TextInput
                        value={item.category}
                        onChangeText={(t) => {
                          const items = [...editing.items];
                          items[i] = { ...items[i], category: t };
                          setEditing({ ...editing, items });
                        }}
                        placeholder="Label (e.g. Waxing)"
                        placeholderTextColor={colors.textSubtle}
                        style={[styles.input, { flex: 1, marginRight: 6 }]}
                      />
                      <TextInput
                        value={item.description}
                        onChangeText={(t) => {
                          const items = [...editing.items];
                          items[i] = { ...items[i], description: t };
                          setEditing({ ...editing, items });
                        }}
                        placeholder="Description"
                        placeholderTextColor={colors.textSubtle}
                        style={[styles.input, { flex: 2 }]}
                      />
                      <TouchableOpacity
                        onPress={() => setEditing({ ...editing, items: editing.items.filter((_, idx) => idx !== i) })}
                        style={{ padding: 8 }}
                      >
                        <Trash2 size={14} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addItemBtn}
                    onPress={() => setEditing({ ...editing, items: [...editing.items, { category: "", description: "" }] })}
                  >
                    <Plus size={14} color={colors.primary} />
                    <Text style={styles.addItemBtnText}>Add item</Text>
                  </TouchableOpacity>

                  <View style={styles.toggleRowInline}>
                    <Text style={styles.label}>Active (visible to customers)</Text>
                    <Switch
                      value={editing.is_active}
                      onValueChange={(v) => setEditing({ ...editing, is_active: v })}
                      trackColor={{ true: colors.primary }}
                    />
                  </View>

                  <TouchableOpacity style={styles.saveBtn} onPress={onSavePackage} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <Save size={16} color="#fff" />
                        <Text style={styles.saveBtnText}>Save package</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  catRow: { maxHeight: 52, backgroundColor: "#fff" },
  catChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 8,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 12, fontWeight: "600", color: colors.textMain },
  catChipTextActive: { color: "#fff" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginTop: 1,
  },
  toggleLabel: { fontSize: 13, fontWeight: "700", color: colors.textMain },
  toggleSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  list: { padding: 16, paddingBottom: 40 },
  pkgCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  pkgName: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  pkgMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pkgEditBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  pkgEditBtnText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  addBtnText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCardWrap: { width: "100%" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textMain,
  },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16, marginTop: 2 },
  addItemBtnText: { color: colors.primary, fontWeight: "600", fontSize: 12 },
  toggleRowInline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: 30,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
