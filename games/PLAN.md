# Mini Arcade — Mobile Games Plan

Goal: simple, touch-first games that kids (5+) and adults both enjoy.
No installs, no ads, no accounts, no dependencies — plain HTML/CSS/JS that
runs in any phone browser and can be "Added to Home Screen" (PWA).

## Design rules
- **One-thumb play** — big tap targets (min 56px), no tiny buttons, no keyboard needed.
- **Learn in 5 seconds** — one-line rule on screen; no reading-heavy tutorials.
- **Difficulty levels** — Easy for kids, Hard for adults, in every game.
- **Short rounds** — 30 s to 2 min, perfect for quick breaks.
- **Kind feedback** — no violence, no "you lose" shaming; cheerful sounds/vibration.
- **Best scores saved locally** (localStorage) — nothing leaves the device.
- **Works offline** after first visit (service worker).

## Games (v1)
| Game | Why it works for all ages | Kids mode | Adult mode |
|---|---|---|---|
| 🧠 **Memory Match** | Flip emoji cards, find pairs. Trains memory. | 3×4 grid (6 pairs) | 4×5 grid (10 pairs) + move counter |
| 🎈 **Balloon Pop** | Tap rising balloons in 30 s; avoid bombs. Pure reflex fun. | Slow, no bombs | Fast, bombs cost points |
| ⭕ **Tic-Tac-Toe** | Classic, play a friend or the computer. | Easy bot (random) | Unbeatable bot (minimax) |
| 🌈 **Color Sequence** | Watch the pads light up, repeat the pattern. Gets longer each round. | Slow playback | Fast playback |
| 🔤 **Word Scramble** | Tap letters to spell the word. | 3–5 letter words with picture clues | 6–8 letter words with text clues |
| 🧩 **Slide Puzzle** | Slide numbered tiles into order. | 3×3 board | 4×4 board |
| ➕ **Quick Math** | Pick the right answer before time runs out. | Add/subtract up to 10 | ×, ÷ and bigger numbers |

## Tech
```
games/
  index.html        hub with game cards
  games.css         shared theme (light/dark, big buttons)
  common.js         sound, vibration, best-score helpers
  memory.html  balloon.html  tictactoe.html  simon.html  math.html  word.html  slide.html
  manifest.webmanifest, sw.js   install + offline
```

## Future ideas (v2)
- Daily challenge + streaks
- Wrap with Capacitor to ship to Play Store / App Store
