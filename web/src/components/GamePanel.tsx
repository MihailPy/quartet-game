import type {
  GameFinishedPayload,
  Player,
  PublicGameState,
  Room,
  RequestableCard,
} from '../types'

type GamePanelProps = {
  room: Room | null
  player: Player | null
  publicGameState: PublicGameState | null
  currentTurnPlayerID: string
  lastMoveMessage: string
  completedQuartetMessage: string
  gameFinished: GameFinishedPayload | null
  socketStatus: string
  targetPlayerID: string
  selectedCardID: string
  availableRequestCards: RequestableCard[]
  onTargetPlayerIDChange: (value: string) => void
  onSelectedCardIDChange: (value: string) => void
  onRequestCard: () => void
  onStartGame: () => void
  getPlayerName: (playerID: string) => string
  canRequestCard: () => boolean
  getRequestButtonText: () => string
}

export function GamePanel({
  room,
  player,
  publicGameState,
  currentTurnPlayerID,
  lastMoveMessage,
  completedQuartetMessage,
  gameFinished,
  socketStatus,
  targetPlayerID,
  selectedCardID,
  availableRequestCards,
  onTargetPlayerIDChange,
  onSelectedCardIDChange,
  onRequestCard,
  onStartGame,
  getPlayerName,
  canRequestCard,
  getRequestButtonText,
}: GamePanelProps) {
  return (
    <div className="panel">
      <h2>Игра</h2>

      <div className="socket-status">
        <strong>WebSocket:</strong> {socketStatus}
      </div>

      {room && player && room.status !== 'playing' && (
        <button className="button" onClick={onStartGame}>
          Старт игры
        </button>
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

          {lastMoveMessage && (
            <div className="move-message">{lastMoveMessage}</div>
          )}

          {completedQuartetMessage && (
            <div className="quartet-message">{completedQuartetMessage}</div>
          )}

          {gameFinished && (
            <div className="game-finished">
              <h3>Игра завершена</h3>

              <p>
                <strong>Победители:</strong>{' '}
                {gameFinished.winners.map(getPlayerName).join(', ')}
              </p>

              <h4>Счёт</h4>

              {gameFinished.scores.map((score) => (
                <div className="player-row" key={score.player_id}>
                  <span>{getPlayerName(score.player_id)}</span>
                  <span>{score.score}</span>
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

          {player && publicGameState && (
            <div className="request-form">
              <h3>Запрос карты</h3>

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
                    currentTurnPlayerID !== player.id
                  }
                >
                  <option value="">Выбери игрока</option>

                  {publicGameState.players
                    .filter((gamePlayer) => gamePlayer.id !== player.id)
                    .map((gamePlayer) => (
                      <option key={gamePlayer.id} value={gamePlayer.id}>
                        {gamePlayer.name}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Какую карту спросить
                <select
                  className="input"
                  value={selectedCardID}
                  onChange={(event) =>
                    onSelectedCardIDChange(event.target.value)
                  }
                  disabled={
                    !player ||
                    gameFinished !== null ||
                    socketStatus !== 'connected' ||
                    currentTurnPlayerID !== player.id ||
                    availableRequestCards.length === 0
                  }
                >
                  <option value="">Выбери карту</option>

                  {availableRequestCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.title} — {card.quartet_title}
                    </option>
                  ))}
                </select>
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
                disabled={!canRequestCard()}
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
