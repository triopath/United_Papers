/**
 * SYNTHETIC DEMO DATA. Prices, costs, stock and company names are invented for the
 * demonstration and are not real United Papers commercial terms.
 */

export const categories = [
  { slug: "cups-lids", name: "Paper Cups & Lids", description: "Hot and cold cups with lids that fit." },
  { slug: "food-containers", name: "Food Containers", description: "Takeout containers, clamshells and bowls." },
  { slug: "foil-pans", name: "Aluminum Foil & Pans", description: "Foil rolls, sheets and steam-table pans." },
  { slug: "paper-bags", name: "Paper Bags", description: "Kraft and handled bags for takeout." },
  { slug: "cutlery-utensils", name: "Cutlery & Utensils", description: "Forks, spoons, knives and kits." },
  { slug: "trash-liners", name: "Trash Liners", description: "Commercial can liners in every size." },
  { slug: "napkins-towels", name: "Napkins & Towels", description: "Dispenser napkins, dinner napkins, towels." },
  { slug: "cleaning-supplies", name: "Cleaning & Restaurant Supplies", description: "Gloves, sanitizer and back-of-house basics." },
];

export const suppliers = [
  { name: "Great Lakes Paper Co. (demo)", contactName: "Demo Contact A", email: "orders@greatlakes.example.test", leadTimeDays: 5, minOrderCases: 25 },
  { name: "Pacific Pack Co. (demo)", contactName: "Demo Contact B", email: "orders@pacificpack.example.test", leadTimeDays: 4, minOrderCases: 50 },
  { name: "Midwest Foil Supply (demo)", contactName: "Demo Contact C", email: "sales@midwestfoil.example.test", leadTimeDays: 3, minOrderCases: 24 },
  { name: "Lakeshore Poly (demo)", contactName: "Demo Contact D", email: "po@lakeshorepoly.example.test", leadTimeDays: 5, minOrderCases: 40 },
  { name: "SafeHand Supply (demo)", contactName: "Demo Contact E", email: "orders@safehand.example.test", leadTimeDays: 6, minOrderCases: 20 },
];

interface V {
  sku: string;
  name: string;
  pack: string;
  units: number;
  price: number;
  onHand: number;
  reorder: number;
  specs?: Record<string, string>;
}
interface P {
  slug: string;
  name: string;
  category: string;
  supplier: string;
  kind: string;
  description: string;
  imageUrl?: string;
  cost: number; // cost as a fraction of selling price
  variants: V[];
}

export const products: P[] = [
  {
    slug: "hot-paper-cups-navy", name: "Hot Paper Cups — UP Navy Print", category: "cups-lids", supplier: "Great Lakes", kind: "cup",
    imageUrl: "/brand/up-cup.jpg", cost: 0.66,
    description: "Single-wall, poly-lined paperboard hot cups in United Papers navy and white. Pairs with 90 mm sip and dome lids.",
    variants: [
      { sku: "UP-CUP-H08", name: "8 oz", pack: "Case of 1,000", units: 1000, price: 27.5, onHand: 180, reorder: 40, specs: { Capacity: "8 oz", "Rim size": "80 mm", Material: "Paperboard, PE lined" } },
      { sku: "UP-CUP-H12", name: "12 oz", pack: "Case of 1,000", units: 1000, price: 30.8, onHand: 220, reorder: 50, specs: { Capacity: "12 oz", "Rim size": "90 mm", Material: "Paperboard, PE lined" } },
      { sku: "UP-CUP-H16", name: "16 oz", pack: "Case of 1,000", units: 1000, price: 34, onHand: 240, reorder: 60, specs: { Capacity: "16 oz", "Rim size": "90 mm", Material: "Paperboard, PE lined" } },
      { sku: "UP-CUP-H20", name: "20 oz", pack: "Case of 600", units: 600, price: 29.4, onHand: 90, reorder: 30, specs: { Capacity: "20 oz", "Rim size": "90 mm", Material: "Paperboard, PE lined" } },
    ],
  },
  {
    slug: "clear-pet-cold-cups", name: "Clear PET Cold Cups", category: "cups-lids", supplier: "Great Lakes", kind: "coldcup", cost: 0.7,
    description: "Crystal-clear PET cups for iced coffee, smoothies and sodas. Use with 98 mm dome or flat lids.",
    variants: [
      { sku: "UP-CUP-C16", name: "16 oz", pack: "Case of 1,000", units: 1000, price: 46, onHand: 140, reorder: 25, specs: { Capacity: "16 oz", "Rim size": "98 mm", Material: "PET plastic" } },
      { sku: "UP-CUP-C24", name: "24 oz", pack: "Case of 600", units: 600, price: 39.6, onHand: 12, reorder: 20, specs: { Capacity: "24 oz", "Rim size": "98 mm", Material: "PET plastic" } },
    ],
  },
  {
    slug: "sip-lids-90mm", name: "Hot Cup Sip Lids — 90 mm", category: "cups-lids", supplier: "Great Lakes", kind: "lid", cost: 0.64,
    description: "Snap-on sip-through lids that fit all 12, 16 and 20 oz United Papers hot cups.",
    variants: [
      { sku: "UP-LID-H90B", name: "Black", pack: "Case of 1,000", units: 1000, price: 28.5, onHand: 198, reorder: 60, specs: { "Fits rim": "90 mm", Color: "Black" } },
      { sku: "UP-LID-H90W", name: "White", pack: "Case of 1,000", units: 1000, price: 28.5, onHand: 150, reorder: 60, specs: { "Fits rim": "90 mm", Color: "White" } },
    ],
  },
  {
    slug: "dome-lids-98mm", name: "Clear Dome Lids with Straw Hole — 98 mm", category: "cups-lids", supplier: "Great Lakes", kind: "lid", cost: 0.66,
    description: "Domed lids for smoothies and iced drinks with whipped toppings.",
    variants: [{ sku: "UP-LID-D98", name: "98 mm", pack: "Case of 1,000", units: 1000, price: 33.9, onHand: 110, reorder: 30, specs: { "Fits rim": "98 mm", Material: "PET" } }],
  },
  {
    slug: "black-pp-containers", name: "Black PP Rectangle Containers with Lids", category: "food-containers", supplier: "Pacific", kind: "container", cost: 0.72,
    description: "Microwave-safe, reusable black base with clear lid. Great for meal prep and takeout.",
    variants: [
      { sku: "UP-BOX-PP16", name: "16 oz", pack: "Case of 150 sets", units: 150, price: 32, onHand: 60, reorder: 25, specs: { Capacity: "16 oz", Microwave: "Yes" } },
      { sku: "UP-BOX-PP24", name: "24 oz", pack: "Case of 150 sets", units: 150, price: 36.5, onHand: 85, reorder: 25, specs: { Capacity: "24 oz", Microwave: "Yes" } },
      { sku: "UP-BOX-PP32", name: "32 oz", pack: "Case of 150 sets", units: 150, price: 42, onHand: 40, reorder: 30, specs: { Capacity: "32 oz", Microwave: "Yes" } },
      { sku: "UP-BOX-PP48", name: "48 oz", pack: "Case of 150 sets", units: 150, price: 48, onHand: 55, reorder: 20, specs: { Capacity: "48 oz", Microwave: "Yes" } },
    ],
  },
  {
    slug: "hinged-fiber-clamshells", name: "Hinged Fiber Clamshells", category: "food-containers", supplier: "Pacific", kind: "clamshell", cost: 0.71,
    description: "Molded-fiber hinged containers with secure latch. Great for burgers, wraps and plates.",
    variants: [
      { sku: "UP-CLAM-66", name: "6 × 6 in", pack: "Case of 500", units: 500, price: 41, onHand: 70, reorder: 20, specs: { Size: "6 × 6 × 3 in", Material: "Molded fiber" } },
      { sku: "UP-CLAM-99", name: "9 × 9 in", pack: "Case of 200", units: 200, price: 54, onHand: 64, reorder: 20, specs: { Size: "9 × 9 × 3 in", Material: "Molded fiber" } },
    ],
  },
  {
    slug: "kraft-salad-bowls", name: "Kraft Salad Bowls with Lids", category: "food-containers", supplier: "Pacific", kind: "bowl", cost: 0.7,
    description: "Kraft paper bowls with clear PET lids for salads, grain bowls and soups.",
    variants: [{ sku: "UP-BOWL-K32", name: "32 oz", pack: "Case of 300 sets", units: 300, price: 58, onHand: 48, reorder: 15, specs: { Capacity: "32 oz", Material: "Kraft paper, PE lined" } }],
  },
  {
    slug: "aluminum-foil-rolls", name: "Heavy-Duty Aluminum Foil Rolls", category: "foil-pans", supplier: "Midwest", kind: "foil", cost: 0.8,
    description: "Commercial-grade foil rolls for wrapping, lining and covering.",
    variants: [
      { sku: "UP-FOIL-R12", name: '12" × 500 ft', pack: "Roll", units: 1, price: 22.5, onHand: 60, reorder: 15, specs: { Width: "12 in", Length: "500 ft" } },
      { sku: "UP-FOIL-R18", name: '18" × 500 ft', pack: "Roll", units: 1, price: 29.75, onHand: 30, reorder: 24, specs: { Width: "18 in", Length: "500 ft" } },
    ],
  },
  {
    slug: "steam-table-pans", name: "Aluminum Steam Table Pans", category: "foil-pans", supplier: "Midwest", kind: "pan", cost: 0.74,
    description: "Disposable pans for catering and hot-holding. Sold by the case.",
    variants: [
      { sku: "UP-PAN-HD", name: "Half-size deep", pack: "Case of 100", units: 100, price: 64, onHand: 40, reorder: 12, specs: { Size: "Half, 2.5 in deep" } },
      { sku: "UP-PAN-FD", name: "Full-size deep", pack: "Case of 50", units: 50, price: 59, onHand: 28, reorder: 10, specs: { Size: "Full, 2.5 in deep" } },
    ],
  },
  {
    slug: "foil-popup-sheets", name: "Pop-Up Foil Sheets", category: "foil-pans", supplier: "Midwest", kind: "foil", cost: 0.76,
    description: "Interfolded foil sheets, ready to wrap sandwiches and burritos.",
    variants: [{ sku: "UP-FOIL-S12", name: '12" × 10.75"', pack: "Case of 3,000", units: 3000, price: 38, onHand: 35, reorder: 10, specs: { Size: '12 × 10.75 in' } }],
  },
  {
    slug: "kraft-paper-bags", name: "Kraft Paper Bags — 60 lb", category: "paper-bags", supplier: "Great Lakes", kind: "bag", cost: 0.7,
    description: "Strong, plain kraft bags for takeout orders and bakery items.",
    variants: [
      { sku: "UP-BAG-K12", name: "#12", pack: "Case of 500", units: 500, price: 38.9, onHand: 120, reorder: 30, specs: { Size: "7 × 4.5 × 13.75 in" } },
      { sku: "UP-BAG-K20", name: "#20", pack: "Case of 250", units: 250, price: 34.5, onHand: 90, reorder: 25, specs: { Size: "8.25 × 5.25 × 16.1 in" } },
    ],
  },
  {
    slug: "handled-takeout-shoppers", name: "Handled Takeout Shopper Bags", category: "paper-bags", supplier: "Great Lakes", kind: "bag", cost: 0.7,
    description: "Twisted-handle kraft shoppers for catering and larger takeout orders.",
    variants: [{ sku: "UP-BAG-HS1", name: "Large", pack: "Case of 200", units: 200, price: 52, onHand: 40, reorder: 15, specs: { Size: "12 × 7 × 17 in" } }],
  },
  {
    slug: "wrapped-cutlery-kits", name: "Wrapped Cutlery Kits", category: "cutlery-utensils", supplier: "Pacific", kind: "cutlery", cost: 0.66,
    description: "Fork, knife and napkin in a sealed pouch — ready for delivery bags.",
    variants: [{ sku: "UP-CUT-KIT", name: "Fork / Knife / Napkin", pack: "Case of 250 kits", units: 250, price: 24.6, onHand: 110, reorder: 30, specs: { Contents: "Fork, knife, napkin" } }],
  },
  {
    slug: "heavyweight-cutlery", name: "Heavyweight Plastic Cutlery", category: "cutlery-utensils", supplier: "Pacific", kind: "cutlery", cost: 0.68,
    description: "Sturdy polypropylene cutlery, unwrapped, in bulk cases.",
    variants: [
      { sku: "UP-CUT-FORK", name: "Fork", pack: "Case of 1,000", units: 1000, price: 21, onHand: 200, reorder: 40, specs: { Material: "Polypropylene" } },
      { sku: "UP-CUT-SPN", name: "Spoon", pack: "Case of 1,000", units: 1000, price: 21, onHand: 180, reorder: 40, specs: { Material: "Polypropylene" } },
      { sku: "UP-CUT-KNF", name: "Knife", pack: "Case of 1,000", units: 1000, price: 21, onHand: 160, reorder: 40, specs: { Material: "Polypropylene" } },
    ],
  },
  {
    slug: "jumbo-wrapped-straws", name: "Jumbo Wrapped Straws", category: "cutlery-utensils", supplier: "Pacific", kind: "straw", cost: 0.65,
    description: "Individually paper-wrapped jumbo straws.",
    variants: [{ sku: "UP-STRAW-J", name: '7.75" jumbo', pack: "Case of 2,000", units: 2000, price: 18.5, onHand: 90, reorder: 20, specs: { Length: "7.75 in", Wrapped: "Yes" } }],
  },
  {
    slug: "black-trash-liners", name: "Black Trash Liners — 1.5 mil", category: "trash-liners", supplier: "Lakeshore", kind: "liner", cost: 0.68,
    description: "Heavy-duty can liners that resist punctures in busy kitchens.",
    variants: [
      { sku: "UP-TRASH-13", name: "13 gal tall kitchen", pack: "Case of 500", units: 500, price: 29, onHand: 70, reorder: 20, specs: { Gauge: "0.9 mil" } },
      { sku: "UP-TRASH-33", name: "33 gal", pack: "Case of 100", units: 100, price: 32.4, onHand: 80, reorder: 25, specs: { Gauge: "1.5 mil" } },
      { sku: "UP-TRASH-55", name: "55 gal", pack: "Case of 100", units: 100, price: 36.4, onHand: 24, reorder: 25, specs: { Gauge: "1.5 mil" } },
    ],
  },
  {
    slug: "dispenser-napkins", name: "Napkins", category: "napkins-towels", supplier: "Great Lakes", kind: "napkin", cost: 0.7,
    description: "Everyday napkins for counters and dining rooms.",
    variants: [
      { sku: "UP-NAP-D1", name: "Dispenser, 1-ply", pack: "Case of 6,000", units: 6000, price: 42, onHand: 60, reorder: 20, specs: { Ply: "1" } },
      { sku: "UP-NAP-DN", name: "Dinner, 2-ply", pack: "Case of 3,000", units: 3000, price: 48, onHand: 35, reorder: 15, specs: { Ply: "2" } },
    ],
  },
  {
    slug: "multifold-towels", name: "Multifold Paper Towels", category: "napkins-towels", supplier: "Great Lakes", kind: "napkin", cost: 0.7,
    description: "Absorbent multifold towels for hand-wash stations.",
    variants: [{ sku: "UP-TWL-MF", name: "Natural", pack: "Case of 4,000", units: 4000, price: 36, onHand: 50, reorder: 15, specs: { Fold: "Multifold" } }],
  },
  {
    slug: "nitrile-gloves", name: "Black Nitrile Gloves — Powder-Free", category: "cleaning-supplies", supplier: "SafeHand", kind: "glove", cost: 0.73,
    description: "Disposable foodservice gloves, powder-free, 4 mil.",
    variants: [
      { sku: "UP-GLV-NM", name: "Medium", pack: "Case of 1,000", units: 1000, price: 52, onHand: 0, reorder: 15, specs: { Size: "M" } },
      { sku: "UP-GLV-NL", name: "Large", pack: "Case of 1,000", units: 1000, price: 52, onHand: 70, reorder: 20, specs: { Size: "L" } },
    ],
  },
  {
    slug: "quat-sanitizer", name: "Quat Sanitizer Concentrate", category: "cleaning-supplies", supplier: "SafeHand", kind: "jug", cost: 0.7,
    description: "No-rinse sanitizer concentrate for food-contact surfaces.",
    variants: [{ sku: "UP-SAN-Q", name: "1 gal jugs", pack: "Case of 4", units: 4, price: 38, onHand: 45, reorder: 12, specs: { Volume: "4 × 1 gal" } }],
  },
  {
    slug: "pos-receipt-rolls", name: "Thermal POS Receipt Rolls", category: "cleaning-supplies", supplier: "SafeHand", kind: "roll", cost: 0.68,
    description: "BPA-free thermal paper rolls for point-of-sale printers.",
    variants: [{ sku: "UP-POS-318", name: '3⅛" × 230 ft', pack: "Case of 50 rolls", units: 50, price: 27, onHand: 60, reorder: 15, specs: { Width: "3.125 in" } }],
  },
];

export const customers = [
  { companyName: "Lotus Thai Kitchen", contactName: "Maria L.", email: "buyer@lotusthai.example.test", phone: "630-555-0101", addressLine: "100 Demo St", city: "Naperville", state: "IL", zip: "60540" },
  { companyName: "Morning Grind Café", contactName: "Dev P.", email: "orders@morninggrind.example.test", phone: "630-555-0102", addressLine: "22 Sample Ave", city: "Aurora", state: "IL", zip: "60505" },
  { companyName: "Pita Point", contactName: "Sam K.", email: "manager@pitapoint.example.test", phone: "312-555-0103", addressLine: "9 Test Blvd", city: "Chicago", state: "IL", zip: "60614" },
  { companyName: "Sweet Crumb Bakery", contactName: "Nina R.", email: "hello@sweetcrumb.example.test", phone: "630-555-0104", addressLine: "5 Placeholder Ln", city: "Lisle", state: "IL", zip: "60532" },
  { companyName: "Taqueria Sol", contactName: "Luis G.", email: "luis@taqueriasol.example.test", phone: "773-555-0105", addressLine: "41 Fixture Rd", city: "Chicago", state: "IL", zip: "60632" },
  { companyName: "Fresh Bowl Co.", contactName: "Ana T.", email: "ops@freshbowl.example.test", phone: "630-555-0106", addressLine: "77 Mock Way", city: "Downers Grove", state: "IL", zip: "60515" },
];

/** [customer index, daysAgo, [[sku, cases]...]] — placed through the real order service. */
export const historicalOrders: [number, number, [string, number][]][] = [
  [0, 6, [["UP-CUP-H16", 3], ["UP-LID-H90B", 3], ["UP-FOIL-R18", 1]]],
  [1, 5, [["UP-CUP-H12", 4], ["UP-LID-H90W", 4], ["UP-BAG-K12", 1]]],
  [2, 4, [["UP-BOX-PP24", 3], ["UP-CUT-KIT", 2], ["UP-NAP-D1", 1]]],
  [3, 3, [["UP-BAG-K20", 2], ["UP-CUP-H08", 2]]],
  [4, 2, [["UP-BOX-PP32", 4], ["UP-TRASH-33", 1], ["UP-GLV-NL", 1]]],
  [5, 1, [["UP-BOWL-K32", 2], ["UP-CUT-FORK", 1], ["UP-CLAM-99", 1]]],
  [0, 0, [["UP-CUP-H16", 2], ["UP-LID-H90B", 2]]],
];
