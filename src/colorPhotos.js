// Фото товара в другом цвете: { id товара: { 'Название цвета': '/img/colors/файл.jpg' } }.
// Это снимок похожей модели в этом цвете, а не того же изделия, — интерфейс подписывает его так.
export const colorPhotos = {
  1: { 'Чёрный': '/img/colors/1-black.jpg' },
  2: { 'Чёрный': '/img/colors/2-black.jpg' },
  3: { 'Графит': '/img/colors/3-graphite.jpg' },
  4: { 'Коньячный': '/img/colors/4-cognac.jpg' },
  5: { 'Чёрный': '/img/colors/5-black.jpg' },
  6: { 'Чёрный': '/img/colors/6-black.jpg' },
  7: { 'Чёрный': '/img/colors/7-black.jpg' },
  8: { 'Голубой': '/img/colors/8-light-blue.jpg' },
  9: { 'Песочный': '/img/colors/9-sand.jpg' },
  10: { 'Коричневый': '/img/colors/10-brown.jpg' },
  11: { 'Чёрный': '/img/colors/11-black.jpg' },
  12: { 'Белый': '/img/colors/12-white.jpg' },
  13: { 'Чёрный': '/img/colors/13-black.jpg' },
  14: { 'Чёрный': '/img/colors/14-black.jpg' },
  15: { 'Белый': '/img/colors/15-white.jpg' },
  16: { 'Серый меланж': '/img/colors/16-grey-melange.jpg' },
  17: { 'Чёрный': '/img/colors/17-black.jpg' },
  18: { 'Тёмно-синий': '/img/colors/18-navy.jpg' },
  19: { 'Красный': '/img/colors/19-red.jpg' },
  20: { 'Молочный': '/img/colors/20-milk.jpg' },
  21: { 'Белый': '/img/colors/21-white.jpg' },
  22: { 'Деним': '/img/colors/22-denim.jpg' },
  23: { 'Чёрный': '/img/colors/23-black.jpg' },
  24: { 'Графит': '/img/colors/24-graphite.jpg' },
  25: { 'Голубой': '/img/colors/25-light-blue.jpg' },
  26: { 'Голубой': '/img/colors/26-light-blue.jpg' },
  27: { 'Тёмно-синий': '/img/colors/27-navy.jpg' },
  28: { 'Серый меланж': '/img/colors/28-grey-melange.jpg' },
  29: { 'Чёрный': '/img/colors/29-black.jpg' },
  30: { 'Чёрный': '/img/colors/30-black.jpg' },
  31: { 'Чёрный': '/img/colors/31-black.jpg' },
  32: { 'Чёрный': '/img/colors/32-black.jpg' },
  33: { 'Чёрный': '/img/colors/33-black.jpg' },
  34: { 'Чёрный': '/img/colors/34-black.jpg' },
  35: { 'Песочный': '/img/colors/35-sand.jpg' },
}

// фото для выбранного цвета: своё, если есть, иначе основное
export const photoFor = (p, color) => colorPhotos[p.id]?.[color] ?? p.img
export const isSimilar = (p, color) => Boolean(colorPhotos[p.id]?.[color]) && color !== p.color
