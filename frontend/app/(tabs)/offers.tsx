import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Copy, Tag, Ticket } from "lucide-react-native";

import { dataService } from "@/src/data/service";
import { colors, radius, shadow } from "@/src/theme";
import { Offer } from "@/src/types";

export default function OffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    dataService.getOffers().then(setOffers);
  }, []);

  const copy = async (code: string) => {
    Alert.alert("Promo code copied", `Use ${code} at checkout.`);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Offers & coupons</Text>
        <Text style={styles.subtitle}>Save more on every booking</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {offers.map((o) => (
          <View key={o.id} style={styles.card} testID={`offer-card-${o.id}`}>
            <Image source={{ uri: o.bannerUrl }} style={styles.banner} />
            <View
              style={[
                styles.discountBadge,
                { backgroundColor: o.bgColor },
              ]}
            >
              <Text style={styles.discountText}>{o.discountPercent}% OFF</Text>
            </View>
            <View style={styles.body}>
              <View style={styles.row}>
                <Tag size={14} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.tagText}>Limited time</Text>
              </View>
              <Text style={styles.cardTitle}>{o.title}</Text>
              <Text style={styles.cardSub}>{o.subtitle}</Text>
              <View style={styles.codeRow}>
                <View style={styles.codeBox}>
                  <Ticket size={14} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.codeText}>{o.code}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => copy(o.code)}
                  testID={`offer-copy-${o.id}`}
                  activeOpacity={0.8}
                >
                  <Copy size={14} color="#FFFFFF" />
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.expiry}>
                Valid until {new Date(o.validUntil).toLocaleDateString("en-IN")}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: colors.textMain },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  banner: { width: "100%", height: 130 },
  discountBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  discountText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  body: { padding: 16, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  tagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 4,
  },
  cardSub: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    flex: 1,
  },
  codeText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  copyText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  expiry: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
