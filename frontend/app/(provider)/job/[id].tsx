import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Play,
} from "lucide-react-native";
import * as Location from "expo-location";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { providerService } from "@/src/data/providerService";
import { dataService } from "@/src/data/service";
import { colors, radius, shadow } from "@/src/theme";
import { Booking, Provider } from "@/src/types";
import { confirmAsync, notify } from "@/src/utils/dialogs";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";
const LOCATION_UPLOAD_INTERVAL_MS = 30 * 1000; // 30 seconds

export default function JobDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [job, setJob] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentProvider = await providerService.getCurrentProvider();
      if (!currentProvider) {
        router.replace("/(provider)/login");
        return;
      }
      setProvider(currentProvider);

      const jobs = await providerService.listJobs(currentProvider.id);
      const found = jobs.find((j) => j.id === id);
      setJob(found ?? null);
    } catch (e) {
      console.warn("Failed to load job", e);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ─────────────────────────────────────────────────────────────
  // Live location upload while job is in_progress
  // ─────────────────────────────────────────────────────────────
  const lastUploadRef = useRef<number>(0);
  const [liveSharing, setLiveSharing] = useState(false);

  useEffect(() => {
    if (!provider || !job) return;
    if (job.status !== "in_progress") {
      setLiveSharing(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const uploadOnce = async () => {
      if (cancelled) return;
      try {
        // Permission gate (idempotent)
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLiveSharing(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const res = await fetch(
          `${API_BASE}/api/provider/${provider.id}/location`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              heading: pos.coords.heading ?? null,
              speed: pos.coords.speed ?? null,
              accuracy: pos.coords.accuracy ?? null,
              booking_id: job.id,
            }),
          }
        );
        if (res.ok) {
          lastUploadRef.current = Date.now();
          setLiveSharing(true);
        }
      } catch (e) {
        // network blip — keep trying on next tick
        console.warn("[live-location] upload failed", e);
      }
    };

    // Fire immediately + every 30s
    uploadOnce();
    intervalId = setInterval(uploadOnce, LOCATION_UPLOAD_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      setLiveSharing(false);
    };
  }, [provider, job]);

  const handleStartJob = async () => {
    if (!provider || !job) return;

    const confirmed = await confirmAsync(
      "Start Job?",
      "This will mark the job as in progress. Make sure you're at the customer location.",
      "Start Job",
      "Cancel"
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const success = await providerService.startJob(provider.id, job.id);
      if (success) {
        notify("Job Started", "The job is now in progress.");
        await loadData();
      } else {
        notify("Failed", "Could not start the job. It may have been cancelled.");
      }
    } catch (e) {
      notify("Error", "Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!provider || !job) return;

    const confirmed = await confirmAsync(
      "Complete Job?",
      "This will mark the job as completed. Make sure all work is finished and customer is satisfied.",
      "Complete Job",
      "Cancel"
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const success = await providerService.completeJob(provider.id, job.id);
      if (success) {
        notify("Job Completed! 🎉", "Great work! You're now available for new jobs.");
        router.back();
      } else {
        notify("Failed", "Could not complete the job. Please try again.");
      }
    } catch (e) {
      notify("Error", "Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const openMaps = () => {
    if (!job?.address) return;
    const { latitude, longitude, addressLine, city } = job.address;
    const label = encodeURIComponent(`${addressLine}, ${city}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;
    Linking.openURL(url);
  };

  const callCustomer = () => {
    // In a real app, you'd have the customer's phone number
    notify("Coming Soon", "Customer contact will be available in the next update.");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <ArrowLeft size={22} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.title}>Job Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Job not found or no longer active.</Text>
          <PrimaryButton
            label="Go Back"
            onPress={() => router.back()}
            size="md"
          />
        </View>
      </SafeAreaView>
    );
  }

  const date = new Date(job.scheduledDate);
  const isAssigned = job.status === "assigned";
  const isInProgress = job.status === "in_progress";

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          testID="job-detail-back"
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>Job Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Image source={{ uri: job.serviceImage }} style={styles.heroImg} />
          <View style={{ padding: 14 }}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isInProgress
                    ? colors.warningLight
                    : colors.primaryLight,
                },
              ]}
            >
              {isInProgress ? (
                <Clock size={11} color="#B45309" strokeWidth={2.5} />
              ) : (
                <CheckCircle2 size={11} color={colors.primary} strokeWidth={2.5} />
              )}
              <Text
                style={[
                  styles.statusText,
                  { color: isInProgress ? "#B45309" : colors.primary },
                ]}
              >
                {isInProgress ? "In Progress" : "Assigned"}
              </Text>
            </View>
            {isInProgress && (
              <View style={styles.liveSharePill}>
                <View
                  style={[
                    styles.liveDot,
                    { backgroundColor: liveSharing ? "#16A34A" : "#9CA3AF" },
                  ]}
                />
                <Text style={styles.liveShareText}>
                  {liveSharing
                    ? "Sharing live location with customer"
                    : "Waiting for GPS permission…"}
                </Text>
              </View>
            )}
            <Text style={styles.svcTitle}>{job.serviceTitle}</Text>

            <View style={styles.metaRow}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {date.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{job.timeSlot}</Text>
            </View>
          </View>
        </View>

        {/* Address Card */}
        <View style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.addressLabel}>Customer Address</Text>
          </View>
          <Text style={styles.addressText}>
            {job.address?.addressLine ?? "N/A"}
          </Text>
          {job.address?.landmark && (
            <Text style={styles.landmarkText}>
              Landmark: {job.address.landmark}
            </Text>
          )}
          <Text style={styles.cityText}>{job.address?.city ?? ""}</Text>
          <TouchableOpacity
            style={styles.mapsBtn}
            onPress={openMaps}
            activeOpacity={0.85}
          >
            <Navigation size={14} color="#FFFFFF" />
            <Text style={styles.mapsBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Price & Notes */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Price</Text>
            <Text style={styles.priceValue}>₹{job.price}</Text>
          </View>
          {job.notes && (
            <>
              <View style={styles.divider} />
              <Text style={styles.notesLabel}>Customer Notes</Text>
              <Text style={styles.notesText}>{job.notes}</Text>
            </>
          )}
        </View>

        {/* Contact Customer */}
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={callCustomer}
          activeOpacity={0.85}
        >
          <Phone size={18} color={colors.primary} />
          <Text style={styles.contactText}>Contact Customer</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {isAssigned && (
            <PrimaryButton
              label={actionLoading ? "Starting..." : "Start Job"}
              onPress={handleStartJob}
              disabled={actionLoading}
              testID="start-job-btn"
              icon={<Play size={18} color="#FFFFFF" />}
            />
          )}
          {isInProgress && (
            <PrimaryButton
              label={actionLoading ? "Completing..." : "Complete Job"}
              onPress={handleCompleteJob}
              disabled={actionLoading}
              testID="complete-job-btn"
              icon={<CheckCircle2 size={18} color="#FFFFFF" />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 20,
  },
  loadingText: { fontSize: 14, color: colors.textMuted },
  errorText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
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
  heroCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  heroImg: { width: "100%", height: 180 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 11, fontWeight: "800" },
  liveSharePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginTop: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveShareText: { fontSize: 11, fontWeight: "700", color: "#065F46" },
  svcTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  metaText: { fontSize: 13, color: colors.textBody, flex: 1 },
  addressCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  addressText: {
    fontSize: 14,
    color: colors.textMain,
    fontWeight: "600",
    lineHeight: 20,
  },
  landmarkText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  cityText: {
    fontSize: 13,
    color: colors.textBody,
    marginTop: 4,
  },
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 14,
  },
  mapsBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  priceCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 13,
    color: colors.textBody,
    marginTop: 6,
    lineHeight: 19,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primaryLight,
    paddingVertical: 14,
    borderRadius: radius.lg,
    marginTop: 16,
  },
  contactText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
});
