/** LK Creations monogram, redrawn from the watermark. */
export default function Logo({ size = 40, withText = false, className = '', title }) {
  return (
    <svg
      className={`logo ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
    >
      <rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="currentColor" strokeWidth="5.5" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="9.5"
        strokeLinecap="square"
        transform={withText ? undefined : 'translate(0 6)'}
      >
        <path d="M30 20 V66 H46" />
        <path d="M70 20 L40 50" />
        <path d="M52 38 L72 66" />
      </g>
      {withText && (
        <text
          x="50"
          y="84.5"
          textAnchor="middle"
          fontFamily="Manrope Variable, Manrope, sans-serif"
          fontWeight="800"
          fontSize="8.6"
          letterSpacing="1.4"
          fill="currentColor"
        >
          CREATIONS
        </text>
      )}
    </svg>
  )
}
