import React, { useCallback, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Phone, Trash2, UserPlus, Users } from "lucide-react-native";

import { providerService } from "@/src/data/providerService";
import { CATEGORIES } from "@/src/data/seed";
import { Provider } from "@/src/types";
import { colors, radius, shadow } from "@/src/theme";
import { notify, confirmAsync } from "@/src/utils/dialogs";

export default function AddProvider() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [serviceType, setServiceType] = useState(CATEGORIES[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const reload = useCallback(() => {
    setLoadingList(true);
    providerService
      .listAllProviders()
      .then(setProviders)
      .finally(() => setLoadingList(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const phoneDigits = phone.replace(/\D/g, "");
  const aadhaarDigits = aadhaar.replace(/\D/g, "");
  const canSubmit =
    name.trim().length > 1 &&
    phoneDigits.length >= 10 &&
    !!serviceType &&
    (aadhaarDigits.length === 0 || aadhaarDigits.length === 12);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await providerService.createProvider(
        name.trim(),
        phoneDigits,
        serviceType,
        aadhaarDigits,
      );
      if (!res.success) {
        notify("Couldn't add provider", res.error || "Please try again.");
        return;
      }
      notify(
        "Provider added",
        `${name.trim()} can now log in to the provider app using ${phoneDigits}.`,
      );
      setName("");
      setPhone("");
      setAadhaar("");
      reload();
    } catch (e: any) {
      notify("Couldn't add provider", e?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (p: Provider) => {
    const prev = providers;
    setProviders((cur) =>
      cur.map((x) => (x.id === p.id ? { ...x, isAvailable: !x.isAvailable } : x)),
    );
    const res = await providerService.setProviderAvailability(p.id, !p.isAvailable);
    if (!res.success) {
      setProviders(prev);
      notify("Couldn't update", res.error || "Please try again.");
    }
  };

  const onDelete = async (p: Provider) => {
    const ok = await confirmAsync(
      "Remove provider?",
      `${p.name} won't be able to log in anymore. Their past job history stays intact.`,
    );
    if (!ok) return;
    const res = await providerService.deleteProvider(p.id);
    if (!res.success) {
      notify("Couldn't remove", res.error || "Please try again.");
      return;
    }
    reload();
  };

  const categoryName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name || id;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.crumb}>Admin</Text>
          <Text style={styles.title}>Providers · {providers.length}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          data={providers}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={
            <View style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <UserPlus size={18} color={colors.primary} />
                <Text style={styles.formTitle}>Register a new provider</Text>
              </View>
              <Text style={styles.formHint}>
                Once added, they can log in to the Provider app using this phone number
                and an OTP.
              </Text>

              <Text style={styles.label}>Full name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Rakesh Kumar"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Phone number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.label}>Aadhaar number (optional, for KYC)</Text>
              <TextInput
                value={aadhaar}
                onChangeText={setAadhaar}
                placeholder="12-digit Aadhaar number"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={12}
              />
              {aadhaarDigits.length > 0 && aadhaarDigits.length !== 12 && (
                <Text style={styles.errorHint}>Aadhaar number must be exactly 12 digits.</Text>
              )}

              <Text style={styles.label}>Service category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, serviceType === c.id && styles.chipActive]}
                    onPress={() => setServiceType(c.id)}
                  >
                    <Text style={[styles.chipText, serviceType === c.id && styles.chipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={onSubmit}
                disabled={!canSubmit || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Add provider</Text>
                )}
              </TouchableOpacity>

              <View style={styles.listHeaderRow}>
                <Users size={16} color={colors.textMain} />
                <Text style={styles.listHeaderTitle}>Registered providers</Text>
              </View>
              {loadingList && <ActivityIndicator style={{ marginTop: 10 }} color={colors.primary} />}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.providerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.providerName}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Phone size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.phone}</Text>
                </View>
                <Text style={styles.metaText}>{categoryName(item.serviceType)}</Text>
                {item.aadhaarNumber ? (
                  <Text style={styles.metaText}>Aadhaar: •••• •••• {item.aadhaarNumber.slice(-4)}</Text>
                ) : null}
              </View>
              <View style={styles.providerActions}>
                <View style={styles.availRow}>
                  <Text style={styles.availLabel}>{item.isAvailable ? "Available" : "Off duty"}</Text>
                  <Switch
                    value={item.isAvailable}
                    onValueChange={() => toggleAvailability(item)}
                    trackColor={{ true: colors.primary }}
                  />
                </View>
                <TouchableOpacity onPress={() => onDelete(item)} style={styles.deleteBtn} hitSlop={8}>
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !loadingList ? (
              <Text style={styles.emptyText}>No providers registered yet.</Text>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  back: { marginRight: 12 },
  crumb: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "700", color: colors.textMain },
  listContent: { padding: 16, paddingBottom: 40 },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 16,
    ...shadow.card,
  },
  formHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  formTitle: { fontSize: 15, fontWeight: "700", color: colors.textMain },
  formHint: { fontSize: 12, color: colors.textMuted, marginBottom: 16, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: "600", color: colors.textMain, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textMain,
  },
  errorHint: { fontSize: 11, color: "#DC2626", marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.textMain },
  chipTextActive: { color: "#fff" },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  listHeaderTitle: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  providerCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  providerName: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  metaText: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  providerActions: { alignItems: "flex-end", justifyContent: "space-between" },
  availRow: { alignItems: "center" },
  availLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 2 },
  deleteBtn: { marginTop: 10, padding: 4 },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: 20, fontSize: 13 },
});
