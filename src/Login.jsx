import { useState } from 'react'

// shortcut: вход только в браузере (имя хранится в localStorage, пароль никуда не уходит), для настоящих аккаунтов нужен сервер
export default function Login({ onLogin, close }) {
  const [error, setError] = useState('')

  const submit = e => {
    e.preventDefault()
    const { email, password } = e.target.elements
    if (password.value.length < 6) return setError('Пароль должен быть не короче 6 символов')
    onLogin({ email: email.value, name: email.value.split('@')[0] })
  }

  return (
    <div className="modal-scrim" onClick={e => e.target === e.currentTarget && close()}>
      <form className="modal" onSubmit={submit} aria-labelledby="login-title">
        <div className="drawer-head">
          <h2 id="login-title">Вход</h2>
          <button type="button" className="icon-btn" aria-label="Закрыть" onClick={close}>✕</button>
        </div>
        <p className="muted">Войдите, чтобы оформить заказ и видеть свою корзину.</p>
        <label htmlFor="login-email">Почта</label>
        <input id="login-email" name="email" type="email" required autoComplete="email" placeholder="you@mail.ru" autoFocus />
        <label htmlFor="login-password">Пароль</label>
        <input id="login-password" name="password" type="password" required autoComplete="current-password" onChange={() => setError('')} />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-main" type="submit">Войти</button>
        <small className="muted">Демо: аккаунт создаётся при первом входе и хранится только в этом браузере.</small>
      </form>
    </div>
  )
}
