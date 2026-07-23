import type { GameplayHandCardSlotViewModel } from '../types'
import { CardImage } from './CardImage'

type GameplayCardSlotProps = {
  slot: GameplayHandCardSlotViewModel
}

export function GameplayCardSlot({
  slot,
}: GameplayCardSlotProps) {
  return (
    <div
      className={
        slot.ownership === 'owned'
          ? 'gameplay-card-slot gameplay-card-slot-owned'
          : 'gameplay-card-slot gameplay-card-slot-missing'
      }
    >
      <CardImage
        imageUrl={slot.imageURL}
        title={slot.title}
      />

      <strong>{slot.title}</strong>

      {slot.ownership === 'missing' && (
        <span>
          Нужно получить
        </span>
      )}

      {slot.disabledReason && (
        <small>
          {slot.disabledReason}
        </small>
      )}
    </div>
  )
}
