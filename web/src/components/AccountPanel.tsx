import type { User } from '../types'

type AccountPanelProps = {
  user: User | null
  recoveryCode: string
  onRecoveryCodeChange: (value: string) => void
  onCreateUser: () => void
  onLoginUser: () => void
  onLogoutUser: () => void
  onBack: () => void
}

export function AccountPanel({
  user,
  recoveryCode,
  onRecoveryCodeChange,
  onCreateUser,
  onLoginUser,
  onLogoutUser,
  onBack,
}: AccountPanelProps) {
  return (
    <div className="panel">
      <h2>Аккаунт</h2>

      {user ? (
        <>
          <p className="form-hint">Аккаунт: {user.player_name}</p>

          <p className="form-hint">
            Код восстановления: {user.recovery_code}
          </p>

          <button
            className="button secondary-button"
            type="button"
            onClick={onLogoutUser}
          >
            Выйти из аккаунта
          </button>
        </>
      ) : (
        <>
          <button
            className="button secondary-button"
            type="button"
            onClick={onCreateUser}
          >
            Создать аккаунт
          </button>

          <div className="form-row">
            <input
              className="input"
              type="text"
              value={recoveryCode}
              onChange={(event) => onRecoveryCodeChange(event.target.value)}
              placeholder="Код восстановления"
            />

            <button
              className="button secondary-button"
              type="button"
              onClick={onLoginUser}
            >
              Войти
            </button>
          </div>
        </>
      )}

      <button className="button" type="button" onClick={onBack}>
        Назад
      </button>
    </div>
  )
}
