import type { Quartet } from '../types'
import { CardImage } from './CardImage'

type QuartetsPanelProps = {
  userQuartets: Quartet[]
  quartetTitle: string
  quartetCards: string[]
  onQuartetTitleChange: (value: string) => void
  onQuartetCardsChange: (cards: string[]) => void
  onCreateUserQuartet: () => void
  onDeleteUserQuartet: (quartetID: string) => void
  editingQuartetID: string | null
  onStartEditQuartet: (quartet: Quartet) => void
  onSaveQuartetChanges: () => void
  onBack: () => void
}

export function QuartetsPanel({
  userQuartets,
  quartetTitle,
  quartetCards,
  onQuartetTitleChange,
  onQuartetCardsChange,
  onCreateUserQuartet,
  onDeleteUserQuartet,
  editingQuartetID,
  onStartEditQuartet,
  onSaveQuartetChanges,
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
          onClick={editingQuartetID ? onSaveQuartetChanges : onCreateUserQuartet}
        >
          {editingQuartetID ? 'Сохранить изменения' : 'Создать квартет'}
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

            <div className="quartet-cards-preview">
              {quartet.Cards.map((card) => (
                <div key={card.ID} className="quartet-card-preview">
                  <CardImage
                    imageUrl={card.ImageURL}
                    title={card.Title}
                  />

                  <span className="quartet-card-title">
                    {card.Title}
                  </span>
                </div>
              ))}
            </div>

            <button
              className="button secondary-button"
              type="button"
              onClick={() => onStartEditQuartet(quartet)}
            >
              Редактировать
            </button>
            <button
              className="button secondary-button"
              type="button"
              onClick={() => onDeleteUserQuartet(quartet.ID)}
            >
              Удалить
            </button>
          </div>
        ))
      )}

      <button className="button" type="button" onClick={onBack}>
        Назад
      </button>
    </div>
  )
}
