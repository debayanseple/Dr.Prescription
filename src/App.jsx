import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import PrescriptionForm from './components/PrescriptionForm.jsx'
import PrescriptionPreview from './components/PrescriptionPreview.jsx'
import Login from './components/Login.jsx'
import History from './components/History.jsx'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'

function todayISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const blankForm = () => ({
  name: '',
  age: '',
  gender: '',
  date: todayISO(),
  weight: '',
  height: '',
  doa: '',
  dos: '',
  co: '',
  hopi: '',
  oe: '',
  adv: '',
  wd: '',
  plan: '',
  rx: '',
})

export default function App() {
  const [data, setData] = useState(blankForm)
  const [view, setView] = useState('form') // 'form' | 'preview' | 'history'
  const [busy, setBusy] = useState(false)
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [savedAt, setSavedAt] = useState(null) // { at: Date, updated: bool } | null
  const [editingId, setEditingId] = useState(null) // history row being edited, if any
  const [histTick, setHistTick] = useState(0)
  const [zoom, setZoom] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 900 ? 1 : 0.7,
  )
  const clampZoom = (z) => Math.min(1.5, Math.max(0.4, Math.round(z * 10) / 10))
  const sheetRef = useRef(null)

  const canDownload = useMemo(
    () =>
      data.name.trim().length > 0 &&
      data.date.trim().length > 0 &&
      String(data.age).trim().length > 0 &&
      String(data.gender).trim().length > 0 &&
      !busy,
    [data, busy],
  )

  const fileName = useMemo(() => {
    const cleanName = (data.name.trim().replace(/\s+/g, '') || 'Patient').replace(/[^\w\-]/g, '')
    return `Prescription_${cleanName}_${data.date || todayISO()}.pdf`
  }, [data])

  // Supabase session (history + save). Without env config the app runs
  // fully offline exactly as before — no login, no history.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const saveReady = useMemo(
    () =>
      isSupabaseConfigured &&
      !!session &&
      data.name.trim().length > 0 &&
      data.date.trim().length > 0 &&
      String(data.age).trim().length > 0 &&
      String(data.gender).trim().length > 0,
    [data, session],
  )

  async function saveRecord() {
    if (!saveReady || saveBusy) return false
    setSaveBusy(true)
    try {
      const nil = (v) => (String(v ?? '').trim() === '' ? null : v)
      const payload = {
        patient_name: data.name.trim(),
        age: String(data.age).trim(),
        gender: String(data.gender).trim(),
        visit_date: data.date || todayISO(),
        weight: nil(data.weight),
        height: nil(data.height),
        admitted_on: nil(data.doa),
        surgery_on: nil(data.dos),
        co: nil(data.co),
        hopi: nil(data.hopi),
        oe: nil(data.oe),
        adv: nil(data.adv),
        wd: nil(data.wd),
        plan: nil(data.plan),
        rx: nil(data.rx),
      }
      if (editingId) {
        // Editing a history record → update it in place, no new row.
        const { data: updated, error } = await supabase
          .from('prescriptions')
          .update(payload)
          .eq('id', editingId)
          .select('id')
        if (error) throw error
        if (!updated || updated.length === 0) {
          // Row vanished (deleted elsewhere) → save as a new entry instead.
          const { data: inserted, error: insErr } = await supabase
            .from('prescriptions')
            .insert({ ...payload, user_id: session.user.id })
            .select('id')
          if (insErr) throw insErr
          setEditingId(inserted[0].id)
          setSavedAt({ at: new Date(), updated: false })
        } else {
          setSavedAt({ at: new Date(), updated: true })
        }
      } else {
        const { data: inserted, error } = await supabase
          .from('prescriptions')
          .insert({ ...payload, user_id: session.user.id })
          .select('id')
        if (error) throw error
        setEditingId(inserted[0].id)
        setSavedAt({ at: new Date(), updated: false })
      }
      setHistTick((t) => t + 1)
      return true
    } catch (err) {
      console.error('History save failed', err)
      alert('PDF saved, but storing to history failed: ' + (err.message || err))
      return false
    } finally {
      setSaveBusy(false)
    }
  }

  function openRecord(r) {
    setEditingId(r.id)
    setData({
      name: r.patient_name || '',
      age: r.age || '',
      gender: r.gender || '',
      date: r.visit_date || todayISO(),
      weight: r.weight || '',
      height: r.height || '',
      doa: r.admitted_on || '',
      dos: r.surgery_on || '',
      co: r.co || '',
      hopi: r.hopi || '',
      oe: r.oe || '',
      adv: r.adv || '',
      wd: r.wd || '',
      plan: r.plan || '',
      rx: r.rx || '',
    })
    setSavedAt(null)
    setView('preview')
  }

  async function handleDownload() {
    const node = sheetRef.current
    if (!node || !canDownload) return
    // Normalize rendering before capture so the PDF is identical on every
    // device: undo preview zoom, and force the sheet to an exact A4 CSS
    // width (210mm @ 96dpi = 793.7px → 794px). On narrow phones the sheet
    // would otherwise capture tall and narrow, breaking the A4 layout.
    // Everything is restored in `finally`.
    const zoomWrap = node.closest('.preview-zoom')
    const scrollWrap = node.closest('.preview-scroll')
    const sheetInner = node.querySelector('.sheet-inner')
    const footerEl = node.querySelector('.tpl-footer')
    const prevZoom = zoomWrap ? zoomWrap.style.zoom : ''
    const prevWidth = node.style.width
    const prevMaxWidth = node.style.maxWidth
    const prevMinHeight = node.style.minHeight
    const prevFlex = node.style.flex
    const prevOverflow = scrollWrap ? scrollWrap.style.overflowX : ''
    const prevJustify = scrollWrap ? scrollWrap.style.justifyContent : ''
    const prevPadBottom = sheetInner ? sheetInner.style.paddingBottom : ''
    const prevWinX = window.scrollX
    const prevWinY = window.scrollY
    const prevScrollLeft = scrollWrap ? scrollWrap.scrollLeft : 0
    let spacer = null
    const prevFooterPosition = footerEl ? footerEl.style.position : ''
    setBusy(true)
    try {
      if (zoomWrap) zoomWrap.style.zoom = '1'
      node.style.width = '794px'
      node.style.maxWidth = '794px'
      node.style.minHeight = '1123px' // 297mm @ 96dpi — one full A4 page
      // Lock the flex item so a 360px phone row can't shrink it: without
      // this the capture comes out phone-wide and the PDF looks zoomed
      // across multiple blank pages.
      node.style.flex = '0 0 794px'
      if (scrollWrap) {
        scrollWrap.style.overflowX = 'visible'
        // Flex centering crops the left edge of an overflowing (794px) sheet
        // on narrow phones and shifts html2canvas's measured bounds.
        scrollWrap.style.justifyContent = 'flex-start'
        scrollWrap.scrollLeft = 0
      }
      window.scrollTo(0, 0)
      // Pin the signature block to the page foot: lay the footer out in
      // normal flow with an exact spacer pushing it to the bottom-right
      // when content is short. (On screen `absolute; bottom: 0` does this,
      // but the canvas renderer can drop it right under short content, so
      // the signature "moves up" in the PDF. Plain blocks + explicit px
      // render identically everywhere.)
      if (sheetInner && footerEl) {
        footerEl.style.position = 'static'
        sheetInner.style.paddingBottom = '0px'
        // Inner height that keeps the whole sheet at exactly one A4 page
        // (1123px), accounting for the sheet's own padding + border, minus
        // a 3px safety margin so renderer rounding can't tip a 2nd page.
        const cs = getComputedStyle(node)
        const chrome =
          (parseFloat(cs.paddingTop) || 0) +
          (parseFloat(cs.paddingBottom) || 0) +
          (parseFloat(cs.borderTopWidth) || 0) +
          (parseFloat(cs.borderBottomWidth) || 0)
        const innerTarget = 1123 - chrome - 3
        const gap = innerTarget - sheetInner.offsetHeight
        if (gap > 0) {
          spacer = document.createElement('div')
          spacer.style.cssText = `height:${gap}px;`
          sheetInner.insertBefore(spacer, footerEl)
        }
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

      // Capture at ~289 DPI (794px * 3 ≈ 2382px wide, vs 2480px for true
      // 300 DPI A4). Falls back to scale 2 (~192 DPI) if the device runs
      // out of canvas memory on very long (multi-page) sheets.
      // All client-side — no network calls.
      let canvas = null
      let scale = 3
      try {
        canvas = await html2canvas(node, {
          scale,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        })
      } catch (oomErr) {
        console.warn('html2canvas scale 3 failed, retrying at scale 2', oomErr)
        scale = 2
        canvas = await html2canvas(node, {
          scale,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        })
      }
      const imgData = canvas.toDataURL('image/jpeg', 0.92)

      // Exact A4 pages: jsPDF 'a4' = 210 × 297 mm
      // (21 × 29.7 cm, 8.27 × 11.69 in, 595 × 842 pt @ 72dpi,
      // 2480 × 3508 px @ 300dpi). The rendered image always spans the
      // full 210mm width; content taller than 297mm flows onto page 2, 3…
      // — never shrunk to fit one page.
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
      const pageW = 210
      const pageH = 297
      const imgW = pageW
      const imgH = (canvas.height * pageW) / canvas.width
      if (imgH <= pageH + 8) {
        // Fits one A4 page (or over by a sliver from renderer rounding):
        // single page with an imperceptible ≤2.6% shrink, signature stays
        // fully visible at the foot instead of spilling to a blank page 2.
        const s = Math.min(1, pageH / imgH)
        const w = imgW * s
        const h = imgH * s
        pdf.addImage(imgData, 'JPEG', (pageW - w) / 2, 0, w, h)
      } else {
        // Genuinely long note: flow across pages with content-aware breaks —
        // never cut through text. Each page ends at a block boundary
        // (between sections, or before the signature), leaving a clean
        // margin at the page foot; the signature lands whole at the end.
        const rect = node.getBoundingClientRect()
        const k = canvas.width / rect.width // canvas px per css px
        const nodeH = rect.height
        const pageHcss = rect.width * (pageH / pageW) // one A4 page in css px
        const edgeY = (el, top) => {
          const r = el.getBoundingClientRect()
          return (top ? r.top : r.bottom) - rect.top
        }
        const cands = []
        node.querySelectorAll('.tpl-sec').forEach((el) => cands.push(edgeY(el, false)))
        const foot = node.querySelector('.tpl-footer')
        if (foot) cands.push(edgeY(foot, true)) // keep signature whole
        const slices = []
        let start = 0
        let guard = 0
        while (start < nodeH - 1 && guard++ < 10) {
          const boundary = start + pageHcss
          if (boundary >= nodeH - 1) { slices.push([start, nodeH]); break }
          let best = -1
          for (const c of cands) {
            if (c > start + 1 && c >= boundary - 350 && c <= boundary - 20 && c > best) best = c
          }
          const breakAt = best > start + 1 ? best : boundary // fallback: hard cut
          slices.push([start, breakAt])
          start = breakAt
        }
        const px2mm = pageW / canvas.width
        slices.forEach(([a, b], i) => {
          const y = Math.round(a * k)
          const h = Math.max(1, Math.round((b - a) * k))
          const pc = document.createElement('canvas')
          pc.width = canvas.width
          pc.height = h
          pc.getContext('2d').drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h)
          if (i > 0) pdf.addPage('a4', 'portrait')
          pdf.addImage(pc.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, h * px2mm)
        })
      }
      pdf.save(fileName)
      // Append to history (logged-in only; PDF is already saved by now).
      if (session) await saveRecord()
    } catch (err) {
      console.error('PDF generation failed', err)
      alert('PDF generation failed. Please try again.')
    } finally {
      if (zoomWrap) zoomWrap.style.zoom = prevZoom
      node.style.width = prevWidth
      node.style.maxWidth = prevMaxWidth
      node.style.minHeight = prevMinHeight
      node.style.flex = prevFlex
      if (scrollWrap) {
        scrollWrap.style.overflowX = prevOverflow
        scrollWrap.style.justifyContent = prevJustify
        scrollWrap.scrollLeft = prevScrollLeft
      }
      if (sheetInner) sheetInner.style.paddingBottom = prevPadBottom
      if (footerEl) footerEl.style.position = prevFooterPosition
      if (spacer && spacer.parentNode) spacer.parentNode.removeChild(spacer)
      window.scrollTo(prevWinX, prevWinY)
      setBusy(false)
    }
  }

  function handleClear() {
    if (window.confirm('Start a new patient? This clears all fields.')) {
      setData(blankForm())
      setEditingId(null)
      setSavedAt(null)
      setView('form')
    }
  }

  const authed = isSupabaseConfigured && !!session

  if (!authReady) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div>
            <h1>Prescription Form → PDF</h1>
            <p>Loading…</p>
          </div>
        </header>
      </div>
    )
  }

  if (isSupabaseConfigured && !session) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div>
            <h1>Prescription Form → PDF</h1>
            <p>Sign in to continue</p>
          </div>
        </header>
        <main className="main main-centered">
          <Login />
        </main>
      </div>
    )
  }

  return (
    <div className={`app-shell ${view === 'form' ? 'show-form' : view === 'history' ? 'show-history' : 'show-preview'}`}>
      <header className="app-header">
        <div>
          <h1>Prescription Form → PDF</h1>
          <p>Fill • Preview • Download — works offline, private to this device</p>
        </div>
        <div className="header-actions">
          {authed && (
            <button
              className="btn btn-ghost btn-small history-nav"
              onClick={() => setView((v) => (v === 'history' ? 'form' : 'history'))}
              type="button"
            >
              {view === 'history' ? '← Back' : 'History'}
            </button>
          )}
          <button className="btn btn-ghost btn-small" onClick={handleClear} type="button">
            New
          </button>
          {session && (
            <button
              className="btn btn-ghost btn-small"
              onClick={() => supabase.auth.signOut()}
              type="button"
              title={session.user.email || 'Sign out'}
            >
              Out
            </button>
          )}
        </div>
      </header>

      <div className="view-toggle" role="tablist" aria-label="Form, preview or history">
        <button
          role="tab"
          aria-selected={view === 'form'}
          className={view === 'form' ? 'active' : ''}
          onClick={() => setView('form')}
          type="button"
        >
          ✎ Form
        </button>
        <button
          role="tab"
          aria-selected={view === 'preview'}
          className={view === 'preview' ? 'active' : ''}
          onClick={() => setView('preview')}
          type="button"
        >
          ⎙ Preview
        </button>
        {authed && (
          <button
            role="tab"
            aria-selected={view === 'history'}
            className={view === 'history' ? 'active' : ''}
            onClick={() => setView('history')}
            type="button"
          >
            ☰ History
          </button>
        )}
      </div>

      <main className="main">
        <section className="panel form-panel" aria-label="Patient form">
          <p className="privacy-note">
            🔒 100% private — all rendering and PDF generation happens in this browser.
            {authed
              ? ' Saving to history sends the form data to your Supabase project.'
              : ' No data is sent to any server.'}
          </p>
          <PrescriptionForm data={data} onChange={(d) => { setData(d); setSavedAt(null) }} />
        </section>

        <section className="panel preview-panel" aria-label="Template preview">
          <div className="preview-toolbar">
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={!canDownload}
              type="button"
            >
              {busy ? 'Generating PDF…' : '⬇ Download PDF'}
            </button>
            {authed && (
              <button
                className="btn"
                onClick={saveRecord}
                disabled={!saveReady || busy || saveBusy}
                type="button"
                title={!saveReady ? 'Fill Name + Age + Gender + Date first' : editingId ? 'Update this history entry' : 'Save to history without downloading'}
              >
                {saveBusy ? 'Saving…' : editingId ? 'Update' : 'Save'}
              </button>
            )}
            <button className="btn" onClick={handleClear} type="button">
              Clear Form
            </button>
            <div className="zoom-controls">
              <button
                className="btn btn-small"
                onClick={() => setZoom((z) => clampZoom(z - 0.1))}
                type="button"
                aria-label="Zoom preview out"
              >
                −
              </button>
              <span className="zoom-label">{Math.round(zoom * 100)}%</span>
              <button
                className="btn btn-small"
                onClick={() => setZoom((z) => clampZoom(z + 0.1))}
                type="button"
                aria-label="Zoom preview in"
              >
                +
              </button>
            </div>
          </div>
          <div className="preview-zoom" style={{ zoom }}>
            <PrescriptionPreview ref={sheetRef} data={data} />
          </div>
          <p className="status-line">
            {!data.name.trim() || !data.date || !String(data.age).trim() || !String(data.gender).trim()
              ? 'Fill Patient’s Name + Age + Gender + Date to enable download.'
              : `Ready — will save as ${fileName}`}
            {savedAt && authed
              ? ` · ${savedAt.updated ? 'Updated' : 'Saved to history'} ✓ ${savedAt.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </p>
        </section>

        {view === 'history' && authed && (
          <section className="panel history-panel" aria-label="Prescription history">
            <History
              key={`${session.user.id}-${histTick}`}
              onOpen={openRecord}
            />
          </section>
        )}
      </main>
    </div>
  )
}
