import { useRef, useState } from 'react'
import { Heart } from '../ProductView.jsx'
import { photoFor, isSimilar } from '../colorPhotos.js'
import { rub } from '../products.js'
export default function Card({ p, delay, onOpen, fav, toggleFav }) {
  const photo = useRef()
  const [color, setColor] = useState(p.color)
  const src = photoFor(p, color)
  return (
    <article className="card" style={{ '--d': delay + 'ms' }}>
      <div className="media">
        <button className="pic" onClick={() => onOpen(p, photo.current, color)} aria-label={`${p.name} — подробнее`}>
          {/* key — новое фото цвета плавно проявляется */}
          <img key={src} ref={photo} src={src} alt={`${p.name}, ${(isSimilar(p, color) ? color : p.color).toLowerCase()}`} loading="lazy" />
          {p.badge && <span className="badge">{p.badge}</span>}
          <span className="add">Подробнее</span>
        </button>
        <button className="fav" aria-pressed={fav} aria-label={`В избранное: ${p.name}`} onClick={() => toggleFav(p.id)}><Heart on={fav} /></button>
      </div>
      <h3>{p.name}</h3>
      <div className="meta">
        <span className="dots" role="group" aria-label="Цвета">
          {p.colors.map(c => <button key={c.name} aria-label={`Цвет: ${c.name}`} aria-pressed={color === c.name} title={c.name} style={{ '--sw': c.hex }}
            onPointerEnter={() => setColor(c.name)} onFocus={() => setColor(c.name)} onClick={() => setColor(c.name)} />)}
        </span>
        <span>{p.oneSize ? 'Один размер' : `${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}`}</span>
      </div>
      <span className="price">{rub(p.price)}{p.old > 0 && <s>{rub(p.old)}</s>}</span>
    </article>
  )
}
