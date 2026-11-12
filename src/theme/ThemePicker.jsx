import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from './theme.js'

const OPTIONS = [
  ['light', 'Light', Sun, 'Always use the light appearance'],
  ['dark', 'Dark', Moon, 'Easier on the eyes in low light'],
  ['system', 'System default', Monitor, 'Follow this device\'s setting'],
]

/** Appearance setting: applies immediately and is remembered on this device. */
export default function ThemePicker() {
  const { preference, set } = useTheme()
  return (
    <fieldset className="section pad" style={{ border: 0, margin: 0 }} aria-label="Appearance">
      <legend style={{ fontWeight: 650, padding: 0, marginBottom: 8 }}>Appearance</legend>
      <div className="theme-options" role="radiogroup" aria-label="Appearance">
        {OPTIONS.map(([id, label, Icon, hint]) => (
          <label key={id} className={`theme-option ${preference === id ? 'on' : ''}`}>
            <input type="radio" name="theme" value={id} checked={preference === id} onChange={() => set(id)} className="sr" />
            <Icon size={20} aria-hidden="true" />
            <span><strong>{label}</strong><br /><span className="muted small">{hint}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
