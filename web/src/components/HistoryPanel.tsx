import type { GameHistoryRecord } from '../types'

type HistoryPanelProps = {
  records: GameHistoryRecord[]
  onBack: () => void
}

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return 'Неизвестно'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds} сек.`
  }

  return `${minutes} мин. ${remainingSeconds} сек.`
}

export function HistoryPanel({
  records,
  onBack,
}: HistoryPanelProps) {
  return (
    <div className="panel">
      <h2>История игр</h2>

      {records.length === 0 ? (
        <p className="form-hint">История игр пока пуста.</p>
      ) : (
        records.map((record) => {
          const sortedResults = [...record.player_results].sort((left, right) => {
            if (left.score !== right.score) {
              return right.score - left.score
            }

            if (left.is_winner === right.is_winner) {
              return 0
            }

            return left.is_winner ? -1 : 1
          })

          return (
            <div key={record.id} className="form-block">
              <h3>Комната {record.room_id}</h3>

              <p>Дата: {new Date(record.created_at).toLocaleString()}</p>
              <p>Длительность: {formatDuration(record.duration_seconds)}</p>

              <div className="form-block">
                <h4>Результаты</h4>

                {sortedResults.map((result) => (
                  <div key={result.player_id} className="player-row">
                    <span>
                      {result.player_name}
                      {result.is_winner ? ' 🏆' : ''}
                    </span>

                    <span>{result.score} очков</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      <button className="button" type="button" onClick={onBack}>
        Назад
      </button>
    </div>
  )
}
