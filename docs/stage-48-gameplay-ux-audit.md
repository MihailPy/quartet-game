# Stage 48 Gameplay UX Audit

<!--toc:start-->
- [Stage 48 Gameplay UX Audit](#stage-48-gameplay-ux-audit)
  - [1. Scope](#1-scope)
  - [2. Current gameplay entry point](#2-current-gameplay-entry-point)
  - [3. Gameplay state ownership](#3-gameplay-state-ownership)
    - [3.1. Основное состояние в `App.tsx`](#31-основное-состояние-в-apptsx)
    - [3.2. Назначение состояний](#32-назначение-состояний)
      - [`publicGameState`](#publicgamestate)
      - [`playerHand`](#playerhand)
      - [`currentTurnPlayerID`](#currentturnplayerid)
      - [`gameFinished`](#gamefinished)
      - [`temporaryMessages`](#temporarymessages)
      - [`toasts`](#toasts)
      - [`gameEvents`](#gameevents)
  - [4. State update flows](#4-state-update-flows)
    - [4.1. Начало игры](#41-начало-игры)
    - [4.2. Загрузка состояния после reconnect](#42-загрузка-состояния-после-reconnect)
    - [4.3. WebSocket `game_state`](#43-websocket-gamestate)
    - [4.4. WebSocket `turn_changed`](#44-websocket-turnchanged)
    - [4.5. WebSocket `card_request_result`](#45-websocket-cardrequestresult)
    - [4.6. WebSocket `quartet_completed`](#46-websocket-quartetcompleted)
    - [4.7. WebSocket `game_finished`](#47-websocket-gamefinished)
  - [5. Current component responsibilities](#5-current-component-responsibilities)
  - [5.1. `GamePanel`](#51-gamepanel)
    - [Текущая ответственность](#текущая-ответственность)
    - [Props](#props)
    - [Производное состояние](#производное-состояние)
    - [Проблема смешения ответственности](#проблема-смешения-ответственности)
    - [Возможность переиспользования](#возможность-переиспользования)
  - [5.2. `GameplayLayout`](#52-gameplaylayout)
    - [Текущая ответственность](#текущая-ответственность-1)
    - [Ограничения](#ограничения)
    - [Возможность переиспользования](#возможность-переиспользования-1)
  - [5.3. `GameplayTable`](#53-gameplaytable)
    - [Текущая ответственность](#текущая-ответственность-2)
    - [Текущая структура](#текущая-структура)
    - [Зависимость от backend-структуры](#зависимость-от-backend-структуры)
    - [Ограничения layout](#ограничения-layout)
    - [Проблемы](#проблемы)
    - [Возможность переиспользования](#возможность-переиспользования-2)
  - [5.4. `GameplayHandZone`](#54-gameplayhandzone)
    - [Текущая ответственность](#текущая-ответственность-3)
    - [Плюсы](#плюсы)
    - [Ограничения](#ограничения-1)
    - [Возможность переиспользования](#возможность-переиспользования-3)
  - [5.5. `PlayerHandPanel`](#55-playerhandpanel)
    - [Текущая ответственность](#текущая-ответственность-4)
    - [Плюсы](#плюсы-1)
    - [Проблемы](#проблемы-1)
    - [Возможность переиспользования](#возможность-переиспользования-4)
  - [5.6. `RequestCardFlow`](#56-requestcardflow)
    - [Плюсы](#плюсы-2)
    - [Риски](#риски)
    - [Возможность переиспользования](#возможность-переиспользования-5)
  - [6. Duplicated and fragmented UI state](#6-duplicated-and-fragmented-ui-state)
  - [6.1. Статус текущего хода](#61-статус-текущего-хода)
    - [В центре `GameplayTable`](#в-центре-gameplaytable)
    - [В action-блоке](#в-action-блоке)
    - [В `GamePanel`](#в-gamepanel)
    - [В temporary messages](#в-temporary-messages)
    - [В toast после неуспешного запроса](#в-toast-после-неуспешного-запроса)
  - [6.2. Статус партии](#62-статус-партии)
  - [6.3. Статус соединения](#63-статус-соединения)
  - [6.4. Ошибки request flow](#64-ошибки-request-flow)
  - [6.5. Игровые события](#65-игровые-события)
  - [6.6. Завершение игры](#66-завершение-игры)
  - [7. Backend data versus UI data](#7-backend-data-versus-ui-data)
  - [7.1. Backend-типы, используемые напрямую](#71-backend-типы-используемые-напрямую)
    - [`PublicGameState`](#publicgamestate-1)
    - [`PublicGamePlayer`](#publicgameplayer)
    - [`PlayerHandPayload`](#playerhandpayload)
    - [`PrivateCard`](#privatecard)
    - [`GameFinishedPayload`](#gamefinishedpayload)
    - [`GameEvent`](#gameevent)
    - [`TemporaryMessage`](#temporarymessage)
  - [7.2. Отсутствие frontend view model](#72-отсутствие-frontend-view-model)
  - [7.3. Значения, вычисляемые внутри JSX или компонентов](#73-значения-вычисляемые-внутри-jsx-или-компонентов)
  - [8. Proposed gameplay UI view model](#8-proposed-gameplay-ui-view-model)
    - [Connection](#connection)
    - [Player card](#player-card)
    - [Table](#table)
    - [Central status](#central-status)
    - [Last action](#last-action)
    - [Action state](#action-state)
  - [9. Reusable parts](#9-reusable-parts)
    - [9.1. API и WebSocket infrastructure](#91-api-и-websocket-infrastructure)
    - [9.2. Backend-типы](#92-backend-типы)
    - [9.3. Request flow](#93-request-flow)
    - [9.4. Рука игрока](#94-рука-игрока)
    - [9.5. Player details](#95-player-details)
    - [9.6. Toast infrastructure](#96-toast-infrastructure)
    - [9.7. Game log](#97-game-log)
  - [10. Parts to refactor](#10-parts-to-refactor)
    - [10.1. Формирование gameplay UI-состояния](#101-формирование-gameplay-ui-состояния)
    - [10.2. Текущий ход](#102-текущий-ход)
    - [10.3. Верхняя строка состояния](#103-верхняя-строка-состояния)
    - [10.4. Карточка игрока](#104-карточка-игрока)
    - [10.5. Layout стола](#105-layout-стола)
    - [10.6. Центральный статус](#106-центральный-статус)
    - [10.7. Последнее игровое действие](#107-последнее-игровое-действие)
    - [10.8. Завершение игры](#108-завершение-игры)
    - [10.9. `App.tsx`](#109-apptsx)
  - [11. Proposed component boundary](#11-proposed-component-boundary)
    - [`App.tsx`](#apptsx)
    - [`buildGameplayUIViewModel`](#buildgameplayuiviewmodel)
    - [`GameplayShell`](#gameplayshell)
    - [`GameStatusBar`](#gamestatusbar)
    - [`GameplayTable`](#gameplaytable)
    - [`GameplayPlayerCard`](#gameplayplayercard)
    - [`CentralGameStatus`](#centralgamestatus)
    - [`GameplayActionPanel`](#gameplayactionpanel)
    - [`GameplayHandZone`](#gameplayhandzone)
    - [`RequestCardFlow`](#requestcardflow)
    - [`GameplayResultSummary`](#gameplayresultsummary)
  - [12. Risks](#12-risks)
  - [12.1. Рассинхронизация текущего хода](#121-рассинхронизация-текущего-хода)
  - [12.2. Несколько источников статуса партии](#122-несколько-источников-статуса-партии)
  - [12.3. Потеря последнего действия](#123-потеря-последнего-действия)
  - [12.4. Неполное восстановление после reconnect](#124-неполное-восстановление-после-reconnect)
  - [12.5. Layout для 5–6 игроков](#125-layout-для-56-игроков)
  - [12.6. Mobile layout](#126-mobile-layout)
  - [12.7. Request flow regression](#127-request-flow-regression)
  - [12.8. Finished state с открытыми окнами](#128-finished-state-с-открытыми-окнами)
  - [12.9. Технические ID в UI](#129-технические-id-в-ui)
  - [12.10. Дублирование преобразования событий](#1210-дублирование-преобразования-событий)
  - [12.11. Большой `App.tsx`](#1211-большой-apptsx)
  - [13. Recommended implementation principles](#13-recommended-implementation-principles)
  - [14. Stage 48 implementation sequence](#14-stage-48-implementation-sequence)
  - [15. Audit conclusion](#15-audit-conclusion)
<!--toc:end-->

## 1. Scope

Цель аудита — зафиксировать текущее устройство игрового frontend перед
созданием нового каркаса игрового интерфейса в Stage 48.

Аудит охватывает:

- владение игровым состоянием;
- обработку backend- и WebSocket-данных;
- текущую композицию игрового экрана;
- отображение хода, подключения, событий и окончания игры;
- игровой стол;
- руку текущего игрока;
- request flow;
- модальные окна и вспомогательные панели;
- границу между backend-моделями и UI-моделями.

В рамках задачи production-код не изменяется.

---

## 2. Current gameplay entry point

Основной координатор frontend находится в `web/src/App.tsx`.

`App.tsx` одновременно отвечает за:

- вход и восстановление пользовательской сессии;
- создание комнаты и подключение к ней;
- управление аккаунтом и пользовательскими квартетами;
- загрузку состояния игры;
- загрузку руки игрока;
- загрузку журнала игровых событий;
- WebSocket-подключение;
- обработку игровых WebSocket-сообщений;
- хранение локального UI-состояния;
- формирование значительной части gameplay-разметки;
- открытие request flow, preview карты, карточки игрока и игрового журнала.

Переход в игровой режим определяется двумя разными признаками:

```ts
const hasGameStarted = publicGameState !== null
const isGamePlaying = publicGameState?.status === 'playing'
```

При построении основного layout дополнительно используется:

```ts
room.status === 'playing'
```

Таким образом, frontend опирается сразу на несколько источников истины:

- `room.status`;
- `publicGameState`;
- `publicGameState.status`;
- `gameFinished`.

Активный игровой экран рендерится, когда:

```ts
room && room.status === 'playing'
```

Внутри active gameplay shell находятся:

- верхняя панель комнаты;
- `GameplayLayout`;
- `GameplayTable`;
- action-блок текущего хода;
- `GamePanel`;
- `GameplayHandZone`;
- `PlayerDetailsModal`;
- `RequestCardFlow`;
- `CardPreviewModal`;
- меню текущего игрока;
- игровой журнал.

Основная gameplay-композиция сейчас находится непосредственно в `App.tsx`,
поэтому компонент выполняет не только orchestration, но и значительную часть
обязанностей layout-компонента.

---

## 3. Gameplay state ownership

### 3.1. Основное состояние в `App.tsx`

Ключевые игровые состояния:

```ts
const [publicGameState, setPublicGameState] =
  useState<PublicGameState | null>(null)

const [playerHand, setPlayerHand] =
  useState<PlayerHandPayload | null>(null)

const [targetPlayerID, setTargetPlayerID] =
  useState<string>('')

const [selectedCardID, setSelectedCardID] =
  useState<string>('')

const [currentTurnPlayerID, setCurrentTurnPlayerID] =
  useState<string>('')

const [gameFinished, setGameFinished] =
  useState<GameFinishedPayload | null>(null)

const [temporaryMessages, setTemporaryMessages] =
  useState<TemporaryMessage[]>([])

const [toasts, setToasts] =
  useState<ToastMessage[]>([])

const [gameEvents, setGameEvents] =
  useState<GameEvent[]>([])
```

Дополнительное gameplay UI-состояние:

```ts
const [previewCard, setPreviewCard] =
  useState<PrivateCard | null>(null)

const [selectedTablePlayerID, setSelectedTablePlayerID] =
  useState('')

const [isHandOpen, setIsHandOpen] =
  useState(true)

const [isRequestFlowOpen, setIsRequestFlowOpen] =
  useState(false)

const [isGameLogOpen, setIsGameLogOpen] =
  useState(false)

const [isPlayerPanelOpen, setIsPlayerPanelOpen] =
  useState(false)
```

Состояние подключения:

```ts
const [socketStatus, setSocketStatus] =
  useState<string>('disconnected')

const [reconnectAttempt, setReconnectAttempt] =
  useState<number>(0)
```

### 3.2. Назначение состояний

#### `publicGameState`

Содержит публичное состояние партии:

- ID игры;
- статус игры;
- ID текущего игрока;
- список игроков;
- количество карт каждого игрока;
- собранные квартеты.

Используется как основной источник данных для игрового стола и выбора соперника.

#### `playerHand`

Содержит приватные карты текущего пользователя.

Используется:

- в зоне руки;
- при построении requestable cards;
- в request flow;
- в preview карты.

#### `currentTurnPlayerID`

Локальная копия ID текущего игрока.

Значение обновляется отдельно:

- после старта игры;
- после загрузки состояния;
- при `game_state`;
- при `turn_changed`;
- при `card_request_result`.

При этом то же значение существует в:

```ts
publicGameState.current_player_id
```

Это создаёт два источника истины для текущего хода.

#### `gameFinished`

Содержит итоговый payload:

- победителей;
- результаты игроков;
- ID игры.

Используется для:

- статуса в верхней панели;
- итогового блока в `GamePanel`;
- отключения request flow;
- определения завершённого состояния.

#### `temporaryMessages`

Массив краткоживущих сообщений, отображаемых внутри `GamePanel`.

Используется для:

- сообщения о смене хода;
- ошибок request flow;
- сообщения о собранном квартете;
- завершения игры;
- ошибок восстановления состояния.

Сообщения удаляются через ограниченное время, поэтому не подходят для роли
постоянного «последнего игрового действия».

#### `toasts`

Отдельный канал временной обратной связи.

Используется, например, для:

- начала игры;
- успешного запроса карты;
- неуспешного запроса;
- перехода хода;
- системных действий аккаунта и комнаты.

#### `gameEvents`

Постоянный журнал backend-событий.

Используется:

- для последних двух событий в центре стола;
- для полного журнала игры.

В отличие от `temporaryMessages`, это более подходящий источник для
восстановления последнего игрового действия после reconnect.

---

## 4. State update flows

### 4.1. Начало игры

После успешного `startGameRequest`:

```ts
setPublicGameState(data.state)
setCurrentTurnPlayerID(data.state.current_player_id)
```

После этого отдельно загружается колода.

### 4.2. Загрузка состояния после reconnect

`loadGameState`:

- загружает `PublicGameState`;
- обновляет `publicGameState`;
- отдельно обновляет `currentTurnPlayerID`;
- загружает игровой журнал;
- строит `gameFinished`, если статус равен `finished`.

Если восстановление не удалось:

- состояние игры очищается;
- текущий ход очищается;
- завершение игры очищается;
- показывается временное сообщение.

### 4.3. WebSocket `game_state`

При сообщении `game_state`:

```ts
setPublicGameState(payload)
setCurrentTurnPlayerID(payload.current_player_id)
```

Снова обновляются два связанных состояния.

### 4.4. WebSocket `turn_changed`

При смене хода:

- обновляется только `currentTurnPlayerID`;
- формируется текст о текущем игроке;
- показывается temporary message.

`publicGameState.current_player_id` в этом обработчике напрямую не изменяется.

До следующего полного `game_state` два значения могут временно расходиться.

### 4.5. WebSocket `card_request_result`

При результате запроса:

- очищается выбранный соперник;
- очищается выбранная карта;
- обновляется `currentTurnPlayerID`;
- показываются один или два toast-сообщения.

Публичное состояние игры в этом обработчике напрямую не обновляется.

### 4.6. WebSocket `quartet_completed`

Формируется temporary message с именем игрока и названием квартета.

Постоянного локального состояния последнего действия нет.

### 4.7. WebSocket `game_finished`

При завершении игры:

- сохраняется `gameFinished`;
- формируется temporary message с победителем.

При этом `room.status` может продолжать иметь значение `playing`,
а `publicGameState.status` обновляется только при получении или загрузке
соответствующего состояния.

---

## 5. Current component responsibilities

## 5.1. `GamePanel`

### Текущая ответственность

`GamePanel` одновременно отображает:

- статус WebSocket-соединения;
- кнопку начала игры;
- подсказку для старта;
- empty state до начала игры;
- ошибку загрузки состояния;
- статус текущего хода;
- temporary messages;
- завершение игры;
- победителей;
- результат текущего игрока;
- итоговый счёт.

### Props

Компонент принимает:

```ts
room
player
publicGameState
currentTurnPlayerID
temporaryMessages
gameFinished
socketStatus
onStartGame
canStartGame
getPlayerName
isStartingGame
startGameHint
```

Props относятся сразу к нескольким независимым областям:

- lifecycle комнаты;
- соединение;
- старт партии;
- активный ход;
- временные события;
- итоговый экран.

### Производное состояние

Компонент самостоятельно вычисляет:

- является ли ход текущим;
- какой ID хода использовать;
- имя текущего игрока;
- список победителей;
- подпись «Победитель» или «Победители»;
- сортировку итогового счёта;
- результат текущего пользователя;
- является ли пользователь победителем.

### Проблема смешения ответственности

`GamePanel` не является одним цельным UI-блоком.

Фактически внутри него объединены как минимум четыре будущих компонента:

1. connection indicator;
2. pre-game start panel;
3. central turn/status panel;
4. finished-game summary.

В активной партии компонент рендерится под игровым столом и action-блоком,
хотя часть его информации уже отображается в других местах.

### Возможность переиспользования

Целиком компонент переиспользовать в новом shell нецелесообразно.

Можно переиспользовать или вынести отдельно:

- преобразование socket status в пользовательский label;
- сортировку финальных результатов;
- представление итогового счёта;
- pre-game start logic.

---

## 5.2. `GameplayLayout`

### Текущая ответственность

Компонент представляет собой только оболочку:

```tsx
<div className="gameplay-layout">{children}</div>
```

Он не задаёт семантические зоны и не принимает структурированные props.

### Ограничения

`GameplayLayout` не знает о:

- верхнем статусе;
- игровом столе;
- центральном статусе;
- action-зоне;
- руке;
- desktop/mobile-композиции;
- компактном режиме для 5–6 игроков.

Вся реальная структура передаётся через произвольный `children`.

### Возможность переиспользования

Название компонента можно сохранить, но его контракт следует изменить.

Вместо общего `children` layout может принимать именованные области либо самостоятельно собирать устойчивую структуру gameplay shell.

---

## 5.3. `GameplayTable`

### Текущая ответственность

Компонент:

- получает `PublicGameState`;
- строит список завершённых квартетов;
- вычисляет имя текущего игрока;
- вычисляет общее количество квартетов;
- отображает центр стола;
- отображает два последних события;
- отображает собранные квартеты;
- отображает все player seats;
- выделяет игрока текущего хода;
- вызывает callback при клике на игрока.

### Текущая структура

Центр стола содержит:

- label «Текущий ход»;
- имя игрока;
- число игроков;
- число завершённых квартетов;
- до двух последних событий;
- список собранных квартетов.

Игроки отображаются через кнопки `player-seat`.

Каждый seat содержит:

- первую букву имени;
- имя;
- до четырёх декоративных рубашек;
- точное количество карт.

### Зависимость от backend-структуры

Компонент напрямую принимает `PublicGameState` и внутри JSX работает с:

```ts
gameState.players
gameState.completed
currentTurnPlayerID
```

UI-представление игрока не отделено от backend-модели `PublicGamePlayer`.

### Ограничения layout

Позиционирование игрока зависит от:

```ts
player-seat-${index}
player-seats-count-${gameState.players.length}
table-player-count-${gameState.players.length}
```

То есть схема расположения определяется индексом игрока и количеством игроков через CSS.

В компоненте отсутствует явная модель:

- верхнего игрока;
- нижнего игрока;
- левой и правой стороны;
- текущего пользователя;
- соперника;
- компактного seat;
- режима `standard` или `compact`.

### Проблемы

1. Центр стола одновременно показывает ход, метаданные, события и квартеты.
2. Текущий ход также показывается в `GamePanel`.
3. Текущий ход дополнительно показывается в action-блоке.
4. Два последних события являются просто строками.
5. Для событий используется `key={eventText}`, что может дать дублирующиеся React keys.
6. Завершённые квартеты отображаются по техническому `quartetID`.
7. Компонент знает слишком много о преобразовании backend-состояния в визуальную модель.
8. Нет отдельного компонента карточки игрока.
9. Нет явной адаптации содержимого player card для 5–6 игроков.
10. Не обозначен текущий пользователь среди остальных игроков.

### Возможность переиспользования

Можно сохранить:

- общую идею круглого/овального стола;
- click interaction по игроку;
- отображение количества карт;
- визуальное выделение текущего хода;
- `PlayerDetailsModal`.

Сам `GameplayTable` следует перевести на типизированную UI-модель.

---

## 5.4. `GameplayHandZone`

### Текущая ответственность

Компонент:

- скрывает себя, если `playerHand` отсутствует;
- отображает кнопку открытия/закрытия руки;
- показывает количество карт;
- рендерит `PlayerHandPanel`.

### Плюсы

Компонент уже отделяет collapsible shell руки от содержимого руки.

Контракт небольшой и понятный.

### Ограничения

Компонент принимает backend-типы напрямую:

```ts
Player
PlayerHandPayload
PrivateCard
```

При отсутствии `playerHand` зона полностью исчезает.

Это может вызывать изменение общей высоты layout во время:

- первоначальной загрузки;
- reconnect;
- обновления руки.

### Возможность переиспользования

Компонент в целом пригоден для дальнейшего использования.

Возможные изменения:

- стабильный loading/empty shell;
- размещение в новом gameplay layout;
- передача подготовленной UI-модели руки;
- сохранение высоты или предсказуемой collapsed-зоны.

---

## 5.5. `PlayerHandPanel`

### Текущая ответственность

Компонент:

- группирует карты по `quartet_id`;
- отображает название квартета;
- вычисляет прогресс `N / 4`;
- показывает состояние «Квартет собран»;
- рендерит карты;
- открывает preview по клику.

### Плюсы

Полезная игровая логика уже визуально представлена:

- группировка по квартетам;
- прогресс сбора;
- preview карты;
- изображение карты;
- название карты.

### Проблемы

1. Компонент принимает одновременно `player` и `playerHand`, хотя родитель уже не рендерит его без `playerHand`.
2. В каждой карте показывается технический `card.id`.
3. UI напрямую использует backend-поля `quartet_id`, `image_url`.
4. Группировка выполняется на каждом render.
5. Порядок групп и карт зависит от порядка backend-payload.
6. Нет отдельной view model для группы квартета.
7. Нет пустого состояния для руки с нулём карт.
8. Один компонент одновременно выполняет data transformation и rendering.

### Возможность переиспользования

Следует сохранить:

- группировку руки по квартетам;
- прогресс `N / 4`;
- `CardImage`;
- preview interaction;
- визуальную карточку.

Технический ID следует убрать из основного пользовательского интерфейса.

---

## 5.6. `RequestCardFlow`

Request flow открывается из отдельного action-блока в `App.tsx`.

Компонент получает:

- список публичных игроков;
- ID текущего пользователя;
- выбранного соперника;
- список доступных карт;
- выбранную карту;
- приватную руку;
- callback preview;
- callback submit;
- функцию получения названия квартета.

Состояние request flow хранится в `App.tsx`:

```ts
targetPlayerID
selectedCardID
isRequestFlowOpen
```

Доступность открытия определяется так:

```ts
player !== null &&
publicGameState !== null &&
gameFinished === null &&
currentTurnPlayerID === player.id
```

### Плюсы

Request flow уже отделён от игрового стола и может быть сохранён при перестройке shell.

### Риски

1. Доступность зависит от локального `currentTurnPlayerID`.
2. При рассинхронизации с `publicGameState.current_player_id` кнопка может появиться или исчезнуть неверно.
3. Окно закрывается сразу после вызова `requestCard`, до подтверждения результата.
4. При завершении игры открытый flow явно не закрывается.
5. При reconnect открытое состояние модального окна может сохраниться.
6. Выбранный соперник валидируется отдельным effect.
7. Выбранная карта валидируется отдельным effect.
8. Логика доступности распределена между `App.tsx`, effect-ами и самим flow.

### Возможность переиспользования

Основной сценарий request flow следует сохранить.

В Stage 48 желательно передавать в него уже подготовленные UI-данные и единый флаг доступности действия.

---

## 6. Duplicated and fragmented UI state

## 6.1. Статус текущего хода

Текущий ход отображается одновременно в нескольких местах.

### В центре `GameplayTable`

```text
Текущий ход
Имя игрока
```

### В action-блоке

Для текущего пользователя:

```text
Твой ход
Сделай запрос карты
```

Для ожидания:

```text
Ожидание
Сейчас ход другого игрока
```

### В `GamePanel`

```text
Ваш ход
```

или:

```text
Ход игрока ...
```

### В temporary messages

После `turn_changed`:

```text
Сейчас твой ход.
```

или:

```text
Сейчас ходит ...
```

### В toast после неуспешного запроса

Отдельно показывается результат запроса, затем отдельный toast о том, кто ходит.

Таким образом, один игровой факт может одновременно появиться:

- в центре стола;
- в action-блоке;
- в `GamePanel`;
- во временном сообщении;
- в toast.

---

## 6.2. Статус партии

В active toolbar показывается:

```text
Игра идёт
```

или:

```text
Игра завершена
```

Одновременно завершение игры подробно отображается в `GamePanel`.

Статус также косвенно определяется через:

- `room.status`;
- `publicGameState.status`;
- `gameFinished`.

---

## 6.3. Статус соединения

`socketStatus` хранится как произвольная строка.

Пользовательская подпись формируется внутри `GamePanel`.

При ошибке WebSocket дополнительно устанавливается глобальный `error`:

```text
Ошибка websocket-подключения.
```

В итоге ошибка может отображаться:

- в глобальном error banner;
- в connection status внутри `GamePanel`.

---

## 6.4. Ошибки request flow

При `request_card_error`:

- устанавливается глобальный `error`;
- показывается temporary message.

Одна ошибка дублируется минимум в двух местах.

---

## 6.5. Игровые события

Существует три параллельных канала:

1. `temporaryMessages`;
2. `toasts`;
3. `gameEvents`.

Они частично описывают одни и те же игровые действия, но имеют разные lifecycle и формат.

Нет единой модели:

```ts
lastAction
```

которая:

- сохраняется до следующего игрового действия;
- восстанавливается из game events;
- имеет тип;
- содержит actor и target;
- имеет presentation variant;
- используется центральным статусом.

---

## 6.6. Завершение игры

После `game_finished`:

- устанавливается `gameFinished`;
- показывается temporary message;
- toolbar меняет статус;
- `GamePanel` показывает большой итоговый блок;
- request flow перестаёт быть доступен;
- action waiting block не показывается.

При этом gameplay shell и стол остаются в структуре, потому что условие active shell основано на:

```ts
room.status === 'playing'
```

Это приводит к смешанному экрану: стол активной игры и итоговый блок завершённой партии существуют одновременно.

---

## 7. Backend data versus UI data

## 7.1. Backend-типы, используемые напрямую

### `PublicGameState`

```ts
type PublicGameState = {
  game_id: string
  status: string
  current_player_id: string
  players: PublicGamePlayer[]
  completed: Record<string, string[]>
}
```

### `PublicGamePlayer`

```ts
type PublicGamePlayer = {
  id: string
  name: string
  card_count: number
}
```

### `PlayerHandPayload`

```ts
type PlayerHandPayload = {
  player_id: string
  cards: PrivateCard[]
}
```

### `PrivateCard`

```ts
type PrivateCard = {
  id: string
  quartet_id: string
  title: string
  image_url?: string
}
```

### `GameFinishedPayload`

```ts
type GameFinishedPayload = {
  game_id: string
  winners: string[]
  scores: PlayerScore[]
}
```

### `GameEvent`

```ts
type GameEvent = {
  id: string
  game_id: string
  room_id: string
  type: string
  actor_id: string
  target_id: string
  payload: Record<string, unknown>
  created_at: string
}
```

### `TemporaryMessage`

```ts
type TemporaryMessage = {
  id: string
  text: string
}
```

---

## 7.2. Отсутствие frontend view model

Сейчас отдельной gameplay UI-модели нет.

Компоненты самостоятельно вычисляют:

- текущего игрока;
- имя текущего игрока;
- является ли ход пользовательским;
- число собранных квартетов;
- итоговый счёт;
- победителей;
- прогресс квартета;
- список завершённых квартетов;
- доступность request flow;
- подписи статусов;
- тексты игровых событий;
- CSS-классы расположения игроков.

Это приводит к тому, что backend-структуры распространяются по всему дереву компонентов.

---

## 7.3. Значения, вычисляемые внутри JSX или компонентов

Сейчас непосредственно в компонентах вычисляются:

- `isCurrentPlayerTurn`;
- fallback между `currentTurnPlayerID` и `publicGameState.current_player_id`;
- `turnPlayerName`;
- `winnerNames`;
- `winnerLabel`;
- `sortedFinalScores`;
- `isCurrentPlayerWinner`;
- `completedQuartets`;
- `completedQuartetsCount`;
- `currentPlayerName`;
- `cardsByQuartet`;
- `quartetProgress`;
- классы player seats;
- число декоративных рубашек;
- текст socket status.

Эти вычисления должны быть централизованы либо в builder-функции UI-модели, либо в небольших специализированных selectors.

---

## 8. Proposed gameplay UI view model

Предварительно Stage 48 потребуется модель уровня frontend.

Пример направления:

```ts
type GameplayUIViewModel = {
  phase: 'loading' | 'playing' | 'finished' | 'unavailable'
  connection: GameplayConnectionViewModel
  statusBar: GameplayStatusBarViewModel
  table: GameplayTableViewModel
  centralStatus: GameplayCentralStatusViewModel
  hand: GameplayHandViewModel | null
  action: GameplayActionViewModel
  result: GameplayResultViewModel | null
}
```

### Connection

```ts
type GameplayConnectionViewModel = {
  status:
    | 'connected'
    | 'connecting'
    | 'reconnecting'
    | 'disconnected'
    | 'error'
  label: string
  isProblem: boolean
}
```

### Player card

```ts
type GameplayPlayerViewModel = {
  id: string
  name: string
  initials: string
  cardCount: number
  completedQuartetsCount: number
  isCurrentUser: boolean
  isCurrentTurn: boolean
  isWinner: boolean
  seat: GameplayPlayerSeat
  density: 'standard' | 'compact'
}
```

### Table

```ts
type GameplayTableViewModel = {
  playerCount: number
  layoutMode: 'table' | 'compact'
  players: GameplayPlayerViewModel[]
  completedQuartetsCount: number
}
```

### Central status

```ts
type GameplayCentralStatusViewModel = {
  tone: 'neutral' | 'active' | 'success' | 'warning' | 'finished'
  eyebrow: string
  title: string
  description?: string
  lastAction?: GameplayLastActionViewModel
}
```

### Last action

```ts
type GameplayLastActionViewModel = {
  type:
    | 'game_started'
    | 'turn_changed'
    | 'card_request_succeeded'
    | 'card_request_failed'
    | 'quartet_completed'
    | 'game_finished'
  text: string
  actorID?: string
  targetID?: string
  cardTitle?: string
  quartetTitle?: string
  createdAt?: string
}
```

### Action state

```ts
type GameplayActionViewModel = {
  mode: 'request-card' | 'waiting' | 'finished' | 'disabled'
  title: string
  description: string
  canRequestCard: boolean
}
```

Точные названия и структура должны быть определены в задаче 2 Stage 48.

---

## 9. Reusable parts

Следующие части текущей реализации можно сохранить.

### 9.1. API и WebSocket infrastructure

Можно сохранить:

- `loadGameStateRequest`;
- `loadPlayerHandRequest`;
- `loadGameEventsRequest`;
- WebSocket lifecycle;
- reconnect attempt;
- обработку session restore;
- загрузку колоды;
- загрузку приватной руки.

### 9.2. Backend-типы

Backend DTO должны остаться отдельными типами:

- `PublicGameState`;
- `PublicGamePlayer`;
- `PlayerHandPayload`;
- `PrivateCard`;
- `GameFinishedPayload`;
- `GameEvent`.

Их не следует переименовывать в UI-модели.

### 9.3. Request flow

Можно сохранить:

- выбор соперника;
- выбор карты;
- preview карты;
- submit request;
- валидацию выбранной карты;
- валидацию выбранного соперника.

### 9.4. Рука игрока

Можно сохранить:

- группировку по квартетам;
- отображение прогресса;
- `CardImage`;
- preview;
- collapsible hand zone.

### 9.5. Player details

Можно сохранить сценарий открытия деталей игрока по нажатию на player card.

### 9.6. Toast infrastructure

`ToastContainer` можно сохранить для системной и краткой feedback-информации.

Игровой статус и последнее действие при этом не должны зависеть только от toast.

### 9.7. Game log

Можно сохранить:

- загрузку событий;
- полный журнал;
- форматирование времени;
- открытие журнала из меню игрока.

Форматирование события желательно вынести из `App.tsx`.

---

## 10. Parts to refactor

В Stage 48 следует изменить следующие области.

### 10.1. Формирование gameplay UI-состояния

Backend DTO не должны напрямую определять структуру JSX.

Нужна единая типизированная view model.

### 10.2. Текущий ход

Следует определить единый источник истины.

Предпочтительные варианты:

- использовать только `publicGameState.current_player_id`;
- либо гарантированно обновлять единый gameplay state;
- либо строить normalized state перед UI.

Хранение отдельного `currentTurnPlayerID` без строгой синхронизации создаёт риск рассинхронизации.

### 10.3. Верхняя строка состояния

Текущую `active-game-toolbar` следует превратить в специализированный компонент.

Она должна отображать только основные данные:

- комната;
- состояние соединения;
- состояние партии;
- действие выхода.

### 10.4. Карточка игрока

Разметку player seat следует вынести в отдельный компонент.

Он должен поддерживать:

- стандартный режим;
- компактный режим;
- текущего пользователя;
- текущий ход;
- число карт;
- собранные квартеты;
- победителя;
- click interaction.

### 10.5. Layout стола

Таблица должна использовать подготовленные seat positions, а не только индекс массива.

Нужны отдельные правила:

- для 2 игроков;
- для 3 игроков;
- для 4 игроков;
- компактный режим для 5 игроков;
- компактный режим для 6 игроков.

### 10.6. Центральный статус

Нужен единый центр партии, который заменит дублирование между:

- `GameplayTable`;
- action-блоком;
- `GamePanel`;
- temporary messages.

### 10.7. Последнее игровое действие

Нужно постоянное `lastAction`.

Оно должно:

- обновляться при игровом событии;
- не исчезать по таймеру;
- восстанавливаться из `gameEvents`;
- быть типизированным;
- отображаться в центре игры;
- заменяться только следующим релевантным действием.

### 10.8. Завершение игры

Finished state должен быть частью общей UI-модели.

Следует определить:

- остаётся ли стол видимым;
- где показывается победитель;
- где показывается итоговый счёт;
- закрываются ли открытые modal flows;
- становится ли рука read-only;
- какие действия остаются доступными.

### 10.9. `App.tsx`

Из JSX `App.tsx` желательно вынести весь active gameplay shell в отдельный компонент.

`App.tsx` должен остаться координатором:

- запросов;
- WebSocket;
- backend-состояния;
- высокоуровневых callbacks;
- modal state, если его не перенесут ниже.

---

## 11. Proposed component boundary

Предварительная граница компонентов:

### `App.tsx`

Ответственность:

- room/session state;
- API;
- WebSocket;
- backend DTO;
- gameplay commands;
- загрузка событий;
- построение или вызов builder UI-модели.

### `buildGameplayUIViewModel`

Ответственность:

- нормализация состояния;
- определение phase;
- определение текущего пользователя;
- определение текущего хода;
- подготовка игроков;
- выбор layout mode;
- формирование центрального статуса;
- формирование action state;
- формирование finished state.

### `GameplayShell`

Ответственность:

- общая композиция активной партии;
- status bar;
- table;
- central status;
- action;
- hand.

### `GameStatusBar`

Ответственность:

- ID комнаты;
- соединение;
- статус партии;
- выход.

### `GameplayTable`

Ответственность:

- table surface;
- расположение подготовленных player view models;
- рендер центрального статуса;
- обработка клика по игроку.

### `GameplayPlayerCard`

Ответственность:

- отображение одного игрока;
- standard/compact variant;
- current user;
- current turn;
- card count;
- completed quartets;
- winner state.

### `CentralGameStatus`

Ответственность:

- текущий статус;
- основной текст;
- supporting text;
- последнее игровое действие;
- finished state.

### `GameplayActionPanel`

Ответственность:

- request-card action;
- waiting state;
- disabled state;
- finished state.

### `GameplayHandZone`

Ответственность:

- открытие и закрытие руки;
- стабильная нижняя зона;
- отображение hand model.

### `RequestCardFlow`

Ответственность:

- выбор соперника;
- выбор карты;
- подтверждение запроса.

### `GameplayResultSummary`

Ответственность:

- победители;
- результат текущего игрока;
- итоговый счёт.

Компонент может быть частью `CentralGameStatus` либо отдельным блоком внутри shell.

---

## 12. Risks

## 12.1. Рассинхронизация текущего хода

`currentTurnPlayerID` и `publicGameState.current_player_id` обновляются не всегда одновременно.

Это может привести к различиям между:

- player highlight;
- центральным текстом;
- доступностью request flow;
- `GamePanel`.

## 12.2. Несколько источников статуса партии

Используются:

- `room.status`;
- `publicGameState.status`;
- `gameFinished`.

Без нормализации возможны переходные несовместимые состояния.

## 12.3. Потеря последнего действия

`temporaryMessages` исчезают по таймеру.

После исчезновения сообщения центр стола может не объяснять последнее действие пользователя.

## 12.4. Неполное восстановление после reconnect

После reconnect загружаются:

- game state;
- player hand;
- game events.

Однако последнее действие не строится как отдельное состояние из последнего события.

## 12.5. Layout для 5–6 игроков

Текущие player seats используют единый формат карточки.

При большом числе игроков возможны:

- наложения;
- слишком длинные имена;
- недостаток места для рубашек карт;
- перегруженный центр;
- плохая читаемость на мобильном экране.

## 12.6. Mobile layout

Gameplay состоит из нескольких крупных вертикальных блоков:

- toolbar;
- table;
- action panel;
- `GamePanel`;
- hand.

Из-за дублирования статусов мобильный экран становится длиннее необходимого.

## 12.7. Request flow regression

При переносе shell важно сохранить:

- выбор target player;
- список requestable cards;
- preview;
- submit;
- очистку выбора;
- блокировку вне своего хода;
- обработку ошибок.

## 12.8. Finished state с открытыми окнами

При завершении игры явно не закрываются:

- `RequestCardFlow`;
- `PlayerDetailsModal`;
- preview карты;
- player popover.

Новая модель должна определить поведение этих окон.

## 12.9. Технические ID в UI

Сейчас пользователю могут показываться:

- `card.id`;
- `quartetID`.

После UI-рефакторинга технические идентификаторы не должны быть частью основного игрового представления.

## 12.10. Дублирование преобразования событий

WebSocket handlers формируют пользовательские строки самостоятельно.

`formatGameEvent` отдельно формирует строки для журнала и стола.

Одно событие может получить разные формулировки в разных областях интерфейса.

## 12.11. Большой `App.tsx`

`App.tsx` содержит состояние и логику нескольких независимых функциональных областей.

Gameplay-рефакторинг может увеличить его размер, если новые вычисления не будут вынесены в builders, hooks или selectors.

---

## 13. Recommended implementation principles

1. Не менять backend DTO ради удобства frontend-разметки.
2. Ввести отдельные gameplay UI-типы.
3. Строить UI-модель в одном месте.
4. Определить один источник истины для текущего хода.
5. Разделить persistent game action и transient toast.
6. Использовать единый центральный статус.
7. Не отображать одно состояние одновременно в трёх блоках.
8. Сделать player card самостоятельным компонентом.
9. Явно моделировать layout для 2–4 и 5–6 игроков.
10. Сохранить request flow и preview без функциональных изменений.
11. Изолировать finished state.
12. Оставить `App.tsx` координатором, а не renderer-ом всей gameplay-страницы.

---

## 14. Stage 48 implementation sequence

Рекомендуемая последовательность:

1. Ввести типизированную gameplay UI view model.
2. Ввести постоянное состояние последнего игрового действия.
3. Создать статичный gameplay shell.
4. Создать верхнюю строку состояния партии.
5. Создать компактную карточку игрока.
6. Реализовать layout стола для 2–4 игроков.
7. Реализовать компактный layout для 5–6 игроков.
8. Создать единый центральный статус партии.
9. Интегрировать backend state с новым UI shell.
10. Провести desktop/mobile UX-регрессию.

---

## 15. Audit conclusion

Текущий frontend уже содержит большую часть необходимых игровых возможностей:

- публичное состояние партии;
- приватную руку;
- игровой стол;
- отображение количества карт;
- request flow;
- preview карты;
- журнал событий;
- reconnect;
- завершение партии.

Основная проблема находится не в отсутствии функциональности, а в структуре presentation layer.

Gameplay UI сейчас распределён между:

- большим `App.tsx`;
- универсальным `GamePanel`;
- `GameplayTable`;
- отдельным action-блоком;
- temporary messages;
- toast;
- игровым журналом.

Одни и те же игровые факты отображаются в нескольких местах, а backend-состояние используется компонентами напрямую.

Stage 48 должен прежде всего создать устойчивую frontend-границу:

```text
backend state
      ↓
typed gameplay UI view model
      ↓
stable gameplay shell
      ↓
specialized presentation components
```

После появления этой границы дальнейшие UX-изменения можно будет выполнять без повторного смешивания WebSocket-логики, backend DTO и JSX-разметки.
