// Аккаунты покупателей.
// shortcut: аккаунты лежат в localStorage этого браузера, а код подтверждения показывается на экране (тестовый режим) —
// для настоящих покупателей нужен сервер: база пользователей, отправка SMS и писем, ограничение попыток на сервере.

// Тестовые номера и почты, как в Firebase: код подтверждения всегда TEST_CODE
export const TEST_IDS = ['+79000000001', '+79000000002', 'test@nitka.shop']
export const TEST_CODE = '123456'
export const CODE_TTL = 5 * 60 * 1000 // код действует 5 минут
export const MAX_TRIES = 5

// +7 (900) 000-00-01, 8 900 000 00 01, 9000000001 → +79000000001
export function normPhone(s) {
  const d = String(s).replace(/\D/g, '')
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) return '+7' + d.slice(1)
  if (d.length === 10 && d[0] === '9') return '+7' + d
  return null
}
export function normEmail(s) {
  const e = String(s).trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null
}
export const normId = s => (String(s).includes('@') ? normEmail(s) : normPhone(s))
export const prettyId = id => (id.startsWith('+7') ? `+7 ${id.slice(2, 5)} ${id.slice(5, 8)}-${id.slice(8, 10)}-${id.slice(10)}` : id)

export function passwordProblem(p) {
  if (p.length < 8) return 'Пароль — не короче 8 символов'
  if (!/\d/.test(p) || !/\p{L}/u.test(p)) return 'В пароле нужны и буквы, и цифры'
  return ''
}

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
export const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)))
export const newCode = id => (TEST_IDS.includes(id) ? TEST_CODE : String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, '0'))

// пароль хранится только как PBKDF2-хеш с солью
export async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100000 }, key, 256)
  return hex(bits)
}

// storage — localStorage или любой объект с getItem/setItem (для теста)
export function accounts(storage) {
  const read = () => { try { return JSON.parse(storage.getItem('nitka-users')) || {} } catch { return {} } }
  const write = u => { try { storage.setItem('nitka-users', JSON.stringify(u)) } catch { /* без сохранения */ } }
  return {
    exists: id => Boolean(read()[id]),
    async create(id, name, password) {
      const salt = newSalt(), users = read()
      users[id] = { name, salt, hash: await hashPassword(password, salt), created: new Date().toISOString() }
      write(users)
      return { id, name }
    },
    // неизвестный логин и неверный пароль дают одинаковый ответ — не подсказываем, какие аккаунты есть
    async check(id, password) {
      const a = read()[id]
      if (!a) return null
      return (await hashPassword(password, a.salt)) === a.hash ? { id, name: a.name } : null
    },
  }
}
