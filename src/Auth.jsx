import { useEffect, useState } from 'react'
import { accounts, normId, normPhone, normEmail, prettyId, passwordProblem, newCode, CODE_TTL, MAX_TRIES, TEST_IDS } from './auth.js'

const acc = accounts(window.localStorage)

export default function Auth({ onLogin, close, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode) // login | register | verify
  const [via, setVia] = useState('phone')        // как подтверждать регистрацию
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null)   // { id, name, password, code, expires, tries, sentAt }
  const [now, setNow] = useState(Date.now())

  useEffect(() => { // таймер для «Отправить ещё раз»
    if (mode !== 'verify') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [mode])

  const switchTo = m => { setMode(m); setError('') }

  const login = async e => {
    e.preventDefault()
    const { login, password } = e.target.elements
    const id = normId(login.value)
    if (!id) return setError('Введите телефон в формате +7 900 000-00-00 или почту')
    setBusy(true)
    const user = await acc.check(id, password.value)
    setBusy(false)
    user ? onLogin(user) : setError('Неверный телефон, почта или пароль')
  }

  const sendCode = (data) => {
    const code = newCode(data.id)
    setPending({ ...data, code, expires: Date.now() + CODE_TTL, tries: 0, sentAt: Date.now() })
    setMode('verify'); setError('')
  }

  const register = e => {
    e.preventDefault()
    const f = e.target.elements
    const name = f.name.value.trim()
    const id = via === 'phone' ? normPhone(f.contact.value) : normEmail(f.contact.value)
    if (!name) return setError('Укажите имя')
    if (!id) return setError(via === 'phone' ? 'Телефон в формате +7 900 000-00-00' : 'Проверьте адрес почты')
    if (acc.exists(id)) return setError('Такой аккаунт уже есть — войдите')
    const problem = passwordProblem(f.password.value)
    if (problem) return setError(problem)
    if (f.password.value !== f.password2.value) return setError('Пароли не совпадают')
    if (!f.consent.checked) return setError('Нужно согласие на обработку персональных данных')
    sendCode({ id, name, password: f.password.value })
  }

  const verify = async e => {
    e.preventDefault()
    const code = e.target.elements.code.value.trim()
    if (Date.now() > pending.expires) return setError('Код устарел — отправьте новый')
    if (pending.tries >= MAX_TRIES) return setError('Слишком много попыток — отправьте новый код')
    if (code !== pending.code) {
      setPending({ ...pending, tries: pending.tries + 1 })
      return setError(`Неверный код. Осталось попыток: ${MAX_TRIES - pending.tries - 1}`)
    }
    setBusy(true)
    const user = await acc.create(pending.id, pending.name, pending.password)
    setBusy(false)
    onLogin(user, true)
  }

  const resendIn = pending ? Math.max(0, 30 - Math.floor((now - pending.sentAt) / 1000)) : 0

  return (
    <div className="modal-scrim" onClick={e => e.target === e.currentTarget && close()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="drawer-head">
          <h2 id="auth-title">{mode === 'verify' ? 'Подтверждение' : mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
          <button type="button" className="icon-btn" aria-label="Закрыть" onClick={close}>✕</button>
        </div>

        {mode !== 'verify' && (
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={mode === 'login'} onClick={() => switchTo('login')}>Вход</button>
            <button role="tab" aria-selected={mode === 'register'} onClick={() => switchTo('register')}>Регистрация</button>
          </div>
        )}

        {mode === 'login' && (
          <form className="form" onSubmit={login} noValidate>
            <label htmlFor="auth-login">Телефон или почта</label>
            <input id="auth-login" name="login" required autoComplete="username" placeholder="+7 900 000-00-00 или you@mail.ru" autoFocus />
            <label htmlFor="auth-password">Пароль</label>
            <input id="auth-password" name="password" type="password" required autoComplete="current-password" />
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn btn-main" type="submit" disabled={busy}>{busy ? 'Проверяем…' : 'Войти'}</button>
            <p className="muted small">Нет аккаунта? <button type="button" className="link" onClick={() => switchTo('register')}>Зарегистрироваться</button></p>
          </form>
        )}

        {mode === 'register' && (
          <form className="form" onSubmit={register} noValidate>
            <label htmlFor="reg-name">Имя</label>
            <input id="reg-name" name="name" required autoComplete="given-name" autoFocus defaultValue={pending?.name} />
            <span className="label">Подтвердить через</span>
            <div className="segmented" role="radiogroup" aria-label="Способ подтверждения">
              <button type="button" role="radio" aria-checked={via === 'phone'} onClick={() => { setVia('phone'); setError('') }}>Телефон</button>
              <button type="button" role="radio" aria-checked={via === 'email'} onClick={() => { setVia('email'); setError('') }}>Почту</button>
            </div>
            <label htmlFor="reg-contact">{via === 'phone' ? 'Телефон' : 'Почта'}</label>
            <input id="reg-contact" key={via} name="contact" required
              type={via === 'phone' ? 'tel' : 'email'} inputMode={via === 'phone' ? 'tel' : 'email'}
              autoComplete={via === 'phone' ? 'tel' : 'email'} placeholder={via === 'phone' ? '+7 900 000-00-00' : 'you@mail.ru'}
              defaultValue={pending && pending.id.includes('@') === (via === 'email') ? pending.id : undefined} />
            <label htmlFor="reg-password">Пароль</label>
            <input id="reg-password" name="password" type="password" required autoComplete="new-password" aria-describedby="reg-hint" defaultValue={pending?.password} />
            <small id="reg-hint" className="muted small">Не короче 8 символов, буквы и цифры</small>
            <label htmlFor="reg-password2">Повторите пароль</label>
            <input id="reg-password2" name="password2" type="password" required autoComplete="new-password" defaultValue={pending?.password} />
            <label className="check"><input type="checkbox" name="consent" defaultChecked={Boolean(pending)} /> Согласен на обработку персональных данных</label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn btn-main" type="submit">Получить код</button>
          </form>
        )}

        {mode === 'verify' && pending && (
          <form className="form" onSubmit={verify} noValidate>
            <p>Код отправлен на <b>{prettyId(pending.id)}</b>. Он действует 5 минут.</p>
            <div className="test-inbox" role="note">
              <b>Тестовый режим</b>
              {TEST_IDS.includes(pending.id) ? 'Тестовый аккаунт — код всегда ' : 'SMS и письма пока не отправляются. Ваш код: '}
              <code>{pending.code}</code>
            </div>
            <label htmlFor="verify-code">Код из {pending.id.includes('@') ? 'письма' : 'SMS'}</label>
            <input id="verify-code" key={pending.sentAt} name="code" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" autoFocus />
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn btn-main" type="submit" disabled={busy}>{busy ? 'Создаём аккаунт…' : 'Подтвердить'}</button>
            <div className="row-between small">
              <button type="button" className="link" disabled={resendIn > 0} onClick={() => sendCode(pending)}>
                {resendIn > 0 ? `Отправить снова через ${resendIn} с` : 'Отправить код снова'}
              </button>
              <button type="button" className="link" onClick={() => switchTo('register')}>Изменить данные</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
