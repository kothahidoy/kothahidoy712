import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCart } from "@/src/context/CartContext";
import { dataService } from "@/src/data/service";

export default function BookingNew() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { addToCart } = useCart();

  useEffect(() => {
    (async () => {
      if (serviceId) {
        const s = await dataService.getServiceById(serviceId);
        await addToCart(
          serviceId,
          1,
          s
            ? { title: s.title, image: s.image, price: s.startingPrice, category: s.category }
            : undefined
        );
      }
      router.replace("/booking/slot");
    })();
  }, [serviceId]);

  return null;
}
