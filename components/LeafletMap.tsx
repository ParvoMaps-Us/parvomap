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

    const map = L.map(containerRef.current, {
      center: [39.5, -98.35],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      dragging: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
    })

    map.setMaxBounds([
      [15, -170],
      [72, -50],
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

      const popup = L.popup({ className: 'parvo-popup', closeButton: false, offset: [0, -6] }).setContent(`
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e0e0e0;background:#111;padding:10px 12px;border:1px solid #333;border-radius:4px;min-width:160px;">
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
          <div style="margin-top:8px;font-size:9px;color:#555;letter-spacing:0.08em;">Anonymous community report</div>
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
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '420px', background: '#0a0a0a' }}
    />
  )
}
