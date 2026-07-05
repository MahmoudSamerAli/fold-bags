/* ==========================================
   FOLD — Product Data
   Add / edit / remove products here
   ========================================== */

const products = [
  // -- Backpacks --
  {
    id: 1,
    name: 'Heritage Leather Backpack',
    category: 'backpacks',
    price: 1250,
    description: 'Handcrafted from full-grain leather with a padded laptop sleeve, this backpack blends timeless craftsmanship with modern function. Features brass hardware and adjustable straps.',
    image: 'https://picsum.photos/seed/fold1/600/700',
    images: [
      'https://picsum.photos/seed/fold1/600/700',
      'https://picsum.photos/seed/fold1a/600/700',
      'https://picsum.photos/seed/fold1b/600/700'
    ],
    colors: [
      { name: 'Cognac', hex: '#a0845c' },
      { name: 'Black', hex: '#2d2d2d' },
      { name: 'Brown', hex: '#5c3a21' }
    ],
    sizes: ['S', 'M', 'L']
  },
  {
    id: 2,
    name: 'Canvas Daypack',
    category: 'backpacks',
    price: 750,
    description: 'Lightweight canvas daypack perfect for daily commutes and weekend adventures. Multiple pockets keep your essentials organized.',
    image: 'https://picsum.photos/seed/fold2/600/700',
    images: [
      'https://picsum.photos/seed/fold2/600/700',
      'https://picsum.photos/seed/fold2a/600/700',
      'https://picsum.photos/seed/fold2b/600/700'
    ],
    colors: [
      { name: 'Olive', hex: '#556b2f' },
      { name: 'Navy', hex: '#1b3a5c' },
      { name: 'Sand', hex: '#d4c5a9' }
    ],
    sizes: ['S', 'M', 'L']
  },
  {
    id: 3,
    name: 'Waxed Cotton Backpack',
    category: 'backpacks',
    price: 1100,
    description: 'Weather-resistant waxed cotton with a rugged aesthetic. Roomy main compartment with drawstring closure and metal buckles.',
    image: 'https://picsum.photos/seed/fold3/600/700',
    images: [
      'https://picsum.photos/seed/fold3/600/700',
      'https://picsum.photos/seed/fold3a/600/700',
      'https://picsum.photos/seed/fold3b/600/700'
    ],
    colors: [
      { name: 'Forest', hex: '#2d4a2e' },
      { name: 'Mustard', hex: '#c9a84c' },
      { name: 'Charcoal', hex: '#4a4a4a' }
    ],
    sizes: ['M', 'L']
  },
  {
    id: 4,
    name: 'Urban Minimal Backpack',
    category: 'backpacks',
    price: 900,
    description: 'Sleek and minimalist design for city living. Padded laptop compartment, hidden security pocket, and clean lines.',
    image: 'https://picsum.photos/seed/fold4/600/700',
    images: [
      'https://picsum.photos/seed/fold4/600/700',
      'https://picsum.photos/seed/fold4a/600/700',
      'https://picsum.photos/seed/fold4b/600/700'
    ],
    colors: [
      { name: 'Black', hex: '#2d2d2d' },
      { name: 'Grey', hex: '#8c8c8c' },
      { name: 'White', hex: '#f5f5f5' }
    ],
    sizes: ['S', 'M', 'L']
  },
  // -- Tote Bags --
  {
    id: 5,
    name: 'Woven Straw Tote',
    category: 'totes',
    price: 650,
    description: 'Handwoven natural straw tote with leather handles. Perfect for beach days, farmers markets, and summer outings.',
    image: 'https://picsum.photos/seed/fold5/600/700',
    images: [
      'https://picsum.photos/seed/fold5/600/700',
      'https://picsum.photos/seed/fold5a/600/700',
      'https://picsum.photos/seed/fold5b/600/700'
    ],
    colors: [
      { name: 'Natural', hex: '#decbb7' },
      { name: 'Black', hex: '#2d2d2d' }
    ],
    sizes: ['M', 'L']
  },
  {
    id: 6,
    name: 'Leather Tote',
    category: 'totes',
    price: 1350,
    description: 'Buttery-soft leather tote that ages beautifully. Spacious enough for work or travel, with an interior zip pocket.',
    image: 'https://picsum.photos/seed/fold6/600/700',
    images: [
      'https://picsum.photos/seed/fold6/600/700',
      'https://picsum.photos/seed/fold6a/600/700',
      'https://picsum.photos/seed/fold6b/600/700'
    ],
    colors: [
      { name: 'Cognac', hex: '#a0845c' },
      { name: 'Brown', hex: '#5c3a21' },
      { name: 'Black', hex: '#2d2d2d' }
    ],
    sizes: ['M', 'L']
  },
  {
    id: 7,
    name: 'Canvas Market Tote',
    category: 'totes',
    price: 550,
    description: 'Everyday canvas tote with reinforced stitching. Lightweight, washable, and built to carry your daily essentials.',
    image: 'https://picsum.photos/seed/fold7/600/700',
    images: [
      'https://picsum.photos/seed/fold7/600/700',
      'https://picsum.photos/seed/fold7a/600/700',
      'https://picsum.photos/seed/fold7b/600/700'
    ],
    colors: [
      { name: 'Natural', hex: '#decbb7' },
      { name: 'Navy', hex: '#1b3a5c' },
      { name: 'Striped', hex: '#c4b59a' }
    ],
    sizes: ['M', 'L']
  },
  {
    id: 8,
    name: 'Structured Top-Handle Tote',
    category: 'totes',
    price: 1100,
    description: 'Sculpted top-handle tote with a structured silhouette. Elevates any outfit from desk to dinner.',
    image: 'https://picsum.photos/seed/fold8/600/700',
    images: [
      'https://picsum.photos/seed/fold8/600/700',
      'https://picsum.photos/seed/fold8a/600/700',
      'https://picsum.photos/seed/fold8b/600/700'
    ],
    colors: [
      { name: 'Blush', hex: '#d4a5a5' },
      { name: 'Taupe', hex: '#b09a8a' },
      { name: 'Black', hex: '#2d2d2d' }
    ],
    sizes: ['M', 'L']
  },
  // -- Crossbody Bags --
  {
    id: 9,
    name: 'Slim Crossbody Bag',
    category: 'crossbody',
    price: 700,
    description: 'Slim, streamlined crossbody that sits close to the body. Adjustable strap and organized interior slots.',
    image: 'https://picsum.photos/seed/fold9/600/700',
    images: [
      'https://picsum.photos/seed/fold9/600/700',
      'https://picsum.photos/seed/fold9a/600/700',
      'https://picsum.photos/seed/fold9b/600/700'
    ],
    colors: [
      { name: 'Black', hex: '#2d2d2d' },
      { name: 'Brown', hex: '#5c3a21' },
      { name: 'Tan', hex: '#c4a882' }
    ],
    sizes: ['S', 'M']
  },
  {
    id: 10,
    name: 'Leather Messenger',
    category: 'crossbody',
    price: 1000,
    description: 'Classic leather messenger bag with flap closure and adjustable strap. Fits a tablet and daily essentials.',
    image: 'https://picsum.photos/seed/fold10/600/700',
    images: [
      'https://picsum.photos/seed/fold10/600/700',
      'https://picsum.photos/seed/fold10a/600/700',
      'https://picsum.photos/seed/fold10b/600/700'
    ],
    colors: [
      { name: 'Cognac', hex: '#a0845c' },
      { name: 'Black', hex: '#2d2d2d' }
    ],
    sizes: ['M', 'L']
  },
  {
    id: 11,
    name: 'Mini Crossbody',
    category: 'crossbody',
    price: 600,
    description: 'Compact mini crossbody for your phone, cards, and keys. Detachable strap — wear as a clutch too.',
    image: 'https://picsum.photos/seed/fold11/600/700',
    images: [
      'https://picsum.photos/seed/fold11/600/700',
      'https://picsum.photos/seed/fold11a/600/700',
      'https://picsum.photos/seed/fold11b/600/700'
    ],
    colors: [
      { name: 'Red', hex: '#8b3a3a' },
      { name: 'Navy', hex: '#1b3a5c' },
      { name: 'Blush', hex: '#d4a5a5' }
    ],
    sizes: ['S', 'M']
  },
  // -- Clutches --
  {
    id: 12,
    name: 'Evening Clutch',
    category: 'clutches',
    price: 850,
    description: 'Sleek evening clutch with a subtle sheen. Fits your essentials — phone, lipstick, cards — for a night out.',
    image: 'https://picsum.photos/seed/fold12/600/700',
    images: [
      'https://picsum.photos/seed/fold12/600/700',
      'https://picsum.photos/seed/fold12a/600/700',
      'https://picsum.photos/seed/fold12b/600/700'
    ],
    colors: [
      { name: 'Black', hex: '#2d2d2d' },
      { name: 'Gold', hex: '#c4a84c' },
      { name: 'Blush', hex: '#d4a5a5' }
    ],
    sizes: ['S', 'M']
  },
  {
    id: 13,
    name: 'Envelope Clutch',
    category: 'clutches',
    price: 750,
    description: 'Minimal envelope-style clutch with magnetic closure. Clean lines make it a versatile evening accessory.',
    image: 'https://picsum.photos/seed/fold13/600/700',
    images: [
      'https://picsum.photos/seed/fold13/600/700',
      'https://picsum.photos/seed/fold13a/600/700',
      'https://picsum.photos/seed/fold13b/600/700'
    ],
    colors: [
      { name: 'Cognac', hex: '#a0845c' },
      { name: 'Black', hex: '#2d2d2d' }
    ],
    sizes: ['S', 'M']
  },
  {
    id: 14,
    name: 'Beaded Clutch',
    category: 'clutches',
    price: 950,
    description: 'Hand-beaded clutch with intricate detailing. Each piece is unique — a true statement accessory.',
    image: 'https://picsum.photos/seed/fold14/600/700',
    images: [
      'https://picsum.photos/seed/fold14/600/700',
      'https://picsum.photos/seed/fold14a/600/700',
      'https://picsum.photos/seed/fold14b/600/700'
    ],
    colors: [
      { name: 'Multi', hex: '#c4b59a' },
      { name: 'Gold', hex: '#c4a84c' }
    ],
    sizes: ['S', 'M']
  },
  // -- Duffle Bags --
  {
    id: 15,
    name: 'Weekender Duffle',
    category: 'duffles',
    price: 1400,
    description: 'Spacious weekender duffle with a separate shoe compartment. Carry-on friendly with sturdy leather handles.',
    image: 'https://picsum.photos/seed/fold15/600/700',
    images: [
      'https://picsum.photos/seed/fold15/600/700',
      'https://picsum.photos/seed/fold15a/600/700',
      'https://picsum.photos/seed/fold15b/600/700'
    ],
    colors: [
      { name: 'Olive', hex: '#556b2f' },
      { name: 'Navy', hex: '#1b3a5c' },
      { name: 'Brown', hex: '#5c3a21' }
    ],
    sizes: ['M', 'L']
  },
  {
    id: 16,
    name: 'Canvas Duffle',
    category: 'duffles',
    price: 1100,
    description: 'Rugged canvas duffle with leather trim. Perfect for gym, weekend trips, or as a sports bag.',
    image: 'https://picsum.photos/seed/fold16/600/700',
    images: [
      'https://picsum.photos/seed/fold16/600/700',
      'https://picsum.photos/seed/fold16a/600/700',
      'https://picsum.photos/seed/fold16b/600/700'
    ],
    colors: [
      { name: 'Natural', hex: '#decbb7' },
      { name: 'Black', hex: '#2d2d2d' },
      { name: 'Striped', hex: '#c4b59a' }
    ],
    sizes: ['M', 'L']
  }
];
