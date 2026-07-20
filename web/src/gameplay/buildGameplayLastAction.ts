import type { GameEvent } from '../types'
import type {
  GameplayLastActionType,
  GameplayLastActionViewModel
} from './types'

type BuildGameplayLastActionOptions = {
  getPlayerName: (playerID: string) => string
  getQuartetTitle: (quartetID: string) => string
}

function getPayloadString(
  event: GameEvent,
  key: string,
): string | undefined {
  const value = event.payload[key]

  return typeof value === 'string' && value.trim()
    ? value
    : undefined
}

function normalizeEventType(
  event: GameEvent,
): GameplayLastActionType | null {
  switch (event.type) {
    case 'game_started':
      return 'game-started'

    case 'turn_changed':
      return 'turn-changed'

    case 'card_request_succeeded':
      return 'card-request-succeeded'

    case 'card_request_failed':
      return 'card-request-failed'

    case 'quartet_completed':
      return 'quartet-completed'

    case 'game_finished':
      return 'game-finished'

    default:
      return null
  }
}

export function buildGameplayLastAction(
  event: GameEvent,
  {
    getPlayerName,
    getQuartetTitle,
  }: BuildGameplayLastActionOptions,
): GameplayLastActionViewModel | null {
  const type = normalizeEventType(event)

  if (!type) {
    return null
  }

  const actorName = event.actor_id
    ? getPlayerName(event.actor_id)
    : ''

  const targetName = event.target_id
    ? getPlayerName(event.target_id)
    : ''

  const cardTitle =
    getPayloadString(event, 'card_title') ??
    getPayloadString(event, 'requested_card_title')

  const quartetID =
    getPayloadString(event, 'quartet_id')

  const quartetTitle = quartetID
    ? getQuartetTitle(quartetID)
    : undefined

  switch (type) {
    case 'game-started':
      return {
        type,
        text: 'Игра началась.',
        createdAt: event.created_at,
      }

    case 'turn-changed':
      return {
        type,
        actorID: event.actor_id || undefined,
        text: actorName
          ? `Ход перешёл к игроку ${actorName}.`
          : 'Ход перешёл к следующему игроку.',
        createdAt: event.created_at,
      }

    case 'card-request-succeeded':
      return {
        type,
        actorID: event.actor_id || undefined,
        targetID: event.target_id || undefined,
        cardTitle,
        text:
          actorName && targetName && cardTitle
            ? `${actorName} получил карту «${cardTitle}» у игрока ${targetName}.`
            : cardTitle
              ? `Запрос карты «${cardTitle}» успешен.`
              : 'Запрос карты успешен.',
        createdAt: event.created_at,
      }

    case 'card-request-failed':
      return {
        type,
        actorID: event.actor_id || undefined,
        targetID: event.target_id || undefined,
        cardTitle,
        text:
          actorName && targetName && cardTitle
            ? `У игрока ${targetName} не оказалось карты «${cardTitle}», запрошенной игроком ${actorName}.`
            : cardTitle
              ? `Карты «${cardTitle}» у выбранного игрока нет.`
              : 'Запрос карты не удался.',
        createdAt: event.created_at,
      }

    case 'quartet-completed':
      return {
        type,
        actorID: event.actor_id || undefined,
        quartetTitle,
        text:
          actorName && quartetTitle
            ? `${actorName} собрал квартет «${quartetTitle}».`
            : actorName
              ? `${actorName} собрал квартет.`
              : 'Игрок собрал квартет.',
        createdAt: event.created_at,
      }

    case 'game-finished':
      return {
        type,
        text: 'Игра завершена.',
        createdAt: event.created_at,
      }
  }
}
