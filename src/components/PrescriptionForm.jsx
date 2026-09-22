export default function PrescriptionForm({ data, onChange }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value })

  return (
    <form
      className="form-grid"
      onSubmit={(e) => e.preventDefault()}
      autoComplete="off"
    >
      <div className="field">
        <label htmlFor="f-name">Patient&apos;s Name <span className="req">*</span></label>
        <input
          id="f-name"
          type="text"
          placeholder="e.g. Subodh Chandra Majumdar"
          value={data.name}
          onChange={set('name')}
          required
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="f-age">Age <span className="req">*</span></label>
          <input
            id="f-age"
            type="number"
            inputMode="numeric"
            min="0"
            max="150"
            placeholder="e.g. 75"
            value={data.age}
            onChange={set('age')}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="f-gender">Gender <span className="req">*</span></label>
          <select id="f-gender" value={data.gender} onChange={set('gender')} required>
            <option value="">—</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-date">Date <span className="req">*</span></label>
        <input id="f-date" type="date" value={data.date} onChange={set('date')} required />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="f-weight">Weight</label>
          <div className="unit-wrap">
            <input
              id="f-weight"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="e.g. 62"
              value={data.weight}
              onChange={set('weight')}
            />
            <span className="unit-tag">kg</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-height">Height</label>
          <div className="unit-wrap">
            <input
              id="f-height"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="e.g. 165"
              value={data.height}
              onChange={set('height')}
            />
            <span className="unit-tag">cm</span>
          </div>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="f-doa">Date Of Admission</label>
          <input id="f-doa" type="date" value={data.doa || ''} onChange={set('doa')} />
        </div>
        <div className="field">
          <label htmlFor="f-dos">Date Of Surgery</label>
          <input id="f-dos" type="date" value={data.dos || ''} onChange={set('dos')} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-co">C/O — Chief Complaint</label>
        <textarea id="f-co" placeholder="Chief complaint…" value={data.co} onChange={set('co')} />
      </div>
      <div className="field">
        <label htmlFor="f-hopi">HOPI — History of Present Illness</label>
        <textarea id="f-hopi" placeholder="History…" value={data.hopi} onChange={set('hopi')} />
      </div>
      <div className="field">
        <label htmlFor="f-oe">O/E — On Examination</label>
        <textarea id="f-oe" placeholder="Examination findings…" value={data.oe} onChange={set('oe')} />
      </div>
      <div className="field">
        <label htmlFor="f-adv">ADV — Advice</label>
        <textarea id="f-adv" placeholder="Advice…" value={data.adv} onChange={set('adv')} />
      </div>
      <div className="field">
        <label htmlFor="f-wd">W/D — Working Diagnosis</label>
        <textarea id="f-wd" placeholder="Working diagnosis…" value={data.wd} onChange={set('wd')} />
      </div>
      <div className="field">
        <label htmlFor="f-plan">My Plan</label>
        <textarea id="f-plan" placeholder="Treatment plan…" value={data.plan || ''} onChange={set('plan')} />
      </div>
      <div className="field">
        <label htmlFor="f-rx">RX — Prescription</label>
        <textarea
          id="f-rx"
          placeholder={'1. Tab … — 1-0-1 × 5 days\n2. …'}
          value={data.rx}
          onChange={set('rx')}
          style={{ minHeight: 110 }}
        />
      </div>

      <p className="hint">Name + Age + Gender + Date are required for PDF download. Everything else is optional.</p>
    </form>
  )
}
