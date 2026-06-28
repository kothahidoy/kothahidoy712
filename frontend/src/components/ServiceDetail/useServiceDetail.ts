import { useState, useEffect, useCallback } from "react";
import {
  ServiceDetailData,
  ServiceVariant,
  Review,
  FAQ,
  ProcessStep,
  SafetyTip,
  GalleryImage,
  LoveUsItem,
} from "./types";

// Category color configurations
export const CATEGORY_CONFIGS: Record<
  string,
  { color: string; bgColor: string; name: string }
> = {
  electrician: { color: "#059669", bgColor: "#F0FDF4", name: "Electrician" },
  salon: { color: "#BE185D", bgColor: "#FDF2F8", name: "Salon for Men" },
  "salon-women": { color: "#DB2777", bgColor: "#FDF2F8", name: "Salon for Women" },
  plumber: { color: "#0284C7", bgColor: "#F0F9FF", name: "Plumber" },
  cleaning: { color: "#16A34A", bgColor: "#F0FDF4", name: "Cleaning" },
  "cleaning-pest": { color: "#16A34A", bgColor: "#F0FDF4", name: "Cleaning & Pest" },
  "pest-control": { color: "#7C3AED", bgColor: "#F5F3FF", name: "Pest Control" },
  "ac-appliance": { color: "#0891B2", bgColor: "#ECFEFF", name: "AC & Appliance" },
  "ac-repair": { color: "#0891B2", bgColor: "#ECFEFF", name: "AC & Appliance" },
  painting: { color: "#D97706", bgColor: "#FFFBEB", name: "Painting" },
  carpenter: { color: "#B45309", bgColor: "#FEF3C7", name: "Carpenter" },
  "insta-help": { color: "#2563EB", bgColor: "#EFF6FF", name: "Insta Help" },
};

// Default process steps by category (fallback when admin has not configured)
export const DEFAULT_PROCESS_STEPS: Record<string, ProcessStep[]> = {
  electrician: [
    { step: 1, title: "Inspection", description: "Technician inspects the electrical issue" },
    { step: 2, title: "Quote approval", description: "You approve the repair quote or pay visitation charge" },
    { step: 3, title: "Repair work", description: "Expert completes the repair with quality parts" },
    { step: 4, title: "Warranty", description: "30-day warranty activated on repair" },
  ],
  salon: [
    { step: 1, title: "Consultation", description: "Understand your style preferences" },
    { step: 2, title: "Preparation", description: "Set up premium products and tools" },
    { step: 3, title: "Service", description: "Professional grooming service" },
    { step: 4, title: "Styling", description: "Final styling and finishing" },
  ],
  "salon-women": [
    { step: 1, title: "Skin analysis", description: "Understand your skin type and concerns" },
    { step: 2, title: "Cleansing", description: "Deep cleanse and prep skin" },
    { step: 3, title: "Treatment", description: "Professional beauty treatment" },
    { step: 4, title: "Aftercare", description: "Tips for maintaining results" },
  ],
  plumber: [
    { step: 1, title: "Issue diagnosis", description: "Identify the root cause of the plumbing issue" },
    { step: 2, title: "Quote approval", description: "Share repair quote for your approval" },
    { step: 3, title: "Repair work", description: "Fix the issue with quality materials" },
    { step: 4, title: "Testing", description: "Test for leaks and proper functioning" },
  ],
  cleaning: [
    { step: 1, title: "Assessment", description: "Assess the cleaning requirements" },
    { step: 2, title: "Deep cleaning", description: "Thorough cleaning with eco-friendly products" },
    { step: 3, title: "Sanitization", description: "Disinfect and sanitize surfaces" },
    { step: 4, title: "Final check", description: "Quality check and handover" },
  ],
  "pest-control": [
    { step: 1, title: "Inspection", description: "Identify pest type and infestation level" },
    { step: 2, title: "Treatment plan", description: "Customize treatment based on pest type" },
    { step: 3, title: "Application", description: "Apply safe and effective treatment" },
    { step: 4, title: "Prevention tips", description: "Guidance to prevent future infestations" },
  ],
  "ac-appliance": [
    { step: 1, title: "Diagnosis", description: "Check appliance for issues" },
    { step: 2, title: "Quote approval", description: "Transparent pricing before repair" },
    { step: 3, title: "Repair/Service", description: "Fix or service with genuine parts" },
    { step: 4, title: "Testing", description: "Thorough testing and warranty" },
  ],
  painting: [
    { step: 1, title: "Consultation", description: "Discuss color preferences and scope" },
    { step: 2, title: "Surface prep", description: "Prepare walls, fill cracks, apply primer" },
    { step: 3, title: "Painting", description: "Apply premium paint coats" },
    { step: 4, title: "Finishing", description: "Touch-ups and cleanup" },
  ],
  carpenter: [
    { step: 1, title: "Measurement", description: "Take precise measurements" },
    { step: 2, title: "Design approval", description: "Finalize design and materials" },
    { step: 3, title: "Crafting", description: "Expert carpentry work" },
    { step: 4, title: "Installation", description: "Install and quality check" },
  ],
};

export const DEFAULT_FAQS: Record<string, FAQ[]> = {
  electrician: [
    { id: "faq1", question: "Does the cost include spare parts?", answer: "No, the service cost covers labor only. Spare parts will be charged separately after approval." },
    { id: "faq2", question: "What if the issue recurs?", answer: "We offer 30-day warranty. If the same issue recurs, we'll fix it free of cost." },
  ],
  salon: [
    { id: "faq1", question: "Are the products sealed?", answer: "Yes, we use fresh, sealed products for every service. Hygiene is our priority." },
    { id: "faq2", question: "Can I customize my package?", answer: "Absolutely! Talk to the professional about your preferences before the service." },
  ],
  "salon-women": [
    { id: "faq1", question: "Is it suitable for sensitive skin?", answer: "Yes, we use hypoallergenic products. Please inform us about any allergies." },
    { id: "faq2", question: "How long does the service take?", answer: "Duration varies by service. Typically 30 mins to 2 hours." },
  ],
  plumber: [
    { id: "faq1", question: "Do you bring materials?", answer: "Basic materials are included. Specialized parts will be arranged if needed." },
    { id: "faq2", question: "Is there emergency service?", answer: "Yes, we offer same-day emergency plumbing services." },
  ],
  cleaning: [
    { id: "faq1", question: "Do you bring cleaning supplies?", answer: "Yes, our team comes fully equipped with eco-friendly cleaning supplies." },
    { id: "faq2", question: "How long does deep cleaning take?", answer: "Depends on home size. Typically 3-5 hours for a 2BHK." },
  ],
  "pest-control": [
    { id: "faq1", question: "Is the treatment safe for pets?", answer: "Yes, we use pet-safe, odorless chemicals. Keep pets away for 2-3 hours after treatment." },
    { id: "faq2", question: "How often should I get pest control?", answer: "We recommend quarterly treatment for best results." },
  ],
  "ac-appliance": [
    { id: "faq1", question: "Do you service all brands?", answer: "Yes, our technicians are trained on all major brands." },
    { id: "faq2", question: "What's covered in AC service?", answer: "Filter cleaning, gas check, foam cleaning, and performance testing." },
  ],
  painting: [
    { id: "faq1", question: "What paint brands do you use?", answer: "We use Asian Paints, Berger, Dulux, and other premium brands." },
    { id: "faq2", question: "Do you move furniture?", answer: "Yes, we carefully move and cover furniture. It'll be restored after completion." },
  ],
  carpenter: [
    { id: "faq1", question: "What materials do you use?", answer: "We use marine plywood, solid wood, and MDF based on your preference and budget." },
    { id: "faq2", question: "Can you match existing furniture?", answer: "Yes, our carpenters can match existing wood finish and style." },
  ],
};

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

// Helper functions for fallback defaults
function getDefaultImage(categoryId: string): string {
  const images: Record<string, string> = {
    electrician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
    salon: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=400&q=80",
    "salon-women": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80",
    plumber: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80",
    cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
    "pest-control": "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=400&q=80",
    "ac-appliance": "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=400&q=80",
    painting: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80",
    carpenter: "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=400&q=80",
  };
  return images[categoryId] || images.electrician;
}

function getDefaultInclusions(categoryId: string): string[] {
  const map: Record<string, string[]> = {
    electrician: ["Free safety inspection", "30-day service warranty", "Genuine spare parts", "Verified professionals"],
    salon: ["Sealed premium products", "Trained stylists", "Sanitized equipment", "Hygiene kit included"],
    "salon-women": ["Premium beauty products", "Certified beauticians", "Single-use products", "Post-service care tips"],
    plumber: ["Leak detection", "Quality materials", "30-day warranty", "Same-day service"],
    cleaning: ["All cleaning supplies", "Trained crew", "Eco-friendly chemicals", "Thorough sanitization"],
    "pest-control": ["Safe chemicals", "Pet-friendly options", "90-day warranty", "Follow-up visit"],
    "ac-appliance": ["Gas check", "Filter cleaning", "Performance testing", "30-day warranty"],
    painting: ["Premium paints", "Primer included", "Furniture protection", "Cleanup included"],
    carpenter: ["Quality materials", "Precise measurements", "Installation included", "30-day warranty"],
  };
  return map[categoryId] || map.electrician;
}

function getDefaultExclusions(categoryId: string): string[] {
  const map: Record<string, string[]> = {
    electrician: ["Major rewiring work", "Electrical panel replacement", "New connection installation"],
    salon: ["Hair coloring products not included", "Specialized treatments need advance booking"],
    "salon-women": ["Bridal packages not included", "Hair coloring extra"],
    plumber: ["Major pipeline work", "Borewell services", "Septic tank cleaning"],
    cleaning: ["Exterior cleaning", "Carpet shampooing", "Ceiling cleaning"],
    "pest-control": ["Termite treatment", "Fumigation", "Bird control"],
    "ac-appliance": ["Compressor replacement", "Gas refill charged separately"],
    painting: ["Exterior painting", "Waterproofing", "Texture work"],
    carpenter: ["Full furniture manufacturing", "Heavy structural work"],
  };
  return map[categoryId] || map.electrician;
}

function getDefaultBrands(categoryId: string): string[] {
  const map: Record<string, string[]> = {
    electrician: ["Havells", "Anchor", "Philips", "Crompton", "Syska", "Legrand"],
    salon: ["TIGI", "L'Oreal", "Wella", "Schwarzkopf", "Matrix"],
    "salon-women": ["VLCC", "O3+", "Lotus", "Biotique", "L'Oreal"],
    plumber: ["Jaquar", "Kohler", "Hindware", "Parryware", "Cera"],
    cleaning: ["Dettol", "Harpic", "Lizol", "Colin"],
    "pest-control": ["Bayer", "BASF", "Godrej"],
    "ac-appliance": ["Voltas", "LG", "Samsung", "Daikin", "Blue Star", "Carrier"],
    painting: ["Asian Paints", "Berger", "Dulux", "Nerolac"],
    carpenter: ["Century Ply", "Greenply", "Merino", "Kitply"],
  };
  return map[categoryId] || map.electrician;
}

function getDefaultCoverFeatures(categoryId: string): string[] {
  const map: Record<string, string[]> = {
    electrician: ["Up to 30 days warranty", "Verified electricians", "Quality spare parts", "Safety inspection included"],
    salon: ["Sealed products only", "Trained professionals", "Hygiene guaranteed", "Quality service"],
    "salon-women": ["Premium products", "Certified beauticians", "Skin-safe products", "Post-care tips"],
    plumber: ["30-day warranty", "Quality materials", "Same-day service", "No hidden charges"],
    cleaning: ["Eco-friendly products", "Trained crew", "Thorough sanitization", "Satisfaction guaranteed"],
    "pest-control": ["Safe for family", "Pet-friendly options", "90-day warranty", "Follow-up included"],
    "ac-appliance": ["Trained technicians", "Genuine parts", "30-day warranty", "All brands serviced"],
    painting: ["Premium paints", "Color consultation", "Neat finish", "Cleanup included"],
    carpenter: ["Quality materials", "Expert craftsmen", "Perfect finish", "30-day warranty"],
  };
  return map[categoryId] || map.electrician;
}

function getDefaultSafetyTips(categoryId: string): SafetyTip[] {
  const map: Record<string, SafetyTip[]> = {
    electrician: [
      { text: "Always turn off main switch before inspection", color: "#F59E0B", icon: "shield" },
      { text: "Our technicians carry voltage testers", color: "#10B981", icon: "check" },
      { text: "Earthing check included in all services", color: "#3B82F6", icon: "info" },
    ],
    plumber: [
      { text: "Shut off main water supply when needed", color: "#F59E0B", icon: "shield" },
      { text: "We bring leak-detection equipment", color: "#10B981", icon: "check" },
      { text: "All fittings tested before handover", color: "#3B82F6", icon: "info" },
    ],
    "ac-appliance": [
      { text: "AC unplugged before service for safety", color: "#F59E0B", icon: "shield" },
      { text: "Refrigerant handling certified", color: "#10B981", icon: "check" },
      { text: "Performance test after every job", color: "#3B82F6", icon: "info" },
    ],
    cleaning: [
      { text: "Eco-friendly, non-toxic chemicals", color: "#10B981", icon: "check" },
      { text: "Skilled & background-verified crew", color: "#3B82F6", icon: "info" },
      { text: "Cover heavy furniture before cleaning", color: "#F59E0B", icon: "shield" },
    ],
    "pest-control": [
      { text: "Keep food & utensils covered", color: "#F59E0B", icon: "shield" },
      { text: "Pet & child-safe chemicals", color: "#10B981", icon: "check" },
      { text: "Open windows 2 hrs after treatment", color: "#3B82F6", icon: "info" },
    ],
    painting: [
      { text: "Cover floors & furniture properly", color: "#F59E0B", icon: "shield" },
      { text: "Low-VOC premium paints used", color: "#10B981", icon: "check" },
      { text: "Ventilate rooms during work", color: "#3B82F6", icon: "info" },
    ],
    carpenter: [
      { text: "Eye-protection during cutting work", color: "#F59E0B", icon: "shield" },
      { text: "Quality hardware & marine ply", color: "#10B981", icon: "check" },
      { text: "Clean-up included after every job", color: "#3B82F6", icon: "info" },
    ],
    salon: [
      { text: "Sealed products opened in front of you", color: "#10B981", icon: "check" },
      { text: "Sanitised tools every visit", color: "#3B82F6", icon: "info" },
      { text: "Hygiene kit always carried", color: "#F59E0B", icon: "shield" },
    ],
    "salon-women": [
      { text: "Hypoallergenic premium products", color: "#10B981", icon: "check" },
      { text: "Female beauticians for safety", color: "#3B82F6", icon: "info" },
      { text: "Single-use disposables", color: "#F59E0B", icon: "shield" },
    ],
  };
  return map[categoryId] || map.electrician;
}

// ============================================================================
// MAIN HOOK
// ============================================================================
export function useServiceDetail(serviceId: string, categoryId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<ServiceDetailData | null>(null);

  const buildFromBackend = useCallback(
    (payload: any): ServiceDetailData => {
      const svc = payload.service || {};
      const categoryConfig =
        CATEGORY_CONFIGS[categoryId] || {
          color: "#2563EB",
          bgColor: "#EFF6FF",
          name: "Service",
        };
      const catId = svc.category_id || categoryId;
      const defImg = getDefaultImage(catId);

      // Variants from server (may include auto-generated)
      const rawVariants: any[] = Array.isArray(payload.variants) ? payload.variants : [];
      const variants: ServiceVariant[] = rawVariants.map((v: any) => ({
        id: String(v.id),
        name: v.name || "Standard",
        rating: Math.round((Number(v.rating) || 4.7) * 10) / 10,
        reviews:
          typeof v.review_count === "number"
            ? (v.review_count >= 1000
                ? `${(v.review_count / 1000).toFixed(1)}K`
                : `${v.review_count}`)
            : String(v.reviews || "0"),
        price: Number(v.price) || 0,
        originalPrice: v.original_price ? Number(v.original_price) : undefined,
        duration: v.duration_mins || svc.duration_mins || undefined,
        image: v.image || svc.image || defImg,
        features: Array.isArray(v.features) ? v.features : [],
      }));

      // Reviews from server (already filtered to 5★ by backend)
      const rawReviews: any[] = Array.isArray(payload.reviews) ? payload.reviews : [];
      const reviews: Review[] = rawReviews.map((r: any) => ({
        id: String(r.id),
        name: r.customer_name || "Customer",
        rating: Number(r.rating) || 5,
        date: formatReviewDate(r.created_at),
        comment: r.review_text || "",
        helpful: 0,
        // Empty string => no avatar set; ReviewCard renders initials fallback.
        avatar: r.customer_avatar || "",
      }));

      const safetyTipsRaw: any[] = Array.isArray(svc.safety_tips) ? svc.safety_tips : [];
      const safetyTips: SafetyTip[] =
        safetyTipsRaw.length > 0
          ? safetyTipsRaw.map((t: any) => ({
              text: t.text,
              color: t.color,
              icon: t.icon,
            }))
          : getDefaultSafetyTips(catId);

      const processRaw: any[] = Array.isArray(svc.process_steps) ? svc.process_steps : [];
      const process: ProcessStep[] =
        processRaw.length > 0
          ? processRaw.map((p: any, idx: number) => ({
              step: p.step || idx + 1,
              title: p.title || "",
              description: p.description || "",
              imageUrl: p.image_url || p.imageUrl || "",
            }))
          : DEFAULT_PROCESS_STEPS[catId] || DEFAULT_PROCESS_STEPS.electrician;

      const faqsRaw: any[] = Array.isArray(svc.faqs) ? svc.faqs : [];
      const faqs: FAQ[] =
        faqsRaw.length > 0
          ? faqsRaw.map((f: any, idx: number) => ({
              id: f.id || `faq${idx}`,
              question: f.question || "",
              answer: f.answer || "",
            }))
          : DEFAULT_FAQS[catId] || DEFAULT_FAQS.electrician;

      const inclusionsRaw: any = svc.inclusions;
      const inclusions: string[] =
        Array.isArray(inclusionsRaw) && inclusionsRaw.length > 0
          ? inclusionsRaw
          : getDefaultInclusions(catId);

      const exclusionsRaw: any = svc.exclusions;
      const exclusions: string[] =
        Array.isArray(exclusionsRaw) && exclusionsRaw.length > 0
          ? exclusionsRaw
          : getDefaultExclusions(catId);

      const brandsRaw: any = svc.brands;
      const brands: string[] =
        Array.isArray(brandsRaw) && brandsRaw.length > 0
          ? brandsRaw
          : getDefaultBrands(catId);

      const coverRaw: any = svc.cover_features;
      const coverFeatures: string[] =
        Array.isArray(coverRaw) && coverRaw.length > 0
          ? coverRaw
          : getDefaultCoverFeatures(catId);

      // Editable gallery ("Glow like never before" etc.)
      const galleryRaw: any[] = Array.isArray(svc.gallery_images) ? svc.gallery_images : [];
      const gallery: GalleryImage[] = galleryRaw
        .map((g: any) => ({
          imageUrl: g.image_url || g.imageUrl || "",
          badge: g.badge || "",
        }))
        .filter((g) => !!g.imageUrl);

      // Editable "Why women love us" / "Why we are loved"
      const loveRaw: any[] = Array.isArray(svc.loveus_items) ? svc.loveus_items : [];
      const loveUs: LoveUsItem[] = loveRaw
        .map((l: any) => ({
          icon: l.icon || "heart",
          color: l.color || "#DB2777",
          title: l.title || "",
          description: l.description || "",
        }))
        .filter((l) => !!l.title);

      return {
        id: String(svc.id || serviceId),
        title: svc.title || "Service",
        subtitle: svc.subtitle || "",
        shortDescription: svc.short_description || "",
        description: svc.description || "",
        rating: Number(svc.rating) || 4.7,
        reviewCount: formatReviewCount(svc.review_count),
        categoryName: categoryConfig.name,
        categoryColor: categoryConfig.color,
        categoryBgColor: categoryConfig.bgColor,
        heroImage: svc.hero_image || svc.image,
        variants,
        process,
        inclusions,
        exclusions,
        brands,
        reviews,
        faqs,
        warranty: svc.warranty || "30 days",
        coverFeatures,
        safetyTips,
        galleryTitle: svc.gallery_title || "",
        gallery,
        loveUsTitle: svc.loveus_title || "",
        loveUs,
      };
    },
    [categoryId, serviceId]
  );

  const buildFallback = useCallback((): ServiceDetailData => {
    const cfg =
      CATEGORY_CONFIGS[categoryId] || {
        color: "#2563EB",
        bgColor: "#EFF6FF",
        name: "Service",
      };
    return {
      id: serviceId,
      title: `${cfg.name} Service`,
      subtitle: "",
      description: `Professional ${cfg.name.toLowerCase()} service at your doorstep.`,
      rating: 4.75,
      reviewCount: "10K",
      categoryName: cfg.name,
      categoryColor: cfg.color,
      categoryBgColor: cfg.bgColor,
      heroImage: getDefaultImage(categoryId),
      variants: [
        {
          id: "standard",
          name: "Standard",
          rating: 4.75,
          reviews: "8K",
          price: 199,
          duration: 60,
          image: getDefaultImage(categoryId),
        },
      ],
      process: DEFAULT_PROCESS_STEPS[categoryId] || DEFAULT_PROCESS_STEPS.electrician,
      inclusions: getDefaultInclusions(categoryId),
      exclusions: getDefaultExclusions(categoryId),
      brands: getDefaultBrands(categoryId),
      reviews: [],
      faqs: DEFAULT_FAQS[categoryId] || DEFAULT_FAQS.electrician,
      warranty: "30 days",
      coverFeatures: getDefaultCoverFeatures(categoryId),
      safetyTips: getDefaultSafetyTips(categoryId),
    };
  }, [categoryId, serviceId]);

  const fetchServiceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!serviceId) {
      setServiceData(buildFallback());
      setLoading(false);
      return;
    }
    try {
      if (BACKEND_URL) {
        const url = `${BACKEND_URL}/api/services/${encodeURIComponent(serviceId)}/detail`;
        const res = await fetch(url);
        if (res.ok) {
          const payload = await res.json();
          setServiceData(buildFromBackend(payload));
          setLoading(false);
          return;
        } else if (res.status === 404) {
          // Service not found — show fallback rather than break the page
          setServiceData(buildFallback());
          setLoading(false);
          return;
        }
      }
      setServiceData(buildFallback());
    } catch (err) {
      console.warn("[useServiceDetail] fetch failed:", err);
      setServiceData(buildFallback());
    } finally {
      setLoading(false);
    }
  }, [serviceId, buildFromBackend, buildFallback]);

  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);

  return { loading, error, serviceData, refetch: fetchServiceData };
}

// ============================================================================
// Helpers
// ============================================================================
function formatReviewCount(count: any): string {
  const n = Number(count) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `${n}`;
}

function formatReviewDate(iso?: string): string {
  if (!iso) return "Recently";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 1) return "Today";
    if (diff < 2) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
    return `${Math.floor(diff / 365)} years ago`;
  } catch {
    return "Recently";
  }
}
