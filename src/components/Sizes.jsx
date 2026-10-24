const sizeTable = [['44', 'S', '86–90', '70–74'], ['46', 'M', '90–94', '74–78'], ['48', 'L', '94–98', '78–82'], ['50', 'XL', '98–102', '82–86'], ['52', 'XXL', '102–106', '86–90']]
const shoeTable = [['35', '22,5'], ['36', '23'], ['37', '23,5'], ['38', '24,5'], ['39', '25'], ['40', '25,5'], ['41', '26,5'], ['42', '27'], ['43', '27,5'], ['44', '28,5'], ['45', '29']]
export default function Sizes() {
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
