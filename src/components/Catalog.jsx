import { useState } from 'react'
import { products } from '../products.js'
import Card from './Card.jsx'

const filters = [['all', 'Все'], ['w', 'Женщинам'], ['m', 'Мужчинам'], ['classic', 'Классика'], ['shoes', 'Обувь'], ['outer', 'Верхняя одежда'], ['acc', 'Аксессуары'], ['fav', 'Избранное']]
export default function Catalog({ filter, setFilter, onOpen, favs, toggleFav }) {
  const [limit, setLimit] = useState(12)
  const all = products.filter(p => filter === 'fav' ? favs.includes(p.id) : filter === 'all' || p.cat.includes(filter))
  const shown = all.slice(0, limit)
  return (
    <section id="catalog">
      <div className="wrap">
        <div className="head">
          <div><span className="eyebrow">{all.length} товаров</span><h2>Каталог</h2></div>
          <div className="chips" role="group" aria-label="Фильтр по категории">
            {filters.map(([f, t]) => <button key={f} className="chip" aria-pressed={filter === f} onClick={() => { setFilter(f); setLimit(12) }}>{t}</button>)}
          </div>
        </div>
        {/* key={filter} пересоздаёт карточки, чтобы анимация появления проигрывалась при каждой смене фильтра */}
        <div className="grid" key={filter}>
          {shown.map((p, i) => <Card key={p.id} p={p} delay={(i % 12) * 40} onOpen={onOpen} fav={favs.includes(p.id)} toggleFav={toggleFav} />)}
        </div>
        {filter === 'fav' && !all.length && <p className="muted empty-fav">В избранном пока пусто. Нажмите на сердечко на карточке товара.</p>}
        {all.length > limit && (
          <div className="more">
            <button className="btn btn-ghost" onClick={() => setLimit(limit + 8)}>Показать ещё · {all.length - limit}</button>
          </div>
        )}
      </div>
    </section>
  )
}
