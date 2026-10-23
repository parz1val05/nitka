import { useEffect, useRef, useState } from 'react'
import { products, rub, inStock } from './products.js'
import { photoFor, isSimilar } from './colorPhotos.js'

export const Heart = ({ on }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1z" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

// Слайды галереи — один снимок в разном приближении
const slides = [
  { label: 'Общий вид', scale: 1 },
  { label: 'Крупный план', scale: 2 },
  { label: 'Фактура', scale: 3.2 },
]

export default function ProductView({ p, close, open, onAdd, initialColor, fav, toggleFav }) {
  const start = initialColor ?? p.color
  const [size, setSize] = useState('')
  const [color, setColor] = useState(start)
  const [swapped, setSwapped] = useState(false) // плавная смена фото только после выбора цвета, не при открытии
  const [slide, setSlide] = useState(0)
  const [zoom, setZoom] = useState(null) // {x, y} в процентах, когда фото увеличено
  const [needSize, setNeedSize] = useState(false)
  const [added, setAdded] = useState(false)
  const track = useRef()
  const panel = useRef()

  // при открытии другого товара — всё с начала
  useEffect(() => {
    setSize(''); setColor(start); setSwapped(false); setSlide(0); setZoom(null); setNeedSize(false)
    track.current.scrollTo({ left: 0 })
    panel.current.scrollTo({ top: 0, behavior: 'smooth' })
  }, [p.id, start])

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
      requestAnimationFrame(() => setNeedSize(true)) // перезапуск анимации подсказки
      return
    }
    onAdd(p, p.oneSize ? '' : size, color)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  const src = photoFor(p, color)
  const similar = isSimilar(p, color)
  const photoColor = similar ? color : p.color // какой цвет реально на фото
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
                <img key={src} src={src} className={swapped ? 'swap' : undefined} alt={`${p.name}, ${photoColor.toLowerCase()}: ${s.label.toLowerCase()}`} draggable="false"
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
          {similar && <p className="pv-note" key={color}>Похожая модель в цвете «{color.toLowerCase()}» — другая вещь похожего фасона</p>}
          <span className="pv-hint">{zoom ? 'Нажмите, чтобы уменьшить' : `${slides[slide].label} · на фото: ${photoColor.toLowerCase()}`}</span>
        </div>

        <div className="pv-info" key={p.id}>
          <span className="eyebrow">{p.sku}{p.badge && ` · ${p.badge}`}</span>
          <h2>{p.name}</h2>
          <div className="pv-price">{rub(p.price)}{p.old > 0 && <s>{rub(p.old)}</s>}</div>

          <div>
            <div className="pv-label"><span>Цвет: <b>{color}</b></span>{color !== photoColor && <span className="muted">на фото — {photoColor.toLowerCase()}</span>}</div>
            <div className="swatches" role="radiogroup" aria-label="Цвет">
              {p.colors.map(c => (
                <button key={c.name} role="radio" aria-checked={color === c.name} aria-label={c.name} title={c.name}
                  style={{ '--sw': c.hex }} onClick={() => { setColor(c.name); setSwapped(true) }} />
              ))}
            </div>
          </div>

          {p.oneSize ? <p className="muted">Один размер</p> : (
            <div>
              <div className="pv-label"><span>Размер{size && <>: <b>{size}</b></>}</span><a href="#sizes" onClick={close}>Таблица размеров</a></div>
              <div className={'pv-sizes' + (needSize ? ' shake' : '')} role="radiogroup" aria-label="Размер">
                {p.sizes.map(s => {
                  const ok = inStock(p, s)
                  return <button key={s} role="radio" aria-checked={size === s} disabled={!ok}
                    title={ok ? '' : 'Нет в наличии'} onClick={() => { setSize(s); setNeedSize(false) }}>{s}</button>
                })}
              </div>
              {needSize && <p className="error" role="alert">Выберите размер</p>}
            </div>
          )}

          <div className="pv-buy">
            <span className="pv-buy-price">{rub(p.price)}</span>
            <button className={'btn btn-main' + (added ? ' done' : '')} onClick={add}>{added ? 'Добавлено в корзину' : 'В корзину'}</button>
            <button className="icon-btn fav-btn" aria-pressed={fav} aria-label="В избранное" onClick={() => toggleFav(p.id)}><Heart on={fav} /></button>
          </div>

          <dl className="specs">
            <div><dt>Описание</dt><dd>{p.desc}</dd></div>
            <div><dt>Цвета</dt><dd>{p.colors.map(c => c.name).join(', ')}</dd></div>
            {!p.oneSize && <div><dt>Размеры</dt><dd>{p.sizes[0]}–{p.sizes[p.sizes.length - 1]}{p.kind === 'shoes' ? ' (RU)' : ''}</dd></div>}
            <div><dt>Уход</dt><dd>{p.care}</dd></div>
            <div><dt>Артикул</dt><dd>{p.sku}</dd></div>
          </dl>
          <details>
            <summary>Доставка и возврат</summary>
            <p className="muted">Доставка 1–3 дня, от 5 000 ₽ бесплатно. Примерка перед оплатой, возврат 30 дней.</p>
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
