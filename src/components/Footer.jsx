import { STORE } from '../store.js'
export default function Footer() {
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
