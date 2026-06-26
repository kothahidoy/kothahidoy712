/**
 * Admin CMS – Urban Company-style content management
 * ──────────────────────────────────────────────────────
 * Tabs: Categories  |  Sub-categories  |  Banners  |  Promos  |  Services
 *
 * All data is fetched from /api/admin/cms/* and persisted to Supabase.
 * Image / video upload goes to the `cms-media` Storage bucket.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Edit3,
  Image as ImgIcon,
  Layers,
  Megaphone,
  PlayCircle,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react-native";
import { colors, radius, shadow } from "@/src/theme";
import { useSession } from "@/src/context/SessionContext";
import { notify, confirmAsync } from "@/src/utils/dialogs";

const API = (() => {
  // In a browser, ALWAYS use the current origin via a relative URL so the
  // request goes through the same nginx ingress (avoids stale env URLs).
  if (typeof window !== "undefined") return "/api/admin/cms";
  return (process.env.EXPO_PUBLIC_BACKEND_URL || "") + "/api/admin/cms";
})();

type TabKey = "home" | "categories" | "subcategories" | "banners" | "promos" | "services";

// ─────────────────────────────────────────────────────────────────────
//  HTTP helpers
// ─────────────────────────────────────────────────────────────────────
async function http<T = any>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: any,
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.status === 204 ? (null as any) : await res.json();
}

async function uploadMedia(asset: ImagePicker.ImagePickerAsset): Promise<{ url: string; type: "image" | "video" }> {
  const form = new FormData();
  const ext = (asset.fileName || asset.uri).split(".").pop()?.toLowerCase() || "jpg";
  const isVideo = asset.type === "video" || ["mp4", "mov", "webm"].includes(ext);
  // @ts-ignore React Native FormData file shape
  form.append("file", {
    uri: asset.uri,
    name: asset.fileName || `upload-${Date.now()}.${ext}`,
    type: isVideo ? `video/${ext === "mov" ? "quicktime" : ext}` : `image/${ext === "jpg" ? "jpeg" : ext}`,
  });
  const r = await fetch(`${API}/upload`, { method: "POST", body: form as any });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Upload failed (${r.status}): ${t.slice(0, 200)}`);
  }
  return await r.json();
}

// ─────────────────────────────────────────────────────────────────────
//  Reusable: Media (image/video) picker + URL field
// ─────────────────────────────────────────────────────────────────────
function MediaPicker({
  value,
  onChange,
  acceptVideo = false,
  label = "Image",
}: {
  value?: string | null;
  onChange: (url: string) => void;
  acceptVideo?: boolean;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const pick = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        notify("Permission required", "Allow photo access to upload media.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: acceptVideo ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
      });
      if (res.canceled || !res.assets?.length) return;
      setUploading(true);
      const out = await uploadMedia(res.assets[0]);
      onChange(out.url);
    } catch (e: any) {
      notify("Upload failed", e.message || String(e));
    } finally {
      setUploading(false);
    }
  }, [acceptVideo, onChange]);

  const isVideo = (value || "").match(/\.(mp4|mov|webm)$/i);

  return (
    <View style={{ gap: 8 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {value ? (
        <View style={mediaStyles.preview}>
          {isVideo ? (
            <View style={mediaStyles.videoTile}>
              <Video size={32} color="#fff" />
              <Text style={mediaStyles.videoLabel}>Video uploaded</Text>
            </View>
          ) : (
            <Image source={{ uri: value }} style={mediaStyles.previewImg} />
          )}
          <TouchableOpacity style={mediaStyles.previewClear} onPress={() => onChange("")}>
            <X size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity style={mediaStyles.uploadBtn} onPress={pick} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Upload size={16} color="#fff" />}
          <Text style={mediaStyles.uploadTxt}>{uploading ? "Uploading…" : "Upload from device"}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={fieldStyles.input}
        placeholder="…or paste image/video URL"
        placeholderTextColor={colors.textSubtle}
        autoCapitalize="none"
        value={value || ""}
        onChangeText={onChange}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Field components
// ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && { minHeight: 70, textAlignVertical: "top" }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        value={value == null ? "" : String(value)}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={fieldStyles.toggleRow}>
      <Text style={fieldStyles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function CategoryDropdown({ categories, value, onChange }: any) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c: any) => c.id === value);
  return (
    <View style={{ gap: 6 }}>
      <Text style={fieldStyles.label}>Category</Text>
      <TouchableOpacity style={fieldStyles.dropdownBtn} onPress={() => setOpen(true)}>
        <Text style={{ color: selected ? colors.textMain : colors.textSubtle }}>
          {selected ? selected.name : "Select category…"}
        </Text>
        <ChevronDown size={18} color={colors.textSubtle} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.sheetTitle}>Choose category</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {categories.map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  style={modalStyles.option}
                  onPress={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Text style={{ flex: 1, color: colors.textMain }}>{c.name}</Text>
                  {c.id === value && <ChevronRight size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  CATEGORIES TAB
// ─────────────────────────────────────────────────────────────────────
function CategoriesTab({ categories, reload }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  const blank = {
    id: "",
    name: "",
    icon: "FolderOpen",
    color: "#F3F4F6",
    image_url: "",
    sort_order: (categories.length || 0) + 1,
    is_active: true,
    brand_name: "",
    brand_rating: 4.85,
    brand_reviews_label: "2.0 M bookings",
  };

  const onSave = async () => {
    try {
      if (!editing?.name?.trim()) {
        notify("Missing", "Name is required");
        return;
      }
      const body = { ...editing };
      if (body.brand_rating === "" || body.brand_rating == null) delete body.brand_rating;
      if (editing.id && categories.find((c: any) => c.id === editing.id)) {
        await http("PATCH", `/categories/${editing.id}`, body);
      } else {
        await http("POST", "/categories", body);
      }
      setEditing(null);
      await reload();
      notify("Saved", "Category updated");
    } catch (e: any) {
      notify("Failed", e.message);
    }
  };

  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete category?", "All sub-categories & banners under it will also be removed."))) return;
    await http("DELETE", `/categories/${id}`);
    await reload();
  };

  return (
    <View style={{ gap: 12 }}>
      <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
        <Plus size={16} color="#fff" /><Text style={btn.addTxt}>Add new category</Text>
      </TouchableOpacity>
      {categories.map((c: any) => (
        <View key={c.id} style={row.card}>
          {c.image_url ? (
            <Image source={{ uri: c.image_url }} style={row.thumb} />
          ) : (
            <View style={[row.thumb, { backgroundColor: c.color || "#eee", alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: "#888", fontSize: 10 }}>No img</Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={row.title}>{c.name}</Text>
            <Text style={row.sub}>#{c.sort_order} · {c.is_active ? "Active" : "Hidden"}</Text>
            {c.brand_name ? <Text style={row.subDim}>{c.brand_name} · ⭐ {c.brand_rating}</Text> : null}
          </View>
          <Switch
            value={!!c.is_active}
            onValueChange={async (v) => {
              await http("PATCH", `/categories/${c.id}`, { name: c.name, is_active: v });
              await reload();
            }}
          />
          <TouchableOpacity onPress={() => setEditing({ ...c })} style={row.iconBtn}><Edit3 size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(c.id)} style={row.iconBtn}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
        </View>
      ))}

      <EditModal visible={!!editing} title={editing?.id && categories.find((c: any) => c.id === editing.id) ? "Edit category" : "New category"} onClose={() => setEditing(null)} onSave={onSave}>
        {editing && (
          <>
            <Field label="Name" value={editing.name} onChange={(v: string) => setEditing({ ...editing, name: v })} placeholder="e.g. Home Painting" />
            <Field label="ID (slug, optional)" value={editing.id} onChange={(v: string) => setEditing({ ...editing, id: v })} placeholder="auto-generated if blank" />
            <MediaPicker value={editing.image_url} onChange={(v) => setEditing({ ...editing, image_url: v })} label="Category image" />
            <Field label="Sort order" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })} keyboardType="number-pad" />
            <Field label="Brand label (e.g. Salon Luxe)" value={editing.brand_name} onChange={(v: string) => setEditing({ ...editing, brand_name: v })} placeholder="optional — shown on category page" />
            <Field label="Brand rating" value={editing.brand_rating} onChange={(v: string) => setEditing({ ...editing, brand_rating: Number(v) || 0 })} keyboardType="decimal-pad" />
            <Field label="Reviews label (e.g. 2.0 M bookings)" value={editing.brand_reviews_label} onChange={(v: string) => setEditing({ ...editing, brand_reviews_label: v })} />
            <ToggleRow label="Active / visible" value={!!editing.is_active} onChange={(v) => setEditing({ ...editing, is_active: v })} />
          </>
        )}
      </EditModal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  SUBCATEGORIES TAB
// ─────────────────────────────────────────────────────────────────────
function SubCategoriesTab({ categories }: any) {
  const [catId, setCatId] = useState<string>(categories[0]?.id || "");
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!catId) return;
    const data = await http<any[]>("GET", `/sub-categories?category_id=${catId}`);
    setRows(data || []);
  }, [catId]);
  useEffect(() => { load(); }, [load]);

  const blank = { category_id: catId, name: "", image_url: "", badge: "", badge_color: "#16A34A", sort_order: rows.length + 1, is_active: true };

  const onSave = async () => {
    try {
      if (!editing?.name?.trim()) return notify("Missing", "Name required");
      const body = { ...editing, category_id: catId };
      if (editing.id) await http("PATCH", `/sub-categories/${editing.id}`, body);
      else await http("POST", "/sub-categories", body);
      setEditing(null);
      await load();
    } catch (e: any) { notify("Failed", e.message); }
  };
  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete sub-category?", ""))) return;
    await http("DELETE", `/sub-categories/${id}`); await load();
  };

  return (
    <View style={{ gap: 12 }}>
      <CategoryDropdown categories={categories} value={catId} onChange={setCatId} />
      <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
        <Plus size={16} color="#fff" /><Text style={btn.addTxt}>Add sub-category</Text>
      </TouchableOpacity>
      {rows.map((s) => (
        <View key={s.id} style={row.card}>
          {s.image_url ? <Image source={{ uri: s.image_url }} style={row.thumb} /> : <View style={[row.thumb, { backgroundColor: "#eee" }]} />}
          <View style={{ flex: 1 }}>
            <Text style={row.title}>{s.name}</Text>
            <Text style={row.sub}>#{s.sort_order} {s.badge ? `· ${s.badge}` : ""}</Text>
          </View>
          <Switch value={!!s.is_active} onValueChange={async (v) => { await http("PATCH", `/sub-categories/${s.id}`, { category_id: catId, name: s.name, is_active: v }); load(); }} />
          <TouchableOpacity onPress={() => setEditing({ ...s })} style={row.iconBtn}><Edit3 size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(s.id)} style={row.iconBtn}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
        </View>
      ))}
      <EditModal visible={!!editing} title={editing?.id ? "Edit sub-category" : "New sub-category"} onClose={() => setEditing(null)} onSave={onSave}>
        {editing && (
          <>
            <Field label="Name" value={editing.name} onChange={(v: string) => setEditing({ ...editing, name: v })} placeholder="e.g. Facials" />
            <MediaPicker value={editing.image_url} onChange={(v) => setEditing({ ...editing, image_url: v })} label="Tile image" />
            <Field label="Badge (e.g. New, Upto 20% OFF)" value={editing.badge} onChange={(v: string) => setEditing({ ...editing, badge: v })} placeholder="optional" />
            <Field label="Sort order" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })} keyboardType="number-pad" />
            <ToggleRow label="Active" value={!!editing.is_active} onChange={(v) => setEditing({ ...editing, is_active: v })} />
          </>
        )}
      </EditModal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  BANNERS TAB  (hero carousel per category)
// ─────────────────────────────────────────────────────────────────────
function BannersTab({ categories }: any) {
  const [catId, setCatId] = useState<string>(categories[0]?.id || "");
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!catId) return;
    const data = await http<any[]>("GET", `/banners?category_id=${catId}`);
    setRows(data || []);
  }, [catId]);
  useEffect(() => { load(); }, [load]);

  const blank = { category_id: catId, title: "Salon, at your home", subtitle: "", media_type: "image", media_url: "", poster_url: "", sort_order: rows.length + 1, is_active: true };

  const onSave = async () => {
    try {
      if (!editing?.title?.trim() || !editing?.media_url?.trim()) return notify("Missing", "Title & media URL required");
      const body = { ...editing, category_id: catId };
      if (editing.id) await http("PATCH", `/banners/${editing.id}`, body);
      else await http("POST", "/banners", body);
      setEditing(null);
      await load();
    } catch (e: any) { notify("Failed", e.message); }
  };
  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete banner?", ""))) return;
    await http("DELETE", `/banners/${id}`); await load();
  };

  return (
    <View style={{ gap: 12 }}>
      <CategoryDropdown categories={categories} value={catId} onChange={setCatId} />
      <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
        <Plus size={16} color="#fff" /><Text style={btn.addTxt}>Add banner slide</Text>
      </TouchableOpacity>
      {rows.map((b) => (
        <View key={b.id} style={row.card}>
          {b.media_type === "video" ? (
            <View style={[row.thumb, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
              <PlayCircle size={20} color="#fff" />
            </View>
          ) : (
            <Image source={{ uri: b.media_url }} style={row.thumb} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={row.title}>{b.title}</Text>
            <Text style={row.sub}>#{b.sort_order} · {b.media_type}</Text>
          </View>
          <Switch value={!!b.is_active} onValueChange={async (v) => { await http("PATCH", `/banners/${b.id}`, { category_id: catId, title: b.title, media_url: b.media_url, media_type: b.media_type, is_active: v }); load(); }} />
          <TouchableOpacity onPress={() => setEditing({ ...b })} style={row.iconBtn}><Edit3 size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(b.id)} style={row.iconBtn}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
        </View>
      ))}
      <EditModal visible={!!editing} title={editing?.id ? "Edit banner" : "New banner"} onClose={() => setEditing(null)} onSave={onSave}>
        {editing && (
          <>
            <Field label="Title (large white text)" value={editing.title} onChange={(v: string) => setEditing({ ...editing, title: v })} placeholder="Salon, at your home" />
            <Field label="Subtitle (optional)" value={editing.subtitle} onChange={(v: string) => setEditing({ ...editing, subtitle: v })} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setEditing({ ...editing, media_type: "image" })} style={[chipStyles.chip, editing.media_type === "image" && chipStyles.chipActive]}>
                <ImgIcon size={14} color={editing.media_type === "image" ? "#fff" : colors.textMain} />
                <Text style={[chipStyles.chipTxt, editing.media_type === "image" && { color: "#fff" }]}>Image</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing({ ...editing, media_type: "video" })} style={[chipStyles.chip, editing.media_type === "video" && chipStyles.chipActive]}>
                <Video size={14} color={editing.media_type === "video" ? "#fff" : colors.textMain} />
                <Text style={[chipStyles.chipTxt, editing.media_type === "video" && { color: "#fff" }]}>Video</Text>
              </TouchableOpacity>
            </View>
            <MediaPicker value={editing.media_url} onChange={(v) => setEditing({ ...editing, media_url: v })} acceptVideo label={editing.media_type === "video" ? "Video file" : "Image file"} />
            {editing.media_type === "video" && (
              <MediaPicker value={editing.poster_url} onChange={(v) => setEditing({ ...editing, poster_url: v })} label="Poster image (thumbnail before play)" />
            )}
            <Field label="Sort order" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })} keyboardType="number-pad" />
            <ToggleRow label="Active" value={!!editing.is_active} onChange={(v) => setEditing({ ...editing, is_active: v })} />
          </>
        )}
      </EditModal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  PROMOS TAB  ("Get 25% off upto 200" strips)
// ─────────────────────────────────────────────────────────────────────
function PromosTab({ categories }: any) {
  const [catId, setCatId] = useState<string>(categories[0]?.id || "");
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!catId) return;
    const data = await http<any[]>("GET", `/promos?category_id=${catId}`);
    setRows(data || []);
  }, [catId]);
  useEffect(() => { load(); }, [load]);

  const blank = { category_id: catId, label: "Get 25% off upto 200", sub_label: "For new users", discount_pct: 25, max_off: 200, min_cart: 0, badge_color: "#16A34A", sort_order: rows.length + 1, is_active: true };

  const onSave = async () => {
    try {
      if (!editing?.label?.trim()) return notify("Missing", "Label required");
      const body = { ...editing, category_id: catId };
      if (editing.id) await http("PATCH", `/promos/${editing.id}`, body);
      else await http("POST", "/promos", body);
      setEditing(null); await load();
    } catch (e: any) { notify("Failed", e.message); }
  };
  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete promo strip?", ""))) return;
    await http("DELETE", `/promos/${id}`); await load();
  };

  return (
    <View style={{ gap: 12 }}>
      <CategoryDropdown categories={categories} value={catId} onChange={setCatId} />
      <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
        <Plus size={16} color="#fff" /><Text style={btn.addTxt}>Add promo strip</Text>
      </TouchableOpacity>
      {rows.map((p) => (
        <View key={p.id} style={row.card}>
          <View style={[row.thumb, { backgroundColor: p.badge_color || "#16A34A", alignItems: "center", justifyContent: "center" }]}>
            <Megaphone size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={row.title}>{p.label}</Text>
            <Text style={row.sub}>{p.sub_label || `${p.discount_pct}% upto ₹${p.max_off}`}</Text>
          </View>
          <Switch value={!!p.is_active} onValueChange={async (v) => { await http("PATCH", `/promos/${p.id}`, { category_id: catId, label: p.label, is_active: v }); load(); }} />
          <TouchableOpacity onPress={() => setEditing({ ...p })} style={row.iconBtn}><Edit3 size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(p.id)} style={row.iconBtn}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
        </View>
      ))}
      <EditModal visible={!!editing} title={editing?.id ? "Edit promo" : "New promo"} onClose={() => setEditing(null)} onSave={onSave}>
        {editing && (
          <>
            <Field label="Label" value={editing.label} onChange={(v: string) => setEditing({ ...editing, label: v })} placeholder="Get 25% off upto 200" />
            <Field label="Sub label" value={editing.sub_label} onChange={(v: string) => setEditing({ ...editing, sub_label: v })} placeholder="For new users" />
            <Field label="Discount %" value={editing.discount_pct} onChange={(v: string) => setEditing({ ...editing, discount_pct: Number(v) || 0 })} keyboardType="decimal-pad" />
            <Field label="Max ₹ off" value={editing.max_off} onChange={(v: string) => setEditing({ ...editing, max_off: Number(v) || 0 })} keyboardType="decimal-pad" />
            <Field label="Min cart ₹" value={editing.min_cart} onChange={(v: string) => setEditing({ ...editing, min_cart: Number(v) || 0 })} keyboardType="decimal-pad" />
            <Field label="Badge color (hex)" value={editing.badge_color} onChange={(v: string) => setEditing({ ...editing, badge_color: v })} />
            <Field label="Sort order" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })} keyboardType="number-pad" />
            <ToggleRow label="Active" value={!!editing.is_active} onChange={(v) => setEditing({ ...editing, is_active: v })} />
          </>
        )}
      </EditModal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  SERVICES TAB  (filter by category → sub-category → CRUD)
// ─────────────────────────────────────────────────────────────────────
function ServicesTab({ categories }: any) {
  const [catId, setCatId] = useState<string>(categories[0]?.id || "");
  const [subId, setSubId] = useState<string>("");
  const [subs, setSubs] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const loadSubs = useCallback(async () => {
    if (!catId) return;
    const d = await http<any[]>("GET", `/sub-categories?category_id=${catId}`);
    setSubs(d || []);
  }, [catId]);

  const loadServices = useCallback(async () => {
    if (!catId) return;
    const qp = subId ? `?category_id=${catId}&sub_category_id=${subId}` : `?category_id=${catId}`;
    const d = await http<any[]>("GET", `/services${qp}`);
    setRows(d || []);
  }, [catId, subId]);

  useEffect(() => { loadSubs(); setSubId(""); }, [loadSubs]);
  useEffect(() => { loadServices(); }, [loadServices]);

  const blank = {
    category_id: catId,
    sub_category_id: subId || null,
    title: "",
    description: "",
    starting_price: 0,
    duration_mins: 30,
    rating: 4.7,
    review_count: 0,
    image: "",
    popular: false,
    top_rated: false,
    recommended: false,
    is_active: true,
    sort_order: rows.length + 1,
  };

  const onSave = async () => {
    try {
      if (!editing?.title?.trim()) return notify("Missing", "Title required");
      const body = { ...editing, category_id: catId };
      if (!body.sub_category_id) delete body.sub_category_id;
      if (editing.id) await http("PATCH", `/services/${editing.id}`, body);
      else await http("POST", "/services", body);
      setEditing(null); await loadServices();
    } catch (e: any) { notify("Failed", e.message); }
  };
  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete service?", ""))) return;
    await http("DELETE", `/services/${id}`); await loadServices();
  };

  return (
    <View style={{ gap: 12 }}>
      <CategoryDropdown categories={categories} value={catId} onChange={setCatId} />
      {/* sub-category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <TouchableOpacity onPress={() => setSubId("")} style={[chipStyles.chip, !subId && chipStyles.chipActive]}>
          <Text style={[chipStyles.chipTxt, !subId && { color: "#fff" }]}>All</Text>
        </TouchableOpacity>
        {subs.map((s) => (
          <TouchableOpacity key={s.id} onPress={() => setSubId(s.id)} style={[chipStyles.chip, subId === s.id && chipStyles.chipActive]}>
            <Text style={[chipStyles.chipTxt, subId === s.id && { color: "#fff" }]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
        <Plus size={16} color="#fff" /><Text style={btn.addTxt}>Add service</Text>
      </TouchableOpacity>
      {rows.map((s) => (
        <View key={s.id} style={row.card}>
          {s.image ? <Image source={{ uri: s.image }} style={row.thumb} /> : <View style={[row.thumb, { backgroundColor: "#eee" }]} />}
          <View style={{ flex: 1 }}>
            <Text style={row.title}>{s.title}</Text>
            <Text style={row.sub}>₹{s.starting_price} · {s.duration_mins}m · ⭐ {s.rating}</Text>
          </View>
          <Switch value={!!s.is_active} onValueChange={async (v) => { await http("PATCH", `/services/${s.id}`, { category_id: catId, title: s.title, is_active: v }); loadServices(); }} />
          <TouchableOpacity onPress={() => setEditing({ ...s, sub_category_id: s.sub_category_id || subId || null })} style={row.iconBtn}><Edit3 size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(s.id)} style={row.iconBtn}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
        </View>
      ))}
      <EditModal visible={!!editing} title={editing?.id ? "Edit service" : "New service"} onClose={() => setEditing(null)} onSave={onSave}>
        {editing && (
          <>
            <Field label="Title" value={editing.title} onChange={(v: string) => setEditing({ ...editing, title: v })} placeholder="e.g. Gold facial" />
            <Field label="Description" value={editing.description} onChange={(v: string) => setEditing({ ...editing, description: v })} multiline />
            <View style={{ gap: 6 }}>
              <Text style={fieldStyles.label}>Sub-category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                <TouchableOpacity onPress={() => setEditing({ ...editing, sub_category_id: null })} style={[chipStyles.chip, !editing.sub_category_id && chipStyles.chipActive]}>
                  <Text style={[chipStyles.chipTxt, !editing.sub_category_id && { color: "#fff" }]}>(none)</Text>
                </TouchableOpacity>
                {subs.map((s) => (
                  <TouchableOpacity key={s.id} onPress={() => setEditing({ ...editing, sub_category_id: s.id })} style={[chipStyles.chip, editing.sub_category_id === s.id && chipStyles.chipActive]}>
                    <Text style={[chipStyles.chipTxt, editing.sub_category_id === s.id && { color: "#fff" }]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Field label="Starting price (₹)" value={editing.starting_price} onChange={(v: string) => setEditing({ ...editing, starting_price: Number(v) || 0 })} keyboardType="decimal-pad" />
            <Field label="Duration (mins)" value={editing.duration_mins} onChange={(v: string) => setEditing({ ...editing, duration_mins: Number(v) || 0 })} keyboardType="number-pad" />
            <Field label="Rating" value={editing.rating} onChange={(v: string) => setEditing({ ...editing, rating: Number(v) || 0 })} keyboardType="decimal-pad" />
            <Field label="Review count" value={editing.review_count} onChange={(v: string) => setEditing({ ...editing, review_count: Number(v) || 0 })} keyboardType="number-pad" />
            <MediaPicker value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} label="Service image" />
            <ToggleRow label="Popular (home screen)" value={!!editing.popular} onChange={(v) => setEditing({ ...editing, popular: v })} />
            <ToggleRow label="Top rated" value={!!editing.top_rated} onChange={(v) => setEditing({ ...editing, top_rated: v })} />
            <ToggleRow label="Recommended" value={!!editing.recommended} onChange={(v) => setEditing({ ...editing, recommended: v })} />
            <Field label="Sort order" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })} keyboardType="number-pad" />
            <ToggleRow label="Active" value={!!editing.is_active} onChange={(v) => setEditing({ ...editing, is_active: v })} />
          </>
        )}
      </EditModal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Edit modal wrapper
// ─────────────────────────────────────────────────────────────────────
function EditModal({ visible, title, onClose, onSave, children }: any) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheetLarge}>
            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={row.iconBtn}>
                <X size={20} color={colors.textMain} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>{children}</ScrollView>
            <View style={modalStyles.sheetFooter}>
              <TouchableOpacity style={btn.cancel} onPress={onClose}>
                <Text style={btn.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={btn.save} onPress={onSave}>
                <Save size={16} color="#fff" />
                <Text style={btn.saveTxt}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  HOME TAB  —  Manage home-screen sections (Popular / Top Rated / Recommended)
// ─────────────────────────────────────────────────────────────────────
type HomeSection = "popular" | "top_rated" | "recommended";
const SECTION_META: Record<HomeSection, { title: string; sub: string }> = {
  popular:     { title: "Popular services",      sub: "Most-booked, shown on home" },
  top_rated:   { title: "Top rated services",    sub: "Hand-picked premium picks" },
  recommended: { title: "Recommended for you",   sub: "Curated daily picks" },
};

function HomeTab() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerSection, setPickerSection] = useState<HomeSection | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await http<any[]>("GET", "/services");
      setServices(data || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const inSection = (s: any, section: HomeSection) => {
    if (section === "popular") return !!s.popular;
    if (section === "top_rated") return !!s.top_rated;
    return !!s.recommended;
  };

  const sortedFor = (section: HomeSection) =>
    services
      .filter((s) => inSection(s, section) && s.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  const toggleSection = async (svc: any, section: HomeSection, on: boolean) => {
    const body: any = { category_id: svc.category_id, title: svc.title };
    if (section === "popular") body.popular = on;
    if (section === "top_rated") body.top_rated = on;
    if (section === "recommended") body.recommended = on;
    await http("PATCH", `/services/${svc.id}`, body);
    await load();
  };

  const setSort = async (svc: any, sort: number) => {
    await http("PATCH", `/services/${svc.id}`, {
      category_id: svc.category_id, title: svc.title, sort_order: sort,
    });
    await load();
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 32 }} />;

  return (
    <View style={{ gap: 18 }}>
      <View style={{ padding: 12, backgroundColor: "#FEF9C3", borderRadius: 10 }}>
        <Text style={{ fontSize: 13, color: "#854D0E", fontWeight: "600" }}>
          Tip: Toggle Popular / Top Rated / Recommended below to control what shows on the home screen.
          Lower sort order = appears first.
        </Text>
      </View>

      {(["popular", "top_rated", "recommended"] as HomeSection[]).map((section) => {
        const items = sortedFor(section);
        return (
          <View key={section} style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textMain }}>
                  {SECTION_META[section].title}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSubtle }}>
                  {SECTION_META[section].sub} · {items.length} {items.length === 1 ? "item" : "items"}
                </Text>
              </View>
              <TouchableOpacity style={btn.add} onPress={() => { setPickerSection(section); setSearch(""); }}>
                <Plus size={14} color="#fff" />
                <Text style={[btn.addTxt, { fontSize: 12 }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: colors.textSubtle }}>No services here yet. Tap “Add” to pick from your catalog.</Text>
              </View>
            ) : items.map((s) => (
              <View key={s.id} style={row.card}>
                {s.image ? <Image source={{ uri: s.image }} style={row.thumb} /> : <View style={[row.thumb, { backgroundColor: "#eee" }]} />}
                <View style={{ flex: 1 }}>
                  <Text style={row.title} numberOfLines={1}>{s.title}</Text>
                  <Text style={row.sub}>₹{s.starting_price} · ⭐ {s.rating}</Text>
                </View>
                <TextInput
                  value={String(s.sort_order ?? 0)}
                  onChangeText={(v) => setSort(s, Number(v) || 0)}
                  keyboardType="number-pad"
                  style={{
                    width: 50, paddingHorizontal: 8, paddingVertical: 6,
                    borderWidth: 1, borderColor: colors.border, borderRadius: 6, textAlign: "center", color: colors.textMain,
                  }}
                />
                <TouchableOpacity onPress={() => toggleSection(s, section, false)} style={row.iconBtn}>
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}

      {/* Picker modal — pick services to add to a section */}
      <Modal visible={pickerSection !== null} transparent animationType="slide" onRequestClose={() => setPickerSection(null)}>
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheetLarge}>
            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>
                Add to {pickerSection ? SECTION_META[pickerSection].title : ""}
              </Text>
              <TouchableOpacity onPress={() => setPickerSection(null)} style={row.iconBtn}>
                <X size={20} color={colors.textMain} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 12 }}>
              <TextInput
                style={fieldStyles.input}
                placeholder="Search services…"
                placeholderTextColor={colors.textSubtle}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 24 }}>
              {services
                .filter((s) => {
                  if (!pickerSection) return false;
                  if (inSection(s, pickerSection)) return false;
                  if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
                  return true;
                })
                .map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={row.card}
                    onPress={async () => {
                      if (pickerSection) await toggleSection(s, pickerSection, true);
                      setPickerSection(null);
                    }}
                  >
                    {s.image ? <Image source={{ uri: s.image }} style={row.thumb} /> : <View style={[row.thumb, { backgroundColor: "#eee" }]} />}
                    <View style={{ flex: 1 }}>
                      <Text style={row.title} numberOfLines={1}>{s.title}</Text>
                      <Text style={row.sub}>₹{s.starting_price} · {s.category_id}</Text>
                    </View>
                    <Plus size={18} color={colors.primary} />
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────────────────────────────
export default function AdminCMS() {
  const router = useRouter();
  const { isAdmin, isLoading } = useSession();
  const [tab, setTab] = useState<TabKey>("home");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await http<any[]>("GET", "/categories");
      setCategories(data || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  if (isLoading) return null;
  if (!isAdmin) {
    return (
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.error }}>Admin only</Text>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: radius.md }}
          >
            <Text style={btn.saveTxt}>Go home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: "home",          label: "Home",       icon: Megaphone },
    { key: "categories",    label: "Categories", icon: Layers },
    { key: "subcategories", label: "Sub-cats",   icon: Layers },
    { key: "banners",       label: "Banners",    icon: ImgIcon },
    { key: "promos",        label: "Promos",     icon: Megaphone },
    { key: "services",      label: "Services",   icon: Layers },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={row.iconBtn}>
          <ArrowLeft size={20} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>CMS</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[s.tab, tab === t.key && s.tabActive]}>
            <t.icon size={14} color={tab === t.key ? "#fff" : colors.textMain} />
            <Text style={[s.tabTxt, tab === t.key && { color: "#fff" }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <>
            {tab === "home"           && <HomeTab />}
            {tab === "categories"    && <CategoriesTab categories={categories} reload={reload} />}
            {tab === "subcategories" && <SubCategoriesTab categories={categories} />}
            {tab === "banners"       && <BannersTab categories={categories} />}
            {tab === "promos"        && <PromosTab categories={categories} />}
            {tab === "services"      && <ServicesTab categories={categories} />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.textMain },
  tabBar: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: "#fff" },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F3F4F6" },
  tabActive: { backgroundColor: colors.primary },
  tabTxt: { fontSize: 13, fontWeight: "600", color: colors.textMain },
});

const row = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10, borderRadius: radius.md,
    backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border,
  },
  thumb: { width: 50, height: 50, borderRadius: 8, backgroundColor: "#F3F4F6" },
  title: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  sub: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  subDim: { fontSize: 11, color: colors.textSubtle, marginTop: 2 },
  iconBtn: { padding: 6 },
});

const btn = StyleSheet.create({
  add: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: radius.md },
  addTxt: { color: "#fff", fontWeight: "700" },
  save: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.md, flex: 1 },
  saveTxt: { color: "#fff", fontWeight: "700" },
  cancel: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.md, backgroundColor: "#F3F4F6", flex: 1, alignItems: "center" },
  cancelTxt: { color: colors.textMain, fontWeight: "600" },
});

const fieldStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textMain,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  dropdownBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 12 },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  sheetLarge: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "92%" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  sheetFooter: { flexDirection: "row", padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: "#fff" },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
});

const chipStyles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F3F4F6" },
  chipActive: { backgroundColor: colors.primary },
  chipTxt: { fontSize: 12, fontWeight: "600", color: colors.textMain },
});

const mediaStyles = StyleSheet.create({
  preview: { position: "relative", alignSelf: "flex-start" },
  previewImg: { width: 140, height: 100, borderRadius: 8, backgroundColor: "#eee" },
  videoTile: { width: 140, height: 100, borderRadius: 8, backgroundColor: "#111", alignItems: "center", justifyContent: "center", gap: 4 },
  videoLabel: { fontSize: 10, color: "#fff" },
  previewClear: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, padding: 4 },
  uploadBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.textMain, borderRadius: radius.md, alignSelf: "flex-start" },
  uploadTxt: { color: "#fff", fontWeight: "600", fontSize: 12 },
});
