import { forwardRef } from 'react'
import graphicUrl from '../assets/head-neck-graphic.png'
import signatureUrl from '../assets/signature.png'

function Field({ k, v, style }) {
  return (
    <div className="tpl-field" style={style}>
      <span className="k">{k}</span>
      <span className="v">{v || '\u00A0'}</span>
    </div>
  )
}

// Fixed template matching the Dr Suranjana sample layout.
// Pure text/CSS — no external assets, so PDF matches screen exactly.
const PrescriptionPreview = forwardRef(function PrescriptionPreview({ data }, ref) {
  const d = data
  const fmtDate = (iso) => (iso ? String(iso).split('-').reverse().join('/') : '')
  const dateDisplay = fmtDate(d.date)
  const doaDisplay = fmtDate(d.doa)
  const dosDisplay = fmtDate(d.dos)
  const has = (v) => String(v ?? '').trim().length > 0

  return (
    <div className="preview-scroll">
      <div className="sheet" ref={ref} id="prescription-sheet">
        <div className="sheet-inner">
          <div className="tpl-header">
            <div>
              <p className="tpl-doc-name">Dr. Suranjana Roy</p>
              <p className="tpl-doc-sub">Oral &amp; Maxillofacial Surgeon, M.D.S (Cal)</p>
              <p className="tpl-reg">Reg. No. 7324-A ( WBUHS)</p>
              <p className="tpl-desc">
                Specialized in head and neck surgical oncology, maxillofacial reconstruction,
                and comprehensive general dentistry.
              </p>
              <p className="tpl-phone">✆ +91 7980103899</p>
              <p className="tpl-attached">
                Attached To : Desun Hospital | Rameswara | BP Poddar Hospital | Shanti Healthcare
              </p>
            </div>
            <div className="tpl-graphic" aria-hidden="true"><img src={graphicUrl} alt="" /></div>
          </div>

          <div className="tpl-rule" />

          <div className="tpl-patient-line">
            <Field k="Patient's Name:" v={d.name} style={{ flex: 3, minWidth: 200 }} />
            <Field k="Date:" v={dateDisplay} style={{ flex: 1, minWidth: 130 }} />
          </div>
          <div className="tpl-row-4">
            <Field k="Age:" v={d.age} />
            <Field k="Gender:" v={d.gender} />
            {has(d.weight) && <Field k="Weight:" v={`${d.weight}`} />}
            {has(d.height) && <Field k="Height:" v={`${d.height}`} />}
          </div>
          <div className="tpl-body">
            <div className="tpl-rx-mark">℞</div>
            <div className="tpl-sections">
              {has(d.co) && <div className="tpl-sec"><span className="sk">C/O :</span><span className="sv">{d.co}</span></div>}
              {has(d.hopi) && <div className="tpl-sec"><span className="sk">HOPI :</span><span className="sv">{d.hopi}</span></div>}
              {has(d.oe) && <div className="tpl-sec"><span className="sk">O/E :</span><span className="sv">{d.oe}</span></div>}
              {has(d.adv) && <div className="tpl-sec"><span className="sk">ADV :</span><span className="sv">{d.adv}</span></div>}
              {has(d.wd) && <div className="tpl-sec"><span className="sk">W/D :</span><span className="sv">{d.wd}</span></div>}
              {has(d.plan) && <div className="tpl-sec"><span className="sk">My Plan :</span><span className="sv">{d.plan}</span></div>}
              {(has(doaDisplay) || has(dosDisplay)) && (
                <div className="tpl-sec tpl-dates">
                  {has(doaDisplay) && <span className="tpl-date"><span className="sk">Date Of Admission :</span> <span className="sv">{doaDisplay}</span></span>}
                  {has(dosDisplay) && <span className="tpl-date"><span className="sk">Date Of Surgery :</span> <span className="sv">{dosDisplay}</span></span>}
                </div>
              )}
              {has(d.rx) && <div className="tpl-sec rx"><span className="sk">RX :</span><span className="sv">{d.rx}</span></div>}
            </div>
          </div>

          <div className="tpl-footer">
            <div className="tpl-sign">
              <div className="tpl-sign-script"><img src={signatureUrl} alt="Dr Suranjana Roy signature" /></div>
              <div className="tpl-sign-name">DR SURANJANA ROY</div>
              <div className="tpl-sign-meta">
                MDS (Oral &amp; Maxillofacial Surgery)<br />
                Consultant Maxillofacial &amp; Head &amp; Neck Oncosurgeon<br />
                Reg. No. 7324-A (WBUHS)
              </div>
              <div className="tpl-sign-rule" />
              <div className="tpl-sign-label">Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default PrescriptionPreview
