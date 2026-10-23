import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import ProductView, { Heart } from './ProductView.jsx'
import { photoFor, isSimilar } from './colorPhotos.js'
import { products, rub, parseKey, cartKey } from './products.js'
import { STORE } from './store.js'
import Auth from './Auth.jsx'
import Bot from './Bot.jsx'

// localStorage может быть недоступен (приватный режим) — тогда просто работаем без сохранения
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* без сохранения */ } }

const filters = [['all', 'Все'], ['w', 'Женщинам'], ['m', 'Мужчинам'], ['classic', 'Классика'], ['shoes', 'Обувь'], ['outer', 'Верхняя одежда'], ['acc', 'Аксессуары'], ['fav', 'Избранное']]
const links = [['#catalog', 'Каталог'], ['#info', 'Покупателям'], ['#sizes', 'Размеры'], ['#contacts', 'Контакты']]
const perks = ['Бесплатная доставка от 5 000 ₽', 'Примерка перед оплатой', 'Возврат 30 дней', 'Одежда 44–52 · обувь 35–45']
const sizeTable = [['44', 'S', '86–90', '70–74'], ['46', 'M', '90–94', '74–78'], ['48', 'L', '94–98', '78–82'], ['50', 'XL', '98–102', '82–86'], ['52', 'XXL', '102–106', '86–90']]
const shoeTable = [['35', '22,5'], ['36', '23'], ['37', '23,5'], ['38', '24,5'], ['39', '25'], ['40', '25,5'], ['41', '26,5'], ['42', '27'], ['43', '27,5'], ['44', '28,5'], ['45', '29']]

export default function App() {
  // старый формат пользователя (без id) считаем выходом из аккаунта
  const [user, setUser] = useState(() => { const u = load('nitka-user', null); return u?.id ? u : null })
  const storeKey = 'nitka-cart-' + (user?.id ?? 'guest')
  const [cart, setCart] = useState(() => load(storeKey, {})) // "id-размер-цвет" -> количество
  const [cartOpen, setCartOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(null) // null | 'login' | 'register'
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState('')
  const toastTimer = useRef()
  const [favs, setFavs] = useState(() => load('nitka-favs', [])) // id избранных товаров
  const [pastHero, setPastHero] = useState(false)

  const say = text => {
    setToast(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }
  const change = (key, d) => setCart(c => {
    const q = (c[key] || 0) + d
    const next = { ...c, [key]: q }
    if (q <= 0) delete next[key]
    return next
  })

  useEffect(() => { save(storeKey, cart) }, [storeKey, cart])
  useEffect(() => { save('nitka-favs', favs) }, [favs])
  const toggleFav = id => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id])

  useEffect(() => { // кнопка «Наверх» — после первого экрана
    const on = () => setPastHero(scrollY > innerHeight)
    on()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])

  // Открытие товара: фото «перелетает» из карточки в окно (View Transitions API), без поддержки — просто открывается
  const [viewing, setViewing] = useState(null)
  const [viewColor, setViewColor] = useState(null) // цвет, выбранный в карточке перед открытием
  const origin = useRef() // фото карточки, из которой открыли товар
  const morph = (photo, update) => {
    if (!document.startViewTransition || !photo?.isConnected || matchMedia('(prefers-reduced-motion: reduce)').matches) return update()
    photo.style.viewTransitionName = 'product-photo'
    document.startViewTransition(() => {
      photo.style.viewTransitionName = '' // имя должно быть только у одного элемента
      flushSync(update)
    })
  }
  const openProduct = (p, photo, color) => {
    if (viewing) { setViewColor(null); return setViewing(p) } // переход к похожему товару внутри окна
    origin.current = photo
    morph(photo, () => { setViewColor(color); setViewing(p) })
  }
  const closeProduct = () => {
    const photo = origin.current
    if (!document.startViewTransition || !photo?.isConnected || document.querySelector('.pv-slide img')?.getAttribute('src') !== photo.getAttribute('src')) return setViewing(null)
    document.startViewTransition(() => {
      flushSync(() => setViewing(null))
      photo.style.viewTransitionName = 'product-photo'
    }).finished.finally(() => { photo.style.viewTransitionName = '' })
  }

  const login = (u, isNew) => {
    const saved = load('nitka-cart-' + u.id, {})
    // гостевая корзина добавляется к сохранённой корзине аккаунта
    for (const k in cart) saved[k] = (saved[k] || 0) + cart[k]
    save('nitka-cart-guest', {})
    save('nitka-user', u)
    setUser(u); setCart(saved); setAuthOpen(null)
    say(isNew ? `Аккаунт создан. Добро пожаловать, ${u.name}!` : `Вы вошли как ${u.name}`)
  }
  const logout = () => {
    save('nitka-user', null)
    setUser(null); setCart(load('nitka-cart-guest', {}))
    say('Вы вышли из аккаунта')
  }

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && (setCartOpen(false), setAuthOpen(null))
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // плавность задаёт CSS (scroll-behavior), при reduced motion — без анимации
  const showCategory = f => { setFilter(f); document.getElementById('catalog').scrollIntoView() }

  const count = Object.values(cart).reduce((a, b) => a + b, 0)
  const sum = Object.entries(cart).reduce((s, [k, q]) => s + (parseKey(k).p?.price ?? 0) * q, 0)
  const cartInfo = count
    ? `В корзине ${count} шт. на ${rub(sum)}.` + (sum >= 5000 ? ' Доставка будет бесплатной.' : ` Добавьте ещё на ${rub(5000 - sum)} — и доставка бесплатно.`)
    : 'Корзина пока пуста. Загляните в каталог: там новая классика и обувь.'

  return (
    <div className={(cartOpen ? 'open ' : '') + (menuOpen ? 'menu-open' : '')}>
      <div className="progress" aria-hidden="true" />
      <Header favCount={favs.length} showFavs={() => showCategory('fav')} count={count} menuOpen={menuOpen} setMenuOpen={setMenuOpen} openCart={() => setCartOpen(true)}
        user={user} openAuth={setAuthOpen} logout={logout} />
      <main>
        <Hero showCategory={showCategory} />
        <div className="ticker" aria-hidden="true"><div>
          {[...perks, ...perks].map((p, i) => <span key={i}>{p}</span>)}
        </div></div>
        <Catalog filter={filter} setFilter={setFilter} onOpen={openProduct} favs={favs} toggleFav={toggleFav} />
        <Collections showCategory={showCategory} />
        <Info />
        <Sizes />
        <Contacts say={say} />
      </main>
      <Footer />
      <Cart cart={cart} sum={sum} change={change} close={() => setCartOpen(false)}
        remove={k => change(k, -cart[k])}
        clear={() => { setCart({}); say('Корзина очищена') }}
        checkout={() => {
          if (!count) return say('Сначала добавьте вещи в корзину')
          if (!user) { setCartOpen(false); setAuthOpen('login'); return say('Войдите, чтобы оформить заказ') }
          setCart({}); setCartOpen(false); say('Это демо: заказ не отправлен')
        }} />
      {viewing && <ProductView p={viewing} close={closeProduct} open={openProduct} initialColor={viewColor}
        fav={favs.includes(viewing.id)} toggleFav={toggleFav}
        onAdd={(p, size, color) => { change(cartKey(p, size, color), 1); say(`${p.name}, ${[size, color.toLowerCase()].filter(Boolean).join(', ')} — в корзине`) }} />}
      {authOpen && <Auth initialMode={authOpen} onLogin={login} close={() => setAuthOpen(null)} />}
      <Bot cartInfo={cartInfo} openCart={() => setCartOpen(true)} />
      <button className={'to-top' + (pastHero ? ' show' : '')} aria-label="Наверх" onClick={() => scrollTo({ top: 0 })}>↑</button>
      <div className={'toast' + (toast ? ' show' : '')} role="status">{toast}</div>
    </div>
  )
}

function Header({ favCount, showFavs, count, menuOpen, setMenuOpen, openCart, user, openAuth, logout }) {
  return (
    <header id="top">
      <div className="wrap bar">
        <a className="logo" href="#top">НИТКА</a>
        <nav aria-label="Разделы">{links.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav>
        {user
          ? <button className="icon-btn account" onClick={logout} title="Выйти из аккаунта"><span className="avatar">{user.name[0].toUpperCase()}</span><span className="acc-text">{user.name} · </span>Выйти</button>
          : <button className="icon-btn account" onClick={() => openAuth('login')}>Войти</button>}
        <button className="icon-btn burger" aria-expanded={menuOpen} aria-controls="menu" onClick={() => setMenuOpen(!menuOpen)}>Меню</button>
        <button className="icon-btn" aria-label={`Избранное, товаров: ${favCount}`} onClick={showFavs}>
          <Heart on={favCount > 0} /> <span className="count" key={favCount}>{favCount}</span>
        </button>
        <button className="icon-btn" aria-label={`Корзина, товаров: ${count}`} onClick={openCart}>
          <span className="cart-text">Корзина</span> <span className="count" key={count}>{count}</span>
        </button>
      </div>
      <div className="menu wrap" id="menu"><div>
        {links.map(([h, t]) => <a key={h} href={h} onClick={() => setMenuOpen(false)}>{t}</a>)}
        {!user && <button className="link" onClick={() => { setMenuOpen(false); openAuth('register') }}>Регистрация</button>}
      </div></div>
    </header>
  )
}

function Hero({ showCategory }) {
  return (
    <div className="wrap hero">
      <div className="hero-text">
        <span className="eyebrow">Осень — зима 2026</span>
        <h1>Классика, которая не&nbsp;выходит из&nbsp;моды</h1>
        <p>Шерстяные костюмы, платья, кожаная обувь и база на каждый день. Доставка за 1–3 дня, примерка перед оплатой.</p>
        <div className="cta">
          <button className="btn btn-main" onClick={() => showCategory('classic')}>Смотреть классику</button>
          <button className="btn btn-ghost" onClick={() => showCategory('shoes')}>Обувь</button>
        </div>
      </div>
      <div className="hero-pic">
        <img src="/img/hero.jpg" alt="Рейл с блузками и кардиганами на деревянных плечиках" />
        <div className="tag">−30% на базовые вещи до 31 октября</div>
      </div>
    </div>
  )
}

function Catalog({ filter, setFilter, onOpen, favs, toggleFav }) {
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

function Card({ p, delay, onOpen, fav, toggleFav }) {
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

function Collections({ showCategory }) {
  return (
    <section id="look">
      <div className="wrap">
        <div className="head"><div><span className="eyebrow">Коллекции</span><h2>Выбор сезона</h2></div></div>
        <div className="look">
          <button className="look-card" onClick={() => showCategory('classic')}>
            <img src="/img/men.jpg" alt="Мужчина в тёмно-синем шерстяном костюме" loading="lazy" />
            <span className="look-cap"><b>Классика</b>Костюмы, рубашки, тренчи и вечерние платья</span>
          </button>
          <button className="look-card" onClick={() => showCategory('shoes')}>
            <img src="/img/monks.jpg" alt="Коричневые кожаные монки с двумя пряжками" loading="lazy" />
            <span className="look-cap"><b>Обувь</b>Дерби, монки, лодочки, челси и кеды из кожи</span>
          </button>
        </div>
      </div>
    </section>
  )
}

function Info() {
  const blocks = [
    ['Доставка', 'Курьером и в пункты выдачи за 1–3 дня. От 5 000 ₽ — бесплатно, иначе 350 ₽. Срок и стоимость видны до оплаты.'],
    ['Оплата', 'Картой на сайте, через СБП или при получении — картой или наличными курьеру.'],
    ['Примерка', 'Курьер подождёт 15 минут. Платите только за то, что подошло, остальное он заберёт.'],
    ['Возврат и обмен', '30 дней с момента покупки, если сохранены бирки и товарный вид. Деньги вернутся за 3–5 дней.'],
  ]
  const faq = [
    ['Как выбрать размер?', 'Сверьтесь с таблицами ниже. Если сомневаетесь между двумя размерами одежды, берите больший; для обуви измерьте длину стопы вечером.'],
    ['Можно ли изменить заказ?', 'Да, пока заказ не передан курьеру — напишите или позвоните нам.'],
    ['Цвет на фото и в жизни отличается?', 'На фото показан один цвет — он подписан в карточке. Остальные цвета смотрите на образцах; оттенок может немного отличаться из-за настроек экрана.'],
    ['Как ухаживать за вещами?', 'Рекомендации по уходу есть в карточке каждого товара и на ярлыке изделия.'],
  ]
  return (
    <section id="info">
      <div className="wrap">
        <div className="head"><div><span className="eyebrow">Покупателям</span><h2>Всё о заказе</h2></div></div>
        <div className="info-grid">
          {blocks.map(([t, d]) => <div key={t} className="info-card"><h3>{t}</h3><p>{d}</p></div>)}
        </div>
        <div className="faq">
          <h3>Частые вопросы</h3>
          {faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </div>
    </section>
  )
}

function Sizes() {
  return (
    <section id="sizes">
      <div className="wrap">
        <div className="head"><div><span className="eyebrow">Таблицы размеров</span><h2>Подбор размера</h2></div></div>
        <div className="size-tables">
          <div className="table-box">
            <table>
              <caption>Одежда</caption>
              <thead><tr><th>Размер</th><th>Межд.</th><th>Обхват груди, см</th><th>Обхват талии, см</th></tr></thead>
              <tbody>{sizeTable.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="table-box">
            <table>
              <caption>Обувь</caption>
              <thead><tr><th>Размер RU</th><th>Длина стопы, см</th></tr></thead>
              <tbody>{shoeTable.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function Contacts({ say }) {
  return (
    <section id="contacts">
      <div className="wrap contacts">
        <div>
          <span className="eyebrow">Магазин</span>
          <h2>Контакты</h2>
          <dl className="specs">
            <div><dt>Адрес</dt><dd>{STORE.address}<br /><span className="muted">{STORE.addressNote}</span></dd></div>
            <div><dt>Часы работы</dt><dd>{STORE.hours}</dd></div>
            <div><dt>Телефон</dt><dd>{STORE.phone}</dd></div>
            <div><dt>Почта</dt><dd>{STORE.email}</dd></div>
          </dl>
        </div>
        <div className="sub">
          <h3>Скидка 10% на первый заказ</h3>
          <p>Оставьте почту — пришлём промокод и новости о новых коллекциях.</p>
          <form onSubmit={e => { e.preventDefault(); e.target.reset(); say('Готово! Промокод придёт на почту (демо)') }}>
            <label htmlFor="email" className="sr-only">Почта</label>
            <input id="email" type="email" required placeholder="you@mail.ru" autoComplete="email" />
            <button className="btn btn-main" type="submit">Получить</button>
          </form>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <div className="wrap footer-grid">
        <div><span className="logo">НИТКА</span><p className="muted">Одежда и обувь: классика и база на каждый день.</p></div>
        <div><b>Покупателям</b><a href="#info">Доставка и оплата</a><a href="#info">Возврат и обмен</a><a href="#sizes">Таблицы размеров</a></div>
        <div><b>Магазин</b><span>{STORE.address}</span><span>{STORE.hours}</span><span>{STORE.phone}</span></div>
      </div>
      <div className="wrap copyright">© 2026 НИТКА</div>
    </footer>
  )
}

function Cart({ cart, sum, change, remove, clear, close, checkout }) {
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
