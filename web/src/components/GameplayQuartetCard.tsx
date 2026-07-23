import type { GameplayHandQuartetViewModel } from '../types'
import { GameplayCardSlot } from './GameplayCardSlot'

type GameplayQuartetCardProps = {
  quartet: GameplayHandQuartetViewModel
  selectedCardID: string
  onSelectCard: (cardID: string) => void
}

export function GameplayQuartetCard({
  quartet,
  selectedCardID,
  onSelectCard,
}: GameplayQuartetCardProps) {
  return (
    <section className="gameplay-quartet-card">
      <header>
        <h3>{quartet.title}</h3>

        <span>
          {quartet.ownedCount} / {quartet.totalCount}
        </span>
      </header>

      {quartet.isCompleted && (
        <p>
          Квартет собран
        </p>
      )}

      <div className="gameplay-quartet-slots">
        {quartet.slots.map((slot) => (
          <GameplayCardSlot
            slot={slot}
            isSelected={slot.cardID === selectedCardID}
            onSelect={onSelectCard}
          />
        ))}
      </div>
    </section>
  )
}
