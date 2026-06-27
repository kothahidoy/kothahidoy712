import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  Plus,
  Save,
  Star,
  Trash2,
  Edit3,
  X,
} from "lucide-react-native";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

// ===== TYPES =====
interface SafetyTip {
  text: string;
  color?: string;
  icon?: string;
}
interface ProcessStep {
  step: number;
  title: string;
  description: string;
}
interface FAQ {
  question: string;
  answer: string;
}
interface ServiceCore {
  id: string;
  category_id: string;
  title: string;
  subtitle?: string;
  description?: string;
  short_description?: string;
  starting_price?: number;
  duration_mins?: number;
  rating?: number;
  review_count?: number;
  image?: string;
  hero_image?: string;
  warranty?: string;
  is_active?: boolean;
  safety_tips?: SafetyTip[];
  process_steps?: ProcessStep[];
  inclusions?: string[];
  exclusions?: string[];
  brands?: string[];
  cover_features?: string[];
  faqs?: FAQ[];
}
interface VariantRow {
  id: string;
  service_id: string;
  name: string;
  price: number;
  original_price?: number;
  duration_mins?: number;
  image?: string;
  rating?: number;
  review_count?: number;
  features?: string[];
  sort_order?: number;
  is_active?: boolean;
  auto_generated?: boolean;
}
interface ReviewRow {
  id: string;
  service_id: string;
  customer_name: string;
  customer_avatar?: string;
  rating: number;
  review_text: string;
  is_published: boolean;
  created_at?: string;
}

export default function AdminServiceEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const serviceId = params.id || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<ServiceCore | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  // Modals
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantRow | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewRow | null>(null);

  // Load data
  const load = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/services/${encodeURIComponent(serviceId)}/detail`
      );
      if (res.ok) {
        const data = await res.json();
        setService(data.service || null);
        setVariants(data.variants || []);
        setReviews(data.reviews || []);
      } else {
        Alert.alert("Error", `Could not load service (HTTP ${res.status})`);
      }
    } catch (err: any) {
      Alert.alert("Error", String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    load();
  }, [load]);

  // ===== Save core fields =====
  const handleSaveCore = async () => {
    if (!service) return;
    setSaving(true);
    try {
      const body = {
        title: service.title,
        subtitle: service.subtitle || "",
        description: service.description || "",
        short_description: service.short_description || "",
        starting_price: Number(service.starting_price) || 0,
        duration_mins: Number(service.duration_mins) || 0,
        rating: Number(service.rating) || 4.7,
        review_count: Number(service.review_count) || 0,
        image: service.image || "",
        hero_image: service.hero_image || "",
        warranty: service.warranty || "30 days",
        is_active: !!service.is_active,
        safety_tips: service.safety_tips || [],
        process_steps: service.process_steps || [],
        inclusions: service.inclusions || [],
        exclusions: service.exclusions || [],
        brands: service.brands || [],
        cover_features: service.cover_features || [],
        faqs: service.faqs || [],
      };
      const res = await fetch(
        `${API_BASE}/api/admin/services/${encodeURIComponent(serviceId)}/detail`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        Alert.alert("Saved", "Service details updated.");
        await load();
      } else {
        const text = await res.text();
        Alert.alert("Save failed", text.slice(0, 300));
      }
    } catch (err: any) {
      Alert.alert("Error", String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // ===== Variant operations =====
  const openNewVariant = () => {
    setEditingVariant({
      id: "",
      service_id: serviceId,
      name: "",
      price: 0,
      duration_mins: 60,
      image: "",
      rating: 4.7,
      review_count: 0,
      features: [],
      sort_order: variants.length,
      is_active: true,
    });
    setVariantModalOpen(true);
  };

  const openEditVariant = (v: VariantRow) => {
    if (v.auto_generated) {
      Alert.alert(
        "Auto-generated tier",
        "This Standard/Premium is auto-generated. Tap Save to make it an editable tier."
      );
    }
    setEditingVariant({ ...v });
    setVariantModalOpen(true);
  };

  const saveVariant = async () => {
    if (!editingVariant) return;
    const body: any = {
      name: editingVariant.name,
      price: Number(editingVariant.price) || 0,
      original_price: editingVariant.original_price
        ? Number(editingVariant.original_price)
        : undefined,
      duration_mins: Number(editingVariant.duration_mins) || 60,
      image: editingVariant.image || "",
      rating: Number(editingVariant.rating) || 4.7,
      review_count: Number(editingVariant.review_count) || 0,
      features: editingVariant.features || [],
      sort_order: Number(editingVariant.sort_order) || 0,
      is_active: editingVariant.is_active !== false,
    };
    const isNew = !editingVariant.id || editingVariant.auto_generated;
    const url = isNew
      ? `${API_BASE}/api/admin/services/${encodeURIComponent(serviceId)}/variants`
      : `${API_BASE}/api/admin/services/${encodeURIComponent(serviceId)}/variants/${editingVariant.id}`;
    try {
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setVariantModalOpen(false);
        setEditingVariant(null);
        await load();
      } else {
        const t = await res.text();
        Alert.alert("Save failed", t.slice(0, 300));
      }
    } catch (err: any) {
      Alert.alert("Error", String(err?.message || err));
    }
  };

  const deleteVariant = async (variantId: string) => {
    Alert.alert("Delete tier", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await fetch(
            `${API_BASE}/api/admin/services/${encodeURIComponent(serviceId)}/variants/${variantId}`,
            { method: "DELETE" }
          );
          if (res.ok) await load();
          else Alert.alert("Failed", await res.text());
        },
      },
    ]);
  };

  // ===== Review operations =====
  const openNewReview = () => {
    setEditingReview({
      id: "",
      service_id: serviceId,
      customer_name: "",
      customer_avatar: "",
      rating: 5,
      review_text: "",
      is_published: true,
    });
    setReviewModalOpen(true);
  };

  const openEditReview = (r: ReviewRow) => {
    setEditingReview({ ...r });
    setReviewModalOpen(true);
  };

  const saveReview = async () => {
    if (!editingReview) return;
    const body: any = {
      customer_name: editingReview.customer_name,
      customer_avatar: editingReview.customer_avatar || "",
      rating: Number(editingReview.rating) || 5,
      review_text: editingReview.review_text,
      is_published: editingReview.is_published,
    };
    const isNew = !editingReview.id;
    const url = isNew
      ? `${API_BASE}/api/admin/services/${encodeURIComponent(serviceId)}/reviews`
      : `${API_BASE}/api/admin/services/${encodeURIComponent(serviceId)}/reviews/${editingReview.id}`;
    try {
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setReviewModalOpen(false);
        setEditingReview(null);
        await load();
      } else {
        Alert.alert("Save failed", await res.text());
      }
    } catch (err: any) {
      Alert.alert("Error", String(err?.message || err));
    }
  };

  const deleteReview = async (reviewId: string) => {
    Alert.alert("Delete review", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await fetch(
            `${API_BASE}/api/admin/services/${encodeURIComponent(serviceId)}/reviews/${reviewId}`,
            { method: "DELETE" }
          );
          if (res.ok) await load();
          else Alert.alert("Failed", await res.text());
        },
      },
    ]);
  };

  // ===== Field array helpers (inclusions / exclusions / brands / cover_features) =====
  const updateStringArray = (field: keyof ServiceCore, idx: number, val: string) => {
    setService((s) => {
      if (!s) return s;
      const arr = ((s[field] as string[]) || []).slice();
      arr[idx] = val;
      return { ...s, [field]: arr };
    });
  };
  const addStringItem = (field: keyof ServiceCore) => {
    setService((s) => {
      if (!s) return s;
      const arr = ((s[field] as string[]) || []).slice();
      arr.push("");
      return { ...s, [field]: arr };
    });
  };
  const removeStringItem = (field: keyof ServiceCore, idx: number) => {
    setService((s) => {
      if (!s) return s;
      const arr = ((s[field] as string[]) || []).slice();
      arr.splice(idx, 1);
      return { ...s, [field]: arr };
    });
  };

  // Process steps editor
  const updateProcessStep = (idx: number, key: keyof ProcessStep, val: any) => {
    setService((s) => {
      if (!s) return s;
      const arr = (s.process_steps || []).slice();
      arr[idx] = { ...arr[idx], [key]: key === "step" ? Number(val) : val };
      return { ...s, process_steps: arr };
    });
  };
  const addProcessStep = () => {
    setService((s) => {
      if (!s) return s;
      const arr = (s.process_steps || []).slice();
      arr.push({ step: arr.length + 1, title: "", description: "" });
      return { ...s, process_steps: arr };
    });
  };
  const removeProcessStep = (idx: number) => {
    setService((s) => {
      if (!s) return s;
      const arr = (s.process_steps || []).slice();
      arr.splice(idx, 1);
      // re-number
      arr.forEach((p, i) => (p.step = i + 1));
      return { ...s, process_steps: arr };
    });
  };

  // Safety tips editor
  const updateTip = (idx: number, key: keyof SafetyTip, val: any) => {
    setService((s) => {
      if (!s) return s;
      const arr = (s.safety_tips || []).slice();
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...s, safety_tips: arr };
    });
  };
  const addTip = () => {
    setService((s) => {
      if (!s) return s;
      const arr = (s.safety_tips || []).slice();
      arr.push({ text: "", color: "#F59E0B", icon: "shield" });
      return { ...s, safety_tips: arr };
    });
  };
  const removeTip = (idx: number) => {
    setService((s) => {
      if (!s) return s;
      const arr = (s.safety_tips || []).slice();
      arr.splice(idx, 1);
      return { ...s, safety_tips: arr };
    });
  };

  // FAQ editor
  const updateFaq = (idx: number, key: keyof FAQ, val: string) => {
    setService((s) => {
      if (!s) return s;
      const arr = (s.faqs || []).slice();
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...s, faqs: arr };
    });
  };
  const addFaq = () => {
    setService((s) => {
      if (!s) return s;
      const arr = (s.faqs || []).slice();
      arr.push({ question: "", answer: "" });
      return { ...s, faqs: arr };
    });
  };
  const removeFaq = (idx: number) => {
    setService((s) => {
      if (!s) return s;
      const arr = (s.faqs || []).slice();
      arr.splice(idx, 1);
      return { ...s, faqs: arr };
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }
  if (!service) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text>Service not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Edit: {service.title}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {service.id} · {service.category_id}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSaveCore}
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Save size={16} color="#FFF" />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          {/* Basic */}
          <Section title="Basic Info">
            <Field label="Title">
              <TextInput
                style={styles.input}
                value={service.title}
                onChangeText={(t) => setService({ ...service, title: t })}
              />
            </Field>
            <Field label="Subtitle (badge text)">
              <TextInput
                style={styles.input}
                value={service.subtitle || ""}
                onChangeText={(t) => setService({ ...service, subtitle: t })}
                placeholder="ISI Certified · Safety Verified Electricians"
              />
            </Field>
            <Field label="Short description">
              <TextInput
                style={[styles.input, { height: 56 }]}
                value={service.short_description || ""}
                onChangeText={(t) =>
                  setService({ ...service, short_description: t })
                }
                multiline
              />
            </Field>
            <Field label="Description">
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={service.description || ""}
                onChangeText={(t) => setService({ ...service, description: t })}
                multiline
              />
            </Field>
            <View style={styles.row2}>
              <Field label="Starting Price (₹)" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={String(service.starting_price ?? "")}
                  onChangeText={(t) =>
                    setService({
                      ...service,
                      starting_price: Number(t) || 0,
                    })
                  }
                  keyboardType="numeric"
                />
              </Field>
              <Field label="Duration (mins)" style={{ flex: 1, marginLeft: 8 }}>
                <TextInput
                  style={styles.input}
                  value={String(service.duration_mins ?? "")}
                  onChangeText={(t) =>
                    setService({
                      ...service,
                      duration_mins: Number(t) || 0,
                    })
                  }
                  keyboardType="numeric"
                />
              </Field>
            </View>
            <View style={styles.row2}>
              <Field label="Rating" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={String(service.rating ?? "")}
                  onChangeText={(t) =>
                    setService({ ...service, rating: Number(t) || 4.7 })
                  }
                  keyboardType="numeric"
                />
              </Field>
              <Field label="Review count" style={{ flex: 1, marginLeft: 8 }}>
                <TextInput
                  style={styles.input}
                  value={String(service.review_count ?? "")}
                  onChangeText={(t) =>
                    setService({ ...service, review_count: Number(t) || 0 })
                  }
                  keyboardType="numeric"
                />
              </Field>
            </View>
            <Field label="Image URL">
              <TextInput
                style={styles.input}
                value={service.image || ""}
                onChangeText={(t) => setService({ ...service, image: t })}
                placeholder="https://..."
              />
            </Field>
            <Field label="Warranty">
              <TextInput
                style={styles.input}
                value={service.warranty || ""}
                onChangeText={(t) => setService({ ...service, warranty: t })}
                placeholder="30 days"
              />
            </Field>
            <View style={[styles.row2, { alignItems: "center" }]}>
              <Text style={styles.label}>Active</Text>
              <Switch
                value={!!service.is_active}
                onValueChange={(v) =>
                  setService({ ...service, is_active: v })
                }
                style={{ marginLeft: 12 }}
              />
            </View>
          </Section>

          {/* Tiers / Variants */}
          <Section
            title={`Service Tiers (${variants.length})`}
            action={
              <TouchableOpacity style={styles.addBtn} onPress={openNewVariant}>
                <Plus size={14} color="#FFF" />
                <Text style={styles.addBtnText}>Add Tier</Text>
              </TouchableOpacity>
            }
          >
            <Text style={styles.helper}>
              Standard/Premium/Pro etc. Admin can add any number with custom names.
            </Text>
            {variants.length === 0 && (
              <Text style={styles.empty}>No tiers yet. Tap "Add Tier".</Text>
            )}
            {variants.map((v) => (
              <View key={v.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>
                    {v.name}{" "}
                    {v.auto_generated ? (
                      <Text style={styles.autoTag}>(auto)</Text>
                    ) : null}
                  </Text>
                  <Text style={styles.itemMeta}>
                    ₹{v.price}
                    {v.original_price ? `  (was ₹${v.original_price})` : ""}
                    {v.duration_mins ? `  · ${v.duration_mins} min` : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openEditVariant(v)}
                  style={styles.iconBtn}
                >
                  <Edit3 size={16} color="#059669" />
                </TouchableOpacity>
                {!v.auto_generated && (
                  <TouchableOpacity
                    onPress={() => deleteVariant(v.id)}
                    style={styles.iconBtn}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Section>

          {/* Safety Tips */}
          <Section
            title={`Safety Tips (${(service.safety_tips || []).length})`}
            action={
              <TouchableOpacity style={styles.addBtn} onPress={addTip}>
                <Plus size={14} color="#FFF" />
                <Text style={styles.addBtnText}>Add Tip</Text>
              </TouchableOpacity>
            }
          >
            {(service.safety_tips || []).map((tip, i) => (
              <View key={i} style={styles.editBlock}>
                <View style={styles.row2}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Tip text"
                    value={tip.text}
                    onChangeText={(t) => updateTip(i, "text", t)}
                  />
                  <TouchableOpacity
                    onPress={() => removeTip(i)}
                    style={[styles.iconBtn, { marginLeft: 4 }]}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
                <View style={styles.row2}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Color (#F59E0B)"
                    value={tip.color || ""}
                    onChangeText={(t) => updateTip(i, "color", t)}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                    placeholder="Icon (shield / check / info / alert)"
                    value={tip.icon || ""}
                    onChangeText={(t) => updateTip(i, "icon", t)}
                  />
                </View>
              </View>
            ))}
          </Section>

          {/* Process steps */}
          <Section
            title={`Our Process (${(service.process_steps || []).length} steps)`}
            action={
              <TouchableOpacity style={styles.addBtn} onPress={addProcessStep}>
                <Plus size={14} color="#FFF" />
                <Text style={styles.addBtnText}>Add Step</Text>
              </TouchableOpacity>
            }
          >
            <Text style={styles.helper}>
              You can add as many steps as you want (no 4-step limit).
            </Text>
            {(service.process_steps || []).map((p, i) => (
              <View key={i} style={styles.editBlock}>
                <View style={styles.row2}>
                  <Text style={styles.stepNumber}>{i + 1}.</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Step title (e.g. Inspection)"
                    value={p.title}
                    onChangeText={(t) => updateProcessStep(i, "title", t)}
                  />
                  <TouchableOpacity
                    onPress={() => removeProcessStep(i)}
                    style={[styles.iconBtn, { marginLeft: 4 }]}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, { height: 56 }]}
                  placeholder="Description"
                  value={p.description}
                  onChangeText={(t) => updateProcessStep(i, "description", t)}
                  multiline
                />
              </View>
            ))}
          </Section>

          {/* Inclusions */}
          <StringArraySection
            title="What's Included"
            items={service.inclusions || []}
            onAdd={() => addStringItem("inclusions")}
            onUpdate={(i, v) => updateStringArray("inclusions", i, v)}
            onRemove={(i) => removeStringItem("inclusions", i)}
            placeholder="e.g. Free safety inspection"
          />

          {/* Exclusions */}
          <StringArraySection
            title="What's Excluded"
            items={service.exclusions || []}
            onAdd={() => addStringItem("exclusions")}
            onUpdate={(i, v) => updateStringArray("exclusions", i, v)}
            onRemove={(i) => removeStringItem("exclusions", i)}
            placeholder="e.g. Major rewiring work"
          />

          {/* Brands */}
          <StringArraySection
            title="Brands We Service"
            items={service.brands || []}
            onAdd={() => addStringItem("brands")}
            onUpdate={(i, v) => updateStringArray("brands", i, v)}
            onRemove={(i) => removeStringItem("brands", i)}
            placeholder="e.g. Havells"
          />

          {/* Cover features */}
          <StringArraySection
            title="Mfixit Cover Promise"
            items={service.cover_features || []}
            onAdd={() => addStringItem("cover_features")}
            onUpdate={(i, v) => updateStringArray("cover_features", i, v)}
            onRemove={(i) => removeStringItem("cover_features", i)}
            placeholder="e.g. Up to 30 days warranty"
          />

          {/* FAQ */}
          <Section
            title={`FAQ (${(service.faqs || []).length})`}
            action={
              <TouchableOpacity style={styles.addBtn} onPress={addFaq}>
                <Plus size={14} color="#FFF" />
                <Text style={styles.addBtnText}>Add FAQ</Text>
              </TouchableOpacity>
            }
          >
            {(service.faqs || []).map((f, i) => (
              <View key={i} style={styles.editBlock}>
                <View style={styles.row2}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Question"
                    value={f.question}
                    onChangeText={(t) => updateFaq(i, "question", t)}
                  />
                  <TouchableOpacity
                    onPress={() => removeFaq(i)}
                    style={[styles.iconBtn, { marginLeft: 4 }]}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, { height: 64 }]}
                  placeholder="Answer"
                  value={f.answer}
                  onChangeText={(t) => updateFaq(i, "answer", t)}
                  multiline
                />
              </View>
            ))}
          </Section>

          {/* Reviews */}
          <Section
            title={`Reviews (${reviews.length})`}
            action={
              <TouchableOpacity style={styles.addBtn} onPress={openNewReview}>
                <Plus size={14} color="#FFF" />
                <Text style={styles.addBtnText}>Add Review</Text>
              </TouchableOpacity>
            }
          >
            <Text style={styles.helper}>
              Public site shows only 5★ published reviews. Admin sees all.
            </Text>
            {reviews.length === 0 && (
              <Text style={styles.empty}>No reviews yet.</Text>
            )}
            {reviews.map((r) => (
              <View key={r.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.itemTitle}>{r.customer_name}</Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={11}
                          color={s <= r.rating ? "#F59E0B" : "#E5E7EB"}
                          fill={s <= r.rating ? "#F59E0B" : "#E5E7EB"}
                        />
                      ))}
                    </View>
                    {!r.is_published && (
                      <Text style={styles.hiddenTag}>HIDDEN</Text>
                    )}
                  </View>
                  <Text style={styles.itemMeta} numberOfLines={2}>
                    {r.review_text}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openEditReview(r)}
                  style={styles.iconBtn}
                >
                  <Edit3 size={16} color="#059669" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteReview(r.id)}
                  style={styles.iconBtn}
                >
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Variant modal */}
      <VariantModal
        open={variantModalOpen}
        variant={editingVariant}
        onChange={setEditingVariant}
        onClose={() => {
          setVariantModalOpen(false);
          setEditingVariant(null);
        }}
        onSave={saveVariant}
      />

      {/* Review modal */}
      <ReviewModal
        open={reviewModalOpen}
        review={editingReview}
        onChange={setEditingReview}
        onClose={() => {
          setReviewModalOpen(false);
          setEditingReview(null);
        }}
        onSave={saveReview}
      />
    </SafeAreaView>
  );
}

// ===== Reusable components =====
function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function StringArraySection({
  title,
  items,
  onAdd,
  onUpdate,
  onRemove,
  placeholder,
}: {
  title: string;
  items: string[];
  onAdd: () => void;
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  placeholder?: string;
}) {
  return (
    <Section
      title={`${title} (${items.length})`}
      action={
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Plus size={14} color="#FFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      }
    >
      {items.map((val, i) => (
        <View key={i} style={styles.row2}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder={placeholder}
            value={val}
            onChangeText={(t) => onUpdate(i, t)}
          />
          <TouchableOpacity
            onPress={() => onRemove(i)}
            style={[styles.iconBtn, { marginLeft: 4 }]}
          >
            <Trash2 size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      ))}
    </Section>
  );
}

function VariantModal({
  open,
  variant,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  variant: VariantRow | null;
  onChange: (v: VariantRow | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!variant) return null;
  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>
              {variant.id && !variant.auto_generated ? "Edit Tier" : "New Tier"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 500 }}>
            <Field label="Tier name">
              <TextInput
                style={styles.input}
                placeholder="Standard / Premium / Pro / Express..."
                value={variant.name}
                onChangeText={(t) => onChange({ ...variant, name: t })}
              />
            </Field>
            <View style={styles.row2}>
              <Field label="Price (₹)" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(variant.price ?? "")}
                  onChangeText={(t) =>
                    onChange({ ...variant, price: Number(t) || 0 })
                  }
                />
              </Field>
              <Field label="Original (₹)" style={{ flex: 1, marginLeft: 8 }}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(variant.original_price ?? "")}
                  onChangeText={(t) =>
                    onChange({
                      ...variant,
                      original_price: t ? Number(t) : undefined,
                    })
                  }
                />
              </Field>
            </View>
            <View style={styles.row2}>
              <Field label="Duration (min)" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(variant.duration_mins ?? "")}
                  onChangeText={(t) =>
                    onChange({ ...variant, duration_mins: Number(t) || 0 })
                  }
                />
              </Field>
              <Field label="Sort order" style={{ flex: 1, marginLeft: 8 }}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(variant.sort_order ?? 0)}
                  onChangeText={(t) =>
                    onChange({ ...variant, sort_order: Number(t) || 0 })
                  }
                />
              </Field>
            </View>
            <Field label="Image URL">
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={variant.image || ""}
                onChangeText={(t) => onChange({ ...variant, image: t })}
              />
            </Field>
            <View style={styles.row2}>
              <Field label="Rating" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(variant.rating ?? "")}
                  onChangeText={(t) =>
                    onChange({ ...variant, rating: Number(t) || 4.7 })
                  }
                />
              </Field>
              <Field label="Review count" style={{ flex: 1, marginLeft: 8 }}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(variant.review_count ?? "")}
                  onChangeText={(t) =>
                    onChange({ ...variant, review_count: Number(t) || 0 })
                  }
                />
              </Field>
            </View>
            <View style={[styles.row2, { alignItems: "center" }]}>
              <Text style={styles.label}>Active</Text>
              <Switch
                value={variant.is_active !== false}
                onValueChange={(v) =>
                  onChange({ ...variant, is_active: v })
                }
                style={{ marginLeft: 12 }}
              />
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={onSave}>
              <Check size={16} color="#FFF" />
              <Text style={styles.btnPrimaryText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReviewModal({
  open,
  review,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  review: ReviewRow | null;
  onChange: (r: ReviewRow | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!review) return null;
  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>
              {review.id ? "Edit Review" : "New Review"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 480 }}>
            <Field label="Customer name">
              <TextInput
                style={styles.input}
                value={review.customer_name}
                onChangeText={(t) =>
                  onChange({ ...review, customer_name: t })
                }
              />
            </Field>
            <Field label="Avatar URL (optional)">
              <TextInput
                style={styles.input}
                placeholder="https://i.pravatar.cc/100?img=5"
                value={review.customer_avatar || ""}
                onChangeText={(t) =>
                  onChange({ ...review, customer_avatar: t })
                }
              />
            </Field>
            <Field label="Rating">
              <View style={{ flexDirection: "row" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => onChange({ ...review, rating: s })}
                    style={{ marginRight: 6 }}
                  >
                    <Star
                      size={28}
                      color={s <= review.rating ? "#F59E0B" : "#E5E7EB"}
                      fill={s <= review.rating ? "#F59E0B" : "#E5E7EB"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
            <Field label="Review text">
              <TextInput
                style={[styles.input, { height: 96 }]}
                value={review.review_text}
                onChangeText={(t) =>
                  onChange({ ...review, review_text: t })
                }
                multiline
              />
            </Field>
            <View style={[styles.row2, { alignItems: "center" }]}>
              <Text style={styles.label}>Published (visible)</Text>
              <Switch
                value={review.is_published}
                onValueChange={(v) =>
                  onChange({ ...review, is_published: v })
                }
                style={{ marginLeft: 12 }}
              />
            </View>
            <Text style={styles.helper}>
              Note: even if published, only 5★ reviews are shown to customers.
            </Text>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={onSave}>
              <Check size={16} color="#FFF" />
              <Text style={styles.btnPrimaryText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 6, marginRight: 6 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontWeight: "700", marginLeft: 6 },

  section: { marginTop: 8, backgroundColor: "#FFF" },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 12 },

  field: { marginBottom: 10 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FFF",
  },
  row2: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  addBtn: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "600", marginLeft: 4 },

  helper: { fontSize: 11, color: "#6B7280", marginBottom: 8 },
  empty: { fontSize: 13, color: "#9CA3AF", paddingVertical: 8 },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  itemMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  autoTag: { color: "#9CA3AF", fontSize: 11, fontWeight: "400" },
  iconBtn: { padding: 6, marginLeft: 4 },

  editBlock: {
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
    marginRight: 6,
    paddingVertical: 8,
  },

  starRow: { flexDirection: "row", marginLeft: 6 },
  hiddenTag: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },

  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  btnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  btnGhostText: { color: "#6B7280", fontWeight: "600" },
  btnPrimary: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#FFF", fontWeight: "700", marginLeft: 6 },
});
