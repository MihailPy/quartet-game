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
        records.map((record) => (
          <div key={record.id} className="form-block">
            <p>Комната: {record.room_id}</p>
            <p>Мой счёт: {record.score}</p>
            <p>Счёт победителя: {record.winner_score}</p>
            <p>Победитель: {record.winner_player_name || 'Неизвестно'}</p>
            <p>Длительность: {formatDuration(record.duration_seconds)}</p>
            <p>Дата: {new Date(record.created_at).toLocaleString()}</p>
          </div>
        ))
      )}

      <button className="button" type="button" onClick={onBack}>
        Назад
      </button>
    </div>
  )
}
