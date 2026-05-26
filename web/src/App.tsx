import './App.css'

function App() {
  return (
    <main className="app">
      <section className="game-page">
        <header className="game-header">
          <h1>Квартет</h1>
          <p>Минимальный клиент для онлайн-игры</p>
        </header>

        <section className="game-layout">
          <div className="panel">
            <h2>Комната</h2>
            <p>Здесь будет создание комнаты и подключение игроков.</p>
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
