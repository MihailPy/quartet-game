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
  completedQuartets
}: GamePanelProps) {

  const requestTargetPlayers =
    publicGameState?.players.filter(
      (gamePlayer) =>
        gamePlayer.id !== player?.id && gamePlayer.card_count > 0,
    ) ?? []

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
            disabled={!canStartGame}
          >
            {canStartGame ? 'Старт игры' : 'Старт игры недоступен'}
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
          <p>
            <strong>Статус:</strong> {publicGameState.status}
          </p>

          <p>
            <strong>Сейчас ходит:</strong>
          </p>

          {(() => {
            const turnPlayerID =
              currentTurnPlayerID || publicGameState.current_player_id || ''

            if (!turnPlayerID) {
              return <p>Пока неизвестно.</p>
            }

            return (
              <div>
                <p className="turn-player-name">
                  {getPlayerName(turnPlayerID)}
                  {player?.id === turnPlayerID ? ' — твой ход' : ''}
                </p>

                <small className="technical-id">{turnPlayerID}</small>
              </div>
            )
          })()}

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
                <strong>Победители:</strong>
                <span>
                  {gameFinished.winners.map(getPlayerName).join(', ')}
                </span>
              </div>

              <div className="scores-list">
                <strong>Итоговый счёт</strong>

                {gameFinished.scores.map((score) => (
                  <div className="score-row" key={score.player_id}>
                    <span>{getPlayerName(score.player_id)}</span>
                    <strong>{score.score}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {player && publicGameState && !gameFinished && (
            <div className="request-form">
              <h3>Запрос карты</h3>

              {requestTargetPlayers.length === 0 && (
                <p className="muted-text">
                  Нет игроков с картами, у которых можно спросить карту.
                </p>
              )}

              <label>
                У кого спросить
                <select
                  className="input"
                  value={targetPlayerID}
                  onChange={(event) =>
                    onTargetPlayerIDChange(event.target.value)
                  }
                  disabled={
                    !player ||
                    gameFinished !== null ||
                    socketStatus !== 'connected' ||
                    currentTurnPlayerID !== player.id ||
                    requestTargetPlayers.length === 0
                  }
                >
                  <option value="">Выбери игрока</option>
                  {requestTargetPlayers.map((gamePlayer) => (
                    <option key={gamePlayer.id} value={gamePlayer.id}>
                      {getPlayerName(gamePlayer.id)} — карт: {gamePlayer.card_count}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Какую карту спросить
                <select
                  className="input"
                  value={selectedCardID}
                  onChange={(event) => onSelectedCardIDChange(event.target.value)}
                >
                  <option value="">Выбери карту</option>

                  {Object.entries(availableRequestCardsByQuartet).map(
                    ([quartetID, cards]) => (
                      <optgroup key={quartetID} label={cards[0]?.quartet_title ?? quartetID}>
                        {cards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.title}
                          </option>
                        ))}
                      </optgroup>
                    ),
                  )}
                </select>
                {availableRequestCards.length === 0 && (
                  <p className="form-hint">
                    Нет доступных карт для запроса. Нужно иметь хотя бы одну карту из квартета.
                  </p>
                )}

                {availableRequestCards.length > 0 && (
                  <p className="form-hint">
                    Можно просить только карты из квартетов, которые уже есть у тебя в руке.
                  </p>
                )}
              </label>

              {availableRequestCards.length === 0 && (
                <p className="form-hint">
                  Нет карт, которые можно спросить по текущим квартетам.
                </p>
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
                disabled={!canRequestCard() || requestTargetPlayers.length === 0}
              >
                {getRequestButtonText()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
