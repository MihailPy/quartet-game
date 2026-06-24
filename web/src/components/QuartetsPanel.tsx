import type { Quartet } from '../types'

type QuartetsPanelProps = {
  userQuartets: Quartet[]
  quartetTitle: string
  quartetCards: string[]
  onQuartetTitleChange: (value: string) => void
  onQuartetCardsChange: (cards: string[]) => void
  onCreateUserQuartet: () => void
  onBack: () => void
}

export function QuartetsPanel({
  userQuartets,
  quartetTitle,
  quartetCards,
  onQuartetTitleChange,
  onQuartetCardsChange,
  onCreateUserQuartet,
  onBack,
}: QuartetsPanelProps) {
  return (
    <div className="panel">
      <div className="form-block">
        <h3>Создать квартет</h3>

        <input
          className="input"
          type="text"
          value={quartetTitle}
          onChange={(event) => onQuartetTitleChange(event.target.value)}
          placeholder="Название квартета"
        />

        {quartetCards.map((card, index) => (
          <input
            key={index}
            className="input"
            type="text"
            value={card}
            onChange={(event) => {
              const nextCards = [...quartetCards]
              nextCards[index] = event.target.value
              onQuartetCardsChange(nextCards)
            }}
            placeholder={`Карта ${index + 1}`}
          />
        ))}

        <button
          className="button secondary-button"
          type="button"
          onClick={onCreateUserQuartet}
        >
          Создать квартет
        </button>
      </div>

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
