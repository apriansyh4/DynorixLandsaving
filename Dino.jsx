import { useEffect, useRef } from 'react'

// Dinorix, maskot dino biru. mood: 'happy' | 'warn' | 'bad'
export default function Dino({ mood = 'happy', size = 170, followPointer = false, onClick }) {
  const pupil = useRef(null)
  const wrap = useRef(null)

  useEffect(() => {
    if (!followPointer) return
    const move = (e) => {
      const r = wrap.current?.getBoundingClientRect()
      if (!r || !pupil.current) return
      const dx = Math.max(-2, Math.min(2, (e.clientX - (r.left + r.width * 0.73)) / 80))
      const dy = Math.max(-2, Math.min(2, (e.clientY - (r.top + r.height * 0.3)) / 80))
      pupil.current.setAttribute('cx', 148 + dx)
      pupil.current.setAttribute('cy', 51 + dy)
    }
    document.addEventListener('pointermove', move)
    return () => document.removeEventListener('pointermove', move)
  }, [followPointer])

  const mouth =
    mood === 'happy' ? 'M142 76 Q158 88 172 74' : mood === 'warn' ? 'M144 80 L170 78' : 'M144 84 Q158 72 172 84'

  return (
    <div
      ref={wrap}
      className={`dino ${onClick ? 'clickable' : ''}`}
      style={{ width: size }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      aria-label="Dinorix si dino biru"
    >
      <svg viewBox="0 0 200 170" aria-hidden="true">
        <g className="bob">
          <g className="tail">
            <path d="M70 118 Q30 120 12 96 Q36 108 64 100 Z" fill="var(--dino)" stroke="var(--dino-dark)" strokeWidth="3" strokeLinejoin="round" />
          </g>
          <ellipse cx="96" cy="112" rx="42" ry="38" fill="var(--dino)" stroke="var(--dino-dark)" strokeWidth="3" />
          <ellipse cx="104" cy="120" rx="24" ry="24" fill="var(--belly)" />
          <path d="M70 80 l6 -12 l6 10 l6 -13 l6 12 l6 -12 l5 12" fill="var(--spikes)" stroke="var(--dino-dark)" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="78" y="140" width="14" height="20" rx="6" fill="var(--dino)" stroke="var(--dino-dark)" strokeWidth="3" />
          <rect x="106" y="140" width="14" height="20" rx="6" fill="var(--dino)" stroke="var(--dino-dark)" strokeWidth="3" />
          <ellipse cx="140" cy="62" rx="40" ry="32" fill="var(--dino)" stroke="var(--dino-dark)" strokeWidth="3" />
          <path d="M128 104 q8 6 14 0" fill="none" stroke="var(--dino-dark)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="170" cy="56" r="2.5" fill="var(--dino-dark)" />
          <circle cx="146" cy="50" r="7" fill="#fff" stroke="var(--dino-dark)" strokeWidth="2" />
          <circle ref={pupil} cx="148" cy="51" r="3.5" fill="#15233a" />
          <path d={mouth} fill="none" stroke="var(--dino-dark)" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="134" cy="72" rx="6" ry="3.5" fill="#f4a3b4" opacity=".7" />
          {mood !== 'happy' && <path d="M118 38 q-5 9 0 12 q5 -3 0 -12z" fill="#7cc6f0" />}
          {mood !== 'bad' && (
            <g>
              <circle cx="118" cy="24" r="10" fill="var(--spikes)" stroke="var(--dino-dark)" strokeWidth="2" />
              <text x="118" y="28.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--dino-dark)" fontFamily="Baloo 2, sans-serif">Rp</text>
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}
