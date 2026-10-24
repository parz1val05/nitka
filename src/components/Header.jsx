import { Heart } from '../ProductView.jsx'

const links = [['#catalog', 'Каталог'], ['#info', 'Покупателям'], ['#sizes', 'Размеры'], ['#contacts', 'Контакты']]
export default function Header({ favCount, showFavs, count, menuOpen, setMenuOpen, openCart, user, openAuth, logout }) {
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
