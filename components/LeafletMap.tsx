'use client'
import { useEffect, useRef } from 'react'
import type { Report } from '@/lib/redis'
import 'leaflet/dist/leaflet.css'

interface Props {
  reports: Report[]
  pinColor: (r: Report) => string
  recencyClass: (timestamp: number) => string
}

export default function LeafletMap({ reports, pinColor, recencyClass }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const L = require('leaflet')

    // Belt-and-suspenders mobile detection: use screen.width as the
    // authoritative signal since innerWidth can be wrong before layout settles
    const screenWidth = window.screen.width
    const innerWidth = window.innerWidth
    const isMobile = screenWidth <= 768 || innerWidth <= 768

    console.log('Screen:', screenWidth, 'Inner:', innerWidth, 'Mobile:', isMobile)

    const startCenter: [number, number] = isMobile ? [45, -100] : [38.5, -90]
    const startZoom = isMobile ? 2 : 4.5

    const map = L.map(containerRef.current, {
      center: startCenter,
      zoom: startZoom,
      minZoom: 1,
      maxZoom: 18,
      scrollWheelZoom: !isMobile,
      touchZoom: true,
      doubleClickZoom: true,
      dragging: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      zoomControl: true,
      attributionControl: true,
    })

    map.setMaxBounds([
      [5, -180],
      [80, -40],
    ])

    mapRef.current = map

    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    )

    tileLayer.on('tileerror', () => {
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
      ).addTo(map)
    })

    tileLayer.addTo(map)

    // Force Leaflet to re-measure the container after the browser paints.
    // Without this, the map can initialize against a zero-height container
    // and miscalculate the viewport, ignoring the zoom/center we set.
    setTimeout(() => {
      map.invalidateSize()
      if (window.screen.width <= 768 || window.innerWidth <= 768) {
        map.setView([45, -100], 2)
      }
    }, 100)

    // Scroll/zoom hint
    if (containerRef.current) {
      const hint = document.createElement('div')
      hint.textContent = 'Scroll to zoom · Pinch on mobile'
      hint.style.cssText = `
        position:absolute;bottom:60px;left:50%;transform:translateX(-50%);
        background:rgba(10,10,10,0.85);border:1px solid #2a2a2a;
        color:#666;font-family:'IBM Plex Mono',monospace;font-size:10px;
        letter-spacing:0.1em;padding:6px 14px;pointer-events:none;
        z-index:1001;white-space:nowrap;opacity:0;transition:opacity 0.3s;
      `
      containerRef.current.style.position = 'relative'
      containerRef.current.appendChild(hint)

      let hintDismissed = false
      const showHint = () => { if (!hintDismissed) hint.style.opacity = '1' }
      const hideHint = () => { hint.style.opacity = '0' }
      const dismissHint = () => { hintDismissed = true; hint.style.opacity = '0' }

      containerRef.current.addEventListener('mouseenter', showHint)
      containerRef.current.addEventListener('mouseleave', hideHint)
      map.on('zoom', dismissHint)
    }

    reports.forEach(report => {
      if (!report.lat || !report.lng) return

      const color = pinColor(report)
      const rc = recencyClass(report.timestamp)
      const glowColor = rc === 'red' ? '#ef4444' : rc === 'amber' ? '#f59e0b' : '#00ff88'

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:12px;height:12px;border-radius:50%;
          background:${color};
          border:2px solid ${glowColor};
          box-shadow:0 0 6px ${glowColor}88;
          cursor:pointer;
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })

      const age = Date.now() - report.timestamp
      const ageLabel = age < 60 * 60 * 1000
        ? `${Math.round(age / 60000)}m ago`
        : age < 24 * 60 * 60 * 1000
        ? `${Math.round(age / 3600000)}h ago`
        : `${Math.round(age / 86400000)}d ago`

      const popup = L.popup({ className: 'parvo-popup', closeButton: true, offset: [0, -6] }).setContent(`
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e0e0e0;background:#111;padding:10px 12px;border:1px solid #2a2a2a;border-radius:4px;min-width:160px;">
          <div style="color:#fff;font-weight:700;margin-bottom:6px;font-size:12px;">ZIP ${report.zip}</div>
          <div style="color:#888;margin-bottom:2px;">${report.city ?? ''}</div>
          <div style="margin-top:6px;display:flex;justify-content:space-between;gap:16px;">
            <span style="color:#aaa;">Disease</span>
            <span style="color:${color};font-weight:600;text-transform:capitalize;">${report.disease}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:16px;">
            <span style="color:#aaa;">Reported</span>
            <span style="color:#e0e0e0;">${ageLabel}</span>
          </div>
          <div style="margin-top:8px;font-size:9px;color:#777;letter-spacing:0.08em;">Anonymous community report</div>
        </div>
      `)

      L.marker([report.lat, report.lng], { icon })
        .bindPopup(popup)
        .addTo(map)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <>
    <div style={{ position: 'relative', width: '100%' }}>

      {/* Leaflet map canvas */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 'min(60vh, 400px)',
          minHeight: '280px',
          background: '#060606',
          touchAction: 'none',
        }}
      />

      {/* Empty state overlay — no border, transparent bg */}
      {reports.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          textAlign: 'center',
          pointerEvents: 'none',
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '12px',
            color: '#777777',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>No reports yet</div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            color: '#555555',
            letterSpacing: '0.08em',
          }}>Be the first to report a case</div>
        </div>
      )}

      {/* PIN KEY legend — bottom-right, over map. Hidden on mobile via CSS. */}
      <div className="pin-key-legend" style={{
        position: 'absolute',
        bottom: '24px',
        right: '16px',
        zIndex: 1000,
        background: 'rgba(10,10,10,0.90)',
        border: '1px solid #2a2a2a',
        padding: '10px 14px',
        minWidth: '120px',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '9px',
          color: '#888888',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>PIN KEY</div>
        {[
          { label: 'Last 48h',     color: '#ef4444' },
          { label: 'Last 7 days',  color: '#f59e0b' },
          { label: 'Last 30 days', color: '#00ff88' },
          { label: 'Historical',   color: '#3a3a3a' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: color,
              flexShrink: 0,
              border: color === '#3a3a3a' ? '1px solid #666' : 'none',
            }} />
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              color: '#888888',
              letterSpacing: '0.06em',
            }}>{label}</span>
          </div>
        ))}
      </div>

    </div>

    {/* Mobile-only legend row — flat strip below the map */}
    <div className="mobile-legend-row">
      {[
        { color: '#ef4444', label: 'Last 48h' },
        { color: '#f59e0b', label: 'Last 7 days' },
        { color: '#00ff88', label: 'Last 30 days' },
        { color: '#2a2a2a', label: 'Historical', border: '1px solid #666' },
      ].map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: item.color,
            flexShrink: 0,
            border: item.border ?? 'none',
          }} />
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            color: '#777',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
          }}>{item.label}</span>
        </div>
      ))}
    </div>
    </>
  )
}
