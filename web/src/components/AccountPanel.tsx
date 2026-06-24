import type { User } from '../types'

type AccountPanelProps = {
  user: User | null
  recoveryCode: string
  onRecoveryCodeChange: (value: string) => void
  onCreateUser: () => void
  onLoginUser: () => void
  onLogoutUser: () => void
  onBack: () => void
  accountPlayerName: string
  onAccountPlayerNameChange: (value: string) => void
}

export function AccountPanel({
  user,
  recoveryCode,
  onRecoveryCodeChange,
  onCreateUser,
  onLoginUser,
  onLogoutUser,
  onBack,
  accountPlayerName,
  onAccountPlayerNameChange,
}: AccountPanelProps) {
  return (
    <div className="panel">
      <h2>Аккаунт</h2>

      {user ? (
        <>
          <p className="form-hint">Аккаунт: {user.player_name}</p>

          <div className="form-block">
            <h3>Код восстановления</h3>

            <p className="form-hint">
              Сохрани этот код. Он нужен, чтобы войти в аккаунт после выхода или на другом устройстве.
            </p>

            <div className="player-row">
              <input
                className="input"
                value={user.recovery_code}
                readOnly
              />
            </div>
          </div>

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
          <input
            className="input"
            type="text"
            value={accountPlayerName}
            onChange={(event) => onAccountPlayerNameChange(event.target.value)}
            placeholder="Имя игрока"
          />
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
