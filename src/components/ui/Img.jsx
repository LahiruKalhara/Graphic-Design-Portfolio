import { useEffect, useRef, useState } from 'react'
import { srcSet } from '../../data/works'

/**
 * Responsive WebP image with a blurred placeholder that fades out on load.
 * `img` is the { sm, md, lg } object produced by the image pipeline.
 */
export default function Img({
  img,
  lqip,
  alt = '',
  sizes = '100vw',
  size,
  className = '',
  priority = false,
  fit,
  position,
  style,
  onLoad,
}) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (el && el.complete && el.naturalWidth) setLoaded(true)
  }, [])

  if (!img) return null
  const src = size ? img[size]?.src : img.md?.src || img.sm?.src

  return (
    <span
      className={`img ${loaded ? 'is-loaded' : ''} ${className}`}
      style={{ '--lqip': lqip ? `url(${lqip})` : undefined, ...style }}
    >
      {lqip && <span className="img__ph" aria-hidden="true" />}
      <img
        ref={ref}
        src={src}
        srcSet={size ? undefined : srcSet(img)}
        sizes={size ? undefined : sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        draggable={false}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
        style={{ objectFit: fit, objectPosition: position }}
      />
    </span>
  )
}
