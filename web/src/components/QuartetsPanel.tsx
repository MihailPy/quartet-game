import type { Quartet } from '../types'

type QuartetsPanelProps = {
  userQuartets: Quartet[]
  onBack: () => void
}

export function QuartetsPanel({
  userQuartets,
  onBack,
}: QuartetsPanelProps) {
  return (
    <div className="panel">
      <h2>Мои квартеты</h2>

      {userQuartets.length === 0 ? (
        <p className="form-hint">Пока нет пользовательских квартетов.</p>
      ) : (
        userQuartets.map((quartet) => (
          <div key={quartet.ID} className="player-row">
            <span>{quartet.Title}</span>
            <span>{quartet.Cards.length} карт</span>
          </div>
        ))
      )}

      <button className="button" type="button" onClick={onBack}>
        Назад
      </button>
    </div>
  )
}
