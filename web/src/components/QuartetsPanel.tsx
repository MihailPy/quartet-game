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
  quartetCardImages: string[]
  onQuartetCardImagesChange: (images: string[]) => void
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
  quartetCardImages,
  onQuartetCardImagesChange,
  onBack,
}: QuartetsPanelProps) {
  return (
    <div className="panel">
      <div className="form-block">
        <h3>{editingQuartetID ? 'Редактировать квартет' : 'Создать квартет'}</h3>
        <p className="form-hint">
          {editingQuartetID
            ? 'Измени название квартета или названия карт.'
            : 'Добавь название квартета и 4 карты.'}
        </p>

        <input
          className="input"
          type="text"
          value={quartetTitle}
          onChange={(event) => onQuartetTitleChange(event.target.value)}
          placeholder="Название квартета"
        />

        {quartetCards.map((card, index) => (
          <div key={index} className="quartet-card-form-row">
            <CardImage
              imageUrl={quartetCardImages[index]}
              title={card || `Карта ${index + 1}`}
              className="quartet-card-form-image"
            />

            <input
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

            <input
              className="input"
              type="text"
              value={quartetCardImages[index]}
              onChange={(event) => {
                const nextImages = [...quartetCardImages]
                nextImages[index] = event.target.value
                onQuartetCardImagesChange(nextImages)
              }}
              placeholder={`Изображение карты ${index + 1}`}
            />
          </div>
        ))}

        <button
          className="button secondary-button"
          type="button"
          onClick={editingQuartetID ? onSaveQuartetChanges : onCreateUserQuartet}
        >
          {editingQuartetID ? 'Сохранить изменения' : 'Создать квартет'}
        </button>
      </div>

      <p className="form-hint">
        Здесь можно редактировать названия карт и изображения пользовательских квартетов.
      </p>

      <h2>Мои квартеты</h2>

      {userQuartets.length === 0 ? (
        <div className="quartets-empty-state">
          <h3>Пока нет пользовательских квартетов</h3>
          <p>Создай первый квартет выше. Он появится в этом списке.</p>
        </div>
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
