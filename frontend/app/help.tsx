import { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronDown,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { notify } from "@/src/utils/dialogs";

const FAQS = [
  {
    q: "How do I book a service?",
    a: "Open the Home tab, pick a category, choose a service and tap Book Now. Select date, slot, address and confirm — it takes 60 seconds.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes. Open the Bookings tab, choose the booking, and tap Cancel booking. Free cancellation up to 2 hours before the slot.",
  },
  {
    q: "Are the professionals verified?",
    a: "Every Mfixit pro goes through a background check, skill test and customer rating threshold before being onboarded.",
  },
  {
    q: "Is there a service warranty?",
    a: "Most services come with a 30-day workmanship warranty. Details are listed under What's included on the service page.",
  },
  {
    q: "How do I pay?",
    a: "We currently support cash and UPI at the end of the service. Card and wallet payments are coming soon.",
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);

  const dial = (n: string) => Linking.openURL(`tel:${n}`);
  const wa = () =>
    Linking.openURL("https://wa.me/919999999999?text=Hi%20Mfixit%20Support").catch(
      () => notify("WhatsApp not installed"),
    );
  const mail = () => Linking.openURL("mailto:support@mfixit.app");

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          testID="help-back-btn"
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subTitle}>How can we help?</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={wa}
            activeOpacity={0.85}
            testID="help-whatsapp"
          >
            <View style={[styles.actionIcon, { backgroundColor: "#DCFCE7" }]}>
              <MessageCircle size={20} color="#16A34A" strokeWidth={2.5} />
            </View>
            <Text style={styles.actionLabel}>Chat on WhatsApp</Text>
            <Text style={styles.actionSub}>Instant response</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => dial("18001234567")}
            activeOpacity={0.85}
            testID="help-call"
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Phone size={20} color={colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.actionLabel}>Call us</Text>
            <Text style={styles.actionSub}>1800-123-4567</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={mail}
            activeOpacity={0.85}
            testID="help-email"
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FEF3C7" }]}>
              <Mail size={20} color="#B45309" strokeWidth={2.5} />
            </View>
            <Text style={styles.actionLabel}>Email</Text>
            <Text style={styles.actionSub}>support@mfixit.app</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subTitle, { marginTop: 28 }]}>
          Frequently asked questions
        </Text>

        <View style={styles.faqs}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <TouchableOpacity
                key={f.q}
                style={[
                  styles.faq,
                  i !== FAQS.length - 1 && styles.faqDivider,
                ]}
                onPress={() => setOpen(isOpen ? null : i)}
                activeOpacity={0.85}
                testID={`help-faq-${i}`}
              >
                <View style={styles.faqHead}>
                  <Text style={styles.faqQ}>{f.q}</Text>
                  <ChevronDown
                    size={16}
                    color={colors.textMuted}
                    style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                  />
                </View>
                {isOpen ? <Text style={styles.faqA}>{f.a}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  scroll: { padding: 20, paddingBottom: 40 },
  subTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textMain,
    marginBottom: 14,
  },
  actions: { gap: 10 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 14, fontWeight: "700", color: colors.textMain, flex: 1 },
  actionSub: { fontSize: 12, color: colors.textMuted },
  faqs: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  faq: { padding: 14 },
  faqDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  faqHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQ: { fontSize: 14, fontWeight: "700", color: colors.textMain, flex: 1 },
  faqA: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
});
