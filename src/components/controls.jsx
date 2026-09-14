export function Control({ label, children }) {
  return (
    <div className="control">
      <span className="control-label">{label}</span>
      {children}
    </div>
  )
}

export function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const val = typeof opt === 'object' ? opt.value : opt
        const text = typeof opt === 'object' ? opt.label : String(opt)
        return (
          <button
            key={val}
            type="button"
            className={val === value ? 'on' : ''}
            onClick={() => onChange(val)}
            aria-pressed={val === value}
          >
            {text}
          </button>
        )
      })}
    </div>
  )
}

export function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`switch${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    />
  )
}
