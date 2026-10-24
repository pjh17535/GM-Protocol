import React from 'react'

interface GMProtocolLogoProps {
  size?: number
  variant?: 'icon' | 'full'
  className?: string
}

// Logo A — 日出弧形版（正式版）
function LogoIcon({ size = 36 }: { size: number }) {
  const id = `lgA_${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${id}bg`} cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#3E2B63" />
          <stop offset="100%" stopColor="#1B3158" />
        </radialGradient>
        <linearGradient id={`${id}arc`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`${id}glow`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="28" fill={`url(#${id}bg)`} />
      <ellipse cx="28" cy="38" rx="22" ry="8" fill={`url(#${id}glow)`} />
      <path d="M10 35 Q28 14 46 35" stroke={`url(#${id}arc)`} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <line x1="8" y1="38" x2="48" y2="38" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.6"/>
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="800" fontFamily="system-ui,sans-serif" fill="white" letterSpacing="-0.5">GM</text>
      <circle cx="28" cy="45" r="4.5" stroke="#F59E0B" strokeWidth="1" fill="none" strokeOpacity="0.8"/>
      <circle cx="28" cy="45" r="2.8" stroke="#F59E0B" strokeWidth="0.8" fill="none" strokeOpacity="0.5"/>
      <circle cx="28" cy="45" r="1.2" fill="#F59E0B" fillOpacity="0.6"/>
    </svg>
  )
}

export default function GMProtocolLogo({ size = 36, variant = 'full', className = '' }: GMProtocolLogoProps) {
  if (variant === 'icon') {
    return <LogoIcon size={size} />
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={size} />
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500"
          style={{ fontSize: size * 0.4, letterSpacing: '-0.02em' }}>
          GM Protocol
        </span>
        <span className="text-gray-500" style={{ fontSize: size * 0.22 }}>Built on Arc</span>
      </div>
    </div>
  )
}
