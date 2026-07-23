import type { GameplayHandQuartetViewModel, Player, PlayerHandPayload, PrivateCard } from '../types'
import { PlayerHandPanel } from './PlayerHandPanel'
import { GameplayQuartetCard } from './GameplayQuartetCard'

type GameplayHandZoneProps = {
  isHandOpen: boolean
  player: Player | null
  playerHand: PlayerHandPayload | null
  getQuartetTitle: (quartetID: string) => string
  onToggleHand: () => void
  onCardPreview: (card: PrivateCard) => void
  selectedCardID: string
  onSelectCard: (cardID: string) => void
  gameplayHandModel: GameplayHandQuartetViewModel[]
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
  gameplayHandModel,
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
      {gameplayHandModel.map((quartet) => (
        <GameplayQuartetCard
          key={quartet.quartetID}
          quartet={quartet}
          selectedCardID={selectedCardID}
          onSelectCard={onSelectCard}
        />
      ))}
    </div>
  )
}
