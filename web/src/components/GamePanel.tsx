import type {
  GameFinishedPayload,
  Player,
  PublicGameState,
  Room,
  TemporaryMessage
} from '../types'

type GamePanelProps = {
  room: Room | null
  player: Player | null
  publicGameState: PublicGameState | null
  currentTurnPlayerID: string
  temporaryMessages: TemporaryMessage[]
  gameFinished: GameFinishedPayload | null
  socketStatus: string
  onStartGame: () => void
  canStartGame: boolean
  getPlayerName: (playerID: string) => string
  isStartingGame: boolean
  startGameHint: string
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
  onStartGame,
  canStartGame,
  getPlayerName,
  isStartingGame,
  startGameHint,
}: GamePanelProps) {

  const isCurrentPlayerTurn = player !== null && currentTurnPlayerID === player.id
  const turnPlayerID = currentTurnPlayerID || publicGameState?.current_player_id || ''
  const turnPlayerName = turnPlayerID ? getPlayerName(turnPlayerID) : ''

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
  const currentPlayerScore = sortedFinalScores.find(
    (score) => score.player_id === player?.id,
  )

  const isCurrentPlayerWinner =
    player !== null && gameFinished?.winners.includes(player.id) === true

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

          <p className="form-hint">{startGameHint}</p>
        </div>
      )}

      {!publicGameState && room?.status !== 'playing' && (
        <div className="game-empty-state">
          <strong>Игра ещё не началась</strong>
          <p className="form-hint">
            Выберите игроков и квартеты, затем запустите партию.
          </p>
        </div>
      )}

      {!publicGameState && room?.status === 'playing' && (
        <div className="game-empty-state game-empty-state-warning">
          <strong>Состояние игры не загружено</strong>
          <p className="form-hint">
            Игра была начата, но состояние не удалось восстановить. Возможно, backend был перезапущен.
          </p>
        </div>
      )}

      {publicGameState && (
        <div className="game-info">
          {!gameFinished && (
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
          )}
          {temporaryMessages.length > 0 && (
            <div className="temporary-messages">
              {temporaryMessages.map((message) => (
                <div className="temporary-message" key={message.id}>
                  {message.text}
                </div>
              ))}
            </div>
          )}

          {gameFinished && (
            <div className="game-finished-box">
              <h3>Игра завершена</h3>
              <p className="form-hint">Итоговые результаты партии.</p>

              <div className="winners-box">
                <strong>{winnerLabel}:</strong>
                <span>{winnerNames}</span>
              </div>

              {currentPlayerScore && (
                <div className={isCurrentPlayerWinner ? 'player-result-box player-result-box-winner' : 'player-result-box'}>
                  <strong>
                    {isCurrentPlayerWinner ? 'Ты победил' : 'Твой результат'}
                  </strong>
                  <span>{currentPlayerScore.score} квартетов</span>
                </div>
              )}

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

              <p className="form-hint">
                Чтобы сыграть ещё раз, выйди из комнаты и создай новую партию.
              </p>
            </div>
          )}
        </div>
      )
      }
    </div >
  )
}
