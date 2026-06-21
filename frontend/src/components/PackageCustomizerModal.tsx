import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { X, Clock, Minus, Plus, ArrowRight, ChevronDown } from "lucide-react-native";
import { PackageData, PackageItem } from "./SuperSaverPackages";

interface PackageCustomizerModalProps {
  visible: boolean;
  onClose: () => void;
  packageData: PackageData | null;
  themeColor?: string;
  onAddToCart: (packageId: string, selectedItems: PackageItem[], totalPrice: number) => void;
}

export const PackageCustomizerModal: React.FC<PackageCustomizerModalProps> = ({
  visible,
  onClose,
  packageData,
  themeColor = "#7C3AED",
  onAddToCart,
}) => {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: PackageItem }>({});
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (packageData?.customizableItems) {
      const initial: { [key: string]: PackageItem } = {};
      packageData.customizableItems.forEach((category) => {
        category.items.forEach((item) => {
          if (item.selected) {
            initial[item.id] = {
              ...item,
              variant: item.variants?.[0] ?? item.variant,
            };
          }
        });
      });
      setSelectedItems(initial);
    } else {
      setSelectedItems({});
    }
    setExpandedVariant(null);
  }, [visible, packageData]);

  const toggleItem = (item: PackageItem) => {
    setSelectedItems((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: { ...item, variant: item.variants?.[0] ?? item.variant },
      };
    });
  };

  const setVariant = (itemId: string, variant: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], variant },
    }));
    setExpandedVariant(null);
  };

  const total = useMemo(
    () => Object.values(selectedItems).reduce((sum, it) => sum + it.price, 0),
    [selectedItems]
  );
  const originalTotal = useMemo(() => {
    const discount = packageData?.discount || 0;
    if (discount > 0) return Math.round(total / (1 - discount / 100));
    return packageData?.originalPrice && total > 0 && packageData?.price
      ? Math.round(total * (packageData.originalPrice / packageData.price))
      : 0;
  }, [total, packageData]);
  const savings = originalTotal - total;

  const selectedCount = Object.keys(selectedItems).length;

  // Bail-out AFTER hooks (rules-of-hooks)
  if (!packageData) return null;

  const handleAddToCart = () => {
    onAddToCart(packageData.id, Object.values(selectedItems), total);
    onClose();
  };

  // Helper: short variant chips when the list is small (≤3) AND short text (≤10 chars)
  const renderVariantsChips = (item: PackageItem) => {
    if (!item.variants || item.variants.length === 0) return null;
    const isShort =
      item.variants.length <= 3 && item.variants.every((v) => v.length <= 10);
    const currentVariant =
      selectedItems[item.id]?.variant || item.variants[0] || item.variant;
    if (isShort) {
      return (
        <View style={styles.chipsRow}>
          {item.variants.map((v) => {
            const active = currentVariant === v;
            return (
              <TouchableOpacity
                key={v}
                style={[
                  styles.chip,
                  active ? { borderColor: themeColor, backgroundColor: `${themeColor}10` } : null,
                ]}
                onPress={() => setVariant(item.id, v)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? { color: themeColor, fontWeight: "700" } : null,
                  ]}
                >
                  {v}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    // Longer list → dropdown
    const isOpen = expandedVariant === item.id;
    return (
      <View>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setExpandedVariant(isOpen ? null : item.id)}
        >
          <Text style={styles.dropdownText} numberOfLines={1}>
            {currentVariant}
          </Text>
          <ChevronDown size={16} color="#6B7280" />
        </TouchableOpacity>
        {isOpen && (
          <View style={styles.dropdownPanel}>
            {item.variants.map((v) => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.dropdownOption,
                  currentVariant === v && { backgroundColor: "#F3F4F6" },
                ]}
                onPress={() => setVariant(item.id, v)}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    currentVariant === v && { fontWeight: "700", color: "#111827" },
                  ]}
                >
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header — Urban Company style: pale cream background */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.headerTitle}>{packageData.name}</Text>
              <View style={styles.headerMeta}>
                <Clock size={14} color="#6B7280" />
                <Text style={styles.headerMetaText}>
                  Service time: {packageData.duration}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={10}
            >
              <X size={22} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Scrollable items */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {packageData.customizableItems?.map((category, catIdx) => (
              <View key={catIdx} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.category}</Text>
                <Text style={styles.categoryHint}>
                  {category.items.length === 1
                    ? "Choose 1"
                    : `Choose ${Math.min(category.items.length, 3)}`}
                </Text>

                {category.items.map((item) => {
                  const isSelected = !!selectedItems[item.id];
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.itemCard,
                        isSelected && {
                          borderColor: themeColor,
                          backgroundColor: `${themeColor}06`,
                        },
                      ]}
                    >
                      <View style={styles.itemTopRow}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <View style={styles.priceRow}>
                            <Text style={styles.itemPrice}>
                              ₹{item.price.toLocaleString()}
                            </Text>
                            {item.variant && !item.variants?.length ? (
                              <Text style={styles.itemVariantTag}>{item.variant}</Text>
                            ) : null}
                          </View>
                        </View>

                        {/* +/− style toggle (Urban Company look) */}
                        {isSelected ? (
                          <TouchableOpacity
                            style={[styles.minusBtn, { borderColor: themeColor }]}
                            onPress={() => toggleItem(item)}
                          >
                            <Minus size={18} color={themeColor} strokeWidth={2.5} />
                            <Text
                              style={[styles.minusBtnText, { color: themeColor }]}
                            >
                              Added
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.addBtn, { borderColor: themeColor }]}
                            onPress={() => toggleItem(item)}
                          >
                            <Plus size={16} color={themeColor} strokeWidth={2.5} />
                            <Text
                              style={[styles.addBtnText, { color: themeColor }]}
                            >
                              Add
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {isSelected && item.variants && item.variants.length > 0 ? (
                        <View style={styles.variantSection}>
                          <Text style={styles.variantHeading}>
                            Choose your option
                          </Text>
                          {renderVariantsChips(item)}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Sticky bottom bar */}
          <View style={styles.bottomBar}>
            <View style={{ flex: 1 }}>
              <View style={styles.totalRow}>
                <Text style={styles.totalPrice}>
                  ₹{total.toLocaleString()}
                </Text>
                {originalTotal > total && (
                  <Text style={styles.originalTotal}>
                    ₹{originalTotal.toLocaleString()}
                  </Text>
                )}
              </View>
              {savings > 0 ? (
                <Text style={styles.savingsText}>
                  You save ₹{savings.toLocaleString()}
                </Text>
              ) : (
                <Text style={styles.totalSub}>
                  {selectedCount} item{selectedCount === 1 ? "" : "s"} selected
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                {
                  backgroundColor: selectedCount > 0 ? themeColor : "#9CA3AF",
                },
              ]}
              onPress={handleAddToCart}
              disabled={selectedCount === 0}
            >
              <Text style={styles.addToCartText}>Add to cart</Text>
              <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    minHeight: "70%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: "#FFF7ED",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
    marginBottom: 6,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerMetaText: {
    fontSize: 13,
    color: "#6B7280",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  categorySection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  categoryHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    marginBottom: 12,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  itemPrice: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  itemVariantTag: {
    fontSize: 12,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 92,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  minusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 92,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  minusBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  variantSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  variantHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  chipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  dropdownText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    fontWeight: "600",
  },
  dropdownPanel: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownOptionText: {
    fontSize: 13,
    color: "#374151",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
  },
  originalTotal: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#15803D",
    marginTop: 2,
  },
  totalSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default PackageCustomizerModal;
