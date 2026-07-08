type DeckEditorProps = {
  onClose: () => void
}

export function DeckEditor({ onClose }: DeckEditorProps) {
  return (
    <div className="modal-backdrop">
      <section className="deck-editor-modal">
        <header className="deck-editor-header">
          <h2>Редактор колоды</h2>

          <button className="button secondary" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div className="deck-editor-content">
          <p>Редактор колоды появится на следующих задачах.</p>
        </div>
      </section>
    </div>
  )
}
