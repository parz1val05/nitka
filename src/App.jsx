import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import ProductView from './ProductView.jsx'
import { rub, parseKey, cartKey } from './products.js'
import Auth from './Auth.jsx'
import Bot from './Bot.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Catalog from './components/Catalog.jsx'
import Collections from './components/Collections.jsx'
import Info from './components/Info.jsx'
import Sizes from './components/Sizes.jsx'
import Contacts from './components/Contacts.jsx'
import Footer from './components/Footer.jsx'
import Cart from './components/Cart.jsx'

// localStorage может быть недоступен (приватный режим) — тогда просто работаем без сохранения
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* без сохранения */ } }

const perks = ['Бесплатная доставка от 5 000 ₽', 'Примерка перед оплатой', 'Возврат 30 дней', 'Одежда 44–52 · обувь 35–45']

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
