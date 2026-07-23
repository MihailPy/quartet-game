import { PlayerHandPanel } from './PlayerHandPanel'
import type { Player, PlayerHandPayload, PrivateCard } from '../types'

type GameplayHandZoneProps = {
  isHandOpen: boolean
  player: Player | null
  playerHand: PlayerHandPayload | null
  getQuartetTitle: (quartetID: string) => string
  onToggleHand: () => void
  onCardPreview: (card: PrivateCard) => void
  selectedCardID: string
  onSelectCard: (cardID: string) => void
}

export function GameplayHandZone({
  isHandOpen,
  player,
  playerHand,
  getQuartetTitle,
  onToggleHand,
  onCardPreview,
  selectedCardID,
  onSelectCard,
}: GameplayHandZoneProps) {
  if (!playerHand) {
    return null
  }

  return (
    <div className={`gameplay-hand-zone ${isHandOpen ? 'hand-open' : 'hand-collapsed'}`}>
      <button className="hand-toggle-button" type="button" onClick={onToggleHand}>
        Моя рука ({playerHand.cards.length} карт)
        <span>{isHandOpen ? 'Свернуть' : 'Открыть'}</span>
      </button>

      {isHandOpen && (
        <PlayerHandPanel
          player={player}
          playerHand={playerHand}
          getQuartetTitle={getQuartetTitle}
          onCardPreview={onCardPreview}
          selectedCardID={selectedCardID}
          onSelectCard={onSelectCard}
        />
      )}
    </div>
  )
}
