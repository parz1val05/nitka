// Проверка логики аккаунтов: node src/auth.test.js
import assert from 'node:assert/strict'
import { normPhone, normEmail, normId, prettyId, passwordProblem, hashPassword, newCode, accounts, TEST_CODE } from './auth.js'

assert.equal(normPhone('+7 (900) 000-00-01'), '+79000000001')
assert.equal(normPhone('8 900 000 00 01'), '+79000000001')
assert.equal(normPhone('9000000001'), '+79000000001')
assert.equal(normPhone('12345'), null)
assert.equal(normEmail('  Anna@Mail.RU '), 'anna@mail.ru')
assert.equal(normEmail('anna@mail'), null)
assert.equal(normId('anna@mail.ru'), 'anna@mail.ru')
assert.equal(normId('+79000000001'), '+79000000001')
assert.equal(prettyId('+79000000001'), '+7 900 000-00-01')

assert.ok(passwordProblem('short1'))
assert.ok(passwordProblem('onlyletters'))
assert.ok(passwordProblem('1234567!'), 'знаки препинания — не буквы')
assert.equal(passwordProblem('пароль2026'), '')
assert.equal(passwordProblem('nitka2026'), '')

assert.equal(newCode('+79000000001'), TEST_CODE)
assert.match(newCode('+79991234567'), /^\d{6}$/)

assert.equal(await hashPassword('nitka2026', 'salt'), await hashPassword('nitka2026', 'salt'))
assert.notEqual(await hashPassword('nitka2026', 'salt'), await hashPassword('nitka2026', 'other'))

const mem = new Map(), storage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) }
const acc = accounts(storage)
assert.equal(acc.exists('anna@mail.ru'), false)
await acc.create('anna@mail.ru', 'Анна', 'nitka2026')
assert.equal(acc.exists('anna@mail.ru'), true)
assert.ok(!mem.get('nitka-users').includes('nitka2026'), 'пароль не хранится открытым текстом')
assert.deepEqual(await acc.check('anna@mail.ru', 'nitka2026'), { id: 'anna@mail.ru', name: 'Анна' })
assert.equal(await acc.check('anna@mail.ru', 'wrong2026'), null)
assert.equal(await acc.check('nobody@mail.ru', 'nitka2026'), null)

console.log('auth: все проверки пройдены')
