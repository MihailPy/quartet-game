import type { GameplayHandQuartetViewModel } from '../types'
import { GameplayCardSlot } from './GameplayCardSlot'

type GameplayQuartetCardProps = {
  quartet: GameplayHandQuartetViewModel
}

export function GameplayQuartetCard({
  quartet,
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
            key={slot.cardID}
            slot={slot}
          />
        ))}
      </div>
    </section>
  )
}
