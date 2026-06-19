import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Star, ChevronDown } from "lucide-react-native";

export interface PackageItem {
  id: string;
  name: string;
  selected?: boolean;
  price: number;
  variant?: string;
  variants?: string[];
}

export interface PackageData {
  id: string;
  name: string;
  rating: number;
  reviewCount: string;
  price: number;
  originalPrice: number;
  duration: string;
  discount: number;
  items: { category: string; description: string }[];
  customizable?: boolean;
  customizableItems?: { category: string; items: PackageItem[] }[];
}

interface SuperSaverPackagesProps {
  packages: PackageData[];
  themeColor?: string;
  onAddPackage: (packageId: string) => void;
  onEditPackage: (packageId: string) => void;
}

const PackageCard = ({
  pkg,
  themeColor,
  onAdd,
  onEdit,
}: {
  pkg: PackageData;
  themeColor: string;
  onAdd: () => void;
  onEdit: () => void;
}) => (
  <View style={styles.packageCard}>
    <View style={styles.packageLeft}>
      {/* Package Label */}
      <View style={styles.packageLabelRow}>
        <View style={[styles.packageLabel, { backgroundColor: `${themeColor}15` }]}>
          <View style={[styles.packageLabelIcon, { backgroundColor: themeColor }]} />
          <Text style={[styles.packageLabelText, { color: themeColor }]}>PACKAGE</Text>
        </View>
      </View>

      {/* Package Name */}
      <Text style={styles.packageName}>{pkg.name}</Text>

      {/* Rating */}
      <View style={styles.ratingRow}>
        <Star size={12} color="#000" fill="#000" />
        <Text style={styles.ratingText}>
          {pkg.rating} ({pkg.reviewCount} reviews)
        </Text>
      </View>

      {/* Price Row */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{pkg.price.toLocaleString()}</Text>
        <Text style={styles.originalPrice}>₹{pkg.originalPrice.toLocaleString()}</Text>
        <Text style={styles.duration}> • {pkg.duration}</Text>
      </View>

      {/* Dotted Separator */}
      <View style={styles.dottedSeparator} />

      {/* Items List */}
      <View style={styles.itemsList}>
        {pkg.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemBullet}>•</Text>
            <Text style={styles.itemText}>
              <Text style={styles.itemCategory}>{item.category}: </Text>
              {item.description}
            </Text>
          </View>
        ))}
      </View>

      {/* Edit Package Button */}
      {pkg.customizable && (
        <TouchableOpacity style={styles.editPackageBtn} onPress={onEdit}>
          <Text style={styles.editPackageText}>Edit your package</Text>
        </TouchableOpacity>
      )}
    </View>

    {/* Discount Badge */}
    <View style={styles.packageRight}>
      <View style={styles.discountBadge}>
        <Text style={[styles.discountPercent, { color: themeColor }]}>{pkg.discount}%</Text>
        <Text style={[styles.discountOff, { color: themeColor }]}>OFF</Text>
      </View>
      <TouchableOpacity
        style={[styles.addBadgeBtn, { borderColor: themeColor }]}
        onPress={onAdd}
      >
        <Text style={[styles.addBadgeText, { color: themeColor }]}>Add</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export const SuperSaverPackages: React.FC<SuperSaverPackagesProps> = ({
  packages,
  themeColor = "#16A34A",
  onAddPackage,
  onEditPackage,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Super saver packages</Text>
      
      {packages.map((pkg, index) => (
        <View key={pkg.id}>
          <PackageCard
            pkg={pkg}
            themeColor={themeColor}
            onAdd={() => onAddPackage(pkg.id)}
            onEdit={() => onEditPackage(pkg.id)}
          />
          {index < packages.length - 1 && <View style={styles.packageDivider} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  packageCard: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  packageLeft: {
    flex: 1,
    paddingRight: 16,
  },
  packageLabelRow: {
    marginBottom: 8,
  },
  packageLabel: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  packageLabelIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  packageLabelText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 6,
    lineHeight: 24,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    color: "#6B7280",
    textDecorationLine: "underline",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
  },
  originalPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  duration: {
    fontSize: 14,
    color: "#6B7280",
  },
  dottedSeparator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  itemBullet: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "700",
    marginTop: -2,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  itemCategory: {
    fontWeight: "700",
    color: "#000000",
  },
  editPackageBtn: {
    marginTop: 16,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  editPackageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  packageRight: {
    width: 110,
    alignItems: "center",
  },
  discountBadge: {
    width: 100,
    height: 100,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  discountPercent: {
    fontSize: 32,
    fontWeight: "800",
  },
  discountOff: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: -4,
  },
  addBadgeBtn: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  addBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  packageDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
    marginVertical: 8,
  },
});

export default SuperSaverPackages;
