import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/src/lib/supabase";
import { ServiceDetailData, ServiceVariant, Review, FAQ, ProcessStep } from "./types";

// Category color configurations
export const CATEGORY_CONFIGS: Record<string, { color: string; bgColor: string; name: string }> = {
  electrician: { color: "#059669", bgColor: "#F0FDF4", name: "Electrician" },
  salon: { color: "#BE185D", bgColor: "#FDF2F8", name: "Salon for Men" },
  "salon-women": { color: "#DB2777", bgColor: "#FDF2F8", name: "Salon for Women" },
  plumber: { color: "#0284C7", bgColor: "#F0F9FF", name: "Plumber" },
  cleaning: { color: "#16A34A", bgColor: "#F0FDF4", name: "Cleaning" },
  "pest-control": { color: "#7C3AED", bgColor: "#F5F3FF", name: "Pest Control" },
  "ac-appliance": { color: "#0891B2", bgColor: "#ECFEFF", name: "AC & Appliance" },
  "ac-repair": { color: "#0891B2", bgColor: "#ECFEFF", name: "AC & Appliance" },
  painting: { color: "#D97706", bgColor: "#FFFBEB", name: "Painting" },
  carpenter: { color: "#B45309", bgColor: "#FEF3C7", name: "Carpenter" },
};

// Default process steps by category
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
  "ac-repair": [
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

// Default FAQs by category
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
  "ac-repair": [
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

// Default reviews (fallback)
const DEFAULT_REVIEWS: Review[] = [
  {
    id: "1",
    name: "Satisfied Customer",
    rating: 5,
    date: "Recently",
    comment: "Excellent service! Very professional and completed on time. Highly recommended!",
    helpful: 25,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
  },
];

export function useServiceDetail(serviceId: string, categoryId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<ServiceDetailData | null>(null);

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoryConfig = CATEGORY_CONFIGS[categoryId] || {
        color: "#2563EB",
        bgColor: "#EFF6FF",
        name: "Service",
      };

      if (isSupabaseConfigured && supabase) {
        // Fetch service from Supabase
        const { data: service, error: serviceError } = await supabase
          .from("services")
          .select("*")
          .eq("id", serviceId)
          .single();

        if (serviceError || !service) {
          // Try fetching by title match or similar
          const { data: services } = await supabase
            .from("services")
            .select("*")
            .eq("category_id", categoryId)
            .limit(1);

          if (services && services.length > 0) {
            const svc = services[0];
            const serviceDetail = buildServiceDetail(svc, categoryConfig, categoryId);
            setServiceData(serviceDetail);
          } else {
            // Use fallback data
            setServiceData(buildFallbackService(serviceId, categoryConfig, categoryId));
          }
        } else {
          const serviceDetail = buildServiceDetail(service, categoryConfig, categoryId);
          setServiceData(serviceDetail);
        }
      } else {
        // Fallback for when Supabase is not configured
        setServiceData(buildFallbackService(serviceId, categoryConfig, categoryId));
      }
    } catch (err) {
      console.error("Error fetching service:", err);
      setError("Failed to load service details");
    } finally {
      setLoading(false);
    }
  };

  const buildServiceDetail = (
    service: any,
    categoryConfig: { color: string; bgColor: string; name: string },
    catId: string
  ): ServiceDetailData => {
    // Build variants from the service
    const variants: ServiceVariant[] = [
      {
        id: "standard",
        name: "Standard",
        rating: Number(service.rating) || 4.7,
        reviews: service.review_count ? `${service.review_count}` : "1K",
        price: Number(service.starting_price) || 199,
        duration: service.duration_mins,
        image: service.image || getDefaultImage(catId),
      },
    ];

    // Add premium variant if applicable
    if (Number(service.starting_price) > 100) {
      variants.push({
        id: "premium",
        name: "Premium",
        rating: (Number(service.rating) || 4.7) + 0.1,
        reviews: Math.floor((service.review_count || 1000) * 0.3) + "K",
        price: Math.round((Number(service.starting_price) || 199) * 1.5),
        originalPrice: Math.round((Number(service.starting_price) || 199) * 1.8),
        duration: (service.duration_mins || 60) + 30,
        image: service.image || getDefaultImage(catId),
      });
    }

    return {
      id: service.id,
      title: service.title,
      description: service.description,
      rating: Number(service.rating) || 4.7,
      reviewCount: service.review_count ? `${service.review_count}` : "1K",
      categoryName: categoryConfig.name,
      categoryColor: categoryConfig.color,
      categoryBgColor: categoryConfig.bgColor,
      heroImage: service.image,
      variants,
      process: DEFAULT_PROCESS_STEPS[catId] || DEFAULT_PROCESS_STEPS.electrician,
      inclusions: service.inclusions || getDefaultInclusions(catId),
      exclusions: getDefaultExclusions(catId),
      brands: getDefaultBrands(catId),
      reviews: DEFAULT_REVIEWS,
      faqs: DEFAULT_FAQS[catId] || DEFAULT_FAQS.electrician,
      warranty: "30 days",
      coverFeatures: getDefaultCoverFeatures(catId),
    };
  };

  const buildFallbackService = (
    svcId: string,
    categoryConfig: { color: string; bgColor: string; name: string },
    catId: string
  ): ServiceDetailData => {
    return {
      id: svcId,
      title: `${categoryConfig.name} Service`,
      description: `Professional ${categoryConfig.name.toLowerCase()} service at your doorstep.`,
      rating: 4.75,
      reviewCount: "10K",
      categoryName: categoryConfig.name,
      categoryColor: categoryConfig.color,
      categoryBgColor: categoryConfig.bgColor,
      heroImage: getDefaultImage(catId),
      variants: [
        {
          id: "standard",
          name: "Standard Service",
          rating: 4.75,
          reviews: "8K",
          price: 199,
          duration: 60,
          image: getDefaultImage(catId),
        },
        {
          id: "premium",
          name: "Premium Service",
          rating: 4.85,
          reviews: "2K",
          price: 349,
          originalPrice: 449,
          duration: 90,
          image: getDefaultImage(catId),
        },
      ],
      process: DEFAULT_PROCESS_STEPS[catId] || DEFAULT_PROCESS_STEPS.electrician,
      inclusions: getDefaultInclusions(catId),
      exclusions: getDefaultExclusions(catId),
      brands: getDefaultBrands(catId),
      reviews: DEFAULT_REVIEWS,
      faqs: DEFAULT_FAQS[catId] || DEFAULT_FAQS.electrician,
      warranty: "30 days",
      coverFeatures: getDefaultCoverFeatures(catId),
    };
  };

  useEffect(() => {
    fetchServiceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, categoryId]);

  return { loading, error, serviceData, refetch: fetchServiceData };
}

// Helper functions for default data
function getDefaultImage(categoryId: string): string {
  const images: Record<string, string> = {
    electrician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
    salon: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=400&q=80",
    "salon-women": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80",
    plumber: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80",
    cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
    "pest-control": "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=400&q=80",
    "ac-appliance": "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=400&q=80",
    "ac-repair": "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=400&q=80",
    painting: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80",
    carpenter: "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=400&q=80",
  };
  return images[categoryId] || images.electrician;
}

function getDefaultInclusions(categoryId: string): string[] {
  const inclusions: Record<string, string[]> = {
    electrician: ["Free safety inspection", "30-day service warranty", "Genuine spare parts", "Verified professionals"],
    salon: ["Sealed premium products", "Trained stylists", "Sanitized equipment", "Hygiene kit included"],
    "salon-women": ["Premium beauty products", "Certified beauticians", "Single-use products", "Post-service care tips"],
    plumber: ["Leak detection", "Quality materials", "30-day warranty", "Same-day service"],
    cleaning: ["All cleaning supplies", "Trained crew", "Eco-friendly chemicals", "Thorough sanitization"],
    "pest-control": ["Safe chemicals", "Pet-friendly options", "90-day warranty", "Follow-up visit"],
    "ac-appliance": ["Gas check", "Filter cleaning", "Performance testing", "30-day warranty"],
    "ac-repair": ["Gas check", "Filter cleaning", "Performance testing", "30-day warranty"],
    painting: ["Premium paints", "Primer included", "Furniture protection", "Cleanup included"],
    carpenter: ["Quality materials", "Precise measurements", "Installation included", "30-day warranty"],
  };
  return inclusions[categoryId] || inclusions.electrician;
}

function getDefaultExclusions(categoryId: string): string[] {
  const exclusions: Record<string, string[]> = {
    electrician: ["Major rewiring work", "Electrical panel replacement", "New connection installation"],
    salon: ["Hair coloring products not included", "Specialized treatments need advance booking"],
    "salon-women": ["Bridal packages not included", "Hair coloring extra"],
    plumber: ["Major pipeline work", "Borewell services", "Septic tank cleaning"],
    cleaning: ["Exterior cleaning", "Carpet shampooing", "Ceiling cleaning"],
    "pest-control": ["Termite treatment", "Fumigation", "Bird control"],
    "ac-appliance": ["Compressor replacement", "Gas refill charged separately"],
    "ac-repair": ["Compressor replacement", "Gas refill charged separately"],
    painting: ["Exterior painting", "Waterproofing", "Texture work"],
    carpenter: ["Full furniture manufacturing", "Heavy structural work"],
  };
  return exclusions[categoryId] || exclusions.electrician;
}

function getDefaultBrands(categoryId: string): string[] {
  const brands: Record<string, string[]> = {
    electrician: ["Havells", "Anchor", "Philips", "Crompton", "Syska", "Legrand", "& more"],
    salon: ["TIGI", "L'Oreal", "Wella", "Schwarzkopf", "Matrix", "& more"],
    "salon-women": ["VLCC", "O3+", "Lotus", "Biotique", "L'Oreal", "& more"],
    plumber: ["Jaquar", "Kohler", "Hindware", "Parryware", "Cera", "& more"],
    cleaning: ["Dettol", "Harpic", "Lizol", "Colin", "& more"],
    "pest-control": ["Bayer", "BASF", "Godrej", "& more"],
    "ac-appliance": ["Voltas", "LG", "Samsung", "Daikin", "Blue Star", "Carrier", "& more"],
    "ac-repair": ["Voltas", "LG", "Samsung", "Daikin", "Blue Star", "Carrier", "& more"],
    painting: ["Asian Paints", "Berger", "Dulux", "Nerolac", "& more"],
    carpenter: ["Century Ply", "Greenply", "Merino", "Kitply", "& more"],
  };
  return brands[categoryId] || brands.electrician;
}

function getDefaultCoverFeatures(categoryId: string): string[] {
  const features: Record<string, string[]> = {
    electrician: ["Up to 30 days warranty", "Verified electricians", "Quality spare parts", "Safety inspection included"],
    salon: ["Sealed products only", "Trained professionals", "Hygiene guaranteed", "Quality service"],
    "salon-women": ["Premium products", "Certified beauticians", "Skin-safe products", "Post-care tips"],
    plumber: ["30-day warranty", "Quality materials", "Same-day service", "No hidden charges"],
    cleaning: ["Eco-friendly products", "Trained crew", "Thorough sanitization", "Satisfaction guaranteed"],
    "pest-control": ["Safe for family", "Pet-friendly options", "90-day warranty", "Follow-up included"],
    "ac-appliance": ["Trained technicians", "Genuine parts", "30-day warranty", "All brands serviced"],
    "ac-repair": ["Trained technicians", "Genuine parts", "30-day warranty", "All brands serviced"],
    painting: ["Premium paints", "Color consultation", "Neat finish", "Cleanup included"],
    carpenter: ["Quality materials", "Expert craftsmen", "Perfect finish", "30-day warranty"],
  };
  return features[categoryId] || features.electrician;
}
