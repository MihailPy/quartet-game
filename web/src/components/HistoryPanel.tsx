import type { GameHistoryRecord } from '../types'

type HistoryPanelProps = {
  records: GameHistoryRecord[]
  onBack: () => void
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
            <p>Очки: {record.score}</p>
            <p>{record.is_winner ? 'Победа' : 'Поражение'}</p>
            <p>{new Date(record.created_at).toLocaleString()}</p>
          </div>
        ))
      )}

      <button className="button" type="button" onClick={onBack}>
        Назад
      </button>
    </div>
  )
}
