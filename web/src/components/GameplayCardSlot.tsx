import type { GameplayHandCardSlotViewModel } from '../types'
import { CardImage } from './CardImage'

type GameplayCardSlotProps = {
  slot: GameplayHandCardSlotViewModel
  isSelected: boolean
  onSelect: (cardID: string) => void
}

export function GameplayCardSlot({
  slot,
  isSelected,
  onSelect,
}: GameplayCardSlotProps) {
  return (
    <div
      className={
        slot.ownership === 'owned'
          ? 'gameplay-card-slot gameplay-card-slot-owned'
          : 'gameplay-card-slot gameplay-card-slot-missing'
      }
    >
      {slot.ownership === 'missing' ? (
        <button
          type="button"
          disabled={!slot.isSelectable}
          className={
            isSelected
              ? 'gameplay-card-slot selected'
              : 'gameplay-card-slot'
          }
          onClick={() => onSelect(slot.cardID)}
        >
          <CardImage
            imageUrl={slot.imageURL}
            title={slot.title}
          />

          <strong>{slot.title}</strong>
        </button>
      ) : (
        <div className="gameplay-card-slot">
          <CardImage
            imageUrl={slot.imageURL}
            title={slot.title}
          />

          <strong>{slot.title}</strong>
        </div>
      )}
    </div>
  )
}
