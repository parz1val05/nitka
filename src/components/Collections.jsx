export default function Collections({ showCategory }) {
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
