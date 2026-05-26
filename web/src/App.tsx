import { useState } from 'react'
import './App.css'

type Room = {
  id: string
  status: string
  players: Player[]
}

type Player = {
  id: string
  name: string
  is_ready: boolean
  is_connected: boolean
}

const API_URL = 'http://localhost:8080'

function App() {
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string>('')

  async function createRoom() {
    setError('')

    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create room')
      }

      const createdRoom = (await response.json()) as Room
      setRoom(createdRoom)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <main className="app">
      <section className="game-page">
        <header className="game-header">
          <h1>Квартет</h1>
          <p>Минимальный клиент для онлайн-игры</p>
        </header>

        {error && <div className="error">{error}</div>}

        <section className="game-layout">
          <div className="panel">
            <h2>Комната</h2>

            <button className="button" onClick={createRoom}>
              Создать комнату
            </button>

            {room && (
              <div className="room-info">
                <p>
                  <strong>ID комнаты:</strong>
                </p>
                <code>{room.id}</code>

                <p>
                  <strong>Статус:</strong> {room.status}
                </p>
              </div>
            )}
          </div>

          <div className="panel">
            <h2>Игра</h2>
            <p>Здесь будет состояние игры, ход и события.</p>
          </div>

          <div className="panel">
            <h2>Моя рука</h2>
            <p>Здесь будут карты текущего игрока.</p>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
