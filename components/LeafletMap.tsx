'use client'
import { useEffect, useRef, useState } from 'react'
import type { Report } from '@/lib/redis'
import { DISEASE_MAP } from '@/lib/diseases'
import 'leaflet/dist/leaflet.css'

const DAY_MS = 86_400_000

/** A pin is "historical" once it's older than its disease's TTL (past-TTL pins
 *  render dimmed and are hidden when the Historical toggle is off). */
function isHistorical(r: Report): boolean {
  const ttlDays = DISEASE_MAP[r.disease]?.pinTtlDays ?? 90
  return Date.now() - r.timestamp > ttlDays * DAY_MS
}

interface Props {
  reports: Report[]
  pinColor: (r: Report) => string
  recencyClass: (timestamp: number) => string
}

// Non-individual reporter types get a distinct emoji marker; individuals stay dots.
const REPORTER_EMOJI: Record<string, string> = {
  vet:      '🏥',
  facility: '🏢',
  news:     '📰',
}

/** Escape user-supplied text before injecting into popup HTML (XSS-safe). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Small "report this pin" control appended to each report popup for moderation. */
function flagButtonHtml(id: string): string {
  return `<button class="flag-pin-btn" data-id="${escapeHtml(id)}" style="margin-top:8px;width:100%;background:transparent;color:#999;border:1px solid #2a2a2a;border-radius:3px;padding:5px 0;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.06em;cursor:pointer;">🚩 Report this pin</button>`
}

/** Popup markup for a lost-dog pin: photo, name, details, exact address, contact. */
function lostPopupHtml(report: Report, ageLabel: string): string {
  const isSighting = report.lostKind === 'sighting'
  const heading = isSighting ? '👀 Dog spotted' : '🐶 Lost dog'
  const headColor = isSighting ? '#f59e0b' : '#ef4444'
  const name = report.dogName ? escapeHtml(report.dogName) : (isSighting ? 'Unknown dog' : 'Lost dog')
  const descParts = [report.dogBreed, report.dogDescription].filter(Boolean).map(s => escapeHtml(s as string))
  const lastSeen = report.lastSeen ? escapeHtml(formatLastSeen(report.lastSeen)) : ''
  const place = report.address || report.locationDetail || report.city || ''

  return `
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e0e0e0;background:#111;padding:10px 12px;border:1px solid #2a2a2a;border-radius:4px;min-width:180px;max-width:240px;">
      <div style="color:${headColor};font-weight:700;margin-bottom:6px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;">${heading}</div>
      ${report.photoUrl && /^https?:\/\//i.test(report.photoUrl) ? `<img src="${escapeHtml(report.photoUrl)}" alt="${name}" style="width:100%;height:130px;object-fit:cover;border-radius:3px;margin-bottom:6px;border:1px solid #2a2a2a;" />` : ''}
      <div style="color:#fff;font-weight:700;font-size:13px;margin-bottom:2px;">${name}</div>
      ${descParts.length ? `<div style="color:#bbb;margin-bottom:4px;line-height:1.4;">${descParts.join(' · ')}</div>` : ''}
      ${place ? `<div style="color:#00ff88;margin:4px 0;font-size:11px;line-height:1.4;">📍 ${escapeHtml(place)}</div>` : ''}
      ${lastSeen ? `<div style="display:flex;justify-content:space-between;gap:16px;"><span style="color:#aaa;">Last seen</span><span style="color:#e0e0e0;">${lastSeen}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="color:#aaa;">Reported</span><span style="color:#e0e0e0;">${ageLabel}</span></div>
      ${report.contact ? `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #222;color:#60a5fa;font-size:11px;word-break:break-word;">📞 ${escapeHtml(report.contact)}</div>` : ''}
      <div style="margin-top:8px;font-size:9px;color:#999;letter-spacing:0.08em;">Community lost-dog report</div>
      ${flagButtonHtml(report.id)}
    </div>
  `
}

/** Render an ISO/datetime-local string as a short human date; fall back to raw. */
function formatLastSeen(v: string): string {
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function LeafletMap({ reports, pinColor, recencyClass }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  // Click-to-drop-a-pin: ref drives the live map click handler, state drives the
  // toggle button's appearance.
  const dropModeRef = useRef(false)
  const dropMarkerRef = useRef<any>(null)
  const [dropMode, setDropMode] = useState(false)
  // Current filter-bar selection. A ref (not state) so the map's one-time effect
  // reads live values without re-initializing; the FilterBar broadcasts changes
  // via the 'parvomap:filter' window event.
  const filterRef = useRef({ disease: 'all', showHistorical: true, showUnverified: true })

  // Toggle "drop a pin" mode: next map click drops a draggable pin and prefills
  // the report form with its location.
  function toggleDropMode() {
    const next = !dropModeRef.current
    dropModeRef.current = next
    setDropMode(next)
    if (containerRef.current) {
      containerRef.current.style.cursor = next ? 'crosshair' : ''
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const L = require('leaflet')

    // Belt-and-suspenders mobile detection: use screen.width as the
    // authoritative signal since innerWidth can be wrong before layout settles
    const screenWidth = window.screen.width
    const innerWidth = window.innerWidth
    const isMobile = screenWidth <= 768 || innerWidth <= 768

    const startCenter: [number, number] = isMobile ? [38, -96] : [38.5, -90]
    const startZoom = isMobile ? 3 : 4

    const map = L.map(containerRef.current, {
      center: startCenter,
      zoom: startZoom,
      minZoom: 2,
      maxZoom: 18,
      scrollWheelZoom: !isMobile,
      touchZoom: true,
      doubleClickZoom: true,
      dragging: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      zoomControl: true,
      attributionControl: true,
    })

    map.setMaxBounds([
      [10, -170],
      [72, -50],
    ])

    mapRef.current = map

    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        // Lighten CARTO's very dark basemap so land/borders are legible while
        // keeping the dark theme. Applied via CSS on the .map-tiles class.
        className: 'map-tiles',
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
        map.setView([38, -96], 3)
      }
    }, 150)

    // Scroll/zoom hint
    if (containerRef.current) {
      const hint = document.createElement('div')
      hint.textContent = 'Scroll to zoom · Pinch on mobile'
      hint.style.cssText = `
        position:absolute;bottom:60px;left:50%;transform:translateX(-50%);
        background:rgba(10,10,10,0.85);border:1px solid #2a2a2a;
        color:#999;font-family:'IBM Plex Mono',monospace;font-size:10px;
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

    // Markers live in a layer group so we can clear and re-cluster on zoom.
    const markerLayer = L.layerGroup().addTo(map)

    // Double-click a marker → fast fly-zoom in (also declusters a hotspot).
    const flyZoom = (lat: number, lng: number) =>
      map.flyTo([lat, lng], Math.max(map.getZoom() + 4, 15), { duration: 0.6 })

    // "⚠ Report this area" CTA appended to popups; clicking it prefills the
    // form's location and scrolls to the report section.
    const reportBtnHtml =
      `<button class="report-area-btn" style="margin-top:10px;width:100%;background:#00ff88;color:#000;border:none;border-radius:3px;padding:7px 0;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;">⚠ Report this area</button>`

    const wireMarker = (
      marker: any,
      lat: number,
      lng: number,
      detail: { locationDetail?: string; lat: number; lng: number; zip: string },
    ) => {
      marker.on('dblclick', (ev: any) => { L.DomEvent.stop(ev); flyZoom(lat, lng) })
      marker.on('popupopen', (e: any) => {
        const el = e.popup.getElement()
        const btn = el?.querySelector('.report-area-btn')
        btn?.addEventListener('click', () => {
          map.closePopup()
          window.dispatchEvent(new CustomEvent('parvomap:report-area', { detail }))
        })

        // Moderation: flag this pin as inappropriate/fake. Posts to /api/flag.
        const flagBtn = el?.querySelector('.flag-pin-btn') as HTMLButtonElement | null
        if (flagBtn && !flagBtn.dataset.wired) {
          flagBtn.dataset.wired = '1'
          flagBtn.addEventListener('click', async () => {
            const id = flagBtn.getAttribute('data-id')
            if (!id) return
            const reason = window.prompt('Report this pin — what’s wrong with it? (optional)')
            if (reason === null) return // cancelled
            flagBtn.disabled = true
            flagBtn.textContent = 'Reporting…'
            const endpoint = window.location.hostname === 'parvomaps.us'
              ? 'https://www.parvomaps.us/api/flag'
              : '/api/flag'
            try {
              const res = await fetch(endpoint, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ id, reason: reason.trim() }),
              })
              flagBtn.textContent = res.ok ? '✓ Reported — thank you' : 'Failed — try again'
            } catch {
              flagBtn.textContent = 'Failed — try again'
              flagBtn.disabled = false
            }
          })
        }
      })
    }

    const addReportMarker = (report: Report) => {
      if (!report.lat || !report.lng) return

      const color = pinColor(report)
      const rc = recencyClass(report.timestamp)
      const glowColor = rc === 'red' ? '#ef4444' : rc === 'amber' ? '#f59e0b' : '#00ff88'

      // Lost dogs get a paw marker; vet/facility/news get their own emoji;
      // individual disease reporters stay as dots.
      const emoji = report.kind === 'lost'
        ? '🐶'
        : report.reporterType ? REPORTER_EMOJI[report.reporterType] : undefined
      const icon = emoji
        ? L.divIcon({
            className: '',
            html: `<div style="
              width:22px;height:22px;display:flex;align-items:center;justify-content:center;
              font-size:15px;line-height:1;
              ${isMobile ? '' : `filter:drop-shadow(0 0 4px ${glowColor});`}
              cursor:pointer;
            ">${emoji}</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          })
        : L.divIcon({
            className: '',
            html: `<div style="
              width:12px;height:12px;border-radius:50%;
              background:${color};
              border:2px solid ${glowColor};
              ${isMobile ? '' : `box-shadow:0 0 6px ${glowColor}88;`}
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

      const popup = L.popup({ className: 'parvo-popup', closeButton: true, offset: [0, -6] }).setContent(
        report.kind === 'lost'
          ? lostPopupHtml(report, ageLabel)
          : `
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e0e0e0;background:#111;padding:10px 12px;border:1px solid #2a2a2a;border-radius:4px;min-width:160px;">
          <div style="color:#fff;font-weight:700;margin-bottom:6px;font-size:12px;">${report.zip ? `ZIP ${report.zip}` : escapeHtml(report.city || report.locationDetail || report.state || 'Pinned location')}</div>
          <div style="color:#888;margin-bottom:2px;">${escapeHtml(report.zip ? (report.city ?? '') : (report.state ?? ''))}</div>
          ${report.locationDetail ? `<div style="color:#00ff88;margin:4px 0 2px;font-size:11px;line-height:1.4;">📍 ${escapeHtml(report.locationDetail)}</div>` : ''}
          ${report.sourceUrl && /^https?:\/\//i.test(report.sourceUrl) ? `<a href="${escapeHtml(report.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="display:block;color:#60a5fa;margin:4px 0 2px;font-size:11px;text-decoration:underline;">📰 Source article ↗</a>` : ''}
          <div style="margin-top:6px;display:flex;justify-content:space-between;gap:16px;">
            <span style="color:#aaa;">Disease</span>
            <span style="color:${color};font-weight:600;text-transform:capitalize;">${escapeHtml(report.disease)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:16px;">
            <span style="color:#aaa;">Reported</span>
            <span style="color:#e0e0e0;">${ageLabel}</span>
          </div>
          ${report.verifiedClinic ? `<div style="margin-top:8px;color:#00ff88;font-weight:700;font-size:10px;letter-spacing:0.04em;">✓ Verified Pro Clinic report</div>` : `<div style="margin-top:8px;font-size:9px;color:#999;letter-spacing:0.08em;">Anonymous community report</div>`}
          ${report.locationDetail ? reportBtnHtml : ''}
          ${flagButtonHtml(report.id)}
        </div>
      `)

      const marker = L.marker([report.lat, report.lng], { icon })
        .bindPopup(popup)
        .addTo(markerLayer)
      wireMarker(marker, report.lat, report.lng, {
        locationDetail: report.locationDetail,
        lat: report.lat,
        lng: report.lng,
        zip: report.zip,
      })
    }

    const addHotspotMarker = (group: Report[]) => {
      const valid = group.filter(r => r.lat != null && r.lng != null)
      const lat = valid.reduce((s, r) => s + r.lat!, 0) / valid.length
      const lng = valid.reduce((s, r) => s + r.lng!, 0) / valid.length

      // disease breakdown, most common first
      const counts: Record<string, number> = {}
      valid.forEach(r => { counts[r.disease] = (counts[r.disease] ?? 0) + 1 })
      const breakdown = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([d, n]) => `<div style="display:flex;justify-content:space-between;gap:16px;"><span style="color:#aaa;text-transform:capitalize;">${escapeHtml(d)}</span><span style="color:#ef4444;font-weight:600;">${n}</span></div>`)
        .join('')
      const area = valid[0].locationDetail || valid[0].city || `ZIP ${valid[0].zip}`

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(239,68,68,0.22);border:2px solid #ef4444;box-shadow:0 0 16px #ef4444aa;"></div>
          <span style="position:relative;font-size:20px;line-height:1;">☣️</span>
          <span style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-family:monospace;font-size:10px;font-weight:700;border-radius:9px;padding:1px 5px;border:1px solid #0a0a0a;">${valid.length}</span>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      const popup = L.popup({ className: 'parvo-popup', closeButton: true, offset: [0, -10] }).setContent(`
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e0e0e0;background:#111;padding:10px 12px;border:1px solid #ef4444;border-radius:4px;min-width:180px;">
          <div style="color:#ef4444;font-weight:700;margin-bottom:6px;font-size:12px;letter-spacing:0.08em;">☣ OUTBREAK HOTSPOT</div>
          <div style="color:#fff;margin-bottom:6px;">${escapeHtml(area)}</div>
          <div style="color:#aaa;margin-bottom:6px;">${valid.length} reports in this area</div>
          ${breakdown}
          <div style="margin-top:8px;font-size:9px;color:#999;letter-spacing:0.08em;">Double-click to zoom in · individual reports</div>
          ${reportBtnHtml}
        </div>
      `)

      const marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
        .bindPopup(popup)
        .addTo(markerLayer)
      wireMarker(marker, lat, lng, { locationDetail: area, lat, lng, zip: valid[0].zip })
    }

    // Cluster cell scales with zoom: zoomed out → ~1.4mi cells (hotspots emerge);
    // zoomed in → much smaller cells, so a dense spot breaks apart into the
    // individual pins it's made of. Re-rendered on every zoom.
    const BIOHAZARD_THRESHOLD = 10

    // Does a report pass the current filter-bar selection?
    const matchesFilter = (r: Report): boolean => {
      const f = filterRef.current
      // Disease chip: 'all' shows everything; otherwise only the chosen disease.
      // (Lost-dog pins have their own disease value and hide under any specific
      // disease selection, which is the desired behavior.)
      if (f.disease !== 'all' && r.disease !== f.disease) return false
      if (!f.showHistorical && r.kind !== 'lost' && isHistorical(r)) return false
      if (!f.showUnverified && r.verified === false) return false
      return true
    }

    const renderMarkers = () => {
      markerLayer.clearLayers()
      const zoom = map.getZoom()
      const cell = Math.min(0.04, Math.max(0.0005, 0.02 * Math.pow(2, 11 - zoom)))
      const cells = new Map<string, Report[]>()
      reports.forEach(r => {
        if (r.lat == null || r.lng == null) return
        if (!matchesFilter(r)) return
        // Lost-dog pins are always shown individually — they never merge into a
        // disease "outbreak hotspot" cluster.
        if (r.kind === 'lost') { addReportMarker(r); return }
        const key = `${Math.round(r.lat / cell)}_${Math.round(r.lng / cell)}`
        const arr = cells.get(key)
        if (arr) arr.push(r)
        else cells.set(key, [r])
      })
      cells.forEach(group => {
        if (group.length >= BIOHAZARD_THRESHOLD) addHotspotMarker(group)
        else group.forEach(addReportMarker)
      })
    }

    renderMarkers()
    map.on('zoomend', renderMarkers)

    // Re-render when the filter bar broadcasts a new selection.
    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) filterRef.current = { ...filterRef.current, ...detail }
      renderMarkers()
    }
    window.addEventListener('parvomap:filter', onFilter)

    // ─── Click-to-drop-a-pin ───
    mapRef.current = map

    const dropIcon = L.divIcon({
      className: '',
      html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 0 5px #00ff88);">📍</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    })

    // Reverse-geocode the dropped point to a readable label, then prefill the
    // report form (the form already listens for this event and scrolls to itself).
    const dispatchDrop = async (lat: number, lng: number) => {
      let label = `Dropped pin (${lat.toFixed(5)}, ${lng.toFixed(5)})`
      try {
        const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`)
        const data = await res.json()
        const p = data.features?.[0]?.properties
        if (p) {
          const parts = [p.name ?? p.street, p.city ?? p.county, p.state]
            .filter((x: unknown): x is string => typeof x === 'string' && x.length > 0)
          const built = Array.from(new Set(parts)).join(', ')
          if (built) label = built
        }
      } catch {
        /* keep coordinate label */
      }
      window.dispatchEvent(new CustomEvent('parvomap:report-area', { detail: { lat, lng, locationDetail: label } }))
    }

    const exitDropMode = () => {
      dropModeRef.current = false
      setDropMode(false)
      if (containerRef.current) containerRef.current.style.cursor = ''
    }

    map.on('click', (e: any) => {
      if (!dropModeRef.current) return
      const { lat, lng } = e.latlng
      if (dropMarkerRef.current) {
        dropMarkerRef.current.setLatLng(e.latlng)
      } else {
        dropMarkerRef.current = L.marker(e.latlng, { draggable: true, icon: dropIcon, zIndexOffset: 2000 }).addTo(map)
        // Dragging the pin updates the prefilled location.
        dropMarkerRef.current.on('dragend', (ev: any) => {
          const ll = ev.target.getLatLng()
          dispatchDrop(ll.lat, ll.lng)
        })
      }
      dispatchDrop(lat, lng)
      exitDropMode() // drop one pin, then drag to fine-tune
    })

    return () => {
      window.removeEventListener('parvomap:filter', onFilter)
      map.remove()
      mapRef.current = null
      dropMarkerRef.current = null
    }
  }, [])

  return (
    <>
    <div style={{ position: 'relative', width: '100%' }}>

      {/* Leaflet map canvas */}
      <div
        ref={containerRef}
        className="map-container"
        style={{
          width: '100%',
          height: 'calc(100vh - 140px)',
          minHeight: '500px',
          maxHeight: '800px',
          background: '#060606',
          touchAction: 'none',
        }}
      />

      {/* Drop-a-pin toggle — top-right over the map */}
      <button
        type="button"
        onClick={toggleDropMode}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: dropMode ? '#00ff88' : 'rgba(10,10,10,0.90)',
          color: dropMode ? '#04130c' : '#00ff88',
          border: `1px solid ${dropMode ? '#00ff88' : '#2a2a2a'}`,
          borderRadius: '4px',
          backdropFilter: 'blur(8px)',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          cursor: 'pointer',
        }}
      >
        {dropMode ? '✕ Cancel — tap the map' : '📍 Drop a pin to report'}
      </button>

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
            color: '#999999',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>No reports yet</div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            color: '#999999',
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
          { label: 'Lost dog',     emoji: '🐶', divider: true },
        ].map(({ label, color, emoji, divider }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
            ...(divider ? { marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #2a2a2a' } : {}),
          }}>
            {emoji ? (
              <span style={{ width: '8px', fontSize: '9px', flexShrink: 0, textAlign: 'center' }}>{emoji}</span>
            ) : (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
                border: color === '#3a3a3a' ? '1px solid #666' : 'none',
              }} />
            )}
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
        { emoji: '🐶', label: 'Lost dog' },
      ].map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {item.emoji ? (
            <span style={{ fontSize: '9px', flexShrink: 0 }}>{item.emoji}</span>
          ) : (
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: item.color,
            flexShrink: 0,
            border: item.border ?? 'none',
          }} />
          )}
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            color: '#999',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
          }}>{item.label}</span>
        </div>
      ))}
    </div>
    </>
  )
}
