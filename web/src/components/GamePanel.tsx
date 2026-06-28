import type {
  GameFinishedPayload,
  Player,
  PublicGameState,
  Room,
  RequestableCard,
  TemporaryMessage,
} from '../types'

type GamePanelProps = {
  room: Room | null
  player: Player | null
  publicGameState: PublicGameState | null
  currentTurnPlayerID: string
  temporaryMessages: TemporaryMessage[]
  gameFinished: GameFinishedPayload | null
  socketStatus: string
  targetPlayerID: string
  selectedCardID: string
  availableRequestCards: RequestableCard[]
  availableRequestCardsByQuartet: Record<string, RequestableCard[]>
  onTargetPlayerIDChange: (value: string) => void
  onSelectedCardIDChange: (value: string) => void
  onRequestCard: () => void
  onStartGame: () => void
  isRoomOwner: boolean
  canStartGame: boolean
  getPlayerName: (playerID: string) => string
  canRequestCard: () => boolean
  getRequestButtonText: () => string
  isStartingGame: boolean
  completedQuartets: {
    playerID: string
    playerName: string
    quartetID: string
    quartetTitle: string
  }[]
}

function getSocketStatusLabel(status: string): string {
  if (status === 'connected') {
    return 'подключено'
  }

  if (status === 'connecting') {
    return 'подключение...'
  }

  if (status === 'reconnecting') {
    return 'переподключение...'
  }

  if (status === 'error') {
    return 'ошибка подключения'
  }

  return 'отключено'
}

export function GamePanel({
  room,
  player,
  publicGameState,
  currentTurnPlayerID,
  temporaryMessages,
  gameFinished,
  socketStatus,
  targetPlayerID,
  selectedCardID,
  availableRequestCards,
  availableRequestCardsByQuartet,
  onTargetPlayerIDChange,
  onSelectedCardIDChange,
  onRequestCard,
  onStartGame,
  isRoomOwner,
  canStartGame,
  getPlayerName,
  canRequestCard,
  getRequestButtonText,
  completedQuartets,
  isStartingGame,
}: GamePanelProps) {

  const requestTargetPlayers =
    publicGameState?.players.filter(
      (gamePlayer) =>
        gamePlayer.id !== player?.id && gamePlayer.card_count > 0,
    ) ?? []

  const isCurrentPlayerTurn = player !== null && currentTurnPlayerID === player.id
  const turnPlayerID = currentTurnPlayerID || publicGameState?.current_player_id || ''
  const turnPlayerName = turnPlayerID ? getPlayerName(turnPlayerID) : ''

  const hasAvailableRequestCards = availableRequestCards.length > 0
  const hasRequestTargetPlayers = requestTargetPlayers.length > 0

  const currentPlayerCannotRequest =
    isCurrentPlayerTurn &&
    gameFinished === null &&
    socketStatus === 'connected' &&
    (!hasAvailableRequestCards || !hasRequestTargetPlayers)

  const winnerNames =
    gameFinished?.winners.map(getPlayerName).join(', ') ?? ''

  const winnerLabel =
    gameFinished && gameFinished.winners.length > 1
      ? 'Победители'
      : 'Победитель'

  const sortedFinalScores =
    gameFinished?.scores
      .slice()
      .sort((firstScore, secondScore) => secondScore.score - firstScore.score) ?? []

  return (
    <div className="panel">
      <h2>Игра</h2>

      <div className={`connection-status connection-status-${socketStatus}`}>
        Соединение: {getSocketStatusLabel(socketStatus)}
      </div>

      {room && player && room.status !== 'playing' && (
        <div className="start-game-block">
          <button
            className="button"
            onClick={onStartGame}
            disabled={!canStartGame || isStartingGame}
          >
            {isStartingGame
              ? 'Начинаем игру...'
              : canStartGame
                ? 'Старт игры'
                : 'Старт игры недоступен'}
          </button>

          {!isRoomOwner && (
            <p className="form-hint">
              Стартовать может только владелец комнаты.
            </p>
          )}

          {isRoomOwner && room.players.length < 2 && (
            <p className="form-hint">
              Для старта нужно минимум два игрока.
            </p>
          )}

          {isRoomOwner &&
            room.players.length >= 2 &&
            !room.players.every((roomPlayer) => roomPlayer.is_ready) && (
              <p className="form-hint">
                Для старта все игроки должны быть готовы.
              </p>
            )}
        </div>
      )}

      {!publicGameState && room?.status !== 'playing' && (
        <p>Игра ещё не началась.</p>
      )}

      {!publicGameState && room?.status === 'playing' && (
        <p className="form-hint">
          Игра была начата, но состояние игры не восстановлено. Возможно,
          backend был перезапущен.
        </p>
      )}

      {publicGameState && (
        <div className="game-info">
          <div className={isCurrentPlayerTurn ? 'turn-banner my-turn' : 'turn-banner'}>
            <strong>
              {isCurrentPlayerTurn
                ? 'Ваш ход'
                : turnPlayerName
                  ? `Ход игрока ${turnPlayerName}`
                  : 'Ожидаем ход'}
            </strong>

            <p className="form-hint">
              {isCurrentPlayerTurn
                ? 'Выберите игрока и карту, чтобы сделать запрос.'
                : 'Ожидайте действия другого игрока.'}
            </p>
          </div>

          {temporaryMessages.length > 0 && (
            <div className="temporary-messages">
              {temporaryMessages.map((message) => (
                <div className="temporary-message" key={message.id}>
                  {message.text}
                </div>
              ))}
            </div>
          )}

          <h3>Игроки</h3>

          {publicGameState.players.map((gamePlayer) => (
            <div
              className={
                gamePlayer.id === currentTurnPlayerID
                  ? 'player-row player-row-active'
                  : 'player-row'
              }
              key={gamePlayer.id}
            >
              <span>
                {gamePlayer.name}
                {player?.id === gamePlayer.id ? ' (ты)' : ''}
              </span>
              <span>{gamePlayer.card_count} карт</span>
            </div>
          ))}

          {completedQuartets.length > 0 && (
            <div className="completed-quartets-box">
              <h3>Собранные квартеты</h3>

              <div className="completed-quartets-list">
                {completedQuartets.map((quartet) => (
                  <div
                    className="completed-quartet-item"
                    key={`${quartet.playerID}-${quartet.quartetID}`}
                  >
                    <strong>{quartet.quartetTitle}</strong>
                    <span>Собрал: {quartet.playerName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameFinished && (
            <div className="game-finished-box">
              <h3>Игра завершена</h3>

              <div className="winners-box">
                <strong>{winnerLabel}:</strong>
                <span>{winnerNames}</span>
              </div>

              <div className="scores-list">
                <strong>Итоговый счёт</strong>

                {sortedFinalScores.map((score) => {
                  const isWinner = gameFinished.winners.includes(score.player_id)

                  return (
                    <div
                      className={`score-row ${isWinner ? 'score-row-winner' : ''}`}
                      key={score.player_id}
                    >
                      <span>
                        {getPlayerName(score.player_id)}
                        {isWinner ? ' 👑' : ''}
                      </span>
                      <strong>{score.score}</strong>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {player && publicGameState && !gameFinished && (
            <div className="request-form">
              <h3>Запрос карты</h3>

              <div className="request-section request-player-section">
                <h4>1. Выбери игрока</h4>

                {!hasRequestTargetPlayers && (
                  <p className="muted-text">
                    Нет игроков с картами, у которых можно спросить карту.
                  </p>
                )}

                <div className="request-choice-grid">
                  {requestTargetPlayers.map((gamePlayer) => (
                    <button
                      className={
                        gamePlayer.id === targetPlayerID
                          ? 'request-choice-card request-choice-card-selected'
                          : 'request-choice-card'
                      }
                      type="button"
                      key={gamePlayer.id}
                      onClick={() => onTargetPlayerIDChange(gamePlayer.id)}
                      disabled={
                        !player ||
                        gameFinished !== null ||
                        socketStatus !== 'connected' ||
                        currentTurnPlayerID !== player.id
                      }
                    >
                      <div className="request-choice-card-media request-choice-card-avatar">
                        {getPlayerName(gamePlayer.id).slice(0, 1).toUpperCase()}
                      </div>

                      <div className="request-choice-card-content">
                        <strong>{getPlayerName(gamePlayer.id)}</strong>
                        <span>{gamePlayer.card_count} карт</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="request-section request-card-section">
                <h4>2. Выбери карту</h4>

                <div className="request-card-groups">
                  {Object.entries(availableRequestCardsByQuartet).map(([quartetID, cards]) => (
                    <div className="request-card-group" key={quartetID}>
                      <strong>{cards[0]?.quartet_title ?? quartetID}</strong>

                      <div className="request-choice-grid">
                        {cards.map((card) => (
                          <button
                            className={
                              card.id === selectedCardID
                                ? 'request-choice-card request-choice-card-selected'
                                : 'request-choice-card'
                            }
                            type="button"
                            key={card.id}
                            onClick={() => onSelectedCardIDChange(card.id)}
                            disabled={
                              gameFinished !== null ||
                              socketStatus !== 'connected' ||
                              currentTurnPlayerID !== player.id
                            }
                          >
                            <div className="request-choice-card-media request-choice-card-image-placeholder">
                              🂠
                            </div>

                            <div className="request-choice-card-content">
                              <strong>{card.title}</strong>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {!hasAvailableRequestCards && (
                  <p className="form-hint">
                    Нет доступных карт для запроса. Нужно иметь хотя бы одну карту из квартета.
                  </p>
                )}

                {availableRequestCards.length > 0 && (
                  <p className="form-hint">
                    Можно просить только карты из квартетов, которые уже есть у тебя в руке.
                  </p>
                )}
              </div>

              {currentPlayerCannotRequest && (
                <div className="form-hint">
                  {!hasAvailableRequestCards && (
                    <p>
                      Сейчас твой ход, но нет карт, которые можно спросить. Нужно иметь хотя бы одну карту из квартета.
                    </p>
                  )}

                  {hasAvailableRequestCards && !hasRequestTargetPlayers && (
                    <p>
                      Сейчас твой ход, но нет игроков с картами, у которых можно спросить карту.
                    </p>
                  )}
                </div>
              )}

              <p className="form-hint">
                {currentTurnPlayerID === player?.id
                  ? 'Сейчас твой ход. Выбери игрока и карту.'
                  : currentTurnPlayerID
                    ? `Сейчас ходит ${getPlayerName(currentTurnPlayerID)}.`
                    : 'Ожидаем состояние игры.'}
              </p>

              <button
                className="button"
                onClick={onRequestCard}
                disabled={!canRequestCard() || !hasRequestTargetPlayers || !hasAvailableRequestCards}
              >
                {getRequestButtonText()}
              </button>
            </div>
          )}
        </div>
      )
      }
    </div >
  )
}
