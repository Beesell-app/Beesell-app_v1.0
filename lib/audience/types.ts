// lib/audience/types.ts
// ══════════════════════════════════════════════════════════════
// AUDIENCE TARGETING INTELLIGENCE — Types & Data
// ══════════════════════════════════════════════════════════════

export type PlatformId     = 'meta' | 'tiktok' | 'google'
export type LookalikeSize  = 1 | 2 | 3 | 5 | 10         // % of country population
export type PixelEventType =
  | 'PageView' | 'ViewContent' | 'AddToCart'
  | 'InitiateCheckout' | 'Purchase' | 'Lead'
  | 'CompleteRegistration' | 'Search' | 'AddToWishlist'
  | 'Subscribe' | 'Contact' | 'CustomizeProduct'

export type RetargetWindowDay = 7 | 14 | 30 | 60 | 90 | 180

export type CustomerDataField =
  | 'email' | 'phone' | 'name' | 'city'
  | 'country' | 'birth_date' | 'gender'

// ── Interest node ─────────────────────────────────────────────
export interface Interest {
  id:          string
  name:        string
  platform:    PlatformId[]
  category:    string
  subcategory: string
  audienceSize:{ min:number; max:number }   // estimated platform audience (Indonesia)
  affinity:    number                        // relevance score 0-100
  cpmIndex:    number                        // relative CPM (1.0 = average)
  competition: 'low' | 'medium' | 'high'
  tags:        string[]
}

// ── Niche interest map ────────────────────────────────────────
export type NicheId =
  | 'fashion' | 'beauty' | 'skincare' | 'food' | 'gadget'
  | 'health' | 'home' | 'baby' | 'hijab' | 'general'

// ── Full interest taxonomy per niche ──────────────────────────
// Platform audience sizes are estimates for Indonesia (2025)
export const INTEREST_TAXONOMY: Record<NicheId, Interest[]> = {
  fashion: [
    { id:'fi_1', name:'Fashion & Style',         platform:['meta','tiktok'], category:'Fashion',    subcategory:'General',      audienceSize:{min:12_000_000,max:18_000_000}, affinity:92, cpmIndex:1.1, competition:'high',   tags:['fashion','style','ootd'] },
    { id:'fi_2', name:'Online Shopping',          platform:['meta','tiktok','google'], category:'Shopping',   subcategory:'Online',       audienceSize:{min:25_000_000,max:35_000_000}, affinity:78, cpmIndex:1.3, competition:'high',   tags:['ecommerce','belanja'] },
    { id:'fi_3', name:'Women\'s Clothing',        platform:['meta'],          category:'Fashion',    subcategory:'Women',        audienceSize:{min:8_000_000, max:14_000_000}, affinity:95, cpmIndex:1.2, competition:'high',   tags:['baju wanita','fashion'] },
    { id:'fi_4', name:'Street Fashion',           platform:['meta','tiktok'], category:'Fashion',    subcategory:'Street',       audienceSize:{min:4_000_000, max:7_000_000},  affinity:80, cpmIndex:0.9, competition:'medium', tags:['streetwear','casual'] },
    { id:'fi_5', name:'Sustainable Fashion',      platform:['meta'],          category:'Fashion',    subcategory:'Sustainable',  audienceSize:{min:1_500_000, max:3_000_000},  affinity:72, cpmIndex:0.8, competition:'low',    tags:['eco','sustainable'] },
    { id:'fi_6', name:'Fashion Influencers',      platform:['tiktok'],        category:'Fashion',    subcategory:'Influencer',   audienceSize:{min:6_000_000, max:10_000_000}, affinity:85, cpmIndex:1.0, competition:'medium', tags:['influencer','content'] },
    { id:'fi_7', name:'Thrift Shopping',          platform:['meta','tiktok'], category:'Fashion',    subcategory:'Thrift',       audienceSize:{min:2_000_000, max:4_000_000},  affinity:68, cpmIndex:0.7, competition:'low',    tags:['preloved','thrift'] },
    { id:'fi_8', name:'Shopee & Tokopedia Users', platform:['meta','tiktok'], category:'Shopping',   subcategory:'Marketplace',  audienceSize:{min:30_000_000,max:45_000_000}, affinity:70, cpmIndex:1.4, competition:'high',   tags:['marketplace','shopee'] },
  ],
  beauty: [
    { id:'bi_1', name:'Beauty & Cosmetics',       platform:['meta','tiktok'], category:'Beauty',     subcategory:'General',      audienceSize:{min:15_000_000,max:22_000_000}, affinity:94, cpmIndex:1.2, competition:'high',   tags:['beauty','makeup','kosmetik'] },
    { id:'bi_2', name:'Makeup Tutorials',         platform:['tiktok'],        category:'Beauty',     subcategory:'Tutorial',     audienceSize:{min:8_000_000, max:13_000_000}, affinity:90, cpmIndex:1.1, competition:'high',   tags:['makeup','tutorial','beauty'] },
    { id:'bi_3', name:'K-Beauty',                 platform:['meta','tiktok'], category:'Beauty',     subcategory:'Korean',       audienceSize:{min:5_000_000, max:9_000_000},  affinity:87, cpmIndex:1.0, competition:'medium', tags:['kbeauty','korean','skincare'] },
    { id:'bi_4', name:'Natural Beauty',           platform:['meta'],          category:'Beauty',     subcategory:'Natural',      audienceSize:{min:3_000_000, max:6_000_000},  affinity:80, cpmIndex:0.9, competition:'medium', tags:['natural','organic'] },
    { id:'bi_5', name:'Beauty Influencers',       platform:['tiktok','meta'], category:'Beauty',     subcategory:'Influencer',   audienceSize:{min:10_000_000,max:16_000_000}, affinity:88, cpmIndex:1.2, competition:'high',   tags:['influencer','beauty'] },
    { id:'bi_6', name:'Halal Cosmetics',          platform:['meta'],          category:'Beauty',     subcategory:'Halal',        audienceSize:{min:4_000_000, max:8_000_000},  affinity:82, cpmIndex:1.0, competition:'medium', tags:['halal','muslim'] },
    { id:'bi_7', name:'Lip Care & Lipstick',      platform:['meta','tiktok'], category:'Beauty',     subcategory:'Lips',         audienceSize:{min:5_000_000, max:9_000_000},  affinity:85, cpmIndex:1.1, competition:'high',   tags:['lipstick','lips'] },
  ],
  skincare: [
    { id:'si_1', name:'Skin Care',                platform:['meta','tiktok'], category:'Skincare',   subcategory:'General',      audienceSize:{min:14_000_000,max:20_000_000}, affinity:96, cpmIndex:1.3, competition:'high',   tags:['skincare','kulit'] },
    { id:'si_2', name:'Anti-Aging',               platform:['meta'],          category:'Skincare',   subcategory:'Anti-Aging',   audienceSize:{min:6_000_000, max:10_000_000}, affinity:85, cpmIndex:1.1, competition:'high',   tags:['antiaging','wrinkles'] },
    { id:'si_3', name:'Acne Treatment',           platform:['meta','tiktok'], category:'Skincare',   subcategory:'Acne',         audienceSize:{min:5_000_000, max:9_000_000},  affinity:88, cpmIndex:1.0, competition:'high',   tags:['acne','jerawat'] },
    { id:'si_4', name:'Sunscreen & Sun Care',     platform:['meta','tiktok'], category:'Skincare',   subcategory:'Sun',          audienceSize:{min:4_000_000, max:7_000_000},  affinity:84, cpmIndex:0.9, competition:'medium', tags:['sunscreen','spf'] },
    { id:'si_5', name:'Dermatology & Skin Issues',platform:['meta'],          category:'Skincare',   subcategory:'Derma',        audienceSize:{min:3_000_000, max:5_000_000},  affinity:90, cpmIndex:1.2, competition:'medium', tags:['dermatologi','kulit sehat'] },
    { id:'si_6', name:'Skincare Routine',         platform:['tiktok','meta'], category:'Skincare',   subcategory:'Routine',      audienceSize:{min:7_000_000, max:12_000_000}, affinity:92, cpmIndex:1.1, competition:'high',   tags:['routine','perawatan'] },
    { id:'si_7', name:'Brightening & Whitening',  platform:['meta','tiktok'], category:'Skincare',   subcategory:'Brightening',  audienceSize:{min:8_000_000, max:13_000_000}, affinity:91, cpmIndex:1.2, competition:'high',   tags:['brightening','cerah','glowing'] },
  ],
  food: [
    { id:'fo_1', name:'Food & Beverage',          platform:['meta','tiktok'], category:'Food',       subcategory:'General',      audienceSize:{min:20_000_000,max:30_000_000}, affinity:75, cpmIndex:0.8, competition:'medium', tags:['food','makanan','kuliner'] },
    { id:'fo_2', name:'Indonesian Food',          platform:['meta','tiktok'], category:'Food',       subcategory:'Local',        audienceSize:{min:12_000_000,max:18_000_000}, affinity:88, cpmIndex:0.7, competition:'medium', tags:['kuliner indonesia','masakan'] },
    { id:'fo_3', name:'Healthy Eating',           platform:['meta'],          category:'Food',       subcategory:'Health',       audienceSize:{min:5_000_000, max:9_000_000},  affinity:82, cpmIndex:0.9, competition:'medium', tags:['sehat','diet','healthy'] },
    { id:'fo_4', name:'Snacks & Junk Food',       platform:['tiktok','meta'], category:'Food',       subcategory:'Snack',        audienceSize:{min:8_000_000, max:14_000_000}, affinity:80, cpmIndex:0.8, competition:'medium', tags:['snack','cemilan'] },
    { id:'fo_5', name:'Coffee Enthusiasts',       platform:['meta','tiktok'], category:'Food',       subcategory:'Coffee',       audienceSize:{min:6_000_000, max:10_000_000}, affinity:85, cpmIndex:1.0, competition:'medium', tags:['kopi','coffee'] },
    { id:'fo_6', name:'Food Delivery',            platform:['meta'],          category:'Food',       subcategory:'Delivery',     audienceSize:{min:10_000_000,max:16_000_000}, affinity:72, cpmIndex:1.1, competition:'high',   tags:['delivery','ojek online'] },
  ],
  gadget: [
    { id:'gi_1', name:'Consumer Electronics',     platform:['meta','google'], category:'Tech',       subcategory:'Electronics',  audienceSize:{min:10_000_000,max:16_000_000}, affinity:88, cpmIndex:1.4, competition:'high',   tags:['elektronik','gadget'] },
    { id:'gi_2', name:'Smartphones',              platform:['meta','tiktok'], category:'Tech',       subcategory:'Mobile',       audienceSize:{min:15_000_000,max:22_000_000}, affinity:82, cpmIndex:1.5, competition:'high',   tags:['hp','smartphone'] },
    { id:'gi_3', name:'Gaming',                   platform:['meta','tiktok'], category:'Tech',       subcategory:'Gaming',       audienceSize:{min:8_000_000, max:13_000_000}, affinity:85, cpmIndex:1.2, competition:'high',   tags:['game','gaming'] },
    { id:'gi_4', name:'Tech Reviews',             platform:['tiktok','meta'], category:'Tech',       subcategory:'Review',       audienceSize:{min:5_000_000, max:9_000_000},  affinity:90, cpmIndex:1.3, competition:'medium', tags:['review','tech'] },
    { id:'gi_5', name:'Photography & Camera',     platform:['meta'],          category:'Tech',       subcategory:'Photo',        audienceSize:{min:3_000_000, max:6_000_000},  affinity:78, cpmIndex:1.1, competition:'medium', tags:['fotografi','camera'] },
    { id:'gi_6', name:'Accessories & Peripherals',platform:['meta','google'], category:'Tech',       subcategory:'Accessories',  audienceSize:{min:4_000_000, max:7_000_000},  affinity:80, cpmIndex:1.0, competition:'medium', tags:['aksesori','peripheral'] },
  ],
  health: [
    { id:'hi_1', name:'Health & Wellness',        platform:['meta','tiktok'], category:'Health',     subcategory:'General',      audienceSize:{min:12_000_000,max:18_000_000}, affinity:82, cpmIndex:1.0, competition:'medium', tags:['kesehatan','wellness'] },
    { id:'hi_2', name:'Herbal & Traditional',     platform:['meta'],          category:'Health',     subcategory:'Herbal',       audienceSize:{min:6_000_000, max:10_000_000}, affinity:88, cpmIndex:0.9, competition:'medium', tags:['herbal','jamu','tradisional'] },
    { id:'hi_3', name:'Fitness & Gym',            platform:['meta','tiktok'], category:'Health',     subcategory:'Fitness',      audienceSize:{min:5_000_000, max:9_000_000},  affinity:80, cpmIndex:1.1, competition:'medium', tags:['gym','fitness','olahraga'] },
    { id:'hi_4', name:'Vitamins & Supplements',   platform:['meta','google'], category:'Health',     subcategory:'Supplement',   audienceSize:{min:4_000_000, max:7_000_000},  affinity:90, cpmIndex:1.2, competition:'high',   tags:['vitamin','suplemen'] },
    { id:'hi_5', name:'Mental Health',            platform:['meta'],          category:'Health',     subcategory:'Mental',       audienceSize:{min:2_000_000, max:4_000_000},  affinity:75, cpmIndex:0.8, competition:'low',    tags:['mental health','mindfulness'] },
  ],
  home: [
    { id:'hoi_1', name:'Home Decoration',         platform:['meta','tiktok'], category:'Home',       subcategory:'Decor',        audienceSize:{min:8_000_000, max:13_000_000}, affinity:88, cpmIndex:1.0, competition:'medium', tags:['dekorasi','rumah','home'] },
    { id:'hoi_2', name:'Interior Design',         platform:['meta'],          category:'Home',       subcategory:'Interior',     audienceSize:{min:4_000_000, max:7_000_000},  affinity:85, cpmIndex:1.1, competition:'medium', tags:['interior','desain'] },
    { id:'hoi_3', name:'Furniture',               platform:['meta','google'], category:'Home',       subcategory:'Furniture',    audienceSize:{min:5_000_000, max:9_000_000},  affinity:82, cpmIndex:1.0, competition:'medium', tags:['furnitur','perabot'] },
    { id:'hoi_4', name:'Cleaning & Organization', platform:['meta','tiktok'], category:'Home',       subcategory:'Cleaning',     audienceSize:{min:3_000_000, max:6_000_000},  affinity:78, cpmIndex:0.8, competition:'low',    tags:['bersih','organizer'] },
    { id:'hoi_5', name:'Smart Home',              platform:['meta'],          category:'Home',       subcategory:'Smart',        audienceSize:{min:2_000_000, max:4_000_000},  affinity:80, cpmIndex:1.2, competition:'medium', tags:['smart home','automation'] },
  ],
  baby: [
    { id:'bai_1', name:'Parenting',               platform:['meta','tiktok'], category:'Baby',       subcategory:'Parenting',    audienceSize:{min:8_000_000, max:14_000_000}, affinity:94, cpmIndex:1.1, competition:'medium', tags:['parenting','orang tua'] },
    { id:'bai_2', name:'Baby Products',           platform:['meta'],          category:'Baby',       subcategory:'Products',     audienceSize:{min:5_000_000, max:9_000_000},  affinity:96, cpmIndex:1.2, competition:'high',   tags:['produk bayi','baby'] },
    { id:'bai_3', name:'New Parents',             platform:['meta'],          category:'Baby',       subcategory:'New Parents',  audienceSize:{min:3_000_000, max:5_000_000},  affinity:98, cpmIndex:1.3, competition:'high',   tags:['newborn','new mom'] },
    { id:'bai_4', name:'Pregnancy',               platform:['meta'],          category:'Baby',       subcategory:'Pregnancy',    audienceSize:{min:2_000_000, max:4_000_000},  affinity:95, cpmIndex:1.1, competition:'medium', tags:['hamil','kehamilan'] },
    { id:'bai_5', name:'Child Education',         platform:['meta'],          category:'Baby',       subcategory:'Education',    audienceSize:{min:4_000_000, max:7_000_000},  affinity:85, cpmIndex:1.0, competition:'medium', tags:['pendidikan anak','edukasi'] },
  ],
  hijab: [
    { id:'hji_1', name:'Islamic Fashion',         platform:['meta','tiktok'], category:'Hijab',      subcategory:'Fashion',      audienceSize:{min:10_000_000,max:16_000_000}, affinity:96, cpmIndex:1.1, competition:'high',   tags:['hijab','fashion muslim'] },
    { id:'hji_2', name:'Hijab Style & Tutorial',  platform:['tiktok','meta'], category:'Hijab',      subcategory:'Tutorial',     audienceSize:{min:6_000_000, max:10_000_000}, affinity:92, cpmIndex:1.0, competition:'medium', tags:['hijab tutorial','style'] },
    { id:'hji_3', name:'Muslim Lifestyle',        platform:['meta'],          category:'Hijab',      subcategory:'Lifestyle',    audienceSize:{min:15_000_000,max:22_000_000}, affinity:80, cpmIndex:0.9, competition:'medium', tags:['muslimah','islami'] },
    { id:'hji_4', name:'Modest Fashion',          platform:['meta','tiktok'], category:'Hijab',      subcategory:'Modest',       audienceSize:{min:5_000_000, max:9_000_000},  affinity:94, cpmIndex:1.1, competition:'medium', tags:['modest','syar\'i'] },
    { id:'hji_5', name:'Halal Lifestyle',         platform:['meta'],          category:'Hijab',      subcategory:'Halal',        audienceSize:{min:8_000_000, max:13_000_000}, affinity:82, cpmIndex:1.0, competition:'medium', tags:['halal','islami'] },
  ],
  general: [
    { id:'gen_1', name:'Online Shopping',         platform:['meta','tiktok','google'], category:'Shopping', subcategory:'Online',  audienceSize:{min:25_000_000,max:38_000_000}, affinity:70, cpmIndex:1.3, competition:'high',   tags:['belanja online','ecommerce'] },
    { id:'gen_2', name:'Small Business Owners',   platform:['meta'],          category:'Business',   subcategory:'SME',          audienceSize:{min:4_000_000, max:8_000_000},  affinity:75, cpmIndex:1.1, competition:'medium', tags:['UMKM','usaha kecil'] },
    { id:'gen_3', name:'Social Media Users',      platform:['meta','tiktok'], category:'Digital',    subcategory:'Social',       audienceSize:{min:40_000_000,max:60_000_000}, affinity:55, cpmIndex:0.9, competition:'high',   tags:['social media','digital'] },
    { id:'gen_4', name:'TikTok Shop Buyers',      platform:['tiktok'],        category:'Shopping',   subcategory:'TikTok',       audienceSize:{min:15_000_000,max:25_000_000}, affinity:80, cpmIndex:1.2, competition:'high',   tags:['tiktok shop','live shopping'] },
    { id:'gen_5', name:'Deal Hunters & Promo',    platform:['meta','tiktok'], category:'Shopping',   subcategory:'Deals',        audienceSize:{min:12_000_000,max:20_000_000}, affinity:72, cpmIndex:1.0, competition:'medium', tags:['promo','diskon','murah'] },
  ],
}

// ── Lookalike spec ────────────────────────────────────────────
export interface LookalikeAudience {
  id:           string
  name:         string
  sourceType:   'customer_list' | 'website_visitors' | 'engagement' | 'purchase_events'
  sourceSize:   number        // number of seed records
  country:      string
  size:         LookalikeSize // % of population
  estimatedReach:{ min:number; max:number }
  platform:     PlatformId
  similarity:   number        // 0-100 quality score
  excludeSource:boolean
  createdAt:    string
}

// ── Retargeting audience ───────────────────────────────────────
export interface RetargetAudience {
  id:           string
  name:         string
  platform:     PlatformId
  type:         'website' | 'engagement' | 'customer_list' | 'video_viewers' | 'lead_form'
  windowDays:   RetargetWindowDay
  pixelEvents:  PixelEventType[]
  filters?:     { field:string; operator:string; value:string }[]
  estimatedSize:{ min:number; max:number }
  description:  string
  priority:     'hot' | 'warm' | 'cold'   // how close to purchase
  recommendedBid:'high' | 'medium' | 'normal'
  createdAt:    string
}

// ── Pixel event config ────────────────────────────────────────
export interface PixelEventConfig {
  event:        PixelEventType
  code:         string         // implementation snippet
  description:  string
  whenToFire:   string
  funnelStage:  'awareness' | 'consideration' | 'conversion'
  metaCode:     string         // fbq() code
  tiktokCode:   string         // ttq() code
  gaCode:       string         // gtag() code
}

export const PIXEL_EVENTS: Record<PixelEventType, PixelEventConfig> = {
  PageView: {
    event:'PageView', description:'Setiap halaman dikunjungi',
    whenToFire:'Setiap halaman load', funnelStage:'awareness',
    code:`// Auto-fired by base pixel code`,
    metaCode:`fbq('track', 'PageView');`,
    tiktokCode:`ttq.page();`,
    gaCode:`gtag('event', 'page_view');`,
  },
  ViewContent: {
    event:'ViewContent', description:'Halaman produk dilihat',
    whenToFire:'Saat user buka halaman produk', funnelStage:'consideration',
    code:`fbq('track', 'ViewContent', { content_type:'product', content_ids:['PRODUCT_ID'], value: PRICE, currency:'IDR' });`,
    metaCode:`fbq('track', 'ViewContent', {
  content_ids: ['{product_id}'],
  content_type: 'product',
  value: {price},
  currency: 'IDR'
});`,
    tiktokCode:`ttq.track('ViewContent', {
  content_id: '{product_id}',
  content_type: 'product',
  value: {price},
  currency: 'IDR'
});`,
    gaCode:`gtag('event', 'view_item', {
  currency: 'IDR',
  value: {price},
  items: [{ item_id: '{product_id}', price: {price} }]
});`,
  },
  AddToCart: {
    event:'AddToCart', description:'Produk ditambah ke keranjang',
    whenToFire:'Klik tombol "Tambah ke Keranjang"', funnelStage:'consideration',
    code:`fbq('track', 'AddToCart', { content_ids:['PRODUCT_ID'], value: PRICE, currency:'IDR' });`,
    metaCode:`fbq('track', 'AddToCart', {
  content_ids: ['{product_id}'],
  content_type: 'product',
  value: {price},
  currency: 'IDR'
});`,
    tiktokCode:`ttq.track('AddToCart', {
  content_id: '{product_id}',
  value: {price},
  currency: 'IDR'
});`,
    gaCode:`gtag('event', 'add_to_cart', {
  currency: 'IDR',
  value: {price},
  items: [{ item_id: '{product_id}', price: {price} }]
});`,
  },
  InitiateCheckout: {
    event:'InitiateCheckout', description:'Mulai proses checkout',
    whenToFire:'Klik "Checkout" atau "Beli Sekarang"', funnelStage:'conversion',
    code:`fbq('track', 'InitiateCheckout', { value: TOTAL, currency:'IDR', num_items: QTY });`,
    metaCode:`fbq('track', 'InitiateCheckout', {
  value: {total},
  currency: 'IDR',
  num_items: {qty}
});`,
    tiktokCode:`ttq.track('InitiateCheckout', {
  value: {total},
  currency: 'IDR'
});`,
    gaCode:`gtag('event', 'begin_checkout', {
  currency: 'IDR',
  value: {total}
});`,
  },
  Purchase: {
    event:'Purchase', description:'Pembelian berhasil',
    whenToFire:'Halaman "Terima Kasih" atau order confirmation', funnelStage:'conversion',
    code:`fbq('track', 'Purchase', { value: TOTAL, currency:'IDR', content_ids:['PRODUCT_ID'] });`,
    metaCode:`fbq('track', 'Purchase', {
  value: {order_total},
  currency: 'IDR',
  content_ids: ['{product_id}'],
  content_type: 'product',
  order_id: '{order_id}'
});`,
    tiktokCode:`ttq.track('Purchase', {
  content_id: '{product_id}',
  value: {order_total},
  currency: 'IDR',
  order_id: '{order_id}'
});`,
    gaCode:`gtag('event', 'purchase', {
  transaction_id: '{order_id}',
  value: {order_total},
  currency: 'IDR'
});`,
  },
  Lead: {
    event:'Lead', description:'Mengisi form lead atau WhatsApp contact',
    whenToFire:'Submit form kontak atau klik WA button', funnelStage:'conversion',
    code:`fbq('track', 'Lead');`,
    metaCode:`fbq('track', 'Lead', { content_name: '{form_name}' });`,
    tiktokCode:`ttq.track('SubmitForm');`,
    gaCode:`gtag('event', 'generate_lead');`,
  },
  CompleteRegistration: {
    event:'CompleteRegistration', description:'Registrasi akun berhasil',
    whenToFire:'Setelah user registrasi berhasil', funnelStage:'conversion',
    code:`fbq('track', 'CompleteRegistration');`,
    metaCode:`fbq('track', 'CompleteRegistration');`,
    tiktokCode:`ttq.track('CompleteRegistration');`,
    gaCode:`gtag('event', 'sign_up');`,
  },
  Search: {
    event:'Search', description:'User melakukan pencarian',
    whenToFire:'Setiap pencarian di search bar', funnelStage:'consideration',
    code:`fbq('track', 'Search', { search_string: QUERY });`,
    metaCode:`fbq('track', 'Search', { search_string: '{query}' });`,
    tiktokCode:`ttq.track('Search', { query: '{query}' });`,
    gaCode:`gtag('event', 'search', { search_term: '{query}' });`,
  },
  AddToWishlist: {
    event:'AddToWishlist', description:'Produk disimpan ke wishlist',
    whenToFire:'Klik ikon hati/favorit', funnelStage:'consideration',
    code:`fbq('track', 'AddToWishlist');`,
    metaCode:`fbq('track', 'AddToWishlist', { content_ids: ['{product_id}'] });`,
    tiktokCode:`ttq.track('AddToWishlist', { content_id: '{product_id}' });`,
    gaCode:`gtag('event', 'add_to_wishlist');`,
  },
  Subscribe: {
    event:'Subscribe', description:'Subscribe newsletter atau notifikasi',
    whenToFire:'Submit email subscription', funnelStage:'awareness',
    code:`fbq('track', 'Subscribe');`,
    metaCode:`fbq('track', 'Subscribe');`,
    tiktokCode:`ttq.track('Subscribe');`,
    gaCode:`gtag('event', 'subscribe');`,
  },
  Contact: {
    event:'Contact', description:'User menghubungi via form atau WA',
    whenToFire:'Klik tombol kontak atau hubungi kami', funnelStage:'consideration',
    code:`fbq('track', 'Contact');`,
    metaCode:`fbq('track', 'Contact');`,
    tiktokCode:`ttq.track('Contact');`,
    gaCode:`gtag('event', 'contact');`,
  },
  CustomizeProduct: {
    event:'CustomizeProduct', description:'User kustomisasi produk',
    whenToFire:'Saat user memilih varian produk', funnelStage:'consideration',
    code:`fbq('track', 'CustomizeProduct');`,
    metaCode:`fbq('track', 'CustomizeProduct', { content_ids: ['{product_id}'] });`,
    tiktokCode:`ttq.track('CustomizeProduct');`,
    gaCode:`gtag('event', 'select_item');`,
  },
}

// ── Base pixel scripts ─────────────────────────────────────────
export const BASE_PIXEL_SCRIPTS: Record<PlatformId, (id:string)=>string> = {
  meta: (pixelId: string) => `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel Code -->`,

  tiktok: (pixelId: string) => `<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track",
  "identify","instances","debug","on","off","once","ready","alias","group",
  "enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){
  t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)
  ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
  ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};
  ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");
  o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
  var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${pixelId}');ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`,

  google: (tagId: string) => `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${tagId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${tagId}');
</script>`,
}

// ── Retargeting window strategy ────────────────────────────────
export const RETARGET_STRATEGIES = [
  { window:7  as RetargetWindowDay, label:'7 Hari',   priority:'hot'  as const, desc:'Pengunjung sangat recent — konversi rate tertinggi, audience kecil',    bid:'high'   as const },
  { window:14 as RetargetWindowDay, label:'14 Hari',  priority:'hot'  as const, desc:'Masih sangat relevan — balance antara ukuran dan konversi',              bid:'high'   as const },
  { window:30 as RetargetWindowDay, label:'30 Hari',  priority:'warm' as const, desc:'Intent masih ada — audience lebih besar, butuh creative yang kuat',      bid:'medium' as const },
  { window:60 as RetargetWindowDay, label:'60 Hari',  priority:'warm' as const, desc:'Mulai dingin — perlu penawaran khusus atau diskon untuk rekativasi',     bid:'medium' as const },
  { window:90 as RetargetWindowDay, label:'90 Hari',  priority:'cold' as const, desc:'Membutuhkan edukasi ulang — cocok untuk brand awareness lanjutan',       bid:'normal' as const },
  { window:180 as RetargetWindowDay, label:'180 Hari',priority:'cold' as const, desc:'Audience sangat besar, intent rendah — budget rendah, ROAS ekspektasi kecil', bid:'normal' as const },
]

// ── Helpers ───────────────────────────────────────────────────
export const fmtN   = (n:number) => n>=1_000_000?`${(n/1_000_000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(0)}K`:String(n)
export const fmtRp  = (n:number) => n>=1_000_000?`Rp${(n/1_000_000).toFixed(1)}Jt`:n>=1000?`Rp${(n/1000).toFixed(0)}K`:`Rp${n}`

export function getTopInterests(niche: NicheId, platform: PlatformId, limit=6): Interest[] {
  return (INTEREST_TAXONOMY[niche] ?? INTEREST_TAXONOMY.general)
    .filter(i => i.platform.includes(platform))
    .sort((a,b) => b.affinity - a.affinity)
    .slice(0, limit)
}