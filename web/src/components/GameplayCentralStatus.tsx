import type {
  GameplayCentralStatusViewModel,
  GameplayResultViewModel,
} from '../gameplay/types'

type GameplayCentralStatusProps = {
  model: GameplayCentralStatusViewModel
  result: GameplayResultViewModel | null
}

export function GameplayCentralStatus({
  model,
  result,
}: GameplayCentralStatusProps) {
  return (
    <section
      className={[
        'gameplay-central-status',
        `gameplay-central-status--${model.tone}`,
      ].join(' ')}
    >
      <span className="gameplay-central-status__eyebrow">
        {model.eyebrow}
      </span>

      <h2 className="gameplay-central-status__title">
        {model.title}
      </h2>

      {model.description && (
        <p className="gameplay-central-status__description">
          {model.description}
        </p>
      )}

      {model.lastAction && (
        <div className="gameplay-central-status__last-action">
          <span>Последнее действие</span>
          <strong>{model.lastAction.text}</strong>
        </div>
      )}

      {result && (
        <div className="gameplay-central-status__result">
          <strong>
            {result.currentPlayerWon
              ? 'Ты победил'
              : result.winnerNames.length > 1
                ? `Победители: ${result.winnerNames.join(', ')}`
                : `Победитель: ${result.winnerNames[0] ?? 'не определён'}`}
          </strong>

          {result.currentPlayerScore !== null && (
            <span>
              Твой результат: {result.currentPlayerScore} квартетов
            </span>
          )}

          <div className="gameplay-central-status__scores">
            {result.scores.map((score) => (
              <div
                className={
                  score.isWinner
                    ? 'gameplay-central-status__score gameplay-central-status__score--winner'
                    : 'gameplay-central-status__score'
                }
                key={score.playerID}
              >
                <span>{score.playerName}</span>
                <strong>{score.score}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
