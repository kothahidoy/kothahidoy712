import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { X, Clock, Check, ChevronDown } from "lucide-react-native";
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
  themeColor = "#16A34A",
  onAddToCart,
}) => {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: PackageItem }>({});
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  useEffect(() => {
    if (packageData?.customizableItems) {
      const initial: { [key: string]: PackageItem } = {};
      packageData.customizableItems.forEach(category => {
        category.items.forEach(item => {
          if (item.selected) {
            initial[item.id] = { ...item };
          }
        });
      });
      setSelectedItems(initial);
    }
  }, [packageData]);

  if (!packageData) return null;

  const toggleItem = (item: PackageItem) => {
    setSelectedItems(prev => {
      if (prev[item.id]) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: { ...item, variant: item.variants?.[0] || item.variant } };
    });
  };

  const updateVariant = (itemId: string, variant: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], variant },
    }));
    setExpandedVariant(null);
  };

  const calculateTotal = () => {
    return Object.values(selectedItems).reduce((sum, item) => sum + item.price, 0);
  };

  const calculateOriginalTotal = () => {
    const total = calculateTotal();
    return Math.round(total / (1 - packageData.discount / 100));
  };

  const handleAddToCart = () => {
    onAddToCart(packageData.id, Object.values(selectedItems), calculateTotal());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: "#FFF7ED" }]}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{packageData.name}</Text>
              <View style={styles.headerInfo}>
                <Clock size={14} color="#6B7280" />
                <Text style={styles.headerDuration}>Service time: {packageData.duration}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {packageData.customizableItems?.map((category, catIndex) => (
              <View key={catIndex} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.category}</Text>
                
                {category.items.map((item) => {
                  const isSelected = !!selectedItems[item.id];
                  const currentVariant = selectedItems[item.id]?.variant || item.variants?.[0] || item.variant;
                  const isExpanded = expandedVariant === item.id;

                  return (
                    <View key={item.id}>
                      <TouchableOpacity
                        style={styles.itemRow}
                        onPress={() => toggleItem(item)}
                        activeOpacity={0.7}
                      >
                        {/* Checkbox */}
                        <View style={[
                          styles.checkbox,
                          isSelected && { backgroundColor: "#1F2937", borderColor: "#1F2937" }
                        ]}>
                          {isSelected && <Check size={14} color="#FFF" strokeWidth={3} />}
                        </View>

                        {/* Item Info */}
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemPrice}>₹{item.price}</Text>
                        </View>

                        {/* Variant Selector */}
                        {item.variants && item.variants.length > 0 && (
                          <TouchableOpacity
                            style={styles.variantSelector}
                            onPress={(e) => {
                              e.stopPropagation();
                              setExpandedVariant(isExpanded ? null : item.id);
                            }}
                          >
                            <Text style={styles.variantText} numberOfLines={1}>
                              {currentVariant ? currentVariant.substring(0, 8) + "..." : "Select"}
                            </Text>
                            <ChevronDown size={16} color="#6B7280" />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>

                      {/* Variant Dropdown */}
                      {isExpanded && item.variants && (
                        <View style={styles.variantDropdown}>
                          {item.variants.map((variant, vIndex) => (
                            <TouchableOpacity
                              key={vIndex}
                              style={[
                                styles.variantOption,
                                currentVariant === variant && styles.variantOptionSelected
                              ]}
                              onPress={() => updateVariant(item.id, variant)}
                            >
                              <Text style={[
                                styles.variantOptionText,
                                currentVariant === variant && styles.variantOptionTextSelected
                              ]}>
                                {variant}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.priceInfo}>
              <Text style={styles.totalPrice}>₹{calculateTotal().toLocaleString()}</Text>
              <Text style={styles.originalTotal}>₹{calculateOriginalTotal().toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={[styles.addToCartBtn, { backgroundColor: "#6366F1" }]}
              onPress={handleAddToCart}
            >
              <Text style={styles.addToCartText}>Add to cart</Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "60%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerDuration: {
    fontSize: 14,
    color: "#6B7280",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  content: {
    flex: 1,
  },
  categorySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: "#6B7280",
  },
  variantSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    minWidth: 100,
  },
  variantText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  variantDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginLeft: 38,
    marginTop: 4,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  variantOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  variantOptionSelected: {
    backgroundColor: "#F3F4F6",
  },
  variantOptionText: {
    fontSize: 14,
    color: "#374151",
  },
  variantOptionTextSelected: {
    fontWeight: "600",
    color: "#000000",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  priceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
  },
  originalTotal: {
    fontSize: 16,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  addToCartBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default PackageCustomizerModal;
