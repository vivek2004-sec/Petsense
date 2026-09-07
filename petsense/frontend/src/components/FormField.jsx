import { Eye, EyeOff } from 'lucide-react'

/**
 * Consistent form input with icon + optional trailing action.
 * Uses flex layout so password dots and text align correctly.
 */
export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  required,
  autoComplete,
  optional,
  showToggle,
  showPassword,
  onTogglePassword,
}) {
  const inputType = showToggle ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {optional && <span className="form-label-optional">(optional)</span>}
        </label>
      )}
      <div className="input-wrap">
        {Icon && (
          <span className="input-icon" aria-hidden>
            <Icon size={18} strokeWidth={1.75} />
          </span>
        )}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="input-inner"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="input-action"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
          </button>
        )}
      </div>
    </div>
  )
}
