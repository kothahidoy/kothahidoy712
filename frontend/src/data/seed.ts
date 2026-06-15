// Curated seed data so the app feels alive immediately on first launch.
// When Supabase is configured the data layer fetches from Postgres instead,
// but the same shapes are reused.

import { Category, Offer, Professional, Service, SubService } from "@/src/types";

export const CITIES = ["Durgapur", "Burdwan", "Kolkata", "Asansol", "Howrah"];

export const CATEGORIES: Category[] = [
  { 
    id: "salon-women", 
    name: "Women's Salon", 
    icon: "Sparkles", 
    color: "#FCE7F3",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHw0fHxzcGElMjB0cmVhdG1lbnR8ZW58MHx8fHwxNzgxNDcxNzAzfDA&ixlib=rb-4.1.0&q=85&w=200"
  },
  { 
    id: "salon", 
    name: "Men's Salon", 
    icon: "Scissors", 
    color: "#FFEDD5",
    imageUrl: "https://images.unsplash.com/photo-1647140655214-e4a2d914971f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxiYXJiZXIlMjBoYWlyY3V0fGVufDB8fHx8MTc4MTQ3MTcwM3ww&ixlib=rb-4.1.0&q=85&w=200"
  },
  { 
    id: "cleaning", 
    name: "Cleaning & Pest Control", 
    icon: "Sparkles", 
    color: "#DCFCE7",
    imageUrl: "https://images.unsplash.com/photo-1686178827149-6d55c72d81df?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwyfHxjbGVhbmluZyUyMHNlcnZpY2V8ZW58MHx8fHwxNzgxNDcxNzAzfDA&ixlib=rb-4.1.0&q=85&w=200"
  },
  { 
    id: "painting", 
    name: "Home Painting", 
    icon: "PaintBucket", 
    color: "#FEF3C7",
    imageUrl: "https://images.unsplash.com/photo-1717281234297-3def5ae3eee1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHw0fHxwYWludGluZyUyMHdhbGx8ZW58MHx8fHwxNzgxNDcxNzAzfDA&ixlib=rb-4.1.0&q=85&w=200"
  },
  { 
    id: "ac-repair", 
    name: "AC & Appliance Repair", 
    icon: "Wind", 
    color: "#CFFAFE",
    imageUrl: "https://cdn.pixabay.com/photo/2021/09/08/07/20/air-conditioner-6605973_1280.jpg"
  },
  { 
    id: "electrician", 
    name: "Electrician", 
    icon: "Zap", 
    color: "#DBEAFE",
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwyfHxlbGVjdHJpY2lhbnxlbnwwfHx8fDE3ODE0NzE3MDN8MA&ixlib=rb-4.1.0&q=85&w=200"
  },
  { 
    id: "insta-help", 
    name: "Insta Help", 
    icon: "Zap", 
    color: "#FEE2E2",
    imageUrl: "https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=200"
  },
  { 
    id: "plumber", 
    name: "Plumber", 
    icon: "Droplets", 
    color: "#DBEAFE",
    imageUrl: "https://images.unsplash.com/photo-1676210134188-4c05dd172f89?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwzfHxwbHVtYmVyfGVufDB8fHx8MTc4MTQ3MTcwM3ww&ixlib=rb-4.1.0&q=85&w=200"
  },
  { 
    id: "carpenter", 
    name: "Carpenter", 
    icon: "Hammer", 
    color: "#FEE2E2",
    imageUrl: "https://images.unsplash.com/photo-1561297331-a9c00b9c2c44?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwyfHxjYXJwZW50ZXJ8ZW58MHx8fHwxNzgxNDcxNzAzfDA&ixlib=rb-4.1.0&q=85&w=200"
  },
];

// Urban Company style sub-services for AC & Appliance Repair category
export const AC_APPLIANCE_SUB_SERVICES: SubService[] = [
  {
    id: "sub-ac",
    categoryId: "ac-repair",
    name: "AC",
    imageUrl: "https://cdn.pixabay.com/photo/2021/09/08/07/20/air-conditioner-6605973_640.jpg",
    estimatedMins: 44,
    rating: 4.77,
    bookingCount: "13.6 M",
  },
  {
    id: "sub-washing",
    categoryId: "ac-repair",
    name: "Washing Machine",
    imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=200&q=80",
    estimatedMins: 60,
    rating: 4.65,
    bookingCount: "8.2 M",
  },
  {
    id: "sub-refrigerator",
    categoryId: "ac-repair",
    name: "Refrigerator",
    imageUrl: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=200&q=80",
    estimatedMins: 55,
    rating: 4.70,
    bookingCount: "5.4 M",
  },
  {
    id: "sub-tv",
    categoryId: "ac-repair",
    name: "Television",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=200&q=80",
    estimatedMins: 44,
    rating: 4.55,
    bookingCount: "3.1 M",
  },
  {
    id: "sub-chimney",
    categoryId: "ac-repair",
    name: "Chimney",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80",
    estimatedMins: 44,
    rating: 4.60,
    bookingCount: "2.8 M",
  },
  {
    id: "sub-microwave",
    categoryId: "ac-repair",
    name: "Microwave",
    imageUrl: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=200&q=80",
    estimatedMins: 40,
    rating: 4.50,
    bookingCount: "1.9 M",
  },
  {
    id: "sub-geyser",
    categoryId: "ac-repair",
    name: "Geyser",
    imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80",
    estimatedMins: 35,
    rating: 4.68,
    bookingCount: "4.2 M",
  },
  {
    id: "sub-water-purifier",
    categoryId: "ac-repair",
    name: "RO/Water Purifier",
    imageUrl: "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=200&q=80",
    estimatedMins: 30,
    rating: 4.72,
    bookingCount: "6.5 M",
  },
];

const IMG = {
  electrician:
    "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBob21lJTIwcmVwYWlyJTIwdGVjaG5pY2lhbnxlbnwwfHx8fDE3ODAwNzU4MzF8MA&ixlib=rb-4.1.0&q=85&w=800",
  electronics:
    "https://images.pexels.com/photos/32391508/pexels-photo-32391508.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=800",
  cleaning:
    "https://images.pexels.com/photos/6195274/pexels-photo-6195274.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=800",
  deepCleaning:
    "https://images.pexels.com/photos/6196694/pexels-photo-6196694.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=800",
  repair:
    "https://images.unsplash.com/photo-1660330589693-99889d60181e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBob21lJTIwcmVwYWlyJTIwdGVjaG5pY2lhbnxlbnwwfHx8fDE3ODAwNzU4MzF8MA&ixlib=rb-4.1.0&q=85&w=800",
  ac: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=800&q=80",
  plumber:
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
  painting:
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
  carpenter:
    "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=800&q=80",
  salon:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  pest:
    "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=800&q=80",
  fridge:
    "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
};

export const SERVICES: Service[] = [
  {
    id: "svc-elec-1",
    categoryId: "electrician",
    title: "Electrical Wiring & Switch Fix",
    description:
      "Trusted electricians for switchboard repair, fan installation, MCB issues, short-circuit fixing and full home wiring inspection.",
    startingPrice: 199,
    durationMins: 60,
    rating: 4.8,
    reviewCount: 1240,
    image: IMG.electrician,
    popular: true,
    topRated: true,
    inclusions: [
      "Free safety inspection",
      "30-day service warranty",
      "Genuine spare parts",
      "Verified professionals",
    ],
  },
  {
    id: "svc-elec-2",
    categoryId: "electrician",
    title: "Fan Installation / Repair",
    description:
      "Ceiling fan, exhaust fan & wall fan installation, regulator replacement and noise diagnosis by certified pros.",
    startingPrice: 149,
    durationMins: 45,
    rating: 4.7,
    reviewCount: 820,
    image: IMG.repair,
    recommended: true,
  },
  {
    id: "svc-plumb-1",
    categoryId: "plumber",
    title: "Tap, Basin & Pipe Leak Fix",
    description:
      "Same-day plumbing repair for leaking taps, blocked drains, basin install and water tank fitting.",
    startingPrice: 179,
    durationMins: 50,
    rating: 4.7,
    reviewCount: 690,
    image: IMG.plumber,
    popular: true,
    inclusions: ["Leak detection", "Pipe sealant included", "30-day warranty"],
  },
  {
    id: "svc-ac-1",
    categoryId: "ac-repair",
    title: "AC Service & Deep Cleaning",
    description:
      "Foam-jet deep clean, gas check & filter wash. Restores cooling and cuts power bill instantly.",
    startingPrice: 499,
    durationMins: 75,
    rating: 4.9,
    reviewCount: 2150,
    image: IMG.ac,
    popular: true,
    topRated: true,
    recommended: true,
    inclusions: [
      "Foam-jet chemical wash",
      "Gas pressure check",
      "Filter cleaning",
      "30-day service guarantee",
    ],
  },
  {
    id: "svc-ac-2",
    categoryId: "ac-repair",
    title: "AC Installation",
    description: "Split & window AC install with copper piping & test run.",
    startingPrice: 1499,
    durationMins: 120,
    rating: 4.6,
    reviewCount: 340,
    image: IMG.ac,
  },
  {
    id: "svc-clean-1",
    categoryId: "cleaning",
    title: "Full Home Deep Cleaning",
    description:
      "Bathroom, kitchen, sofa & floor — chemical & machine deep clean by trained crew with all supplies.",
    startingPrice: 1299,
    durationMins: 240,
    rating: 4.8,
    reviewCount: 3120,
    image: IMG.cleaning,
    popular: true,
    topRated: true,
    inclusions: ["All cleaning supplies", "Trained 2-person crew", "Eco-friendly chemicals"],
  },
  {
    id: "svc-clean-2",
    categoryId: "cleaning",
    title: "Bathroom Deep Clean",
    description:
      "Tile scrubbing, descaling, fittings polish & sanitisation — 90 minute job.",
    startingPrice: 399,
    durationMins: 90,
    rating: 4.7,
    reviewCount: 1480,
    image: IMG.deepCleaning,
    recommended: true,
  },
  {
    id: "svc-carp-1",
    categoryId: "carpenter",
    title: "Furniture Repair & Polish",
    description: "Door alignment, hinge repair, polish and minor furniture fix.",
    startingPrice: 249,
    durationMins: 60,
    rating: 4.6,
    reviewCount: 520,
    image: IMG.carpenter,
  },
  {
    id: "svc-paint-1",
    categoryId: "painting",
    title: "Room Painting (per wall)",
    description: "Premium emulsion, primer & finish. Furniture protected.",
    startingPrice: 899,
    durationMins: 360,
    rating: 4.7,
    reviewCount: 410,
    image: IMG.painting,
    recommended: true,
  },
  {
    id: "svc-appl-1",
    categoryId: "appliance",
    title: "Refrigerator Repair",
    description: "Cooling issues, gas refill, compressor & fan repair on the spot.",
    startingPrice: 299,
    durationMins: 60,
    rating: 4.6,
    reviewCount: 780,
    image: IMG.fridge,
  },
  {
    id: "svc-appl-2",
    categoryId: "appliance",
    title: "Washing Machine Repair",
    description: "Front load / top load diagnostic, motor & drum repair.",
    startingPrice: 279,
    durationMins: 60,
    rating: 4.7,
    reviewCount: 960,
    image: IMG.electronics,
    popular: true,
  },
  {
    id: "svc-salon-1",
    categoryId: "salon",
    title: "Salon at Home — Women",
    description:
      "Hair, facial, waxing, mani-pedi by trained beauticians at your doorstep with sealed products.",
    startingPrice: 599,
    durationMins: 90,
    rating: 4.9,
    reviewCount: 4120,
    image: IMG.salon,
    topRated: true,
    popular: true,
  },
  {
    id: "svc-pest-1",
    categoryId: "pest-control",
    title: "General Pest Control",
    description: "Cockroach, ant & spider gel treatment. Odour-less, child safe.",
    startingPrice: 899,
    durationMins: 120,
    rating: 4.7,
    reviewCount: 670,
    image: IMG.pest,
  },
];

export const PROFESSIONALS: Professional[] = [
  {
    id: "pro-1",
    name: "Rakesh Kumar",
    avatar: "https://i.pravatar.cc/200?img=12",
    rating: 4.9,
    reviewCount: 1820,
    experienceYears: 8,
    verified: true,
    category: "electrician",
  },
  {
    id: "pro-2",
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/200?img=47",
    rating: 4.9,
    reviewCount: 2450,
    experienceYears: 6,
    verified: true,
    category: "salon",
  },
  {
    id: "pro-3",
    name: "Imran Ali",
    avatar: "https://i.pravatar.cc/200?img=33",
    rating: 4.8,
    reviewCount: 1340,
    experienceYears: 10,
    verified: true,
    category: "ac-repair",
  },
  {
    id: "pro-4",
    name: "Suman Das",
    avatar: "https://i.pravatar.cc/200?img=68",
    rating: 4.8,
    reviewCount: 980,
    experienceYears: 7,
    verified: true,
    category: "cleaning",
  },
];

export const OFFERS: Offer[] = [
  {
    id: "off-1",
    title: "First Booking? Get 30% OFF",
    subtitle: "Up to ₹300 off on your first service",
    code: "MFIX30",
    discountPercent: 30,
    validUntil: "2026-12-31",
    bannerUrl:
      "https://static.prod-images.emergentagent.com/jobs/cfc1abea-ed02-4767-9c68-7336c3e0b181/images/ed1d5989654b55b06f6c168024d8b38468ecc7408a4cd1f1736ac1ed5ce7891e.png",
    bgColor: "#2563EB",
  },
  {
    id: "off-2",
    title: "AC Service Bonanza",
    subtitle: "Flat ₹150 off on all AC services",
    code: "COOLAC",
    discountPercent: 20,
    validUntil: "2026-09-30",
    bannerUrl:
      "https://static.prod-images.emergentagent.com/jobs/cfc1abea-ed02-4767-9c68-7336c3e0b181/images/d8c51e30b16bbc14bafcf5ada0c2972abbfee50d9ecb3a445e0dee659134457e.png",
    bgColor: "#0EA5E9",
  },
  {
    id: "off-3",
    title: "Weekend Deep Clean",
    subtitle: "25% off on full home cleaning, Sat/Sun only",
    code: "WEEKEND25",
    discountPercent: 25,
    validUntil: "2026-12-31",
    bannerUrl:
      "https://images.pexels.com/photos/6195274/pexels-photo-6195274.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=800",
    bgColor: "#16A34A",
  },
];

export const TIME_SLOTS = [
  "08:00 AM",
  "09:30 AM",
  "11:00 AM",
  "12:30 PM",
  "02:00 PM",
  "03:30 PM",
  "05:00 PM",
  "06:30 PM",
];
