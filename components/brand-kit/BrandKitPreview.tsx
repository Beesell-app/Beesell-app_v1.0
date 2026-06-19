'use client'
// apps/web-app/components/brand-kit/BrandKitPreview.tsx
// Mini preview card — shows how the brand kit looks applied
import type { BrandKit } from '@/hooks/useBrandKit'

interface Props {
  kit:   BrandKit
  size?: 'sm' | 'md'
}

export function BrandKitPreview({ kit, size = 'md' }: Props) {
  const w = size === 'sm' ? 140 : 240
  const h = size === 'sm' ? 88  : 150

  return (
    <div
      style={{
        width:        `${w}px`,
        height:       `${h}px`,
        borderRadius: '10px',
        overflow:     'hidden',
        border:       '1px solid #E2E8F0',
        flexShrink:   0,
        position:     'relative',
        fontFamily:   kit.primaryFont ?? 'DM Sans',
      }}
    >
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: kit.bgColor ?? '#FFFFFF',
      }} />

      {/* Decorative stripe top */}
      <div style={{
        position:   'absolute',
        top:        0, left: 0, right: 0,
        height:     `${h * 0.45}px`,
        background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.secondaryColor})`,
      }} />

      {/* Logo area or initials */}
      <div style={{
        position:       'absolute',
        top:            `${h * 0.06}px`,
        left:           `${w * 0.05}px`,
        width:          `${w * 0.18}px`,
        height:         `${w * 0.18}px`,
        borderRadius:   '50%',
        background:     kit.accentColor ?? '#FFE600',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       `${w * 0.07}px`,
        fontWeight:     700,
        color:          kit.primaryColor,
        border:         '2px solid rgba(255,255,255,0.5)',
        overflow:       'hidden',
      }}>
        {kit.logoUrl ? (
          <img src={kit.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          kit.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Product name placeholder */}
      <div style={{
        position:     'absolute',
        top:          `${h * 0.47}px`,
        left:         `${w * 0.05}px`,
        right:        `${w * 0.05}px`,
        height:       `${h * 0.12}px`,
        borderRadius: '4px',
        background:   kit.textColor ?? '#0F172A',
        opacity:      0.15,
      }} />

      {/* Price placeholder */}
      <div style={{
        position:     'absolute',
        top:          `${h * 0.63}px`,
        left:         `${w * 0.05}px`,
        width:        `${w * 0.35}px`,
        height:       `${h * 0.10}px`,
        borderRadius: '4px',
        background:   kit.primaryColor,
        opacity:      0.6,
      }} />

      {/* CTA button placeholder */}
      <div style={{
        position:       'absolute',
        bottom:         `${h * 0.08}px`,
        right:          `${w * 0.05}px`,
        width:          `${w * 0.38}px`,
        height:         `${h * 0.16}px`,
        borderRadius:   '6px',
        background:     kit.primaryColor,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize:   `${w * 0.05}px`,
          fontWeight: 700,
          color:      '#FFFFFF',
          fontFamily: kit.primaryFont,
        }}>
          CTA
        </span>
      </div>

      {/* Accent dot */}
      <div style={{
        position:     'absolute',
        top:          `${h * 0.60}px`,
        right:        `${w * 0.05}px`,
        width:        `${h * 0.08}px`,
        height:       `${h * 0.08}px`,
        borderRadius: '50%',
        background:   kit.accentColor,
      }} />
    </div>
  )
}