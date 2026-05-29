type GameLogPanelProps = {
  gameLog: string[]
  events: string[]
  showDebugEvents: boolean
  onToggleDebugEvents: () => void
}

export function GameLogPanel({
  gameLog,
  events,
  showDebugEvents,
  onToggleDebugEvents,
}: GameLogPanelProps) {
  return (
    <div className="panel">
      <div className="events-list">
        <h3>Журнал игры</h3>

        {gameLog.length === 0 && <p>Пока событий нет.</p>}

        {gameLog.map((event, index) => (
          <div className="log-item" key={`${event}-${index}`}>
            {event}
          </div>
        ))}
      </div>

      <div className="debug-events">
        <button
          className="secondary-button"
          type="button"
          onClick={onToggleDebugEvents}
        >
          {showDebugEvents ? 'Скрыть debug-события' : 'Показать debug-события'}
        </button>

        {showDebugEvents && (
          <div className="debug-events-list">
            {events.length === 0 && <p>Debug-событий пока нет.</p>}

            {events.map((event, index) => (
              <pre className="event-item" key={`${event}-${index}`}>
                {event}
              </pre>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
