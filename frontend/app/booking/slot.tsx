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
import { ChevronLeft, X, Zap, CalendarClock } from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { bookingApi, SlotDate, TimeSlot } from "@/src/data/bookingFlow";

type Mode = "instant" | "scheduled";

export default function SlotPickerScreen() {
  const router = useRouter();
  useLocalSearchParams<{ from?: string }>();

  const [mode, setMode] = useState<Mode>("instant");

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

  // Compute an "ASAP" slot for instant bookings: today's date + next :30 or :00
  // rounded up (e.g. 12:47 → 01:00 PM, 01:12 → 01:30 PM).
  const asapSlot = useMemo(() => {
    const now = new Date();
    const mins = now.getMinutes();
    const bump = mins < 30 ? 30 - mins : 60 - mins;
    now.setMinutes(mins + bump, 0, 0);
    const label = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return {
      date: new Date().toISOString().slice(0, 10),
      time: label.replace(/^0/, ""), // "01:30 PM" → "1:30 PM" style; we keep leading zero to match slot format
    };
  }, []);

  const handleProceed = () => {
    if (mode === "instant") {
      router.push({
        pathname: "/booking/checkout",
        params: {
          slot_date: asapSlot.date,
          slot_time: asapSlot.time,
          instant: "1",
        },
      });
      return;
    }
    if (!selectedDate || !selectedTime) return;
    router.push({
      pathname: "/booking/checkout",
      params: { slot_date: selectedDate, slot_time: selectedTime },
    });
  };

  const canProceed = mode === "instant" || (!!selectedDate && !!selectedTime);

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

        {/* ─── Book Now (Instant) card ─── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setMode("instant")}
          style={[styles.modeCard, mode === "instant" && styles.modeCardActive]}
          testID="slot-instant-card"
        >
          <View style={[styles.modeIconWrap, mode === "instant" && styles.modeIconWrapActive]}>
            <Zap size={22} color={mode === "instant" ? "#fff" : PURPLE} fill={mode === "instant" ? "#fff" : "transparent"} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.modeTitleRow}>
              <Text style={styles.modeTitle}>Book Now</Text>
              <View style={styles.instantBadge}>
                <Text style={styles.instantBadgeText}>INSTANT</Text>
              </View>
            </View>
            <Text style={styles.modeSubtitle}>
              Nearest available pro will reach you in ~30–60 mins
            </Text>
          </View>
          <View style={[styles.radioOuter, mode === "instant" && styles.radioOuterActive]}>
            {mode === "instant" ? <View style={styles.radioInner} /> : null}
          </View>
        </TouchableOpacity>

        {/* ─── Schedule for later card ─── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setMode("scheduled")}
          style={[styles.modeCard, mode === "scheduled" && styles.modeCardActive]}
          testID="slot-scheduled-card"
        >
          <View style={[styles.modeIconWrap, mode === "scheduled" && styles.modeIconWrapActive]}>
            <CalendarClock size={22} color={mode === "scheduled" ? "#fff" : PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeTitle}>Schedule for later</Text>
            <Text style={styles.modeSubtitle}>Pick a preferred day & time slot</Text>
          </View>
          <View style={[styles.radioOuter, mode === "scheduled" && styles.radioOuterActive]}>
            {mode === "scheduled" ? <View style={styles.radioInner} /> : null}
          </View>
        </TouchableOpacity>

        {/* Scheduled sub-panel — only visible when Scheduled selected */}
        {mode === "scheduled" ? (
          <View style={styles.scheduledPanel}>
            {/* Date pills */}
            <Text style={styles.subLabel}>Choose a day</Text>
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

            {/* Time slots */}
            <Text style={[styles.subLabel, { marginTop: 18 }]}>Select start time</Text>
            {loadingSlots ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
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
          </View>
        ) : null}
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
            {mode === "instant" ? "Book instant service" : "Proceed to checkout"}
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

  // ─── Mode selector cards ───
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  modeCardActive: {
    borderColor: PURPLE,
    backgroundColor: PURPLE_LIGHT,
  },
  modeIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: PURPLE,
    alignItems: "center", justifyContent: "center",
  },
  modeIconWrapActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  modeTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeTitle: { fontSize: 16, fontWeight: "800", color: colors.textMain },
  modeSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  instantBadge: {
    backgroundColor: PURPLE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  instantBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: "#CBD5E1",
    alignItems: "center", justifyContent: "center",
  },
  radioOuterActive: { borderColor: PURPLE, backgroundColor: PURPLE },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },

  // ─── Scheduled panel ───
  scheduledPanel: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 10,
  },

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
    borderRadius: radius.lg,
    alignItems: "center",
  },
  ctaDisabled: { backgroundColor: "#E2E8F0" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ctaTextDisabled: { color: "#94A3B8" },
});
