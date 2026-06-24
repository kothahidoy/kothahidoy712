import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, X, CreditCard } from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { bookingApi, SlotDate, TimeSlot } from "@/src/data/bookingFlow";

export default function SlotPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();

  const [dates, setDates] = useState<SlotDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fallback time slots (when DB hasn't been seeded yet)
  const fallbackSlots = useMemo(
    () => [
      "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
      "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
      "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
      "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
    ],
    []
  );

  // Generate fallback date pills (next 7 days)
  useEffect(() => {
    (async () => {
      const apiDates = await bookingApi.getSlotDates(7);
      if (apiDates.length > 0 && apiDates.some((d) => d.slot_count > 0)) {
        setDates(apiDates);
        const first = apiDates.find((d) => d.slot_count > 0) || apiDates[0];
        setSelectedDate(first.date);
      } else {
        // build local 7 days
        const today = new Date();
        const local: SlotDate[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          return {
            date: d.toISOString().slice(0, 10),
            day_name: d.toLocaleDateString("en-US", { weekday: "short" }),
            day_num: d.getDate(),
            slot_count: fallbackSlots.length,
          };
        });
        setDates(local);
        setSelectedDate(local[0].date);
      }
    })();
  }, [fallbackSlots]);

  useEffect(() => {
    if (!selectedDate) return;
    (async () => {
      setLoadingSlots(true);
      setSelectedTime(null);
      const apiSlots = await bookingApi.getSlots(selectedDate);
      if (apiSlots.length > 0) {
        setSlots(apiSlots);
      } else {
        // synthesize from fallback list
        setSlots(
          fallbackSlots.map((t, i) => ({
            id: `local-${i}`,
            date: selectedDate,
            time: t,
            available: true,
          }))
        );
      }
      setLoadingSlots(false);
    })();
  }, [selectedDate, fallbackSlots]);

  const handleProceed = () => {
    if (!selectedDate || !selectedTime) return;
    router.push({
      pathname: "/booking/checkout",
      params: { slot_date: selectedDate, slot_time: selectedTime },
    });
  };

  const canProceed = !!selectedDate && !!selectedTime;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your cart</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtnRound} hitSlop={8}>
          <X size={20} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={styles.heroQuestion}>When should the professional arrive?</Text>

        {/* Schedule for later card */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleTitle}>Schedule for later</Text>
              <Text style={styles.scheduleSubtitle}>Select your preferred day & time</Text>
            </View>
            <View style={[styles.radioOuter, styles.radioOuterActive]}>
              <View style={styles.radioInner} />
            </View>
          </View>

          {/* Date pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesRow}
          >
            {dates.map((d) => {
              const active = d.date === selectedDate;
              return (
                <TouchableOpacity
                  key={d.date}
                  style={[styles.dateCard, active && styles.dateCardActive]}
                  onPress={() => setSelectedDate(d.date)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dateDay, active && styles.dateDayActive]}>{d.day_name}</Text>
                  <Text style={[styles.dateNum, active && styles.dateNumActive]}>{d.day_num}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Info badge */}
          <View style={styles.infoBox}>
            <CreditCard size={18} color={colors.textMain} />
            <Text style={styles.infoText}>Online payment only for selected date</Text>
          </View>
        </View>

        {/* Time slots */}
        <Text style={styles.sectionTitle}>Select start time of service</Text>

        {loadingSlots ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.slotsGrid}>
            {slots.map((s) => {
              const active = s.time === selectedTime;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.slotPill, active && styles.slotPillActive]}
                  onPress={() => setSelectedTime(s.time)}
                  activeOpacity={0.8}
                  disabled={!s.available}
                >
                  <Text style={[styles.slotPillText, active && styles.slotPillTextActive]}>
                    {s.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.cta, !canProceed && styles.ctaDisabled]}
          onPress={handleProceed}
          disabled={!canProceed}
          activeOpacity={0.9}
        >
          <Text style={[styles.ctaText, !canProceed && styles.ctaTextDisabled]}>
            Proceed to checkout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const PURPLE = "#6E3DF5";
const PURPLE_LIGHT = "#EFE9FE";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#0F172A",
  },
  iconBtn: { padding: 4 },
  iconBtnRound: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, marginLeft: 8, color: "#fff", fontSize: 20, fontWeight: "700" },
  body: { flex: 1, paddingHorizontal: 16 },

  heroQuestion: { fontSize: 22, fontWeight: "800", color: colors.textMain, marginTop: 18, marginBottom: 16 },

  scheduleCard: {
    borderWidth: 1.5, borderColor: PURPLE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
  },
  scheduleHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  scheduleTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  scheduleSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: "#CBD5E1",
    alignItems: "center", justifyContent: "center",
  },
  radioOuterActive: { borderColor: PURPLE, backgroundColor: PURPLE },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },

  datesRow: { gap: 10, paddingRight: 12 },
  dateCard: {
    width: 78, height: 76,
    borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff",
  },
  dateCardActive: { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT, borderWidth: 2 },
  dateDay: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },
  dateDayActive: { color: PURPLE },
  dateNum: { fontSize: 22, fontWeight: "800", color: colors.textMain, marginTop: 4 },
  dateNumActive: { color: PURPLE },

  infoBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, marginTop: 16,
  },
  infoText: { fontSize: 13, color: colors.textBody, flex: 1, lineHeight: 18 },

  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.textMain, marginBottom: 14 },

  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotPill: {
    flexBasis: "31%",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  slotPillActive: { borderColor: PURPLE, borderWidth: 2, backgroundColor: PURPLE_LIGHT },
  slotPillText: { fontSize: 14, color: colors.textMain, fontWeight: "600" },
  slotPillTextActive: { color: PURPLE },

  ctaBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: colors.border,
    ...shadow.bottomNav,
  },
  cta: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaDisabled: { backgroundColor: "#E2E8F0" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ctaTextDisabled: { color: "#94A3B8" },
});
