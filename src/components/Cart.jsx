import { photoFor } from '../colorPhotos.js'
import { rub, parseKey } from '../products.js'
export default function Cart({ cart, sum, change, remove, clear, close, checkout }) {
  // старые ключи без цвета или удалённые товары пропускаем, а не роняем корзину
  const items = Object.entries(cart).map(([key, q]) => ({ ...parseKey(key), q, key })).filter(i => i.p)
  return (
    <>
      <div className="scrim" onClick={close} />
      <aside className="drawer" aria-label="Корзина">
        <div className="drawer-head"><h2>Корзина</h2><button className="icon-btn" aria-label="Закрыть корзину" onClick={close}>✕</button></div>
        <div className="items">
          {items.length ? items.map(({ p, q, key, size, color }) => (
            <div className="item" key={key}>
              <img src={photoFor(p, color)} alt="" />
              <div>
                <b>{p.name}</b>
                <small>{[size && `Размер ${size}`, color].filter(Boolean).join(' · ')}</small>
                <small>{rub(p.price)} × {q} = {rub(p.price * q)}</small>
                <button className="link" onClick={() => remove(key)}>Удалить</button>
              </div>
              <div className="qty">
                <button aria-label="Убрать одну" onClick={() => change(key, -1)}>−</button>
                <span>{q}</span>
                <button aria-label="Добавить ещё" onClick={() => change(key, 1)}>+</button>
              </div>
            </div>
          )) : <p className="empty">Корзина пока пуста.<br />Добавьте вещи из каталога.</p>}
        </div>
        <div className="total">
          <div><span>Итого</span><span>{rub(sum)}</span></div>
          <small className="muted">{!items.length ? '' : sum >= 5000 ? 'Доставка бесплатно' : `До бесплатной доставки ${rub(5000 - sum)}`}</small>
          <button className="btn btn-main" onClick={checkout}>Оформить заказ</button>
          {items.length > 0 && <button className="link" onClick={clear}>Очистить корзину</button>}
        </div>
      </aside>
    </>
  )
}
