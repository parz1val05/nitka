import { STORE } from '../store.js'
export default function Contacts({ say }) {
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
