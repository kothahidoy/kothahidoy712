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
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
  Zap,
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

type TabKey = "welcome" | "instahelp" | "home" | "categories" | "subcategories" | "banners" | "promos" | "services" | "cover" | "ratecard";

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
  const ext = (asset.fileName || asset.uri).split(".").pop()?.toLowerCase().split("?")[0] || "jpg";
  const isVideo = asset.type === "video" || ["mp4", "mov", "webm", "m4v", "mkv"].includes(ext);
  const mimeType = isVideo
    ? `video/${ext === "mov" ? "quicktime" : ext}`
    : `image/${ext === "jpg" ? "jpeg" : ext}`;
  const fileName = asset.fileName || `upload-${Date.now()}.${ext}`;

  if (Platform.OS === "web") {
    // On WEB: convert the blob: / data: URI returned by expo-image-picker
    // into a real Blob/File so the multipart form is a proper file part
    // (not "[object Object]" which FastAPI rejects with 422).
    const resp = await fetch(asset.uri);
    const blob = await resp.blob();
    const file =
      typeof File !== "undefined"
        ? new File([blob], fileName, { type: blob.type || mimeType })
        : blob;
    form.append("file", file as any, fileName);
  } else {
    // NATIVE (iOS / Android): React Native's FormData accepts this shape.
    // @ts-ignore React Native FormData file shape
    form.append("file", {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    });
  }

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
  mediaType,
}: {
  value?: string | null;
  onChange: (url: string) => void;
  acceptVideo?: boolean;
  label?: string;
  mediaType?: "image" | "video";
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

  // Robust video detection: explicit mediaType prop (most reliable) OR URL
  // path ends with a video extension — strips query strings and fragments first.
  const detectIsVideo = (raw: string) => {
    if (!raw) return false;
    if (mediaType === "video") return true;
    if (mediaType === "image") return false;
    // Strip query and fragment, then check extension on the path
    const path = raw.split("?")[0].split("#")[0].toLowerCase();
    return /\.(mp4|mov|webm|m4v|mkv|avi|3gp|hevc|m3u8)$/i.test(path);
  };
  const trimmed = (value || "").trim();
  const isVideo = detectIsVideo(trimmed);
  // Treat the value as valid for preview if it looks like a URL or data URI
  const looksLikeUrl = /^(https?:\/\/|data:|file:)/i.test(trimmed);

  return (
    <View style={{ gap: 8 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {trimmed && looksLikeUrl ? (
        <View style={mediaStyles.preview}>
          {isVideo ? (
            <View style={mediaStyles.videoTile}>
              <Video size={32} color="#fff" />
              <Text style={mediaStyles.videoLabel} numberOfLines={2}>
                Video linked ✓
              </Text>
              <Text style={[mediaStyles.videoLabel, { fontSize: 9, opacity: 0.8 }]} numberOfLines={1}>
                {trimmed.length > 38 ? trimmed.slice(0, 38) + "…" : trimmed}
              </Text>
            </View>
          ) : (
            <Image source={{ uri: trimmed }} style={mediaStyles.previewImg} />
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
        placeholder={
          mediaType === "video"
            ? "…or paste DIRECT video URL (must end in .mp4/.mov/.webm — webpage links won't play)"
            : mediaType === "image"
            ? "…or paste image URL"
            : "…or paste image/video URL"
        }
        placeholderTextColor={colors.textSubtle}
        autoCapitalize="none"
        autoCorrect={false}
        value={value || ""}
        onChangeText={(v) => onChange(v.trim())}
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

            {/* ── Visitation fee strip (shown at bottom of category page) ── */}
            <View style={{ paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={[fieldStyles.label, { color: colors.primary, marginBottom: 6 }]}>
                Visitation fee strip (bottom of category page)
              </Text>
              <Field
                label="Strip text"
                value={editing.visitation_fee_label}
                onChange={(v: string) => setEditing({ ...editing, visitation_fee_label: v })}
                placeholder="Get visitation fee off on orders above ₹499"
              />
              <Field
                label="Threshold ₹"
                value={editing.visitation_fee_threshold}
                onChange={(v: string) => setEditing({ ...editing, visitation_fee_threshold: Number(v) || 0 })}
                keyboardType="decimal-pad"
              />
              <ToggleRow
                label="Show visitation fee strip"
                value={editing.visitation_fee_active !== false}
                onChange={(v) => setEditing({ ...editing, visitation_fee_active: v })}
              />
            </View>
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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "600" }}>
          {rows.length} sub-categor{rows.length === 1 ? "y" : "ies"} in this category
        </Text>
        <TouchableOpacity onPress={load}>
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700" }}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
        <Plus size={16} color="#fff" /><Text style={btn.addTxt}>Add sub-category</Text>
      </TouchableOpacity>
      {rows.length === 0 && (
        <View style={{ padding: 24, alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12 }}>
          <Text style={{ color: colors.textMuted }}>No sub-categories yet — tap “Add sub-category” above.</Text>
        </View>
      )}
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
          <Text style={[chipStyles.chipTxt, !subId && { color: "#fff" }]}>All ({rows.length})</Text>
        </TouchableOpacity>
        {subs.map((s) => (
          <TouchableOpacity key={s.id} onPress={() => setSubId(s.id)} style={[chipStyles.chip, subId === s.id && chipStyles.chipActive]}>
            <Text style={[chipStyles.chipTxt, subId === s.id && { color: "#fff" }]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "600" }}>
          {rows.length} service{rows.length === 1 ? "" : "s"}
          {subId ? ` in ${subs.find((s) => s.id === subId)?.name || "selected"}` : " in this category"}
        </Text>
        <TouchableOpacity onPress={loadServices}>
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700" }}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
        <Plus size={16} color="#fff" /><Text style={btn.addTxt}>Add service</Text>
      </TouchableOpacity>
      {rows.length === 0 && (
        <View style={{ padding: 24, alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12 }}>
          <Text style={{ color: colors.textMuted }}>
            No services {subId ? "in this sub-category" : "yet"} — tap “Add service” above.
          </Text>
        </View>
      )}
      {/* When "All" is selected, group services by sub-category with section headers */}
      {!subId && rows.length > 0
        ? (() => {
            const subMap = new Map(subs.map((s: any) => [s.id, s.name]));
            const grouped: Record<string, any[]> = {};
            rows.forEach((s: any) => {
              const key = s.sub_category_id || "_none";
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(s);
            });
            // Render in sub-cat sort order first, then "_none" last
            const orderedKeys = [
              ...subs.map((s: any) => s.id).filter((k: string) => grouped[k]),
              ...(grouped._none ? ["_none"] : []),
            ];
            return orderedKeys.map((key) => (
              <View key={key} style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textMain, marginTop: 8 }}>
                  {key === "_none" ? "Uncategorized" : subMap.get(key) || "Sub-category"}{" "}
                  <Text style={{ color: colors.textMuted, fontWeight: "600" }}>({grouped[key].length})</Text>
                </Text>
                {grouped[key].map((s: any) => (
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
              </View>
            ));
          })()
        : rows.map((s) => (
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
            <Field label="Short description (shown under service card)" value={editing.short_description} onChange={(v: string) => setEditing({ ...editing, short_description: v })} placeholder="e.g. Repair or replacement using existing in-wall wiring" multiline />
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


// ─────────────────────────────────────────────────────────────────────
//  HERO PROMO SLIDES  —  Auto-swipeable carousel on the customer home screen
//  Supports images AND videos (stored in home_promos Supabase table)
// ─────────────────────────────────────────────────────────────────────
function HeroPromosSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await http<any[]>("GET", "/home-promos");
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const blank = {
    title: "Try InstaHelp at just",
    subtitle: "",
    price: "₹79",
    original_price: "₹245",
    discount_label: "68% OFF",
    badge_emoji: "🏷️",
    cta_text: "Book now",
    link_url: "/category/insta-help",
    media_type: "image",
    media_url: "",
    poster_url: "",
    sort_order: rows.length + 1,
    is_active: true,
    show_overlay: true,
  };

  const onSave = async () => {
    try {
      if (!editing?.title?.trim()) return notify("Missing", "Title is required");
      if (!editing?.media_url?.trim()) return notify("Missing", "Upload an image or video");
      const body = { ...editing };
      if (editing.id) await http("PATCH", `/home-promos/${editing.id}`, body);
      else await http("POST", "/home-promos", body);
      setEditing(null);
      await load();
    } catch (e: any) {
      notify("Failed", e.message);
    }
  };

  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete this slide?", "It will disappear from the home screen."))) return;
    await http("DELETE", `/home-promos/${id}`);
    await load();
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textMain }}>
            Hero promo slides
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSubtle }}>
            Auto-swipeable carousel below the search bar · supports images & videos · {rows.length} {rows.length === 1 ? "slide" : "slides"}
          </Text>
        </View>
        <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
          <Plus size={14} color="#fff" />
          <Text style={[btn.addTxt, { fontSize: 12 }]}>Add slide</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : rows.length === 0 ? (
        <View style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.textSubtle }}>No slides yet. Tap &quot;Add slide&quot; to create your first hero carousel slide.</Text>
        </View>
      ) : rows.map((p) => (
        <View key={p.id} style={row.card}>
          {p.media_type === "video" ? (
            <View style={[row.thumb, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
              <PlayCircle size={20} color="#fff" />
            </View>
          ) : (
            <Image source={{ uri: p.media_url || p.poster_url }} style={row.thumb} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={row.title} numberOfLines={1}>{p.title}</Text>
            <Text style={row.sub} numberOfLines={1}>
              #{p.sort_order} · {p.media_type} · {p.price || "no price"}
            </Text>
          </View>
          <Switch
            value={!!p.is_active}
            onValueChange={async (v) => {
              await http("PATCH", `/home-promos/${p.id}`, { title: p.title, media_url: p.media_url, media_type: p.media_type, is_active: v });
              load();
            }}
          />
          <TouchableOpacity onPress={() => setEditing({ ...p })} style={row.iconBtn}>
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(p.id)} style={row.iconBtn}>
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      <EditModal
        visible={!!editing}
        title={editing?.id ? "Edit slide" : "New slide"}
        onClose={() => setEditing(null)}
        onSave={onSave}
      >
        {editing && (
          <>
            <Field
              label="Title (e.g. Try InstaHelp at just)"
              value={editing.title}
              onChange={(v: string) => setEditing({ ...editing, title: v })}
              placeholder="Try InstaHelp at just"
            />
            <Field
              label="Subtitle (optional)"
              value={editing.subtitle}
              onChange={(v: string) => setEditing({ ...editing, subtitle: v })}
              placeholder="Short helper text"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Price (e.g. ₹79)"
                  value={editing.price}
                  onChange={(v: string) => setEditing({ ...editing, price: v })}
                  placeholder="₹79"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Original price (struck out)"
                  value={editing.original_price}
                  onChange={(v: string) => setEditing({ ...editing, original_price: v })}
                  placeholder="₹245"
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Field
                  label="Discount label"
                  value={editing.discount_label}
                  onChange={(v: string) => setEditing({ ...editing, discount_label: v })}
                  placeholder="68% OFF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Badge emoji"
                  value={editing.badge_emoji}
                  onChange={(v: string) => setEditing({ ...editing, badge_emoji: v })}
                  placeholder="🏷️"
                />
              </View>
            </View>
            <Field
              label="CTA button text"
              value={editing.cta_text}
              onChange={(v: string) => setEditing({ ...editing, cta_text: v })}
              placeholder="Book now"
            />
            <Field
              label="Link URL (route or full URL)"
              value={editing.link_url}
              onChange={(v: string) => setEditing({ ...editing, link_url: v })}
              placeholder="/category/insta-help"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setEditing({ ...editing, media_type: "image" })}
                style={[chipStyles.chip, editing.media_type === "image" && chipStyles.chipActive]}
              >
                <ImgIcon size={14} color={editing.media_type === "image" ? "#fff" : colors.textMain} />
                <Text style={[chipStyles.chipTxt, editing.media_type === "image" && { color: "#fff" }]}>Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditing({ ...editing, media_type: "video" })}
                style={[chipStyles.chip, editing.media_type === "video" && chipStyles.chipActive]}
              >
                <Video size={14} color={editing.media_type === "video" ? "#fff" : colors.textMain} />
                <Text style={[chipStyles.chipTxt, editing.media_type === "video" && { color: "#fff" }]}>Video</Text>
              </TouchableOpacity>
            </View>
            <MediaPicker
              value={editing.media_url}
              onChange={(v) => setEditing({ ...editing, media_url: v })}
              acceptVideo
              mediaType={editing.media_type === "video" ? "video" : "image"}
              label={editing.media_type === "video" ? "Video file" : "Image file"}
            />
            {editing.media_type === "video" && (
              <MediaPicker
                value={editing.poster_url}
                onChange={(v) => setEditing({ ...editing, poster_url: v })}
                label="Poster image (thumbnail before video plays)"
              />
            )}
            <Field
              label="Sort order (lower = first)"
              value={editing.sort_order}
              onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })}
              keyboardType="number-pad"
            />
            <ToggleRow
              label="Active (visible on home screen)"
              value={!!editing.is_active}
              onChange={(v) => setEditing({ ...editing, is_active: v })}
            />
            <ToggleRow
              label="Show overlay (title, price, Book button)"
              value={editing.show_overlay !== false}
              onChange={(v) => setEditing({ ...editing, show_overlay: v })}
            />
            <Text style={{ fontSize: 11, color: colors.textSubtle, marginTop: -4 }}>
              Turn this OFF to show only the full image/video without any text/price/Book button on top.
            </Text>
          </>
        )}
      </EditModal>
    </View>
  );
}


function ThoughtfulCurationsSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await http<any[]>("GET", "/home-curations");
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const blank = {
    title: "",
    title_line2: "",
    thumbnail_url: "",
    video_url: "",
    sort_order: rows.length + 1,
    is_active: true,
  };

  const onSave = async () => {
    try {
      if (!editing?.title?.trim()) return notify("Missing", "Title is required");
      if (!editing?.video_url?.trim()) return notify("Missing", "Upload or paste a video");
      if (!editing?.thumbnail_url?.trim()) return notify("Missing", "Upload a thumbnail image");
      const body = { ...editing };
      if (editing.id) await http("PATCH", `/home-curations/${editing.id}`, body);
      else await http("POST", "/home-curations", body);
      setEditing(null);
      await load();
    } catch (e: any) {
      notify("Failed", e.message);
    }
  };

  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete this curation?", "It will disappear from the home screen."))) return;
    await http("DELETE", `/home-curations/${id}`);
    await load();
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textMain }}>
            Thoughtful curations
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSubtle }}>
            Auto-playing video tiles on home · upload video + thumbnail · {rows.length} {rows.length === 1 ? "video" : "videos"}
          </Text>
        </View>
        <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
          <Plus size={14} color="#fff" />
          <Text style={[btn.addTxt, { fontSize: 12 }]}>Add video</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : rows.length === 0 ? (
        <View style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.textSubtle }}>
            No videos yet. Tap &quot;Add video&quot; to upload your first curation.
          </Text>
        </View>
      ) : rows.map((p) => (
        <View key={p.id} style={row.card}>
          {p.thumbnail_url ? (
            <Image source={{ uri: p.thumbnail_url }} style={row.thumb} />
          ) : (
            <View style={[row.thumb, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
              <PlayCircle size={20} color="#fff" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={row.title} numberOfLines={1}>{p.title} {p.title_line2 ? `· ${p.title_line2}` : ""}</Text>
            <Text style={row.sub} numberOfLines={1}>
              #{p.sort_order} · video
            </Text>
          </View>
          <Switch
            value={!!p.is_active}
            onValueChange={async (v) => {
              await http("PATCH", `/home-curations/${p.id}`, {
                title: p.title,
                thumbnail_url: p.thumbnail_url,
                video_url: p.video_url,
                is_active: v,
              });
              load();
            }}
          />
          <TouchableOpacity onPress={() => setEditing({ ...p })} style={row.iconBtn}>
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(p.id)} style={row.iconBtn}>
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      <EditModal
        visible={!!editing}
        title={editing?.id ? "Edit curation" : "New curation"}
        onClose={() => setEditing(null)}
        onSave={onSave}
      >
        {editing && (
          <>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Title (line 1)"
                  value={editing.title}
                  onChange={(v: string) => setEditing({ ...editing, title: v })}
                  placeholder="Roll-on"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Title (line 2, optional)"
                  value={editing.title_line2}
                  onChange={(v: string) => setEditing({ ...editing, title_line2: v })}
                  placeholder="waxing"
                />
              </View>
            </View>
            <MediaPicker
              value={editing.video_url}
              onChange={(v) => setEditing({ ...editing, video_url: v })}
              acceptVideo
              mediaType="video"
              label="Video file (mp4 / mov / webm)"
            />
            <MediaPicker
              value={editing.thumbnail_url}
              onChange={(v) => setEditing({ ...editing, thumbnail_url: v })}
              mediaType="image"
              label="Thumbnail image (shown before video plays)"
            />
            <Field
              label="Sort order (lower = first)"
              value={editing.sort_order}
              onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })}
              keyboardType="number-pad"
            />
            <ToggleRow
              label="Active (visible on home)"
              value={!!editing.is_active}
              onChange={(v) => setEditing({ ...editing, is_active: v })}
            />
          </>
        )}
      </EditModal>
    </View>
  );
}


function CelebratingProsSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<any>({ title: "", subtitle: "", is_active: true });
  const [editingHeader, setEditingHeader] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [data, sec] = await Promise.all([
        http<any[]>("GET", "/celebrating-pros"),
        http<any>("GET", "/celebrating-pros-section"),
      ]);
      setRows(data || []);
      setSection({
        title: sec?.title || "Top rated professionals",
        subtitle: sec?.subtitle || "Trusted by Mfixit",
        is_active: sec?.is_active !== false,
      });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const blank = {
    caption: "",
    thumbnail_url: "",
    video_url: "",
    sort_order: rows.length + 1,
    is_active: true,
  };

  const onSave = async () => {
    try {
      if (!editing?.video_url?.trim()) return notify("Missing", "Upload or paste a video");
      const body = { ...editing };
      if (editing.id) await http("PATCH", `/celebrating-pros/${editing.id}`, body);
      else await http("POST", "/celebrating-pros", body);
      setEditing(null);
      await load();
    } catch (e: any) {
      notify("Failed", e.message);
    }
  };

  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete this video?", "It will disappear from the home screen."))) return;
    await http("DELETE", `/celebrating-pros/${id}`);
    await load();
  };

  const saveHeader = async () => {
    try {
      await http("PATCH", "/celebrating-pros-section", {
        title: section.title?.trim() || "Top rated professionals",
        subtitle: section.subtitle?.trim() || "",
        is_active: section.is_active,
      });
      setEditingHeader(false);
      await load();
    } catch (e: any) {
      notify("Failed", e.message);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textMain }}>
            Celebrating Professionals
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSubtle }}>
            UC-style video rail · header &quot;{section.title}&quot; · {rows.length} {rows.length === 1 ? "video" : "videos"}
          </Text>
        </View>
        <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
          <Plus size={14} color="#fff" />
          <Text style={[btn.addTxt, { fontSize: 12 }]}>Add video</Text>
        </TouchableOpacity>
      </View>

      {/* Section header config card */}
      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 8, backgroundColor: "#fafbff" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMain }}>Section header</Text>
          {editingHeader ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={() => { setEditingHeader(false); load(); }} style={row.iconBtn}>
                <X size={16} color={colors.textSubtle} />
              </TouchableOpacity>
              <TouchableOpacity onPress={saveHeader} style={row.iconBtn}>
                <Save size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingHeader(true)} style={row.iconBtn}>
              <Edit3 size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {editingHeader ? (
          <>
            <Field
              label="Title (e.g. Top rated professionals)"
              value={section.title}
              onChange={(v: string) => setSection({ ...section, title: v })}
              placeholder="Top rated professionals"
            />
            <Field
              label="Subtitle (e.g. Trusted by Mfixit)"
              value={section.subtitle}
              onChange={(v: string) => setSection({ ...section, subtitle: v })}
              placeholder="Trusted by Mfixit"
            />
            <ToggleRow
              label="Show section on home"
              value={!!section.is_active}
              onChange={(v) => setSection({ ...section, is_active: v })}
            />
          </>
        ) : (
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textMain }}>{section.title}</Text>
            {!!section.subtitle && (
              <Text style={{ fontSize: 12, color: colors.textSubtle, marginTop: 2 }}>{section.subtitle}</Text>
            )}
            <Text style={{ fontSize: 10, color: section.is_active ? "#16a34a" : colors.error, marginTop: 4 }}>
              {section.is_active ? "✓ Visible on home" : "Hidden from home"}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : rows.length === 0 ? (
        <View style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.textSubtle }}>
            No videos yet. Tap &quot;Add video&quot; to upload your first one.
          </Text>
        </View>
      ) : rows.map((p) => (
        <View key={p.id} style={row.card}>
          {p.thumbnail_url ? (
            <Image source={{ uri: p.thumbnail_url }} style={row.thumb} />
          ) : (
            <View style={[row.thumb, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
              <PlayCircle size={20} color="#fff" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={row.title} numberOfLines={1}>{p.caption || "(no caption)"}</Text>
            <Text style={row.sub} numberOfLines={1}>
              #{p.sort_order} · video
            </Text>
          </View>
          <Switch
            value={!!p.is_active}
            onValueChange={async (v) => {
              await http("PATCH", `/celebrating-pros/${p.id}`, {
                video_url: p.video_url,
                is_active: v,
              });
              load();
            }}
          />
          <TouchableOpacity onPress={() => setEditing({ ...p })} style={row.iconBtn}>
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(p.id)} style={row.iconBtn}>
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      <EditModal
        visible={!!editing}
        title={editing?.id ? "Edit video" : "New video"}
        onClose={() => setEditing(null)}
        onSave={onSave}
      >
        {editing && (
          <>
            <MediaPicker
              value={editing.video_url}
              onChange={(v) => setEditing({ ...editing, video_url: v })}
              acceptVideo
              mediaType="video"
              label="Video file (mp4 / mov / webm)"
            />
            <MediaPicker
              value={editing.thumbnail_url}
              onChange={(v) => setEditing({ ...editing, thumbnail_url: v })}
              mediaType="image"
              label="Thumbnail image (shown before video plays)"
            />
            <Field
              label="Caption (optional, small overlay text)"
              value={editing.caption}
              onChange={(v: string) => setEditing({ ...editing, caption: v })}
              placeholder="e.g. Priya — Mfixit Beauty Expert"
            />
            <Field
              label="Sort order (lower = first)"
              value={editing.sort_order}
              onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })}
              keyboardType="number-pad"
            />
            <ToggleRow
              label="Active (visible on home)"
              value={!!editing.is_active}
              onChange={(v) => setEditing({ ...editing, is_active: v })}
            />
          </>
        )}
      </EditModal>
    </View>
  );
}



// ─────────────────────────────────────────────────────────────────────
//  WELCOME SCREEN CMS – every text/image/toggle/color of /(auth)/welcome
// ─────────────────────────────────────────────────────────────────────
type WelcomeCfg = {
  hero_image_url: string;
  hero_image_enabled: boolean;

  brand_name: string;
  brand_subtitle: string;
  brand_badge_enabled: boolean;

  title_text: string;
  title_color: string;
  title_enabled: boolean;

  subtitle_text: string;
  subtitle_color: string;
  subtitle_enabled: boolean;

  description_text: string;
  description_color: string;
  description_enabled: boolean;

  trust_1_text: string;
  trust_1_enabled: boolean;
  trust_2_text: string;
  trust_2_enabled: boolean;
  trust_3_text: string;
  trust_3_enabled: boolean;
  trust_text_color: string;

  sit_back_text: string;
  sit_back_color: string;
  sit_back_enabled: boolean;

  google_btn_label: string;
  google_btn_enabled: boolean;

  phone_btn_label: string;
  phone_btn_enabled: boolean;

  email_btn_label: string;
  email_btn_enabled: boolean;

  explore_btn_label: string;
  explore_btn_color: string;
  explore_btn_enabled: boolean;

  provider_btn_label: string;
  provider_btn_enabled: boolean;
};

const WELCOME_DEFAULT: WelcomeCfg = {
  hero_image_url: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
  hero_image_enabled: true,
  brand_name: "Mfixit",
  brand_subtitle: "Verified pros · 24×7",
  brand_badge_enabled: true,
  title_text: "AC, Plumbing, Cleaning\nFixed in 30 Minutes",
  title_color: "#FFFFFF",
  title_enabled: true,
  subtitle_text: "Same-day service. No hidden charges.",
  subtitle_color: "#2563EB",
  subtitle_enabled: true,
  description_text: "Book a verified pro in 60 seconds — trusted by your neighbors.",
  description_color: "#CBD5E1",
  description_enabled: true,
  trust_1_text: "10,000+ happy homes in Durgapur",
  trust_1_enabled: true,
  trust_2_text: "4.8 average rating",
  trust_2_enabled: true,
  trust_3_text: "30-day service warranty",
  trust_3_enabled: true,
  trust_text_color: "#FFFFFF",
  sit_back_text: "Sit back, we'll take care of it 👍",
  sit_back_color: "#2563EB",
  sit_back_enabled: true,
  google_btn_label: "Continue with Google",
  google_btn_enabled: true,
  phone_btn_label: "Continue with Phone",
  phone_btn_enabled: true,
  email_btn_label: "Continue with Email",
  email_btn_enabled: true,
  explore_btn_label: "Explore services without signing in",
  explore_btn_color: "#2563EB",
  explore_btn_enabled: true,
  provider_btn_label: "Provider Login",
  provider_btn_enabled: true,
};

const COLOR_PRESETS = [
  "#FFFFFF", "#0F172A", "#1E293B", "#2563EB", "#3B82F6",
  "#60A5FA", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6",
  "#CBD5E1", "#94A3B8", "#E11D48", "#0EA5E9", "#22C55E",
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View
          style={{
            width: 40, height: 40, borderRadius: 8,
            backgroundColor: value || "#000",
            borderWidth: 1, borderColor: colors.border,
          }}
        />
        <TextInput
          style={[fieldStyles.input, { flex: 1 }]}
          placeholder="#RRGGBB"
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="characters"
          autoCorrect={false}
          value={value || ""}
          onChangeText={(v) => onChange(v.trim())}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
        {COLOR_PRESETS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => onChange(c)}
            style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: c,
              borderWidth: value?.toUpperCase() === c ? 3 : 1,
              borderColor: value?.toUpperCase() === c ? colors.primary : colors.border,
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.textMain }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 11, color: colors.textSubtle }}>{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function WelcomeTab() {
  const [cfg, setCfg] = useState<WelcomeCfg>(WELCOME_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await http<WelcomeCfg>("GET", "/welcome-screen");
      setCfg({ ...WELCOME_DEFAULT, ...(data || {}) });
    } catch (e: any) {
      notify("Load failed", e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof WelcomeCfg>(key: K, value: WelcomeCfg[K]) =>
    setCfg((p) => ({ ...p, [key]: value }));

  const save = async () => {
    try {
      setSaving(true);
      await http("PUT", "/welcome-screen", cfg);
      notify("Saved", "Welcome screen updated. Reopen the app / refresh to see changes.");
    } catch (e: any) {
      notify("Save failed", e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    const ok = await confirmAsync("Reset Welcome screen?", "This will restore all default text, colors and toggles. You'll still need to press Save.");
    if (!ok) return;
    setCfg(WELCOME_DEFAULT);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 32 }} />;

  return (
    <View style={{ gap: 14 }}>
      <View style={{ padding: 12, backgroundColor: "#EFF6FF", borderRadius: 10, borderWidth: 1, borderColor: "#BFDBFE" }}>
        <Text style={{ fontSize: 13, color: "#1E3A8A", fontWeight: "700", marginBottom: 4 }}>
          Welcome screen editor
        </Text>
        <Text style={{ fontSize: 12, color: "#1E40AF", lineHeight: 17 }}>
          Toggle any section on/off, edit text, change colors and swap the hero image.
          Save to publish — customers see the update on next app open / refresh.
        </Text>
      </View>

      {/* ─── Hero banner image ───────────────────────────────── */}
      <SectionCard title="Hero banner image" subtitle="Big background photo behind the title.">
        <ToggleRow label="Show hero image" value={cfg.hero_image_enabled} onChange={(v) => set("hero_image_enabled", v)} />
        <MediaPicker
          label="Image"
          value={cfg.hero_image_url}
          onChange={(u) => set("hero_image_url", u)}
          mediaType="image"
        />
      </SectionCard>

      {/* ─── Brand badge ─────────────────────────────────────── */}
      <SectionCard title="Brand badge" subtitle="Top-left pill: name + subtitle.">
        <ToggleRow label="Show brand badge" value={cfg.brand_badge_enabled} onChange={(v) => set("brand_badge_enabled", v)} />
        <Field label="Brand name" value={cfg.brand_name} onChange={(v: string) => set("brand_name", v)} />
        <Field label="Brand subtitle" value={cfg.brand_subtitle} onChange={(v: string) => set("brand_subtitle", v)} />
      </SectionCard>

      {/* ─── Title ───────────────────────────────────────────── */}
      <SectionCard title="Main title" subtitle="Big headline. Use \n for line breaks.">
        <ToggleRow label="Show title" value={cfg.title_enabled} onChange={(v) => set("title_enabled", v)} />
        <Field label="Title text" value={cfg.title_text} onChange={(v: string) => set("title_text", v)} multiline />
        <ColorField label="Title color" value={cfg.title_color} onChange={(v) => set("title_color", v)} />
      </SectionCard>

      {/* ─── Subtitle (blue line) ───────────────────────────── */}
      <SectionCard title="Subtitle" subtitle="The one-liner under the title.">
        <ToggleRow label="Show subtitle" value={cfg.subtitle_enabled} onChange={(v) => set("subtitle_enabled", v)} />
        <Field label="Subtitle text" value={cfg.subtitle_text} onChange={(v: string) => set("subtitle_text", v)} />
        <ColorField label="Subtitle color" value={cfg.subtitle_color} onChange={(v) => set("subtitle_color", v)} />
      </SectionCard>

      {/* ─── Description ────────────────────────────────────── */}
      <SectionCard title="Description" subtitle="Grey descriptive paragraph.">
        <ToggleRow label="Show description" value={cfg.description_enabled} onChange={(v) => set("description_enabled", v)} />
        <Field label="Description text" value={cfg.description_text} onChange={(v: string) => set("description_text", v)} multiline />
        <ColorField label="Description color" value={cfg.description_color} onChange={(v) => set("description_color", v)} />
      </SectionCard>

      {/* ─── Trust items ────────────────────────────────────── */}
      <SectionCard title="Trust badges" subtitle="Up to 3 bullet points with icons.">
        <ToggleRow label="Show badge #1" value={cfg.trust_1_enabled} onChange={(v) => set("trust_1_enabled", v)} />
        <Field label="Badge #1 text" value={cfg.trust_1_text} onChange={(v: string) => set("trust_1_text", v)} />
        <ToggleRow label="Show badge #2" value={cfg.trust_2_enabled} onChange={(v) => set("trust_2_enabled", v)} />
        <Field label="Badge #2 text" value={cfg.trust_2_text} onChange={(v: string) => set("trust_2_text", v)} />
        <ToggleRow label="Show badge #3" value={cfg.trust_3_enabled} onChange={(v) => set("trust_3_enabled", v)} />
        <Field label="Badge #3 text" value={cfg.trust_3_text} onChange={(v: string) => set("trust_3_text", v)} />
        <ColorField label="Badge text color" value={cfg.trust_text_color} onChange={(v) => set("trust_text_color", v)} />
      </SectionCard>

      {/* ─── Sit back banner ────────────────────────────────── */}
      <SectionCard title='"Sit back" banner' subtitle="Blue banner just above the buttons.">
        <ToggleRow label="Show sit-back banner" value={cfg.sit_back_enabled} onChange={(v) => set("sit_back_enabled", v)} />
        <Field label="Banner text" value={cfg.sit_back_text} onChange={(v: string) => set("sit_back_text", v)} />
        <ColorField label="Banner text color" value={cfg.sit_back_color} onChange={(v) => set("sit_back_color", v)} />
      </SectionCard>

      {/* ─── Google button ──────────────────────────────────── */}
      <SectionCard title="Continue with Google" subtitle="Enable to show the Google sign-in button.">
        <ToggleRow label="Show Google button" value={cfg.google_btn_enabled} onChange={(v) => set("google_btn_enabled", v)} />
        <Field label="Button label" value={cfg.google_btn_label} onChange={(v: string) => set("google_btn_label", v)} />
      </SectionCard>

      {/* ─── Phone button ───────────────────────────────────── */}
      <SectionCard title="Continue with Phone" subtitle="Enable to show phone OTP sign-in.">
        <ToggleRow label="Show Phone button" value={cfg.phone_btn_enabled} onChange={(v) => set("phone_btn_enabled", v)} />
        <Field label="Button label" value={cfg.phone_btn_label} onChange={(v: string) => set("phone_btn_label", v)} />
      </SectionCard>

      {/* ─── Email button ───────────────────────────────────── */}
      <SectionCard title="Continue with Email" subtitle="Enable to show email sign-in.">
        <ToggleRow label="Show Email button" value={cfg.email_btn_enabled} onChange={(v) => set("email_btn_enabled", v)} />
        <Field label="Button label" value={cfg.email_btn_label} onChange={(v: string) => set("email_btn_label", v)} />
      </SectionCard>

      {/* ─── Explore without signing in ─────────────────────── */}
      <SectionCard title='"Explore without signing in"' subtitle="Skip-to-app link.">
        <ToggleRow label="Show explore link" value={cfg.explore_btn_enabled} onChange={(v) => set("explore_btn_enabled", v)} />
        <Field label="Link label" value={cfg.explore_btn_label} onChange={(v: string) => set("explore_btn_label", v)} />
        <ColorField label="Link color" value={cfg.explore_btn_color} onChange={(v) => set("explore_btn_color", v)} />
      </SectionCard>

      {/* ─── Provider login ─────────────────────────────────── */}
      <SectionCard title="Provider login" subtitle="Dark button at the bottom (for service providers).">
        <ToggleRow label="Show Provider Login" value={cfg.provider_btn_enabled} onChange={(v) => set("provider_btn_enabled", v)} />
        <Field label="Button label" value={cfg.provider_btn_label} onChange={(v: string) => set("provider_btn_label", v)} />
      </SectionCard>

      {/* ─── Save / Reset row ───────────────────────────────── */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
        <TouchableOpacity style={btn.cancel} onPress={resetToDefaults} disabled={saving}>
          <Text style={btn.cancelTxt}>Reset defaults</Text>
        </TouchableOpacity>
        <TouchableOpacity style={btn.save} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Save size={16} color="#fff" />}
          <Text style={btn.saveTxt}>{saving ? "Saving…" : "Save welcome screen"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  INSTAHELP SCREEN CMS – complete editor for /category/insta-help
// ─────────────────────────────────────────────────────────────────────
type IH_TimeSlot = { id: string; duration: string; price: number; original_price: number; discount: string; enabled: boolean };
type IH_TaskCategory = { id: string; name: string; image: string; inclusions: string[]; exclusions: string[]; enabled: boolean };
type IH_TimeEstimate = { id: string; icon: string; title: string; subtitle: string; time: string; enabled: boolean };
type IH_FAQ = { id: string; question: string; answer: string; enabled: boolean };

type InstaHelpCfg = {
  title: string; rating_text: string; header_enabled: boolean;
  time_slots_enabled: boolean; time_slots: IH_TimeSlot[];
  earliest_slot_enabled: boolean; earliest_slot_text: string;
  super_saver_enabled: boolean; super_saver_badge: string; super_saver_title: string;
  super_saver_price: string; super_saver_validity: string; super_saver_cta: string;
  super_saver_pack_label: string; super_saver_bg_color: string;
  task_categories_enabled: boolean; task_categories_title: string;
  task_categories_note_enabled: boolean; task_categories_note: string;
  task_categories: IH_TaskCategory[];
  time_estimates_enabled: boolean; time_estimates_title: string; time_estimates_note: string;
  time_estimates: IH_TimeEstimate[];
  exclusions_enabled: boolean; exclusions_title: string; excluded_items: string[];
  cover_enabled: boolean; cover_title: string; cover_description: string;
  faq_enabled: boolean; faq_title: string; faqs: IH_FAQ[];
};

const genId = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function TextArrayEditor({
  items,
  onChange,
  placeholder = "Add item…",
  addLabel = "+ Add",
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((it, idx) => (
        <View key={idx} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput
            style={[fieldStyles.input, { flex: 1 }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textSubtle}
            value={it}
            onChangeText={(v) => {
              const copy = [...items];
              copy[idx] = v;
              onChange(copy);
            }}
          />
          <TouchableOpacity
            onPress={() => onChange(items.filter((_, i) => i !== idx))}
            style={{ padding: 8, backgroundColor: "#FEE2E2", borderRadius: 8 }}
          >
            <Trash2 size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={{ paddingVertical: 10, alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 8 }}
        onPress={() => onChange([...items, ""])}
      >
        <Text style={{ color: colors.textMain, fontWeight: "600" }}>{addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function InstaHelpTab() {
  const [cfg, setCfg] = useState<InstaHelpCfg | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await http<InstaHelpCfg>("GET", "/instahelp");
      setCfg(data);
    } catch (e: any) {
      notify("Load failed", e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof InstaHelpCfg>(key: K, value: InstaHelpCfg[K]) => {
    setCfg((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const save = async () => {
    if (!cfg) return;
    try {
      setSaving(true);
      await http("PUT", "/instahelp", cfg);
      notify("Saved", "InstaHelp screen updated. Refresh the app to see changes.");
    } catch (e: any) {
      notify("Save failed", e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !cfg) return <ActivityIndicator style={{ marginTop: 32 }} />;

  // ─── Time slot handlers ──────────────────────────────
  const addSlot = () => set("time_slots", [
    ...cfg.time_slots,
    { id: genId(), duration: "New slot", price: 0, original_price: 0, discount: "", enabled: true },
  ]);
  const updateSlot = (idx: number, patch: Partial<IH_TimeSlot>) => {
    const copy = [...cfg.time_slots];
    copy[idx] = { ...copy[idx], ...patch };
    set("time_slots", copy);
  };
  const removeSlot = async (idx: number) => {
    const ok = await confirmAsync("Delete slot?", "This time slot will be removed.");
    if (ok) set("time_slots", cfg.time_slots.filter((_, i) => i !== idx));
  };

  // ─── Task category handlers ──────────────────────────
  const addTask = () => set("task_categories", [
    ...cfg.task_categories,
    { id: genId(), name: "New task", image: "", inclusions: [], exclusions: [], enabled: true },
  ]);
  const updateTask = (idx: number, patch: Partial<IH_TaskCategory>) => {
    const copy = [...cfg.task_categories];
    copy[idx] = { ...copy[idx], ...patch };
    set("task_categories", copy);
  };
  const removeTask = async (idx: number) => {
    const ok = await confirmAsync("Delete task?", `Remove "${cfg.task_categories[idx].name}"?`);
    if (ok) set("task_categories", cfg.task_categories.filter((_, i) => i !== idx));
  };

  // ─── Time estimate handlers ──────────────────────────
  const addEstimate = () => set("time_estimates", [
    ...cfg.time_estimates,
    { id: genId(), icon: "clock", title: "New task", subtitle: "", time: "10 mins", enabled: true },
  ]);
  const updateEstimate = (idx: number, patch: Partial<IH_TimeEstimate>) => {
    const copy = [...cfg.time_estimates];
    copy[idx] = { ...copy[idx], ...patch };
    set("time_estimates", copy);
  };
  const removeEstimate = async (idx: number) => {
    const ok = await confirmAsync("Delete estimate?", "");
    if (ok) set("time_estimates", cfg.time_estimates.filter((_, i) => i !== idx));
  };

  // ─── FAQ handlers ────────────────────────────────────
  const addFAQ = () => set("faqs", [
    ...cfg.faqs,
    { id: genId(), question: "New question?", answer: "New answer.", enabled: true },
  ]);
  const updateFAQ = (idx: number, patch: Partial<IH_FAQ>) => {
    const copy = [...cfg.faqs];
    copy[idx] = { ...copy[idx], ...patch };
    set("faqs", copy);
  };
  const removeFAQ = async (idx: number) => {
    const ok = await confirmAsync("Delete FAQ?", "");
    if (ok) set("faqs", cfg.faqs.filter((_, i) => i !== idx));
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ padding: 12, backgroundColor: "#EFF6FF", borderRadius: 10, borderWidth: 1, borderColor: "#BFDBFE" }}>
        <Text style={{ fontSize: 13, color: "#1E3A8A", fontWeight: "700", marginBottom: 4 }}>
          InstaHelp screen editor
        </Text>
        <Text style={{ fontSize: 12, color: "#1E40AF", lineHeight: 17 }}>
          Toggle each section on/off, edit any text, add/remove time slots,
          task tiles, FAQs, and update the hero task images. Save to publish.
        </Text>
      </View>

      {/* ── Header ─────────────────────────────── */}
      <SectionCard title="Header" subtitle="Page title + rating badge under the hero.">
        <ToggleRow label="Show header" value={cfg.header_enabled} onChange={(v) => set("header_enabled", v)} />
        <Field label="Title" value={cfg.title} onChange={(v: string) => set("title", v)} />
        <Field label="Rating text" value={cfg.rating_text} onChange={(v: string) => set("rating_text", v)} />
      </SectionCard>

      {/* ── Time slots ─────────────────────────── */}
      <SectionCard title="Time slots (1hr / 2hr etc.)" subtitle="Add, edit or delete the horizontal pricing cards.">
        <ToggleRow label="Show time slots" value={cfg.time_slots_enabled} onChange={(v) => set("time_slots_enabled", v)} />
        {cfg.time_slots.map((slot, idx) => (
          <View key={slot.id} style={{ padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", color: colors.textMain }}>{slot.duration || "(no name)"}</Text>
              <TouchableOpacity onPress={() => removeSlot(idx)} style={{ padding: 6, backgroundColor: "#FEE2E2", borderRadius: 8 }}>
                <Trash2 size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
            <ToggleRow label="Enabled" value={slot.enabled} onChange={(v) => updateSlot(idx, { enabled: v })} />
            <Field label="Duration label" value={slot.duration} onChange={(v: string) => updateSlot(idx, { duration: v })} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Field label="Price (rupees)" value={String(slot.price)} keyboardType="number-pad" onChange={(v: string) => updateSlot(idx, { price: parseInt(v || "0", 10) || 0 })} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Original price" value={String(slot.original_price)} keyboardType="number-pad" onChange={(v: string) => updateSlot(idx, { original_price: parseInt(v || "0", 10) || 0 })} />
              </View>
            </View>
            <Field label="Discount badge" value={slot.discount} onChange={(v: string) => updateSlot(idx, { discount: v })} placeholder="e.g. 68% OFF" />
          </View>
        ))}
        <TouchableOpacity style={btn.add} onPress={addSlot}>
          <Plus size={14} color="#fff" />
          <Text style={btn.addTxt}>Add time slot</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* ── Earliest slot text (default OFF) ────── */}
      <SectionCard title='"Earliest available slot" text' subtitle="Optional bar under the pricing cards. OFF by default.">
        <ToggleRow label="Show earliest-slot text" value={cfg.earliest_slot_enabled} onChange={(v) => set("earliest_slot_enabled", v)} />
        <Field label="Text" value={cfg.earliest_slot_text} onChange={(v: string) => set("earliest_slot_text", v)} />
      </SectionCard>

      {/* ── Super Saver Pack ─────────────────────── */}
      <SectionCard title="3-visits Super Saver Pack banner" subtitle="Purple banner promoting the multi-visit pack.">
        <ToggleRow label="Show banner" value={cfg.super_saver_enabled} onChange={(v) => set("super_saver_enabled", v)} />
        <Field label="Badge (top-left, e.g. EXTRA 80% OFF)" value={cfg.super_saver_badge} onChange={(v: string) => set("super_saver_badge", v)} />
        <Field label="Title (e.g. 3-visits pack at rupees 245)" value={cfg.super_saver_title} onChange={(v: string) => set("super_saver_title", v)} />
        <Field label="Price (e.g. rupees 49/visit)" value={cfg.super_saver_price} onChange={(v: string) => set("super_saver_price", v)} />
        <Field label="Validity text" value={cfg.super_saver_validity} onChange={(v: string) => set("super_saver_validity", v)} />
        <Field label="CTA button text" value={cfg.super_saver_cta} onChange={(v: string) => set("super_saver_cta", v)} />
        <Field label="Pack label (right-side, e.g. SUPER SAVER PACK)" value={cfg.super_saver_pack_label} onChange={(v: string) => set("super_saver_pack_label", v)} />
        <ColorField label="Background color" value={cfg.super_saver_bg_color} onChange={(v) => set("super_saver_bg_color", v)} />
      </SectionCard>

      {/* ── Task categories ─────────────────────── */}
      <SectionCard title="One help who can do it all — tiles" subtitle="Grid of tappable tiles. Each opens a modal with inclusions/exclusions.">
        <ToggleRow label="Show section" value={cfg.task_categories_enabled} onChange={(v) => set("task_categories_enabled", v)} />
        <Field label="Section title" value={cfg.task_categories_title} onChange={(v: string) => set("task_categories_title", v)} />
        <ToggleRow label="Show bottom info note" value={cfg.task_categories_note_enabled} onChange={(v) => set("task_categories_note_enabled", v)} />
        <Field label="Info note text" value={cfg.task_categories_note} onChange={(v: string) => set("task_categories_note", v)} />

        {cfg.task_categories.map((task, idx) => (
          <View key={task.id} style={{ padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, gap: 10, backgroundColor: "#FAFAFA" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", color: colors.textMain, flex: 1 }}>{task.name || "(untitled)"}</Text>
              <TouchableOpacity onPress={() => removeTask(idx)} style={{ padding: 6, backgroundColor: "#FEE2E2", borderRadius: 8 }}>
                <Trash2 size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
            <ToggleRow label="Enabled" value={task.enabled} onChange={(v) => updateTask(idx, { enabled: v })} />
            <Field label="Tile name" value={task.name} onChange={(v: string) => updateTask(idx, { name: v })} />
            <MediaPicker
              label="Tile image"
              value={task.image}
              onChange={(u) => updateTask(idx, { image: u })}
              mediaType="image"
            />
            <View>
              <Text style={fieldStyles.label}>Inclusions (shown in modal)</Text>
              <View style={{ height: 6 }} />
              <TextArrayEditor
                items={task.inclusions}
                onChange={(items) => updateTask(idx, { inclusions: items })}
                placeholder="e.g. Crockery & lunch boxes"
                addLabel="+ Add inclusion"
              />
            </View>
            <View>
              <Text style={fieldStyles.label}>Exclusions (shown in modal)</Text>
              <View style={{ height: 6 }} />
              <TextArrayEditor
                items={task.exclusions}
                onChange={(items) => updateTask(idx, { exclusions: items })}
                placeholder="e.g. Hard food stains"
                addLabel="+ Add exclusion"
              />
            </View>
          </View>
        ))}
        <TouchableOpacity style={btn.add} onPress={addTask}>
          <Plus size={14} color="#fff" />
          <Text style={btn.addTxt}>Add task tile</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* ── Time estimates ─────────────────────── */}
      <SectionCard title="How long does it take? — list" subtitle="List of tasks with estimated durations.">
        <ToggleRow label="Show section" value={cfg.time_estimates_enabled} onChange={(v) => set("time_estimates_enabled", v)} />
        <Field label="Section title" value={cfg.time_estimates_title} onChange={(v: string) => set("time_estimates_title", v)} />
        <Field label="Section note" value={cfg.time_estimates_note} onChange={(v: string) => set("time_estimates_note", v)} multiline />
        {cfg.time_estimates.map((est, idx) => (
          <View key={est.id} style={{ padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", color: colors.textMain, flex: 1 }}>{est.title || "(untitled)"}</Text>
              <TouchableOpacity onPress={() => removeEstimate(idx)} style={{ padding: 6, backgroundColor: "#FEE2E2", borderRadius: 8 }}>
                <Trash2 size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
            <ToggleRow label="Enabled" value={est.enabled} onChange={(v) => updateEstimate(idx, { enabled: v })} />
            <Field label="Icon (kitchen | bathroom | mopping | clock)" value={est.icon} onChange={(v: string) => updateEstimate(idx, { icon: v.trim().toLowerCase() })} />
            <Field label="Title" value={est.title} onChange={(v: string) => updateEstimate(idx, { title: v })} />
            <Field label="Subtitle" value={est.subtitle} onChange={(v: string) => updateEstimate(idx, { subtitle: v })} />
            <Field label="Time (e.g. 25 mins)" value={est.time} onChange={(v: string) => updateEstimate(idx, { time: v })} />
          </View>
        ))}
        <TouchableOpacity style={btn.add} onPress={addEstimate}>
          <Plus size={14} color="#fff" />
          <Text style={btn.addTxt}>Add estimate</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* ── Excluded items ─────────────────────── */}
      <SectionCard title="What's excluded — list" subtitle="Bullet list of items NOT included.">
        <ToggleRow label="Show section" value={cfg.exclusions_enabled} onChange={(v) => set("exclusions_enabled", v)} />
        <Field label="Section title" value={cfg.exclusions_title} onChange={(v: string) => set("exclusions_title", v)} />
        <TextArrayEditor
          items={cfg.excluded_items}
          onChange={(items) => set("excluded_items", items)}
          placeholder="e.g. Removal of hard stains"
          addLabel="+ Add excluded item"
        />
      </SectionCard>

      {/* ── Mfixit cover ────────────────────────── */}
      <SectionCard title="Stay stress free with Mfixit cover — card" subtitle="Green shield card with damage cover promise.">
        <ToggleRow label="Show cover card" value={cfg.cover_enabled} onChange={(v) => set("cover_enabled", v)} />
        <Field label="Title" value={cfg.cover_title} onChange={(v: string) => set("cover_title", v)} />
        <Field label="Description" value={cfg.cover_description} onChange={(v: string) => set("cover_description", v)} multiline />
      </SectionCard>

      {/* ── FAQs ────────────────────────────────── */}
      <SectionCard title="Frequently asked questions" subtitle="Accordion list at the bottom of the page.">
        <ToggleRow label="Show FAQ section" value={cfg.faq_enabled} onChange={(v) => set("faq_enabled", v)} />
        <Field label="Section title" value={cfg.faq_title} onChange={(v: string) => set("faq_title", v)} />
        {cfg.faqs.map((f, idx) => (
          <View key={f.id} style={{ padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", color: colors.textMain, flex: 1 }} numberOfLines={1}>
                {f.question || "(no question)"}
              </Text>
              <TouchableOpacity onPress={() => removeFAQ(idx)} style={{ padding: 6, backgroundColor: "#FEE2E2", borderRadius: 8 }}>
                <Trash2 size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
            <ToggleRow label="Enabled" value={f.enabled} onChange={(v) => updateFAQ(idx, { enabled: v })} />
            <Field label="Question" value={f.question} onChange={(v: string) => updateFAQ(idx, { question: v })} multiline />
            <Field label="Answer" value={f.answer} onChange={(v: string) => updateFAQ(idx, { answer: v })} multiline />
          </View>
        ))}
        <TouchableOpacity style={btn.add} onPress={addFAQ}>
          <Plus size={14} color="#fff" />
          <Text style={btn.addTxt}>Add FAQ</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* ── Save row ───────────────────────────── */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
        <TouchableOpacity style={btn.save} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Save size={16} color="#fff" />}
          <Text style={btn.saveTxt}>{saving ? "Saving…" : "Save InstaHelp screen"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


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
      <HeroPromosSection />

      <ThoughtfulCurationsSection />

      <CelebratingProsSection />

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
//  COVER TAB  —  Mfixit Cover page sections per category
// ─────────────────────────────────────────────────────────────────────
const COVER_SECTION_OPTIONS = [
  { key: "warranty", label: "Warranty" },
  { key: "expert",   label: "Expert verified" },
  { key: "rate",     label: "Fixed rate card" },
  { key: "benefits", label: "Benefits" },
  { key: "support",  label: "24/7 Customer support" },
];

function CoverTab({ categories }: any) {
  const [catId, setCatId] = useState<string>(categories[0]?.id || "");
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!catId) return;
    const data = await http<any[]>("GET", `/cover-sections?category_id=${catId}`);
    setRows(data || []);
  }, [catId]);
  useEffect(() => { load(); }, [load]);

  const blank = { category_id: catId, section_key: "warranty", title: "30-day warranty", bullets: [""], sort_order: rows.length + 1, is_active: true };

  const onSave = async () => {
    try {
      if (!editing?.title?.trim()) return notify("Missing", "Title required");
      const body = {
        ...editing,
        category_id: catId,
        bullets: (editing.bullets || []).filter((b: string) => b?.trim()),
      };
      if (editing.id) await http("PATCH", `/cover-sections/${editing.id}`, body);
      else await http("POST", "/cover-sections", body);
      setEditing(null);
      await load();
    } catch (e: any) { notify("Failed", e.message); }
  };
  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete cover section?", ""))) return;
    await http("DELETE", `/cover-sections/${id}`); await load();
  };

  return (
    <View style={{ gap: 12 }}>
      <CategoryDropdown categories={categories} value={catId} onChange={setCatId} />
      <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
        <Plus size={16} color="#fff" /><Text style={btn.addTxt}>Add cover section</Text>
      </TouchableOpacity>
      {rows.map((r) => (
        <View key={r.id} style={row.card}>
          <View style={{ flex: 1 }}>
            <Text style={row.title}>{r.title}</Text>
            <Text style={row.sub}>{r.section_key} · {(r.bullets || []).length} bullets</Text>
          </View>
          <Switch value={!!r.is_active} onValueChange={async (v) => {
            await http("PATCH", `/cover-sections/${r.id}`, { category_id: catId, section_key: r.section_key, title: r.title, is_active: v });
            load();
          }} />
          <TouchableOpacity onPress={() => setEditing({ ...r, bullets: r.bullets || [""] })} style={row.iconBtn}><Edit3 size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(r.id)} style={row.iconBtn}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
        </View>
      ))}
      <EditModal visible={!!editing} title={editing?.id ? "Edit cover section" : "New cover section"} onClose={() => setEditing(null)} onSave={onSave}>
        {editing && (
          <>
            <View style={{ gap: 6 }}>
              <Text style={fieldStyles.label}>Section type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {COVER_SECTION_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.key}
                    style={[chipStyles.chip, editing.section_key === o.key && chipStyles.chipActive]}
                    onPress={() => setEditing({ ...editing, section_key: o.key })}
                  >
                    <Text style={[chipStyles.chipTxt, editing.section_key === o.key && { color: "#fff" }]}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Field label="Section title" value={editing.title} onChange={(v: string) => setEditing({ ...editing, title: v })} placeholder="30-day warranty" />

            <Text style={fieldStyles.label}>Bullets</Text>
            {(editing.bullets || []).map((b: string, i: number) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  style={[fieldStyles.input, { flex: 1 }]}
                  placeholder={`Bullet ${i + 1}`}
                  placeholderTextColor={colors.textSubtle}
                  value={b}
                  onChangeText={(v) => {
                    const next = [...editing.bullets];
                    next[i] = v;
                    setEditing({ ...editing, bullets: next });
                  }}
                />
                <TouchableOpacity
                  onPress={() => setEditing({ ...editing, bullets: editing.bullets.filter((_: any, idx: number) => idx !== i) })}
                  style={row.iconBtn}
                >
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[btn.cancel, { alignSelf: "flex-start", paddingHorizontal: 14 }]}
              onPress={() => setEditing({ ...editing, bullets: [...(editing.bullets || []), ""] })}
            >
              <Text style={btn.cancelTxt}>+ Add bullet</Text>
            </TouchableOpacity>

            <Field label="Sort order" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })} keyboardType="number-pad" />
            <ToggleRow label="Active" value={!!editing.is_active} onChange={(v) => setEditing({ ...editing, is_active: v })} />
          </>
        )}
      </EditModal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  RATE CARD TAB
// ─────────────────────────────────────────────────────────────────────
function RateCardTab({ categories }: any) {
  const [catId, setCatId] = useState<string>(categories[0]?.id || "");
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!catId) return;
    const data = await http<any[]>("GET", `/rate-card?category_id=${catId}`);
    setRows(data || []);
  }, [catId]);
  useEffect(() => { load(); }, [load]);

  const blank = { category_id: catId, service_name: "", sub_label: "", price: 0, price_suffix: "onwards", sort_order: rows.length + 1, is_active: true };

  const onSave = async () => {
    try {
      if (!editing?.service_name?.trim()) return notify("Missing", "Service name required");
      const body = { ...editing, category_id: catId };
      if (editing.id) await http("PATCH", `/rate-card/${editing.id}`, body);
      else await http("POST", "/rate-card", body);
      setEditing(null); await load();
    } catch (e: any) { notify("Failed", e.message); }
  };
  const onDelete = async (id: string) => {
    if (!(await confirmAsync("Delete rate card row?", ""))) return;
    await http("DELETE", `/rate-card/${id}`); await load();
  };

  return (
    <View style={{ gap: 12 }}>
      <CategoryDropdown categories={categories} value={catId} onChange={setCatId} />
      <TouchableOpacity style={btn.add} onPress={() => setEditing(blank)}>
        <Plus size={16} color="#fff" /><Text style={btn.addTxt}>Add rate card row</Text>
      </TouchableOpacity>
      {rows.map((r) => (
        <View key={r.id} style={row.card}>
          <View style={{ flex: 1 }}>
            <Text style={row.title}>{r.service_name}</Text>
            <Text style={row.sub}>{r.sub_label ? `${r.sub_label} · ` : ""}₹{r.price} {r.price_suffix}</Text>
          </View>
          <Switch value={!!r.is_active} onValueChange={async (v) => {
            await http("PATCH", `/rate-card/${r.id}`, { category_id: catId, service_name: r.service_name, is_active: v });
            load();
          }} />
          <TouchableOpacity onPress={() => setEditing({ ...r })} style={row.iconBtn}><Edit3 size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(r.id)} style={row.iconBtn}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
        </View>
      ))}
      <EditModal visible={!!editing} title={editing?.id ? "Edit rate card row" : "New rate card row"} onClose={() => setEditing(null)} onSave={onSave}>
        {editing && (
          <>
            <Field label="Service name" value={editing.service_name} onChange={(v: string) => setEditing({ ...editing, service_name: v })} placeholder="e.g. Switch / socket replacement" />
            <Field label="Sub label (optional)" value={editing.sub_label} onChange={(v: string) => setEditing({ ...editing, sub_label: v })} placeholder="e.g. 1-gang" />
            <Field label="Price ₹" value={editing.price} onChange={(v: string) => setEditing({ ...editing, price: Number(v) || 0 })} keyboardType="decimal-pad" />
            <Field label="Price suffix" value={editing.price_suffix} onChange={(v: string) => setEditing({ ...editing, price_suffix: v })} placeholder="onwards" />
            <Field label="Sort order" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: Number(v) || 0 })} keyboardType="number-pad" />
            <ToggleRow label="Active" value={!!editing.is_active} onChange={(v) => setEditing({ ...editing, is_active: v })} />
          </>
        )}
      </EditModal>
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
    { key: "welcome",       label: "Welcome",    icon: Sparkles },
    { key: "instahelp",     label: "InstaHelp",  icon: Zap },
    { key: "home",          label: "Home",       icon: Megaphone },
    { key: "categories",    label: "Categories", icon: Layers },
    { key: "subcategories", label: "Sub-cats",   icon: Layers },
    { key: "banners",       label: "Banners",    icon: ImgIcon },
    { key: "promos",        label: "Promos",     icon: Megaphone },
    { key: "services",      label: "Services",   icon: Layers },
    { key: "cover",         label: "Cover",      icon: Layers },
    { key: "ratecard",      label: "Rate Card",  icon: Megaphone },
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
            {tab === "welcome"       && <WelcomeTab />}
            {tab === "instahelp"     && <InstaHelpTab />}
            {tab === "home"           && <HomeTab />}
            {tab === "categories"    && <CategoriesTab categories={categories} reload={reload} />}
            {tab === "subcategories" && <SubCategoriesTab categories={categories} />}
            {tab === "banners"       && <BannersTab categories={categories} />}
            {tab === "promos"        && <PromosTab categories={categories} />}
            {tab === "services"      && <ServicesTab categories={categories} />}
            {tab === "cover"         && <CoverTab categories={categories} />}
            {tab === "ratecard"      && <RateCardTab categories={categories} />}
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
