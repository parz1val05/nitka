import { useEffect, useRef, useState } from 'react'
import Login from './Login.jsx'
import Bot from './Bot.jsx'

// localStorage может быть недоступен (приватный режим) — тогда просто работаем без сохранения
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* без сохранения */ } }

const products = [
  { id: 1, name: 'Футболка из хлопка', cat: ['m', 'w'], price: 1490, old: 2190, img: '/img/tee.jpg', color: 'Белая', badge: '−30%' },
  { id: 2, name: 'Тренч с поясом', cat: ['w', 'outer'], price: 12900, img: '/img/coat.jpg', color: 'Кэмел', badge: 'Новинка' },
  { id: 3, name: 'Костюм из шерсти', cat: ['m'], price: 18500, img: '/img/men.jpg', color: 'Тёмно-синий' },
  { id: 4, name: 'Косуха из экокожи', cat: ['w', 'outer'], price: 8900, img: '/img/leather.jpg', color: 'Чёрная' },
  { id: 5, name: 'Худи оверсайз', cat: ['m', 'w'], price: 3990, img: '/img/hoodie.jpg', color: 'Серый меланж' },
  { id: 6, name: 'Платье макси', cat: ['w'], price: 7490, old: 9990, img: '/img/dress.jpg', color: 'Красное', badge: '−25%' },
  { id: 7, name: 'Бомбер', cat: ['m', 'w', 'outer'], price: 5990, img: '/img/jacket.jpg', color: 'Терракот' },
  { id: 8, name: 'Джинсы прямые', cat: ['m'], price: 4490, img: '/img/jeans.jpg', color: '3 оттенка' },
]

const filters = [['all', 'Все'], ['w', 'Женщинам'], ['m', 'Мужчинам'], ['outer', 'Верхняя одежда']]
const links = [['#catalog', 'Каталог'], ['#look', 'Лукбук'], ['#sizes', 'Размеры'], ['#contacts', 'Контакты']]
const perks = 'Бесплатная доставка от 5 000 ₽|Примерка перед оплатой|Возврат 30 дней|Размеры 42–56'.split('|')
const sizes = [['44', 'S', '86–90', '70–74'], ['46', 'M', '90–94', '74–78'], ['48', 'L', '94–98', '78–82'], ['50', 'XL', '98–102', '82–86'], ['52', 'XXL', '102–106', '86–90']]
const rub = n => n.toLocaleString('ru-RU') + ' ₽'

export default function App() {
  const [user, setUser] = useState(() => load('nitka-user', null))
  const cartKey = 'nitka-cart-' + (user?.email ?? 'guest')
  const [cart, setCart] = useState(() => load(cartKey, {})) // id -> количество
  const [cartOpen, setCartOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef()

  const say = text => {
    setToast(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }
  const change = (id, d) => setCart(c => {
    const q = (c[id] || 0) + d
    const next = { ...c, [id]: q }
    if (q <= 0) delete next[id]
    return next
  })

  useEffect(() => { save(cartKey, cart) }, [cartKey, cart])

  const login = u => {
    const guest = cart
    const saved = load('nitka-cart-' + u.email, {})
    // гостевая корзина добавляется к сохранённой корзине аккаунта
    for (const id in guest) saved[id] = (saved[id] || 0) + guest[id]
    save('nitka-cart-guest', {})
    save('nitka-user', u)
    setUser(u); setCart(saved); setLoginOpen(false)
    say('Вы вошли как ' + u.name)
  }
  const logout = () => {
    save('nitka-user', null)
    setUser(null); setCart(load('nitka-cart-guest', {}))
    say('Вы вышли из аккаунта')
  }

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && (setCartOpen(false), setLoginOpen(false))
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const count = Object.values(cart).reduce((a, b) => a + b, 0)
  const sum = Object.entries(cart).reduce((s, [id, q]) => s + products.find(p => p.id === +id).price * q, 0)
  const cartInfo = count
    ? `В корзине ${count} шт. на ${rub(sum)}.` + (sum >= 5000 ? ' Доставка будет бесплатной.' : ` Добавьте ещё на ${rub(5000 - sum)} — и доставка бесплатно.`)
    : 'Корзина пока пуста. Посмотрите каталог: сейчас −30% на базовые вещи.'

  return (
    <div className={(cartOpen ? 'open ' : '') + (menuOpen ? 'menu-open' : '')}>
      <Header count={count} menuOpen={menuOpen} setMenuOpen={setMenuOpen} openCart={() => setCartOpen(true)}
        user={user} openLogin={() => setLoginOpen(true)} logout={logout} />
      <main>
        <Hero />
        <div className="ticker" aria-hidden="true"><div>
          {[...perks, ...perks].map((p, i) => <span key={i}>{p}</span>)}
        </div></div>
        <Catalog onAdd={p => { change(p.id, 1); say(p.name + ' — в корзине') }} />
        <Lookbook />
        <Sizes />
        <Subscribe say={say} />
      </main>
      <footer>
        <div className="wrap">
          <span>© 2026 нитка. Магазин одежды</span>
          <span>+7 900 000-00-00 · ежедневно 9:00–21:00</span>
        </div>
      </footer>
      <Cart cart={cart} sum={sum} change={change} close={() => setCartOpen(false)}
        remove={id => change(id, -cart[id])}
        clear={() => { setCart({}); say('Корзина очищена') }}
        checkout={() => {
          if (!count) return say('Сначала добавьте вещи в корзину')
          if (!user) { setCartOpen(false); setLoginOpen(true); return say('Войдите, чтобы оформить заказ') }
          setCart({}); setCartOpen(false); say('Это демо: заказ не отправлен')
        }} />
      {loginOpen && <Login onLogin={login} close={() => setLoginOpen(false)} />}
      <Bot cartInfo={cartInfo} openCart={() => setCartOpen(true)} />
      <div className={'toast' + (toast ? ' show' : '')} role="status">{toast}</div>
    </div>
  )
}

function Header({ count, menuOpen, setMenuOpen, openCart, user, openLogin, logout }) {
  return (
    <header id="top">
      <div className="wrap bar">
        <a className="logo" href="#top">нитка<span>.</span></a>
        <nav aria-label="Разделы">{links.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav>
        {user
          ? <button className="icon-btn account" onClick={logout} title="Выйти из аккаунта"><span className="avatar">{user.name[0].toUpperCase()}</span><span className="acc-text">Выйти</span></button>
          : <button className="icon-btn account" onClick={openLogin}>Войти</button>}
        <button className="icon-btn burger" aria-expanded={menuOpen} aria-controls="menu" onClick={() => setMenuOpen(!menuOpen)}>Меню</button>
        <button className="icon-btn" aria-label="Открыть корзину" onClick={openCart}>
          <span className="cart-text">Корзина</span> <span className="count bump" key={count}>{count}</span>
        </button>
      </div>
      <div className="menu wrap" id="menu"><div>
        {links.map(([h, t]) => <a key={h} href={h} onClick={() => setMenuOpen(false)}>{t}</a>)}
      </div></div>
    </header>
  )
}

function Hero() {
  return (
    <div className="wrap hero">
      <div className="hero-text">
        <span className="eyebrow">Коллекция осень — зима 2026</span>
        <h1>Одежда, в которой <em>удобно</em> жить</h1>
        <p>Хлопок, шерсть и кожа без лишнего декора. Доставим за 1–3 дня, примерка перед оплатой.</p>
        <div className="cta">
          <a className="btn btn-main" href="#catalog">Смотреть каталог</a>
          <a className="btn btn-ghost" href="#look">Лукбук</a>
        </div>
      </div>
      <div className="hero-pic">
        <img src="/img/hero.jpg" alt="Рейл с блузками и кардиганами на деревянных плечиках" />
        <div className="tag"><b>−30%</b>на базовые вещи до 31 октября</div>
      </div>
    </div>
  )
}

function Catalog({ onAdd }) {
  const [filter, setFilter] = useState('all')
  const shown = products.filter(p => filter === 'all' || p.cat.includes(filter))
  return (
    <section id="catalog">
      <div className="wrap">
        <div className="head reveal">
          <h2>Каталог</h2>
          <div className="chips" role="group" aria-label="Фильтр по категории">
            {filters.map(([f, t]) => <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{t}</button>)}
          </div>
        </div>
        {/* key={filter} пересоздаёт карточки, чтобы анимация появления проигрывалась при каждой смене фильтра */}
        <div className="grid" key={filter}>
          {shown.map((p, i) => <Card key={p.id} p={p} delay={i * 60} onAdd={onAdd} />)}
        </div>
      </div>
    </section>
  )
}

function Card({ p, delay, onAdd }) {
  const [done, setDone] = useState(false)
  const add = () => {
    onAdd(p)
    setDone(true)
    setTimeout(() => setDone(false), 1400)
  }
  return (
    <article className="card" style={{ animationDelay: delay + 'ms' }}>
      <div className="pic">
        <img src={p.img} alt={`${p.name}, ${p.color.toLowerCase()}`} loading="lazy" />
        {p.badge && <span className="badge">{p.badge}</span>}
        <button className={'add' + (done ? ' done' : '')} onClick={add}>{done ? 'Добавлено ✓' : 'В корзину'}</button>
      </div>
      <h3>{p.name}</h3>
      <div className="meta">
        <span>{p.color}</span>
        <span className="price">{rub(p.price)}{p.old && <s>{rub(p.old)}</s>}</span>
      </div>
    </article>
  )
}

function Lookbook() {
  return (
    <section id="look">
      <div className="wrap">
        <div className="head reveal"><h2>Лукбук</h2></div>
        <div className="look">
          <figure className="reveal">
            <img src="/img/woman.jpg" alt="Девушка в жёлтом спортивном костюме на баскетбольной площадке" loading="lazy" />
            <figcaption><h3>Яркий трикотаж</h3><p>Худи и джоггеры из футера 320 г/м²</p></figcaption>
          </figure>
          <figure className="reveal">
            <img src="/img/rack.jpg" alt="Зелёные футболки на деревянных плечиках" loading="lazy" />
            <figcaption><h3>База на каждый день</h3><p>Футболки из хлопка пенье, 6 цветов</p></figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}

function Sizes() {
  return (
    <section id="sizes">
      <div className="wrap info">
        <div className="reveal">
          <div className="head"><h2>Подбор размера</h2></div>
          <div className="table-box">
            <table>
              <thead><tr><th>Размер</th><th>Межд.</th><th>Обхват груди, см</th><th>Обхват талии, см</th></tr></thead>
              <tbody>{sizes.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="perks reveal">
          <div className="perk"><i>1–3</i><div><b>Доставка за 1–3 дня</b><span>Курьером или в пункт выдачи. От 5 000 ₽ бесплатно.</span></div></div>
          <div className="perk"><i>✓</i><div><b>Примерка перед оплатой</b><span>Платите только за то, что подошло.</span></div></div>
          <div className="perk"><i>30</i><div><b>Возврат 30 дней</b><span>Без объяснения причин, если сохранены бирки.</span></div></div>
        </div>
      </div>
    </section>
  )
}

function Subscribe({ say }) {
  return (
    <div className="wrap reveal" id="contacts">
      <div className="sub">
        <div>
          <h2>Скидка 10% на первый заказ</h2>
          <p style={{ margin: '8px 0 0', opacity: 0.85 }}>Оставьте почту, пришлём промокод и новости о новых коллекциях.</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); e.target.reset(); say('Готово! Промокод придёт на почту (демо)') }}>
          <label htmlFor="email" style={{ position: 'absolute', left: -9999 }}>Почта</label>
          <input id="email" type="email" required placeholder="you@mail.ru" autoComplete="email" />
          <button className="btn" type="submit">Получить</button>
        </form>
      </div>
    </div>
  )
}

function Cart({ cart, sum, change, remove, clear, close, checkout }) {
  const items = Object.entries(cart).map(([id, q]) => [products.find(p => p.id === +id), q])
  return (
    <>
      <div className="scrim" onClick={close} />
      <aside className="drawer" aria-label="Корзина">
        <div className="drawer-head"><h2>Корзина</h2><button className="icon-btn" aria-label="Закрыть корзину" onClick={close}>✕</button></div>
        <div className="items">
          {items.length ? items.map(([p, q]) => (
            <div className="item" key={p.id}>
              <img src={p.img} alt="" />
              <div>
                <b>{p.name}</b><small>{rub(p.price)} × {q} = {rub(p.price * q)}</small>
                <button className="link" onClick={() => remove(p.id)}>Удалить</button>
              </div>
              <div className="qty">
                <button aria-label="Убрать одну" onClick={() => change(p.id, -1)}>−</button>
                <span>{q}</span>
                <button aria-label="Добавить ещё" onClick={() => change(p.id, 1)}>+</button>
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
