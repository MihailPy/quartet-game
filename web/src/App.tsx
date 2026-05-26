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
  const [player, setPlayer] = useState<Player | null>(null)
  const [playerName, setPlayerName] = useState<string>('Mihail')
  const [roomIdInput, setRoomIdInput] = useState<string>('')

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
      setRoomIdInput(createdRoom.id)
  async function loadRoom() {
    if (!roomIdInput) {
      setError('Enter room id')
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/rooms/${roomIdInput}`)

      if (!response.ok) {
        throw new Error('Failed to load room')
      }

      const loadedRoom = (await response.json()) as Room
      setRoom(loadedRoom)
      setPlayer(null)
      setGame(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function joinRoom() {
    if (!room) {
      setError('Create room first')
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/rooms/${room.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to join room')
      }

      const data = (await response.json()) as {
        player: Player
        room: Room
      }

      setPlayer(data.player)
      setRoom(data.room)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function markReady() {
    if (!room || !player) {
      setError('Join room first')
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/rooms/${room.id}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: player.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark player ready')
      }

      const updatedRoom = (await response.json()) as Room
      setRoom(updatedRoom)

      const updatedPlayer = updatedRoom.players.find(
        (roomPlayer) => roomPlayer.id === player.id,
      )

      if (updatedPlayer) {
        setPlayer(updatedPlayer)
      }
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
            <div className="join-form">
              <label>
                ID существующей комнаты
                <input
                  className="input"
                  value={roomIdInput}
                  onChange={(event) => setRoomIdInput(event.target.value)}
                  placeholder="Room ID"
                />
              </label>

              <button className="button" onClick={loadRoom}>
                Открыть комнату
              </button>
            </div>

            <button className="button" onClick={createRoom}>
              Создать комнату
            </button>

            {room && (
              <div className="join-form">
                <label>
                  Имя игрока
                  <input
                    className="input"
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                  />
                </label>

                <button className="button" onClick={joinRoom}>
                  Подключиться
                </button>
              </div>
            )}

            {player && (
              <div className="room-info">
                <p>
                  <strong>Мой игрок:</strong>
                </p>
                <code>{player.id}</code>

                <p>
                  <strong>Имя:</strong> {player.name}
                </p>

                <p>
                  <strong>Статус:</strong> {player.is_ready ? 'готов' : 'не готов'}
                </p>

                <button
                  className="button"
                  onClick={markReady}
                  disabled={player.is_ready}
                >
                  {player.is_ready ? 'Готов' : 'Я готов'}
                </button>
              </div>
            )}

            {room && room.players.length > 0 && (
              <div className="players-list">
                <h3>Игроки</h3>

                {room.players.map((roomPlayer) => (
                  <div className="player-row" key={roomPlayer.id}>
                    <span>{roomPlayer.name}</span>
                    <span>{roomPlayer.is_ready ? 'готов' : 'не готов'}</span>
                  </div>
                ))}
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
