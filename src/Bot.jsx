import { useEffect, useRef, useState } from 'react'
import { STORE } from './store.js'

// Ответы бота: ключевые слова (начала слов, в нижнем регистре) → ответ
const faq = [
  { q: 'Доставка', keys: ['достав', 'курьер', 'привез', 'срок', 'когда'], a: 'Доставляем за 1–3 дня курьером или в пункт выдачи. От 5 000 ₽ доставка бесплатная, иначе 350 ₽.' },
  { q: 'Оплата', keys: ['оплат', 'заплат', 'карт', 'налич'], a: 'Оплата картой на сайте или при получении, наличными или картой курьеру. Можно сначала примерить, потом платить.' },
  { q: 'Возврат', keys: ['возврат', 'вернут', 'обмен', 'не подош'], a: 'Вернуть или обменять вещь можно в течение 30 дней, если сохранены бирки. Деньги придут за 3–5 дней.' },
  { q: 'Размер', keys: ['размер', 'мал', 'велик', 'рост', 'обхват'], a: 'Смотрите «Подбор размера» на странице: одежда 44–52 с обхватами груди и талии, обувь 35–45 с длиной стопы. Если сомневаетесь между двумя размерами одежды, берите больший.' },
  { q: 'Классика и обувь', keys: ['класси', 'костюм', 'обув', 'туфл', 'ботин', 'кед'], a: 'В каталоге есть разделы «Классика» (костюмы, рубашки, тренч, вечернее платье) и «Обувь» (дерби, монки, лодочки, челси, кеды). Выберите фильтр над товарами.' },
  { q: 'Скидки', keys: ['скид', 'акци', 'промо', 'дешев', 'распрод'], a: 'Сейчас −30% на базовые вещи до 31 октября и −10% на первый заказ по промокоду из подписки.' },
  { q: 'Что посоветуете?', keys: ['совет', 'посовет', 'подобр', 'хит', 'популяр', 'что купить'], a: 'Хиты сезона: тренч с поясом, худи оверсайз и футболка из хлопка (сейчас со скидкой 30%). Добавить можно прямо из каталога.' },
  { q: 'Контакты', keys: ['контакт', 'телефон', 'позвон', 'адрес', 'где наход', 'магазин', 'менеджер', 'оператор'], a: `Адрес: ${STORE.address}. Телефон ${STORE.phone}, почта ${STORE.email}. ${STORE.hours}.` },
]
const hello = 'Здравствуйте! Я помощник магазина «НИТКА». Подскажу про доставку, оплату, размеры, классику и обувь, контакты и вашу корзину.'
const fallback = `Не нашёл ответа на этот вопрос. Выберите тему ниже или позвоните нам: ${STORE.phone}.`

export function answer(text, cartInfo) {
  const t = text.toLowerCase()
  if (/корзин|заказ|итог/.test(t)) return cartInfo
  if (/привет|здравств|добр/.test(t)) return hello
  return faq.find(f => f.keys.some(k => t.includes(k)))?.a ?? fallback
}

export default function Bot({ cartInfo, openCart }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{ from: 'bot', text: hello }])
  const [typing, setTyping] = useState(false)
  const end = useRef()

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, typing, open])

  const ask = text => {
    if (!text.trim()) return
    setMsgs(m => [...m, { from: 'me', text }])
    setTyping(true)
    setTimeout(() => { // небольшая пауза, чтобы ответ выглядел живым
      setTyping(false)
      setMsgs(m => [...m, { from: 'bot', text: answer(text, cartInfo), cart: /корзин|заказ|итог/i.test(text) }])
    }, 600)
  }

  return (
    <>
      <button className="bot-fab" aria-expanded={open} aria-controls="bot" onClick={() => setOpen(!open)}>
        {open ? '✕' : 'Помощь'}
      </button>
      {open && (
        <div className="bot" id="bot" role="dialog" aria-label="Чат с помощником">
          <div className="bot-head"><b>Помощник</b><span>Отвечает сразу</span></div>
          <div className="bot-msgs" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={'msg from-' + m.from}>
                {m.text}
                {m.cart && <button className="link" onClick={openCart}>Открыть корзину</button>}
              </div>
            ))}
            {typing && <div className="msg from-bot typing"><i /><i /><i /></div>}
            <div ref={end} />
          </div>
          <div className="bot-quick">
            {[...faq.map(f => f.q), 'Моя корзина'].map(q => <button key={q} className="chip" onClick={() => ask(q)}>{q}</button>)}
          </div>
          <form className="bot-form" onSubmit={e => { e.preventDefault(); ask(e.target.elements.q.value); e.target.reset() }}>
            <label htmlFor="bot-q" className="sr-only">Вопрос</label>
            <input id="bot-q" name="q" placeholder="Напишите вопрос…" autoComplete="off" />
            <button className="btn btn-main" type="submit">→</button>
          </form>
        </div>
      )}
    </>
  )
}
