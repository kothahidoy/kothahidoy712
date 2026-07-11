import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { ArrowLeft, Save } from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { notify } from "@/src/utils/dialogs";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

interface ProfileConfig {
  privacy_policy_title: string;
  privacy_policy_body: string;
  terms_title: string;
  terms_body: string;
  support_email: string;
  support_phone: string;
  rate_us_url_android: string;
  rate_us_url_ios: string;
  share_app_message: string;
  show_share_app: boolean;
  show_rate_us: boolean;
  show_refer_earn: boolean;
}

const EMPTY: ProfileConfig = {
  privacy_policy_title: "",
  privacy_policy_body: "",
  terms_title: "",
  terms_body: "",
  support_email: "",
  support_phone: "",
  rate_us_url_android: "",
  rate_us_url_ios: "",
  share_app_message: "",
  show_share_app: true,
  show_rate_us: true,
  show_refer_earn: true,
};

function ToggleRow({
  label,
  sub,
  value,
  onValueChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        placeholder={label}
        placeholderTextColor={colors.textSubtle}
      />
    </View>
  );
}

export default function LegalContentEditor() {
  const router = useRouter();
  const [cfg, setCfg] = useState<ProfileConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/cms/profile-screen`);
        if (res.ok) {
          const data = await res.json();
          setCfg({ ...EMPTY, ...data });
        }
      } catch (e) {
        notify("Couldn't load", "Failed to fetch current content. Showing blank form.");
      }
      setLoading(false);
    })();
  }, []);

  const set = (key: keyof ProfileConfig) => (val: string) => setCfg((prev) => ({ ...prev, [key]: val }));

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/cms/profile-screen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error(await res.text());
      notify("Saved", "Profile content updated. Changes are live immediately.");
    } catch (e: any) {
      notify("Save failed", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal & Profile Content</Text>
        <TouchableOpacity onPress={onSave} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Save size={16} color="#fff" />}
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Field label="Title" value={cfg.privacy_policy_title} onChangeText={set("privacy_policy_title")} />
          <Field
            label="Body text"
            value={cfg.privacy_policy_body}
            onChangeText={set("privacy_policy_body")}
            multiline
          />

          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Field label="Title" value={cfg.terms_title} onChangeText={set("terms_title")} />
          <Field label="Body text" value={cfg.terms_body} onChangeText={set("terms_body")} multiline />

          <Text style={styles.sectionTitle}>Support contact</Text>
          <Field label="Support email" value={cfg.support_email} onChangeText={set("support_email")} />
          <Field label="Support phone" value={cfg.support_phone} onChangeText={set("support_phone")} />

          <Text style={styles.sectionTitle}>Rate us & Share</Text>
          <Field
            label="Google Play Store URL"
            value={cfg.rate_us_url_android}
            onChangeText={set("rate_us_url_android")}
          />
          <Field label="Apple App Store URL" value={cfg.rate_us_url_ios} onChangeText={set("rate_us_url_ios")} />
          <Field
            label="Share-app message"
            value={cfg.share_app_message}
            onChangeText={set("share_app_message")}
            multiline
          />

          <Text style={styles.sectionTitle}>Profile menu visibility</Text>
          <ToggleRow
            label="Share app"
            sub="Shows the 'Share app' row on the customer Profile screen"
            value={cfg.show_share_app}
            onValueChange={(v) => setCfg((prev) => ({ ...prev, show_share_app: v }))}
          />
          <ToggleRow
            label="Rate us"
            sub="Shows the 'Rate us' row on the customer Profile screen"
            value={cfg.show_rate_us}
            onValueChange={(v) => setCfg((prev) => ({ ...prev, show_rate_us: v }))}
          />
          <ToggleRow
            label="Refer & earn"
            sub="Shows the 'Refer & earn' row on the customer Profile screen"
            value={cfg.show_refer_earn}
            onValueChange={(v) => setCfg((prev) => ({ ...prev, show_refer_earn: v }))}
          />

          <TouchableOpacity style={styles.saveBtnLarge} onPress={onSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnLargeText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: colors.textMain, flex: 1, marginLeft: 10 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  scroll: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.primary, marginTop: 14, marginBottom: 10 },
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
  multiline: { minHeight: 120 },
  saveBtnLarge: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnLargeText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: colors.textMain },
  toggleSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
