import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MapPin, Search } from "lucide-react-native";
import { colors, radius } from "@/src/theme";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

interface Prediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceResult {
  latitude: number;
  longitude: number;
  name: string;
  addressLine: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

interface Props {
  placeholder?: string;
  latitude?: number;
  longitude?: number;
  onSelect: (place: PlaceResult) => void;
}

export default function PlacesSearchInput({ placeholder, latitude, longitude, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ input: query.trim() });
        if (latitude != null && longitude != null) {
          params.set("lat", String(latitude));
          params.set("lon", String(longitude));
        }
        const r = await fetch(`${API_BASE}/api/geo/autocomplete?${params.toString()}`);
        if (r.ok) {
          const data = await r.json();
          setPredictions(data.predictions || []);
        } else {
          setPredictions([]);
        }
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, latitude, longitude]);

  const onPick = async (p: Prediction) => {
    setPredictions([]);
    setQuery(p.description);
    setResolving(true);
    try {
      const r = await fetch(`${API_BASE}/api/geo/place-details?place_id=${encodeURIComponent(p.place_id)}`);
      if (!r.ok) throw new Error("Place details failed");
      const d = await r.json();
      onSelect({
        latitude: d.latitude,
        longitude: d.longitude,
        name: d.name,
        addressLine: d.address_line,
        area: d.area,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
      });
    } catch {
      // Silently ignore — user can still type the address manually.
    } finally {
      setResolving(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder || "Search for area, street..."}
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
        />
        {(loading || resolving) && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {predictions.length > 0 && (
        <View style={styles.dropdown}>
          {predictions.map((p) => (
            <TouchableOpacity key={p.place_id} style={styles.row} onPress={() => onPick(p)}>
              <MapPin size={14} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mainText} numberOfLines={1}>
                  {p.main_text}
                </Text>
                {!!p.secondary_text && (
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {p.secondary_text}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 14, color: colors.textMain },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: 6,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  mainText: { fontSize: 13, fontWeight: "600", color: colors.textMain },
  secondaryText: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
});
