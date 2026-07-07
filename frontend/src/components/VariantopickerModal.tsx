// Shared bottom-sheet shown when a service has multiple variants/options.
// Used by every category's service-list screen (electrician, plumber,
// salon, carpenter, cleaning, pest-control, painting, ac-appliance,
// salon-women) so tapping "Add" on a multi-option service shows the real
// options (fetched from the same admin/backend data as the "View details"
// page) instead of adding a single base price straight to the cart.
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { X, Star } from "lucide-react-native";
import { useServiceDetail } from "@/src/components/ServiceDetail/useServiceDetail";
import { ServiceVariant } from "@/src/components/ServiceDetail/types";

interface Props {
  visible: boolean;
  serviceId: string | null;
  categoryId: string;
  onClose: () => void;
  onAddVariant: (variant: ServiceVariant) => void;
}

export default function VariantPickerModal({
  visible,
  serviceId,
  categoryId,
  onClose,
  onAddVariant,
}: Props) {
  // The hook needs a stable string; pass a placeholder while closed so we
  // don't fire a request for a null id.
  const { loading, error, serviceData } = useServiceDetail(serviceId || "", categoryId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {serviceData?.title || "Choose an option"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#111" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#6D28D9" />
            </View>
          ) : error || !serviceData || serviceData.variants.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>Couldn't load options. Please try again.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {serviceData.variants.map((variant) => (
                <View key={variant.id} style={styles.card}>
                  <Image source={{ uri: variant.image }} style={styles.image} resizeMode="cover" />
                  <Text style={styles.variantName} numberOfLines={2}>
                    {variant.name}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Star size={11} color="#000" fill="#000" />
                    <Text style={styles.ratingText}>
                      {variant.rating} ({variant.reviews})
                    </Text>
                  </View>
                  <Text style={styles.price}>₹{variant.price}</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                      onAddVariant(variant);
                      onClose();
                    }}
                  >
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111", flex: 1, marginRight: 12 },
  closeBtn: { padding: 4 },
  centerBox: { padding: 40, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#6B7280", fontSize: 14, textAlign: "center" },
  list: { paddingHorizontal: 18, paddingTop: 14, gap: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  image: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#F3F4F6" },
  variantName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  ratingText: { fontSize: 11, color: "#6B7280" },
  price: { fontSize: 14, fontWeight: "700", color: "#111", marginHorizontal: 10 },
  addBtn: {
    borderWidth: 1,
    borderColor: "#6D28D9",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  addBtnText: { color: "#6D28D9", fontWeight: "700", fontSize: 13 },
});
