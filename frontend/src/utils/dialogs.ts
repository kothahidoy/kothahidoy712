// Cross-platform confirm + info dialogs.
// On native iOS/Android we use the real RN `Alert.alert` (with button callbacks).
// On react-native-web `Alert.alert` ignores the buttons array, so we shim it
// with the browser's `window.confirm` / `window.alert`.
import { Alert, Platform } from "react-native";

export function confirmAsync(
  title: string,
  message?: string,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
): Promise<boolean> {
  if (Platform.OS === "web") {
    const text = [title, message].filter(Boolean).join("\n\n");
    return Promise.resolve(
      typeof window !== "undefined" ? window.confirm(text) : false,
    );
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") {
    const text = [title, message].filter(Boolean).join("\n\n");
    if (typeof window !== "undefined") window.alert(text);
    return;
  }
  Alert.alert(title, message);
}
