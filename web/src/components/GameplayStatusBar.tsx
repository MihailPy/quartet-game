import type { GameplayStatusBarViewModel } from '../gameplay/types'

type GameplayStatusBarProps = {
  model: GameplayStatusBarViewModel
  onCopyRoomID: () => void
  onLeaveRoom: () => void
}

export function GameplayStatusBar({
  model,
  onCopyRoomID,
  onLeaveRoom,
}: GameplayStatusBarProps) {
  const connectionClassName = [
    'gameplay-status-bar__connection',
    `gameplay-status-bar__connection--${model.connection.status}`,
    model.connection.isProblem
      ? 'gameplay-status-bar__connection--problem'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="gameplay-status-bar">
      <div className="gameplay-status-bar__room">
        <span className="gameplay-status-bar__label">
          Комната
        </span>

        <code className="gameplay-status-bar__room-id">
          {model.roomID}
        </code>

        <button
          className="secondary-button gameplay-status-bar__copy"
          type="button"
          onClick={onCopyRoomID}
        >
          Копировать
        </button>
      </div>

      <div className="gameplay-status-bar__state">
        <span className="gameplay-status-bar__phase">
          {model.phaseLabel}
        </span>

        <span className={connectionClassName}>
          <span
            className="gameplay-status-bar__connection-dot"
            aria-hidden="true"
          />

          {model.connection.label}
        </span>
      </div>

      <button
        className="secondary-button gameplay-status-bar__leave"
        type="button"
        onClick={onLeaveRoom}
      >
        Выйти
      </button>
    </div>
  )
}
