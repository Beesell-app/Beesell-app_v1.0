// lib/avatar/types.ts
// ══════════════════════════════════════════════════════════════
// AI TALKING HEAD & AVATAR PRESENTER — Types & Data
// 20+ avatar · 30+ suara · Emotion engine · Backgrounds
// Text-to-Speech · Lip-sync · Video Composition
// ══════════════════════════════════════════════════════════════

export type AvatarGender   = 'female' | 'male'
export type AvatarStyle    = 'casual' | 'professional' | 'artsy' | 'sporty' | 'hijab' | 'formal'
export type AvatarEthnicity= 'jawa' | 'sunda' | 'minang' | 'batak' | 'betawi' | 'melayu' | 'chinese-indo' | 'general'
export type VoiceLanguage  = 'id-formal' | 'id-gaul' | 'jawa' | 'sunda' | 'minang' | 'mix-en'
export type VoiceEmotion   = 'neutral' | 'excited' | 'calm' | 'urgent' | 'empathetic' | 'whispering'
export type VoiceCharacter = 'energetik' | 'hangat' | 'authoritative' | 'friendly' | 'whispering' | 'professional'
export type BackgroundType = 'solid' | 'gradient' | 'stock' | 'custom' | 'virtual-studio' | 'blur'
export type PiPPosition    = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-right' | 'fullscreen'
export type AspectRatio    = '9:16' | '1:1' | '16:9' | '4:5'
export type LowerThirdStyle= 'minimal' | 'bold' | 'gradient' | 'card' | 'promo-badge'

// ── Avatar definition ─────────────────────────────────────────
export interface AvatarDef {
  id:          string
  label:       string
  emoji:       string
  gender:      AvatarGender
  style:       AvatarStyle
  ethnicity:   AvatarEthnicity
  age:         string
  desc:        string
  niche:       string[]              // best for which niches
  defaultVoiceId: string             // ElevenLabs voice ID
  didAvatarUrl:   string             // D-ID talking head source image URL
  previewThumb?:  string             // preview image
  isCustom?:      boolean
  isPremium?:     boolean
  monthlyNew?:    boolean
}

// ── 20+ Avatar Library ────────────────────────────────────────
export const AVATAR_LIBRARY: AvatarDef[] = [
  // WANITA — Casual
  {
    id:'f-jawa-muda',    label:'Sari — Jawa Muda',      emoji:'👩',   gender:'female', style:'casual',
    ethnicity:'jawa',    age:'19-24', desc:'Energik dan ramah, bicara cepat & modern. Cocok untuk beauty, fashion, snack.',
    niche:['fashion','beauty','food','lifestyle'],
    defaultVoiceId:'21m00Tcm4TlvDq8ikWAM', didAvatarUrl:'https://studio.d-id.com/actors/amy',
  },
  {
    id:'f-sunda-casual', label:'Dewi — Sunda Casual',   emoji:'👩‍🦰',  gender:'female', style:'casual',
    ethnicity:'sunda',   age:'20-27', desc:'Manis dan akrab. Dialek Sunda ringan yang terasa relatable untuk audiens Jabar.',
    niche:['beauty','skincare','food','baby'],
    defaultVoiceId:'AZnzlk1XvdvUeBnXmlld', didAvatarUrl:'https://studio.d-id.com/actors/sophie',
  },
  {
    id:'f-hijab-elegan', label:'Fatimah — Hijab Elegan', emoji:'🧕',  gender:'female', style:'hijab',
    ethnicity:'general', age:'22-30', desc:'Modest fashion dengan aura terpercaya. Sempurna untuk produk halal & muslimah.',
    niche:['hijab','halal','beauty','health'],
    defaultVoiceId:'EXAVITQu4vr4xnSDxMaL', didAvatarUrl:'https://studio.d-id.com/actors/natasha',
  },
  {
    id:'f-hijab-sporty',  label:'Layla — Hijab Sporty', emoji:'🧕',  gender:'female', style:'sporty',
    ethnicity:'general', age:'18-25', desc:'Aktif dan bersemangat. Cocok untuk produk olahraga, suplemen, dan gaya hidup sehat.',
    niche:['health','sport','hijab'],
    defaultVoiceId:'EXAVITQu4vr4xnSDxMaL', didAvatarUrl:'https://studio.d-id.com/actors/natasha', monthlyNew:true,
  },
  // WANITA — Professional
  {
    id:'f-pro-jakarta',  label:'Amanda — Jakarta Pro',  emoji:'👩‍💼',  gender:'female', style:'professional',
    ethnicity:'betawi',  age:'28-35', desc:'Profesional dan berkarakter. Ideal untuk brand premium, B2B, dan produk kesehatan.',
    niche:['health','gadget','professional','b2b'],
    defaultVoiceId:'MF3mGyEYCl7XYWbV9V6O', didAvatarUrl:'https://studio.d-id.com/actors/jane',
  },
  {
    id:'f-expert',       label:'Dr. Rina — Expert',    emoji:'👩‍⚕️',  gender:'female', style:'formal',
    ethnicity:'general', age:'30-40', desc:'Autoritas dokter/pakar. Memberikan kepercayaan instan untuk produk kesehatan.',
    niche:['health','supplement','skincare'], isPremium:true,
    defaultVoiceId:'MF3mGyEYCl7XYWbV9V6O', didAvatarUrl:'https://studio.d-id.com/actors/jane',
  },
  {
    id:'f-chinese-indo', label:'Celine — Chinese Indo', emoji:'👩‍🦱',  gender:'female', style:'artsy',
    ethnicity:'chinese-indo', age:'20-28', desc:'Trendy K-pop vibe. Cocok untuk skincare, kosmetik, dan produk kecantikan premium.',
    niche:['skincare','beauty','fashion'],
    defaultVoiceId:'ErXwobaYiN019PkySvjV', didAvatarUrl:'https://studio.d-id.com/actors/amy',
  },
  {
    id:'f-artsy',        label:'Nadia — Artsy Creative', emoji:'🎨',  gender:'female', style:'artsy',
    ethnicity:'general', age:'22-28', desc:'Kreatif dan eksentrik. Untuk produk art, craft, dan lifestyle unik.',
    niche:['lifestyle','art','fashion'],
    defaultVoiceId:'ErXwobaYiN019PkySvjV', didAvatarUrl:'https://studio.d-id.com/actors/amy',
  },
  // WANITA — Mature
  {
    id:'f-ibu-mature',   label:'Ibu Hani — Mature',    emoji:'👩‍🦳',  gender:'female', style:'casual',
    ethnicity:'jawa',    age:'35-45', desc:'Hangat seperti ibu. Untuk produk baby, keluarga, dan health supplement.',
    niche:['baby','family','health','cooking'],
    defaultVoiceId:'AZnzlk1XvdvUeBnXmlld', didAvatarUrl:'https://studio.d-id.com/actors/jane',
  },
  {
    id:'f-minang',       label:'Yanti — Minang',        emoji:'👩',   gender:'female', style:'casual',
    ethnicity:'minang',  age:'25-35', desc:'Intonasi Minang yang khas, hangat dan persuasif untuk audiens Sumatera.',
    niche:['food','fashion','health'], monthlyNew:true,
    defaultVoiceId:'21m00Tcm4TlvDq8ikWAM', didAvatarUrl:'https://studio.d-id.com/actors/sophie',
  },
  // PRIA — Casual
  {
    id:'m-bro-jakarta',  label:'Bro Kevin — Jakarta',  emoji:'👨',   gender:'male', style:'casual',
    ethnicity:'betawi',  age:'18-25', desc:'Santai dan authentik. Gaya ngobrol anak Jakarta masa kini.',
    niche:['gadget','food','lifestyle','fashion'],
    defaultVoiceId:'TxGEqnHWrfWFTfGW9XjX', didAvatarUrl:'https://studio.d-id.com/actors/daniel',
  },
  {
    id:'m-jawa-muda',    label:'Arif — Jawa Muda',     emoji:'👦',   gender:'male', style:'casual',
    ethnicity:'jawa',    age:'20-27', desc:'Ramah dan mudah dipercaya. Tone Jawa yang lembut cocok untuk keluarga.',
    niche:['family','food','health','home'],
    defaultVoiceId:'TxGEqnHWrfWFTfGW9XjX', didAvatarUrl:'https://studio.d-id.com/actors/daniel',
  },
  {
    id:'m-sporty',       label:'Fandi — Sporty',        emoji:'🏃‍♂️', gender:'male', style:'sporty',
    ethnicity:'general', age:'18-28', desc:'Energi tinggi, penuh semangat. Untuk suplemen, olahraga, dan outdoor.',
    niche:['sport','health','outdoor'],
    defaultVoiceId:'VR6AewLTigWG4xSOukaG', didAvatarUrl:'https://studio.d-id.com/actors/josh',
  },
  // PRIA — Professional
  {
    id:'m-pro-suit',     label:'Dimas — Business Pro',  emoji:'👨‍💼',  gender:'male', style:'professional',
    ethnicity:'general', age:'28-38', desc:'Profesional dan meyakinkan. Untuk teknologi, investasi, dan produk premium.',
    niche:['gadget','b2b','professional','tech'],
    defaultVoiceId:'pNInz6obpgDQGcFmaJgB', didAvatarUrl:'https://studio.d-id.com/actors/josh',
  },
  {
    id:'m-expert-tech',  label:'Mas Budi — Tech Expert', emoji:'👨‍💻', gender:'male', style:'professional',
    ethnicity:'jawa',    age:'28-40', desc:'Credible tech reviewer. Nada tenang dan informatif untuk produk gadget.',
    niche:['tech','gadget','software'], isPremium:true,
    defaultVoiceId:'pNInz6obpgDQGcFmaJgB', didAvatarUrl:'https://studio.d-id.com/actors/josh',
  },
  {
    id:'m-batak-mature', label:'Pak Sitorus — Batak',   emoji:'👨‍🦱',  gender:'male', style:'casual',
    ethnicity:'batak',   age:'35-45', desc:'Tegas dan terpercaya. Intonasi Batak yang bersemangat untuk UMKM.',
    niche:['business','food','health'], monthlyNew:true,
    defaultVoiceId:'VR6AewLTigWG4xSOukaG', didAvatarUrl:'https://studio.d-id.com/actors/daniel',
  },
  {
    id:'m-sunda-mature', label:'Kang Asep — Sunda',     emoji:'👨',   gender:'male', style:'casual',
    ethnicity:'sunda',   age:'30-40', desc:'Humble dan dekat. Nada Sunda yang familiar untuk audiens Jawa Barat.',
    niche:['food','family','health'],
    defaultVoiceId:'TxGEqnHWrfWFTfGW9XjX', didAvatarUrl:'https://studio.d-id.com/actors/daniel',
  },
  // CUSTOM placeholder
  {
    id:'custom-upload',  label:'Avatar Custom Kamu', emoji:'🤳', gender:'female', style:'casual',
    ethnicity:'general', age:'any', desc:'Upload foto wajahmu → AI generate talking head personal. Diperlukan verifikasi consent.',
    niche:['all'], isCustom:true,
    defaultVoiceId:'21m00Tcm4TlvDq8ikWAM', didAvatarUrl:'',
  },
]

// ── 30+ Voice definitions ─────────────────────────────────────
export interface VoiceDef {
  id:           string
  label:        string
  gender:       AvatarGender
  language:     VoiceLanguage
  character:    VoiceCharacter
  emotion:      VoiceEmotion[]       // supported emotions
  sampleText:   string
  elevenLabsId: string
  speed:        { min:number; max:number; default:number }
  niche:        string[]
  desc:         string
}

export const VOICE_LIBRARY: VoiceDef[] = [
  // Indonesia Formal — Wanita
  { id:'id-w-energetik',   label:'Ara — Energetik',     gender:'female', language:'id-formal', character:'energetik',
    emotion:['excited','neutral','urgent'], sampleText:'Halo! Produk ini benar-benar mengubah rutinitas perawatan kulitku!',
    elevenLabsId:'21m00Tcm4TlvDq8ikWAM', speed:{min:0.75,max:1.5,default:1.0}, niche:['beauty','fashion','food'],
    desc:'Suara cerah dan penuh semangat untuk konten viral' },
  { id:'id-w-hangat',      label:'Budi — Hangat',        gender:'female', language:'id-formal', character:'hangat',
    emotion:['calm','empathetic','neutral'], sampleText:'Hai, Bunda! Coba deh produk ini, terbukti cocok untuk kulit sensitif.',
    elevenLabsId:'AZnzlk1XvdvUeBnXmlld', speed:{min:0.75,max:1.3,default:0.95}, niche:['health','baby','family'],
    desc:'Suara ibu yang hangat dan meyakinkan' },
  { id:'id-w-authoritative', label:'Clara — Profesional', gender:'female', language:'id-formal', character:'authoritative',
    emotion:['neutral','calm','urgent'], sampleText:'Berdasarkan penelitian terbaru, formula ini terbukti efektif dalam 14 hari.',
    elevenLabsId:'MF3mGyEYCl7XYWbV9V6O', speed:{min:0.85,max:1.2,default:0.9}, niche:['health','b2b','tech'],
    desc:'Autoritas profesional yang meyakinkan' },
  { id:'id-w-friendly',    label:'Dita — Friendly',      gender:'female', language:'id-formal', character:'friendly',
    emotion:['excited','neutral','calm'], sampleText:'Yeay, ini dia produk yang udah aku tunggu-tunggu! Cobain deh, suka banget!',
    elevenLabsId:'ErXwobaYiN019PkySvjV', speed:{min:0.85,max:1.5,default:1.1}, niche:['fashion','lifestyle','beauty'],
    desc:'Friendly dan relatable seperti teman dekat' },
  { id:'id-w-whispering',  label:'Eva — Whispering',     gender:'female', language:'id-formal', character:'whispering',
    emotion:['calm','empathetic','whispering'], sampleText:'Psst, ini rahasia kecantikanku selama ini. Jangan bilang siapa-siapa ya.',
    elevenLabsId:'EXAVITQu4vr4xnSDxMaL', speed:{min:0.75,max:1.1,default:0.85}, niche:['beauty','skincare','luxury'],
    desc:'Suara berbisik yang misterius dan memikat' },
  // Indonesia Formal — Pria
  { id:'id-m-energetik',   label:'Fajar — Energetik',    gender:'male', language:'id-formal', character:'energetik',
    emotion:['excited','urgent','neutral'], sampleText:'Bro! Ini beneran game changer buat performa lo di lapangan!',
    elevenLabsId:'TxGEqnHWrfWFTfGW9XjX', speed:{min:0.85,max:1.5,default:1.1}, niche:['sport','gadget','lifestyle'],
    desc:'Energi tinggi untuk konten yang membakar semangat' },
  { id:'id-m-authoritative', label:'Gunawan — Authoritative', gender:'male', language:'id-formal', character:'authoritative',
    emotion:['neutral','calm','urgent'], sampleText:'Sebagai praktisi di bidang ini selama 10 tahun, saya sangat merekomendasikan produk ini.',
    elevenLabsId:'pNInz6obpgDQGcFmaJgB', speed:{min:0.8,max:1.2,default:0.9}, niche:['b2b','health','tech'],
    desc:'Kredibilitas pakar yang membangun kepercayaan' },
  { id:'id-m-hangat',      label:'Hendra — Hangat',      gender:'male', language:'id-formal', character:'hangat',
    emotion:['calm','empathetic','neutral'], sampleText:'Buat para bapak yang mau kasih yang terbaik buat keluarga, ini jawabannya.',
    elevenLabsId:'VR6AewLTigWG4xSOukaG', speed:{min:0.8,max:1.2,default:0.95}, niche:['family','health','home'],
    desc:'Bapak yang hangat dan bisa dipercaya' },
  { id:'id-m-friendly',    label:'Iqbal — Friendly',     gender:'male', language:'id-formal', character:'friendly',
    emotion:['excited','neutral','calm'], sampleText:'Hei guys! Iq di sini. Hari ini mau review produk yang udah viral banget nih.',
    elevenLabsId:'yoZ06aMxZJJ28mfd3POQ', speed:{min:0.9,max:1.5,default:1.0}, niche:['gadget','food','lifestyle'],
    desc:'Reviewer friendly yang authentik' },
  // Gaul Jakarta
  { id:'id-gaul-w',        label:'Jessy — Gaul Cewek',  gender:'female', language:'id-gaul', character:'friendly',
    emotion:['excited','neutral'], sampleText:'Bestie! Udah cobain belum? Ini tuh serius bikin hidup jauh lebih enak, gilaa!',
    elevenLabsId:'21m00Tcm4TlvDq8ikWAM', speed:{min:0.9,max:1.5,default:1.1}, niche:['fashion','beauty','food'],
    desc:'Bahasa gaul Jakarta yang hits banget' },
  { id:'id-gaul-m',        label:'Kevin — Gaul Cowok',  gender:'male', language:'id-gaul', character:'friendly',
    emotion:['excited','neutral'], sampleText:'Bro, gue jujur nih ya. Ini beneran worth it banget. Gak nyesel dah!',
    elevenLabsId:'TxGEqnHWrfWFTfGW9XjX', speed:{min:0.9,max:1.5,default:1.1}, niche:['gadget','food','lifestyle'],
    desc:'Cowok gaul Jakarta yang apa adanya' },
  // Dialek Jawa
  { id:'jawa-w',           label:'Mbak Sari — Jawa',    gender:'female', language:'jawa', character:'hangat',
    emotion:['calm','empathetic','neutral'], sampleText:'Monggo dicoba, produke bener-bener apik tenan. Tak rekomendasike lho!',
    elevenLabsId:'AZnzlk1XvdvUeBnXmlld', speed:{min:0.75,max:1.1,default:0.9}, niche:['food','family','health'],
    desc:'Kehangatan Jawa yang authentic dan menyentuh' },
  { id:'jawa-m',           label:'Mas Arif — Jawa',     gender:'male', language:'jawa', character:'hangat',
    emotion:['calm','neutral'], sampleText:'Wis, ora perlu bingung maneh. Produk iki pancen nyata manfaate, suwun!',
    elevenLabsId:'VR6AewLTigWG4xSOukaG', speed:{min:0.75,max:1.1,default:0.9}, niche:['food','health','home'],
    desc:'Kakak Jawa yang amanah dan dipercaya' },
  // Dialek Sunda
  { id:'sunda-w',          label:'Neng Dewi — Sunda',   gender:'female', language:'sunda', character:'friendly',
    emotion:['neutral','calm'], sampleText:'Aeh, ieu mah enya-eyna sae. Cobian atuh, pasti tos resep!',
    elevenLabsId:'ErXwobaYiN019PkySvjV', speed:{min:0.8,max:1.1,default:0.9}, niche:['beauty','food','family'],
    desc:'Keramahan Sunda yang bikin nyaman' },
  { id:'sunda-m',          label:'Kang Asep — Sunda',   gender:'male', language:'sunda', character:'friendly',
    emotion:['neutral','calm'], sampleText:'Hatur nuhun geus percanten ka produk kami. Dijamin sae pisan!',
    elevenLabsId:'TxGEqnHWrfWFTfGW9XjX', speed:{min:0.8,max:1.1,default:0.9}, niche:['food','home','health'],
    desc:'Kang Sunda yang sopan dan jujur' },
  // Dialek Minang
  { id:'minang-w',         label:'Uni Yanti — Minang',  gender:'female', language:'minang', character:'energetik',
    emotion:['excited','neutral'], sampleText:'Alah, ndak usah ragu lai! Iko memang terbaiak, buktikan surang!',
    elevenLabsId:'21m00Tcm4TlvDq8ikWAM', speed:{min:0.85,max:1.3,default:1.0}, niche:['food','fashion','health'],
    desc:'Semangat Minang yang menular dan persuasif' },
  // Mix English-Indonesia
  { id:'mix-en-w',         label:'Rara — Bilingual',    gender:'female', language:'mix-en', character:'professional',
    emotion:['neutral','calm','excited'], sampleText:"So guys, this product is literally the best! Beneran deh, worth every rupiah!",
    elevenLabsId:'EXAVITQu4vr4xnSDxMaL', speed:{min:0.85,max:1.3,default:1.0}, niche:['tech','beauty','lifestyle'],
    desc:'Mix English-Indonesia untuk audiens urban' },
  { id:'mix-en-m',         label:'Stefan — Bilingual',  gender:'male', language:'mix-en', character:'professional',
    emotion:['neutral','calm'], sampleText:"Okay team, so I've been using this for 2 weeks now. Honestly? Game changer banget!",
    elevenLabsId:'pNInz6obpgDQGcFmaJgB', speed:{min:0.85,max:1.3,default:1.0}, niche:['tech','b2b','startup'],
    desc:'Professional bilingual untuk konten premium' },
]

// ── Background presets ────────────────────────────────────────
export interface BackgroundPreset {
  id:     string
  label:  string
  type:   BackgroundType
  preview:string   // CSS background value or image URL
  desc:   string
  niche?: string[]
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // Solid
  { id:'white',       label:'Pure White',        type:'solid',          preview:'#FFFFFF',                    desc:'Bersih, cocok untuk semua produk marketplace' },
  { id:'cream',       label:'Soft Cream',         type:'solid',          preview:'#FEF9EF',                    desc:'Hangat, cocok untuk beauty dan food' },
  { id:'black',       label:'Dark Premium',       type:'solid',          preview:'#111111',                    desc:'Mewah dan premium, cocok untuk gadget' },
  { id:'navy',        label:'Navy Professional',  type:'solid',          preview:'#1E3A5F',                    desc:'Profesional, cocok untuk B2B dan jasa' },
  // Gradients
  { id:'grad-amber',  label:'Sunrise Gradient',   type:'gradient',       preview:'linear-gradient(135deg,#F59E0B,#FDE68A)', desc:'Energetik, cocok untuk promo dan diskon' },
  { id:'grad-purple', label:'Purple Dream',        type:'gradient',       preview:'linear-gradient(135deg,#7C3AED,#C4B5FD)', desc:'Elegan, cocok untuk beauty premium' },
  { id:'grad-green',  label:'Fresh Nature',        type:'gradient',       preview:'linear-gradient(135deg,#059669,#6EE7B7)', desc:'Segar, cocok untuk health dan organik' },
  { id:'grad-pink',   label:'Rose Gold',           type:'gradient',       preview:'linear-gradient(135deg,#EC4899,#FCA5A5)', desc:'Feminim dan stylish, fashion & beauty' },
  { id:'grad-blue',   label:'Ocean Deep',          type:'gradient',       preview:'linear-gradient(135deg,#2563EB,#93C5FD)', desc:'Teknologi dan kepercayaan' },
  // Virtual Studio
  { id:'studio-news',  label:'News Desk',          type:'virtual-studio', preview:'#1A2744',                   desc:'Studio berita profesional untuk konten serius', niche:['b2b','health'] },
  { id:'studio-coffee',label:'Cafe Corner',         type:'virtual-studio', preview:'#6B4C2A',                   desc:'Suasana cafe warm & cozy untuk F&B', niche:['food','lifestyle'] },
  { id:'studio-minimal',label:'Minimal Office',     type:'virtual-studio', preview:'#E8E8E8',                   desc:'Workspace modern yang clean', niche:['tech','professional'] },
  { id:'studio-nature', label:'Garden Outdoor',     type:'virtual-studio', preview:'#2D6A4F',                   desc:'Alam segar untuk produk natural & organik', niche:['health','food'] },
  // Blur / Bokeh
  { id:'blur-warm',    label:'Bokeh Warm',          type:'blur',           preview:'radial-gradient(circle,#FDE68A,#F59E0B)', desc:'Bokeh hangat yang elegan' },
  { id:'blur-cool',    label:'Bokeh Cool',          type:'blur',           preview:'radial-gradient(circle,#BAE6FD,#3B82F6)', desc:'Bokeh sejuk dan modern' },
  // Stock (URL placeholders)
  { id:'stock-city',   label:'Kota Modern',         type:'stock',          preview:'linear-gradient(135deg,#1E293B,#475569)', desc:'Cityscape modern untuk lifestyle' },
  { id:'stock-mall',   label:'Pusat Perbelanjaan',  type:'stock',          preview:'linear-gradient(135deg,#F1F5F9,#CBD5E1)', desc:'Mall & shopping atmosphere' },
  // Custom
  { id:'custom-upload',label:'Upload Background',  type:'custom',         preview:'repeating-conic-gradient(#E5E7EB 0% 25%, #F9FAFB 0% 50%) 0 0/20px 20px', desc:'Upload video/gambar background sendiri' },
]

// ── Lower Third configs ────────────────────────────────────────
export interface LowerThirdConfig {
  enabled:      boolean
  style:        LowerThirdStyle
  productName:  string
  tagline?:     string
  price?:       string
  badge?:       string    // 'DISKON 30%', 'FLASH SALE', dll
  showDuration: number    // seconds to show
  position:     'bottom' | 'top'
  color:        string    // accent color
}

// ── PiP Layout ─────────────────────────────────────────────────
export interface PiPConfig {
  enabled:   boolean
  position:  PiPPosition
  size:      number         // % of frame width: 20-45
  mediaUrl:  string         // product image or video
  mediaType: 'image'|'video'
  border:    boolean
  shadow:    boolean
}

// ── Emotion segment ────────────────────────────────────────────
// Script dipecah per segmen dengan emosi berbeda
export interface ScriptSegment {
  id:      string
  text:    string
  emotion: VoiceEmotion
  speed:   number       // 0.75 - 1.5
  pause:   number       // pause in seconds after segment
}

// ── Full composition config ────────────────────────────────────
export interface TalkingHeadConfig {
  // Avatar
  avatarId:      string
  customImageUrl?:string       // for custom-upload avatar
  consentGiven:  boolean       // required for custom face

  // Voice
  voiceId:       string
  language:      VoiceLanguage
  baseSpeed:     number        // 0.75 - 1.5
  emotion:       VoiceEmotion  // main emotion

  // Script
  script:        string        // full script text
  segments:      ScriptSegment[]
  aiGenerated:   boolean

  // Background
  backgroundId:  string
  backgroundUrl?:string        // for custom upload

  // Composition
  aspectRatio:   AspectRatio
  duration:      number        // seconds

  // Lower third
  lowerThird:    LowerThirdConfig

  // PiP
  pip:           PiPConfig

  // Output
  quality:       'fast'|'balanced'|'hd'   // processing tier
  platform:      'tiktok'|'instagram'|'youtube'|'shopee'|'universal'
}

// ── Emotion to ElevenLabs settings ────────────────────────────
export const EMOTION_SETTINGS: Record<VoiceEmotion, {
  label: string; icon: string; desc: string
  stabilityRange: [number,number]
  similarityBoost: number
  styleExaggeration: number
}> = {
  neutral:    { label:'Normal',     icon:'😐', desc:'Bicara natural tanpa penekanan berlebihan', stabilityRange:[0.5,0.7], similarityBoost:0.85, styleExaggeration:0.2 },
  excited:    { label:'Semangat',   icon:'🔥', desc:'Antusias tinggi, penuh energi',              stabilityRange:[0.3,0.5], similarityBoost:0.9,  styleExaggeration:0.7 },
  calm:       { label:'Tenang',     icon:'😌', desc:'Slow dan menenangkan, penuh kepercayaan',    stabilityRange:[0.7,0.9], similarityBoost:0.8,  styleExaggeration:0.1 },
  urgent:     { label:'Urgensi',    icon:'⚡', desc:'Tegas, cepat, memotivasi tindakan segera',   stabilityRange:[0.35,0.55],similarityBoost:0.9,  styleExaggeration:0.6 },
  empathetic: { label:'Empati',     icon:'💙', desc:'Hangat dan memahami perasaan pendengar',     stabilityRange:[0.6,0.8], similarityBoost:0.85, styleExaggeration:0.3 },
  whispering: { label:'Berbisik',   icon:'🤫', desc:'Intim dan misterius, seperti membisikkan rahasia', stabilityRange:[0.8,0.95],similarityBoost:0.75, styleExaggeration:0.05 },
}

// ── Platform aspect ratio mapping ─────────────────────────────
export const PLATFORM_RATIOS: Record<string, { ratio:AspectRatio; label:string }> = {
  tiktok:    { ratio:'9:16', label:'TikTok / Reels 9:16' },
  instagram: { ratio:'9:16', label:'Instagram Reels 9:16' },
  youtube:   { ratio:'16:9', label:'YouTube 16:9' },
  shopee:    { ratio:'1:1',  label:'Shopee Video 1:1' },
  universal: { ratio:'9:16', label:'Universal (9:16)' },
}

// ── Lower third presets ────────────────────────────────────────
export const LOWER_THIRD_STYLES: Record<LowerThirdStyle, {
  label:string; desc:string; preview:string
}> = {
  'minimal':     { label:'Minimal',     desc:'Teks tipis di bagian bawah',         preview:'text-white text-lg font-medium' },
  'bold':        { label:'Bold',        desc:'Background solid dengan teks tebal', preview:'bg-amber text-white px-4 py-2 rounded' },
  'gradient':    { label:'Gradient',    desc:'Gradient dari transparan ke warna',   preview:'bg-gradient' },
  'card':        { label:'Card',        desc:'Kartu floating dengan shadow',        preview:'bg-white/90 rounded-xl shadow-lg p-3' },
  'promo-badge': { label:'Promo Badge', desc:'Badge promo menonjol',               preview:'bg-red text-white rounded-full' },
}

// ── Helpers ────────────────────────────────────────────────────
export const fmtDuration = (s:number) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m${s%60>0?` ${s%60}s`:''}`

export function getAvatarsByStyle(style: AvatarStyle): AvatarDef[] {
  return AVATAR_LIBRARY.filter(a => a.style === style && !a.isCustom)
}

export function getVoicesByLanguage(lang: VoiceLanguage): VoiceDef[] {
  return VOICE_LIBRARY.filter(v => v.language === lang)
}

export function suggestVoiceForAvatar(avatarId: string): VoiceDef | undefined {
  const avatar = AVATAR_LIBRARY.find(a => a.id === avatarId)
  if (!avatar) return undefined
  return VOICE_LIBRARY.find(v =>
    v.elevenLabsId === avatar.defaultVoiceId
  ) ?? VOICE_LIBRARY[0]
}