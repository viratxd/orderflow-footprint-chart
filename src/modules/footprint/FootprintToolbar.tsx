import type { DisplayMode, ImbalanceMode, FootprintSettings } from './FootprintTypes';

interface Props {
  settings: FootprintSettings;
  onChange: (partial: Partial<FootprintSettings>) => void;
  onFit: () => void;
  onReset: () => void;
}

const btn: React.CSSProperties = {
  background: '#21262d',
  border: '1px solid #30363d',
  color: '#e6edf3',
  borderRadius: 4,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 12,
};

const active: React.CSSProperties = {
  ...btn,
  background: '#388bfd33',
  borderColor: '#58a6ff',
  color: '#58a6ff',
};

export function FootprintToolbar({ settings, onChange, onFit, onReset }: Props) {
  const setDisplay = (displayMode: DisplayMode) => onChange({ displayMode });
  const setImbalanceMode = (mode: ImbalanceMode) =>
    onChange({ imbalance: { ...settings.imbalance, mode } });

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '8px 12px',
        background: '#010409',
        borderBottom: '1px solid #21262d',
        fontSize: 12,
      }}
    >
      <span style={{ color: '#8b949e' }}>Display</span>
      {(['bidAsk', 'delta', 'total'] as DisplayMode[]).map((m) => (
        <button
          key={m}
          style={settings.displayMode === m ? active : btn}
          onClick={() => setDisplay(m)}
        >
          {m === 'bidAsk' ? 'Bid×Ask' : m === 'delta' ? 'Delta' : 'Total'}
        </button>
      ))}

      <span style={{ color: '#8b949e', marginLeft: 8 }}>Imbalance</span>
      {(['samePrice', 'diagonal'] as ImbalanceMode[]).map((m) => (
        <button
          key={m}
          style={settings.imbalance.mode === m ? active : btn}
          onClick={() => setImbalanceMode(m)}
        >
          {m === 'samePrice' ? 'Same' : 'Diagonal'}
        </button>
      ))}

      <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b949e' }}>
        Ratio
        <input
          type="number"
          min={1}
          step={0.5}
          value={settings.imbalance.ratio}
          onChange={(e) =>
            onChange({
              imbalance: { ...settings.imbalance, ratio: Number(e.target.value) || 3 },
            })
          }
          style={{ width: 48, background: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', borderRadius: 4, padding: 2 }}
        />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b949e' }}>
        Stack
        <input
          type="number"
          min={2}
          max={10}
          value={settings.imbalance.stackLevels}
          onChange={(e) =>
            onChange({
              imbalance: { ...settings.imbalance, stackLevels: Number(e.target.value) || 3 },
            })
          }
          style={{ width: 40, background: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', borderRadius: 4, padding: 2 }}
        />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#c9d1d9' }}>
        <input
          type="checkbox"
          checked={settings.imbalance.showHighlights}
          onChange={(e) =>
            onChange({ imbalance: { ...settings.imbalance, showHighlights: e.target.checked } })
          }
        />
        Highlights
      </label>

      <div style={{ flex: 1 }} />
      <button style={btn} onClick={onFit}>
        Fit
      </button>
      <button style={btn} onClick={onReset}>
        Reset
      </button>
    </div>
  );
}
