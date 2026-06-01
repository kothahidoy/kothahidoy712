import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import {
  Bell,
  ChevronRight,
  Globe,
  HeadphonesIcon,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  Share2,
  Shield,
  Sparkles,
  User as UserIcon,
} from "lucide-react-native";

import { useSession } from "@/src/context/SessionContext";
import { colors, radius, shadow } from "@/src/theme";
import { confirmAsync, notify } from "@/src/utils/dialogs";

interface Item {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  href?: string;
  onPress?: () => void;
  destructive?: boolean;
  testID: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isAdmin, signOut, refreshProfile } = useSession();
  const [refreshing, setRefreshing] = React.useState(false);

  // Re-fetch profile (and therefore role) whenever the tab gains focus so
  // role changes made in the DB show up without a hard reload.
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  const items: Item[] = [
    ...(isAdmin
      ? [
          {
            icon: LayoutDashboard,
            label: "Admin Panel",
            onPress: () => router.push("/admin"),
            testID: "profile-item-admin",
          } as Item,
        ]
      : []),
    {
      icon: MapPin,
      label: "Saved addresses",
      onPress: () => router.push("/addresses"),
      testID: "profile-item-addresses",
    },
    {
      icon: Bell,
      label: "Notifications",
      onPress: () => notify("Notifications", "Push notifications coming soon."),
      testID: "profile-item-notifs",
    },
    {
      icon: Globe,
      label: "Language",
      onPress: () => notify("Language", "English (Bengali coming soon)"),
      testID: "profile-item-lang",
    },
    {
      icon: Share2,
      label: "Refer & earn",
      onPress: () => notify("Referral", "Coming soon — earn ₹100 per friend."),
      testID: "profile-item-refer",
    },
    {
      icon: HelpCircle,
      label: "Help & support",
      onPress: () => router.push("/help"),
      testID: "profile-item-help",
    },
    {
      icon: Shield,
      label: "Privacy policy",
      onPress: () => notify("Privacy", "We respect your data."),
      testID: "profile-item-privacy",
    },
    {
      icon: Settings,
      label: "Settings",
      onPress: () => notify("Settings", "More controls coming soon."),
      testID: "profile-item-settings",
    },
    {
      icon: LogOut,
      label: "Sign out",
      onPress: async () => {
        const ok = await confirmAsync(
          "Sign out",
          "Are you sure you want to sign out?",
          "Sign out",
          "Cancel",
        );
        if (!ok) return;
        await signOut();
        router.replace("/(auth)/welcome");
      },
      destructive: true,
      testID: "profile-item-signout",
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatarBubble}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <UserIcon size={28} color={colors.primary} strokeWidth={2} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.name ?? "Guest"}</Text>
            <Text style={styles.meta}>
              {profile?.phone ?? "Not signed in"}
            </Text>
            <View style={styles.cityChip}>
              <MapPin size={11} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.cityText}>{profile?.city ?? "Durgapur"}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.8}
            onPress={() => notify("Edit profile", "Coming soon.")}
            testID="profile-edit-btn"
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.statValue}>Mfixit Member</Text>
            <Text style={styles.statLabel}>
              Since{" "}
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })
                : "today"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/help")}
            activeOpacity={0.85}
            testID="profile-support-btn"
          >
            <HeadphonesIcon size={16} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.statValue}>24x7 Support</Text>
            <Text style={styles.statLabel}>We&apos;re here to help</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menu}>
          {items.map((it, idx) => (
            <TouchableOpacity
              key={it.label}
              style={[
                styles.menuItem,
                idx !== items.length - 1 && styles.menuDivider,
              ]}
              onPress={it.onPress}
              activeOpacity={0.7}
              testID={it.testID}
            >
              <View
                style={[
                  styles.menuIcon,
                  it.destructive && { backgroundColor: colors.errorLight },
                ]}
              >
                <it.icon
                  size={18}
                  color={it.destructive ? colors.error : colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text
                style={[
                  styles.menuLabel,
                  it.destructive && { color: colors.error },
                ]}
              >
                {it.label}
              </Text>
              {!it.destructive ? (
                <ChevronRight size={16} color={colors.textMuted} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>Mfixit · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textMain,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  avatarBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  name: { fontSize: 18, fontWeight: "800", color: colors.textMain },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cityChip: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cityText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  editText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  stats: { flexDirection: "row", gap: 10, marginTop: 14 },
  statBox: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 8,
  },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  menu: {
    marginTop: 18,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMain,
  },
  version: {
    fontSize: 11,
    color: colors.textSubtle,
    textAlign: "center",
    marginTop: 30,
  },
});
