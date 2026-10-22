import { useEffect, useRef, useState } from 'react'
import { products, sizes, rub } from './products.js'

// Слайды галереи — один снимок в разном приближении
const slides = [
  { label: 'Общий вид', scale: 1 },
  { label: 'Крупный план', scale: 2 },
  { label: 'Фактура', scale: 3.2 },
]

export default function ProductView({ p, close, open, onAdd }) {
  const [size, setSize] = useState('')
  const [slide, setSlide] = useState(0)
  const [zoom, setZoom] = useState(null) // {x, y} в процентах, когда фото увеличено
  const [needSize, setNeedSize] = useState(false)
  const [added, setAdded] = useState(false)
  const track = useRef()
  const panel = useRef()

  // при открытии другого товара — всё с начала
  useEffect(() => {
    setSize(''); setSlide(0); setZoom(null); setNeedSize(false)
    track.current.scrollTo({ left: 0 })
    panel.current.scrollTo({ top: 0, behavior: 'smooth' })
  }, [p.id])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') zoom ? setZoom(null) : close()
      if (e.key === 'ArrowRight') go(slide + 1)
      if (e.key === 'ArrowLeft') go(slide - 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  useEffect(() => { // страница под окном не прокручивается
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const go = i => {
    const t = track.current, n = Math.max(0, Math.min(slides.length - 1, i))
    setZoom(null)
    t.scrollTo({ left: n * t.clientWidth, behavior: 'smooth' })
  }
  const point = e => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
  }
  const add = () => {
    if (!p.oneSize && !size) {
      setNeedSize(false)
      requestAnimationFrame(() => setNeedSize(true)) // перезапуск анимации «встряски»
      return
    }
    onAdd(p, p.oneSize ? '' : size)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  const related = products.filter(r => r.id !== p.id && r.cat.some(c => p.cat.includes(c))).slice(0, 8)

  return (
    <div className="pv-scrim" onClick={e => e.target === e.currentTarget && close()}>
      <div className="pv" ref={panel} role="dialog" aria-modal="true" aria-label={p.name}>
        <button className="icon-btn pv-close" aria-label="Закрыть" onClick={close}>✕</button>

        <div className="pv-gallery">
          <div className="pv-track" ref={track}
            onScroll={e => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
            {slides.map((s, i) => (
              <div key={i} className={'pv-slide' + (zoom && slide === i ? ' zoomed' : '')}
                onClick={e => setZoom(zoom ? null : point(e))}
                onPointerMove={e => zoom && slide === i && setZoom(point(e))}>
                <img src={p.img} alt={`${p.name}: ${s.label.toLowerCase()}`} draggable="false"
                  style={{
                    objectPosition: i ? p.focus : 'center',
                    transformOrigin: zoom && slide === i ? `${zoom.x}% ${zoom.y}%` : (i ? p.focus : 'center'),
                    transform: `scale(${s.scale * (zoom && slide === i ? 2 : 1)})`,
                    viewTransitionName: i === 0 ? 'product-photo' : undefined,
                  }} />
              </div>
            ))}
          </div>
          <button className="pv-arrow prev" aria-label="Предыдущее фото" onClick={() => go(slide - 1)} disabled={slide === 0}>‹</button>
          <button className="pv-arrow next" aria-label="Следующее фото" onClick={() => go(slide + 1)} disabled={slide === slides.length - 1}>›</button>
          <div className="pv-dots">
            {slides.map((s, i) => <button key={i} aria-label={s.label} aria-current={slide === i} onClick={() => go(i)} />)}
          </div>
          <span className="pv-hint">{zoom ? 'Нажмите, чтобы уменьшить' : `${slides[slide].label} · нажмите для увеличения`}</span>
        </div>

        <div className="pv-info" key={p.id}>
          {p.badge && <span className="badge static">{p.badge}</span>}
          <h2>{p.name}</h2>
          <div className="pv-price">{rub(p.price)}{p.old > 0 && <s>{rub(p.old)}</s>}</div>
          <p className="muted">Цвет: {p.color}</p>

          {p.oneSize ? <p className="muted">Один размер</p> : (
            <div>
              <div className="pv-label"><b>Размер</b><a href="#sizes" onClick={close}>Таблица размеров</a></div>
              <div className={'pv-sizes' + (needSize ? ' shake' : '')} role="radiogroup" aria-label="Размер">
                {sizes.map(s => (
                  <button key={s} role="radio" aria-checked={size === s} onClick={() => { setSize(s); setNeedSize(false) }}>{s}</button>
                ))}
              </div>
              {needSize && <p className="error" role="alert">Выберите размер</p>}
            </div>
          )}

          <div className="pv-buy">
            <span className="pv-buy-price">{rub(p.price)}</span>
            {added && <span className="pow pow-add" aria-hidden="true">ХОП!</span>}
            <button className={'btn btn-main' + (added ? ' done' : '')} onClick={add}>{added ? 'Добавлено ✓' : 'В корзину'}</button>
          </div>

          <p>{p.desc}</p>
          <details>
            <summary>Доставка и возврат</summary>
            <p className="muted">Доставка 1–3 дня, от 5 000 ₽ бесплатно. Примерка перед оплатой, возврат 30 дней.</p>
          </details>
          <details>
            <summary>Уход</summary>
            <p className="muted">Стирка при 30 °C, гладить с изнанки, не отбеливать.</p>
          </details>

          <h3 className="pv-related-title">Похожие товары</h3>
          <div className="pv-related">
            {related.map(r => (
              <button key={r.id} onClick={() => open(r)}>
                <img src={r.img} alt="" loading="lazy" />
                <span>{r.name}</span>
                <b>{rub(r.price)}</b>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
