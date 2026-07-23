import type {
  Deck,
  GameplayHandCardSlotViewModel,
  GameplayHandQuartetViewModel,
  PlayerHandPayload,
  RequestableCard,
} from '../types'

type BuildGameplayHandModelParams = {
  deck: Deck
  playerHand: PlayerHandPayload
  availableRequestCards: RequestableCard[]
  canRequestCard: boolean
}

export function buildGameplayHandModel({
  deck,
  playerHand,
  availableRequestCards,
  canRequestCard,
}: BuildGameplayHandModelParams): GameplayHandQuartetViewModel[] {
  const ownedCardIDs = new Set(
    playerHand.cards.map((card) => card.id),
  )

  const requestableCardIDs = new Set(
    availableRequestCards.map((card) => card.id),
  )

  return deck.Quartets.map((quartet) => {
    const slots: GameplayHandCardSlotViewModel[] =
      quartet.Cards.map((card) => {
        const isOwned = ownedCardIDs.has(card.ID)

        const isRequestable =
          requestableCardIDs.has(card.ID)

        return {
          cardID: card.ID,
          quartetID: quartet.ID,
          title: card.Title,
          imageURL: card.ImageURL,
          ownership: isOwned ? 'owned' : 'missing',
          isSelectable:
            !isOwned &&
            canRequestCard &&
            isRequestable,
          disabledReason:
            isOwned
              ? 'Карта уже есть в руке'
              : !canRequestCard
                ? 'Сейчас нельзя запросить карту'
                : !isRequestable
                  ? 'Карта недоступна для запроса'
                  : undefined,
        }
      })

    const ownedCount = slots.filter(
      (slot) => slot.ownership === 'owned',
    ).length

    return {
      quartetID: quartet.ID,
      title: quartet.Title,
      ownedCount,
      totalCount: quartet.Cards.length,
      isCompleted: ownedCount === quartet.Cards.length,
      slots,
    }
  })
}
