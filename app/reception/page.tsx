'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ===== PAGE DATA =====
const PAGES = [
  { id: 'cover',     img: '/images/01-cover.jpg',     bg: '#f0e8d0', petals: 'hearts',   type: 'cover' },
  { id: 'invite',    img: '/images/02-invite.jpg',     bg: '#f0e8d0', petals: 'hearts',   type: 'plain' },
  { id: 'reception', img: '/images/07-reception.jpg',  bg: '#8b1a2a', petals: 'roses',    type: 'event',
    map: 'https://maps.google.com/?q=Friends+Banquets+HT+Desai+Compound+Dahisar+West+Mumbai' },
  { id: 'closing',   img: '/images/08-closing.jpg',    bg: '#f0e8d0', petals: 'hearts',   type: 'closing' },
]

const PETAL_TYPES: Record<string, string[]> = {
  hearts:   ['❤️','💕','💗','🤍','💖'],
  leaves:   ['🌿','🍃','🌸','☘️','🍀'],
  marigold: ['🌼','🌻','💛','🟡','🌕'],
  sparkles: ['✨','⭐','💫','🌟','⚡'],
  lotus:    ['🪷','🌸','💮','🏵️','🌺'],
  roses:    ['🌹','🥀','💐','🌺','💝'],
}

const WEDDING_DATE = new Date('2026-05-03T09:00:00+05:30')

// ===== PETAL TYPE =====
interface Petal {
  x: number; y: number; sp: number; wb: number; wf: number;
  sz: number; em: string; rot: number; rs: number; op: number;
}

export default function WeddingInvite() {
  const mainRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const petalsRef = useRef<Petal[]>([])
  const curPetalsRef = useRef('hearts')
  const [musicOn, setMusicOn] = useState(false)
  const [scrollHint, setScrollHint] = useState(true)
  const [countdown, setCountdown] = useState({ d: '--', h: '--', m: '--', s: '--' })

  // ===== VIEWPORT HEIGHT FIX =====
  useEffect(() => {
    const fix = () => {
      document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`)
    }
    fix()
    window.addEventListener('resize', fix)
    window.addEventListener('orientationchange', () => setTimeout(fix, 300))
    return () => window.removeEventListener('resize', fix)
  }, [])

  // ===== COUNTDOWN =====
  useEffect(() => {
    const tick = () => {
      const d = +WEDDING_DATE - +new Date()
      if (d <= 0) return
      setCountdown({
        d: String(Math.floor(d / 864e5)),
        h: String(Math.floor(d % 864e5 / 36e5)).padStart(2, '0'),
        m: String(Math.floor(d % 36e5 / 6e4)).padStart(2, '0'),
        s: String(Math.floor(d % 6e4 / 1e3)).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ===== MUSIC — maximum autoplay =====
  const tryPlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || musicStartedRef.current) return
    audio.volume = 0.4
    audio.play()
      .then(() => { setMusicOn(true); musicStartedRef.current = true })
      .catch(() => {})
  }, [])

  const musicStartedRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Cache audio
    if ('caches' in window) {
      caches.open('wedding-audio-v1').then(cache => {
        cache.match('/music/jashn-e-bahara.mp3').then(r => {
          if (!r) cache.add('/music/jashn-e-bahara.mp3')
        })
      }).catch(() => {})
    }

    // Method 1: Try muted autoplay then unmute
    audio.muted = true
    audio.volume = 0
    audio.play().then(() => {
      // Muted play worked — try unmuting
      setTimeout(() => {
        audio.muted = false
        audio.volume = 0.4
        setMusicOn(true)
        musicStartedRef.current = true
      }, 50)
    }).catch(() => {})

    // Method 2: Direct play with sound
    setTimeout(() => { if (!musicStartedRef.current) tryPlay() }, 200)

    // Method 3: AudioContext unlock
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const buf = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource()
      src.buffer = buf; src.connect(ctx.destination); src.start(0)
      ctx.resume().then(() => { if (!musicStartedRef.current) setTimeout(tryPlay, 100) })
    } catch {}

    // Method 4: Retry every 500ms for 3 seconds
    const retries = [500, 1000, 1500, 2000, 2500, 3000]
    const timers = retries.map(ms => setTimeout(() => { if (!musicStartedRef.current) tryPlay() }, ms))

    // Method 5: First interaction — catches ANY touch/scroll/click
    const unlock = () => {
      if (!musicStartedRef.current) {
        const a = audioRef.current
        if (a) { a.muted = false; a.volume = 0.4 }
        tryPlay()
        // Double tap
        setTimeout(tryPlay, 50)
        setTimeout(tryPlay, 150)
      }
      events.forEach(e => document.removeEventListener(e, unlock))
      events.forEach(e => window.removeEventListener(e, unlock))
    }
    const events = ['touchstart','touchend','touchmove','click','scroll','keydown','pointerdown','mousedown','wheel']
    events.forEach(e => {
      document.addEventListener(e, unlock, { passive: true })
      window.addEventListener(e, unlock, { passive: true })
    })

    return () => {
      timers.forEach(clearTimeout)
      events.forEach(e => {
        document.removeEventListener(e, unlock)
        window.removeEventListener(e, unlock)
      })
    }
  }, [tryPlay])

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (musicOn) { audio.pause(); setMusicOn(false) }
    else { audio.play().then(() => setMusicOn(true)).catch(() => {}) }
  }

  // ===== PETALS CANVAS =====
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return

    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const mkPetal = (): Petal => {
      const t = PETAL_TYPES[curPetalsRef.current] || PETAL_TYPES.hearts
      return {
        x: Math.random() * cv.width, y: -20,
        sp: Math.random() * 1.2 + .4, wb: Math.random() * 2.0 - 1.0,
        wf: Math.random() * .03 + .01, sz: Math.random() * 16 + 14,
        em: t[Math.floor(Math.random() * t.length)],
        rot: Math.random() * 360, rs: Math.random() * 2.4 - 1.2,
        op: Math.random() * .4 + .35,
      }
    }

    let raf: number
    const draw = () => {
      cx.clearRect(0, 0, cv.width, cv.height)
      while (petalsRef.current.length < 25) petalsRef.current.push(mkPetal())
      for (let i = 0; i < petalsRef.current.length; i++) {
        const p = petalsRef.current[i]
        p.y += p.sp; p.x += Math.sin(p.y * p.wf) * p.wb; p.rot += p.rs
        cx.save(); cx.globalAlpha = p.op
        cx.translate(p.x, p.y); cx.rotate(p.rot * Math.PI / 180)
        cx.font = `${p.sz}px serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'
        cx.fillText(p.em, 0, 0); cx.restore()
        if (p.y > cv.height + 30) petalsRef.current[i] = mkPetal()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  // ===== INTERSECTION OBSERVERS =====
  useEffect(() => {
    const main = mainRef.current
    if (!main) return

    // Petal type observer
    const petalObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const t = (e.target as HTMLElement).dataset.petals
          if (t && t !== curPetalsRef.current) {
            curPetalsRef.current = t
            petalsRef.current = []
          }
        }
      })
    }, { root: main, threshold: 0.5 })

    // Anim observer
    const animObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('show')
      })
    }, { root: main, threshold: 0.2 })

    main.querySelectorAll('.page[data-petals]').forEach(p => petalObs.observe(p))
    main.querySelectorAll('.anim').forEach(el => animObs.observe(el))

    return () => { petalObs.disconnect(); animObs.disconnect() }
  }, [])

  // ===== SCROLL HINT =====
  useEffect(() => {
    const main = mainRef.current
    if (!main) return
    const h = () => { setScrollHint(false); main.removeEventListener('scroll', h) }
    main.addEventListener('scroll', h, { passive: true })
    return () => main.removeEventListener('scroll', h)
  }, [])

  return (
    <>
      <canvas id="petals" ref={canvasRef} />
      <button className="music-btn" onClick={toggleMusic}>
        {musicOn ? '🔊' : '🔈'}
      </button>
      <audio ref={audioRef} loop preload="auto">
        <source src="/music/jashn-e-bahara.mp3" type="audio/mpeg" />
      </audio>

      <div id="main" ref={mainRef}>
        {PAGES.map((page, i) => {
          const prev = PAGES[i - 1]
          const next = PAGES[i + 1]

          return (
            <div
              key={page.id}
              className="page"
              data-petals={page.petals}
              style={{
                background: page.bg,
                '--blend-top': prev ? prev.bg : 'transparent',
                '--blend-bottom': next ? next.bg : 'transparent',
              } as React.CSSProperties}
            >
              <div
                className="page-bg"
                style={{ backgroundImage: `url(${page.img})` }}
              />

              {/* Cover scroll hint */}
              {page.type === 'cover' && scrollHint && (
                <div className="scroll-hint">Scroll</div>
              )}

              {/* Event map button */}
              {page.type === 'event' && page.map && (
                <div className="page-btns">
                  <a href={page.map} target="_blank" rel="noopener noreferrer" className="map-btn anim">
                    📍 Navigate to Venue
                  </a>
                </div>
              )}

              {/* Countdown */}
              {page.type === 'closing' && (
                <div className="countdown-wrap">
                  <div className="cd-box">
                    <div className="cd-num">{countdown.d}</div>
                    <div className="cd-lbl">Days</div>
                  </div>
                  <div className="cd-box">
                    <div className="cd-num">{countdown.h}</div>
                    <div className="cd-lbl">Hours</div>
                  </div>
                  <div className="cd-box">
                    <div className="cd-num">{countdown.m}</div>
                    <div className="cd-lbl">Min</div>
                  </div>
                  <div className="cd-box">
                    <div className="cd-num">{countdown.s}</div>
                    <div className="cd-lbl">Sec</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
