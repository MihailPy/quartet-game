type GameplayPlayerCardProps = {
  playerID: string
  name: string
  cardCount: number
  completedQuartetsCount: number
  isCurrentTurn: boolean
  onClick?: (playerID: string) => void
}

export function GameplayPlayerCard({
  playerID,
  name,
  cardCount,
  completedQuartetsCount,
  isCurrentTurn,
  onClick,
}: GameplayPlayerCardProps) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?'

  return (
    <button
      className={
        isCurrentTurn
          ? 'gameplay-player-card gameplay-player-card--current-turn'
          : 'gameplay-player-card'
      }
      type="button"
      onClick={() => onClick?.(playerID)}
    >
      <span className="gameplay-player-card__avatar">
        {initials}
      </span>

      <span className="gameplay-player-card__content">
        <strong className="gameplay-player-card__name">
          {name}
        </strong>

        <span className="gameplay-player-card__stats">
          <span>{cardCount} карт</span>
          <span>{completedQuartetsCount} квартетов</span>
        </span>
      </span>

      {isCurrentTurn && (
        <span className="gameplay-player-card__turn">
          Ход
        </span>
      )}
    </button>
  )
}
