import type { Deck } from '../types'

type DeckEditorProps = {
  deck: Deck | null
  onClose: () => void
}

export function DeckEditor({ deck, onClose }: DeckEditorProps) {
  return (
    <div className="modal-backdrop">
      <section className="deck-editor-modal">
        <header className="deck-editor-header">
          <h2>Редактор колоды</h2>
          <p>Редактор колоды появится на следующих задачах.</p>

          <button className="button secondary" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div className="deck-editor-content">
          {!deck && <p>Колода пока не загружена.</p>}

          {deck && (
            <div className="deck-editor-quartets">
              {deck.Quartets.map((quartet) => (
                <button
                  className="deck-editor-quartet-button"
                  key={quartet.ID}
                  type="button"
                >
                  <strong>{quartet.Title}</strong>
                  <span>{quartet.Cards.length} карт</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
