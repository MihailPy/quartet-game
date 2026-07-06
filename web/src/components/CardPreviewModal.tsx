import type { PrivateCard } from '../types'

type CardPreviewModalProps = {
  card: PrivateCard
  getQuartetTitle: (quartetID: string) => string
  onClose: () => void
}

export function CardPreviewModal({
  card,
  getQuartetTitle,
  onClose,
}: CardPreviewModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card-preview-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="card-preview-art">
          <span>🂠</span>
        </div>

        <div className="card-preview-content">
          <p className="card-preview-kvartet">
            {getQuartetTitle(card.quartet_id)}
          </p>

          <h2>{card.title}</h2>

          <small>{card.id}</small>
        </div>

        <button className="button" type="button" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}
