import type { PublicGamePlayer } from '../types'

type PlayerDetailsModalProps = {
  player: PublicGamePlayer
  isCurrentTurn: boolean
  completedQuartetsCount: number
  onClose: () => void
}

export function PlayerDetailsModal({
  player,
  isCurrentTurn,
  completedQuartetsCount,
  onClose,
}: PlayerDetailsModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="player-details-modal" onClick={(event) => event.stopPropagation()}>
        <div className="player-seat-avatar">
          {player.name.charAt(0).toUpperCase()}
        </div>

        <h2>{player.name}</h2>

        <p>Карт в руке: {player.card_count}</p>
        <p>Собрано квартетов: {completedQuartetsCount}</p>
        <p>{isCurrentTurn ? 'Сейчас ходит' : 'Ожидает ход'}</p>

        <button className="button" type="button" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}
