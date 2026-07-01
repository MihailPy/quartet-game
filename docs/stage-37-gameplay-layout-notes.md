# Stage 37 — Gameplay Layout Research & Prototype

## Result

Stage 37 introduced the first gameplay layout prototype.

Implemented:

- card image standards;
- gameplay layout documentation;
- gameplay table component;
- player seats prototype;
- card backs for player card counts;
- completed quartets inside table area;
- latest game events near the table;
- bottom hand zone;
- horizontal hand scroll prototype;
- card preview modal.

---

## What works well

### Gameplay table concept

Moving from a panel-based layout toward a table-centric layout is the correct direction.

The gameplay area now feels closer to a real card game.

### Bottom hand zone

Placing the player's hand near the bottom of the screen feels natural.

This is the correct direction for both desktop and mobile.

### Card preview modal

Card preview works well on both desktop and mobile.

It provides a good foundation for future card art integration.

---

## Problems discovered

### 1. Current layout is still too panel-based

Current structure still behaves like stacked panels:

- gameplay table
- game panel
- player hand

This is not ideal for a real gameplay experience.

Future layout should be table-first.

---

### 2. Player seat positioning does not scale well

With 3+ players:

- seats overlap;
- player names collide;
- card backs become hard to read.

Current seat positioning is only a prototype.

---

### 3. Player hand does not feel like a real hand of cards

Current hand zone still behaves like a panel.

Future hand zone should:

- feel like physical cards in hand;
- support overlap;
- support horizontal scrolling;
- support card art.

---

### 4. Mobile layout needs a dedicated design

Current mobile layout has several issues:

- gameplay table becomes crowded;
- hand zone takes too much vertical space;
- request flow competes for screen space.

Mobile gameplay should not reuse desktop layout directly.

---

## Important UX ideas for future stages

### Collapsible Hand Zone

On mobile, player hand should be collapsible.

Collapsed:

- only hand summary is visible.

Expanded:

- full hand becomes visible.

This frees a large amount of screen space.

---

### Real Card Hand Layout

Cards in hand should be displayed:

- horizontally;
- with overlap;
- like a real hand of cards.

Not as a standard panel/grid.

---

### Fullscreen Request Flow

Card request flow should become fullscreen.

Recommended flow:

1. Open request mode
2. Select player
3. Select card
4. Confirm request

This prevents gameplay UI from becoming overcrowded.

---

### Card interaction rules

Recommended interaction:

Single tap:

- open card preview.

Double tap:

- select card.

This allows both inspection and quick gameplay.

---

### Hand visibility during request

Player must still be able to see their hand while choosing a card to request.

This is important for decision-making.

---

## Decision

Stage 37 is complete as a research and prototype stage.

Do not continue polishing this prototype.

Next stages should focus on:

- full gameplay UI redesign;
- proper desktop layout;
- dedicated mobile layout;
- better interaction flows;
- foundation for animations, sound, and haptics.
