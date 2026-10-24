export default function Hero({ showCategory }) {
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
