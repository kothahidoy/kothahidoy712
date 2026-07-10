import React, { useState } from "react";
import { View, TextInput, Button, Alert, Text } from "react-native";
import { supabase } from "@/src/lib/supabase";

export default function AddProvider() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");

  const handleAdd = async () => {
    if (!name || !phone || !service) {
      Alert.alert("Error", "All fields required");
      return;
    }

    const { error } = await supabase.from("providers").insert([
      {
        name,
        phone,
        service_type: service,
        is_available: true,
      },
    ]);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Provider Added");
      setName("");
      setPhone("");
      setService("");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Add Provider
      </Text>

      <TextInput
        placeholder="Name"
        onChangeText={setName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <TextInput
        placeholder="Phone"
        onChangeText={setPhone}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <TextInput
        placeholder="Service"
        onChangeText={setService}
        style={{ borderWidth: 1, marginBottom: 20, padding: 8 }}
      />

      <Button title="Add Provider" onPress={handleAdd} />
    </View>
  );
}
