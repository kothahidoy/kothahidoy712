import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { useCart } from "@/src/context/CartContext";
import { useSession } from "@/src/context/SessionContext";

export default function CartScreen() {
  const router = useRouter();
  const { items, itemCount, total, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { session } = useSession();
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    setProcessingItem(itemId);
    await updateQuantity(itemId, newQty);
    setProcessingItem(null);
  };

  const handleRemove = async (itemId: string) => {
    setProcessingItem(itemId);
    await removeFromCart(itemId);
    setProcessingItem(null);
  };

  const handleCheckout = () => {
    if (!session) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to book services",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/welcome") },
        ]
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert("Empty Cart", "Add services to your cart first");
      return;
    }

    // Navigate to booking screen with first cart item's service ID
    // For multiple items, we'll book the first one and user can book others separately
    const firstItem = items[0];
    router.push({
      pathname: "/booking/new",
      params: { serviceId: firstItem.service_id },
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isProcessing = processingItem === item.id;
    
    return (
      <View style={styles.cartItem}>
        {item.service_image ? (
          <Image source={{ uri: item.service_image }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
            <ShoppingCart size={24} color={colors.textMuted} />
          </View>
        )}
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.service_title || "Service"}
          </Text>
          <Text style={styles.itemPrice}>₹{item.service_price || 0}</Text>
          
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
              disabled={isProcessing}
            >
              <Minus size={16} color={colors.textMain} />
            </TouchableOpacity>
            
            <Text style={styles.qtyText}>
              {isProcessing ? "..." : item.quantity}
            </Text>
            
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
              disabled={isProcessing}
            >
              <Plus size={16} color={colors.textMain} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.itemRight}>
          <Text style={styles.itemTotal}>
            ₹{(item.service_price || 0) * item.quantity}
          </Text>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemove(item.id)}
            disabled={isProcessing}
          >
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSubtitle}>{itemCount} items</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Items */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingCart size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse services and add them to your cart
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.browseBtnText}>Browse Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Checkout Footer */}
      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{total}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Calendar size={20} color="#FFF" />
            <Text style={styles.checkoutBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textMain,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.error,
  },
  list: {
    padding: 20,
    paddingBottom: 140,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  itemImagePlaceholder: {
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMain,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
    minWidth: 24,
    textAlign: "center",
  },
  itemRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textMain,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textMain,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  browseBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  browseBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    ...shadow.floating,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textMain,
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 999,
  },
  checkoutBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
