# Product Requirements Document (PRD)
# Shadow Poker - Texas Hold'em

## 1. Overview

**Product Name:** Shadow Poker
**Version:** 1.0
**Date:** 2026-03-20
**Tech Stack:** React + TypeScript
**Platform:** Web (Browser-based)

### 1.1 Vision
A single-player Texas Hold'em No-Limit poker game with a dark, mysterious casino atmosphere. Players face 1-5 AI opponents with configurable difficulty levels. The game emphasizes authentic poker rules, immersive visuals, and strategic gameplay.

### 1.2 Target Audience
- Poker enthusiasts who want to practice strategy
- Casual gamers looking for an atmospheric card game
- Beginners learning Texas Hold'em rules and hand rankings

---

## 2. Game Rules & Mechanics

### 2.1 Poker Variant
- **Texas Hold'em (No Limit)**
- Standard 52-card deck, no jokers
- Follows official World Series of Poker (WSOP) rules

### 2.2 Game Flow
1. **Pre-Game Setup:** Player selects number of opponents (1-5) and AI difficulty
2. **Blinds:** Small blind and big blind posted by designated positions
3. **Pre-Flop:** Each player receives 2 hole cards; betting round
4. **Flop:** 3 community cards dealt; betting round
5. **Turn:** 1 community card dealt; betting round
6. **River:** 1 community card dealt; final betting round
7. **Showdown:** Best 5-card hand from 7 available cards wins the pot
8. **Dealer button rotates** clockwise each hand

### 2.3 Hand Rankings (highest to lowest)
1. Royal Flush (A-K-Q-J-10, same suit)
2. Straight Flush (5 sequential cards, same suit)
3. Four of a Kind (4 cards of same rank)
4. Full House (3 of a kind + pair)
5. Flush (5 cards of same suit)
6. Straight (5 sequential cards)
7. Three of a Kind (3 cards of same rank)
8. Two Pair (2 different pairs)
9. One Pair (2 cards of same rank)
10. High Card (no combination)

### 2.4 Betting Rules
- **No Limit:** Players can bet any amount up to their chip stack
- **Actions:** Fold, Check, Call, Raise, All-In
- **Minimum raise:** Must be at least the size of the previous raise
- **Side pots:** Automatically created when a player goes all-in with less than other players' bets
- **Blinds:** Fixed at Small Blind $5 / Big Blind $10

### 2.5 Winning Conditions
- Win all chips from all opponents (session victory)
- Individual hand wins determined by best 5-card hand or last player standing (all others fold)
- Ties split the pot equally

### 2.6 Session Rules
- Starting stack: $1,000 per player
- Session resets when player loses all chips or chooses to restart
- No carry-over between sessions

---

## 3. AI Opponents

### 3.1 Difficulty Levels

| Level | Behavior |
| --- | --- |
| **Easy** | Plays passively, rarely bluffs, calls too often, makes basic mistakes, limited position awareness |
| **Medium** | Balanced play, occasional bluffs, understands pot odds, moderate position awareness, some hand reading |
| **Hard** | Aggressive and strategic, calculates pot odds, bluffs intelligently, reads betting patterns, strong positional play |

### 3.2 AI Features
- Each AI player has a unique name and avatar
- AI decision-making includes randomized timing (1-4 seconds) to simulate real thinking
- AI adapts slightly based on player behavior within a session (Hard only)
- AI respects standard poker etiquette (no string betting, proper raise amounts)

### 3.3 AI Player Pool
- 8-10 pre-defined AI characters with unique names, avatars, and slight personality variations within their difficulty level
- Player selects difficulty level; characters are randomly assigned from that pool

---

## 4. User Interface & Visual Design

### 4.1 Theme: Dark & Mysterious Casino
- **Color Palette:**
  - Primary background: Deep black (#0a0a0a) to dark charcoal (#1a1a2e)
  - Accent colors: Gold (#d4af37), crimson red (#8b0000), emerald green (#004d00)
  - Text: Off-white (#e0e0e0) with gold highlights
  - Card glow effects: Subtle neon purple (#6a0dad) and blue (#1a237e)
- **Cards:** Animated card flip with 3D rotation, glowing edges on hover
- **Particles:** Floating ambient particles (embers, sparks), burst effects on wins and all-ins
- **Glow effects:** Neon-edge glow on active elements, pulsing highlights on player's turn
- **Transitions:** Smooth CSS transitions on all state changes, slide-in/fade animations
- **Typography:** Elegant serif font for titles, clean sans-serif for game info

### 4.2 Layout
```
+-------------------------------------------------------+
|  [Logo]        SHADOW POKER          [Settings] [Help] |
|-------------------------------------------------------|
|                                                       |
|              [ AI Player 3 ]                          |
|         [ AI 2 ]        [ AI 4 ]                      |
|      [ AI 1 ]              [ AI 5 ]                   |
|                                                       |
|              [  POKER TABLE  ]                         |
|              [ Community Cards ]                       |
|              [    POT: $XXX    ]                       |
|                                                       |
|              [ YOUR CARDS ]                            |
|  [Stats]  [Fold] [Check/Call] [Raise] [All-In]        |
|-------------------------------------------------------|
|  Chips: $XXX  |  Hand: #XX  |  Blind: $5/$10         |
+-------------------------------------------------------+
```

### 4.3 Screens
1. **Main Menu** - Title screen with animated background, Play / Settings / Tutorial / Stats
2. **Game Setup** - Select number of opponents (1-5), select difficulty (Easy/Medium/Hard)
3. **Game Table** - Primary gameplay screen (see layout above)
4. **Hand Result** - Overlay showing winning hand, pot distribution
5. **Game Over** - Session summary with stats, option to play again
6. **Settings** - Sound volume, game speed, card back style
7. **Tutorial** - Interactive guide to poker rules and hand rankings
8. **Stats Dashboard** - Historical session data, win rates, best hands

### 4.4 Animations & Effects
- Card dealing: Smooth slide animation from deck to player positions
- Card flip: 3D rotation reveal animation
- Chip movements: Chips slide toward pot when betting
- Win celebration: Gold particle burst, pot slides to winner
- Fold: Cards fade and slide to muck
- All-in: Dramatic glow effect on player area
- Community card reveals: Sequential with suspenseful timing
- Ambient: Subtle floating particle effects (dust in spotlight)

---

## 5. Audio Design

### 5.1 Sound Effects
| Event | Sound |
| --- | --- |
| Card deal | Crisp card slide/snap |
| Card flip | Paper flip sound |
| Chip bet/call | Ceramic chip click/stack |
| Fold | Soft card toss |
| Check | Knuckle tap on table |
| Win pot | Chip cascade/collection |
| All-in | Dramatic chip push |
| Button click | Subtle UI click |
| Round transition | Soft atmospheric tone |

### 5.2 Audio Controls
- Master volume slider in settings
- Individual toggle for sound effects
- Mute button accessible from game screen

---

## 6. Stats & Hand History

### 6.1 Session Stats
- Hands played
- Hands won / win rate percentage
- Biggest pot won
- Current chip count over time (line chart)
- Best hand achieved

### 6.2 Hand History
- Scrollable log of recent hands
- Each entry shows: hand number, cards, result, pot size
- Expandable detail view showing all betting actions

### 6.3 Lifetime Stats (stored in localStorage)
- Total sessions played
- Total hands played
- Overall win rate
- Best single hand ever
- Longest win streak

---

## 7. Tutorial System

### 7.1 Quick Reference
- Hand rankings chart accessible via help button during gameplay
- Hover tooltips on action buttons explaining each option
- Current hand strength indicator (optional toggle)

### 7.2 Tutorial Mode
- Step-by-step walkthrough of a sample hand
- Explains each phase: blinds, pre-flop, flop, turn, river, showdown
- Interactive - player makes decisions with guidance
- Accessible from main menu

---

## 8. Strategy Advisor Overlay (Cheat Sheet)

### 8.1 Overview
A toggleable overlay accessible during gameplay that provides real-time statistical analysis and action recommendations. Acts as a poker coach/cheat sheet to help players learn optimal play.

### 8.2 Win Probability Display
- **Current hand strength:** Percentage chance of winning with current hole cards + community cards
- **Per-action win statistics:**
  | Action | Display |
  |--------|---------|
  | Fold | Expected value lost by folding |
  | Check/Call | Win probability if checking/calling |
  | Raise | Win probability if raising (with suggested raise amounts) |
  | All-In | Win probability if going all-in |
- **Outs counter:** Number of cards remaining that improve the hand, with percentage to hit
- **Pot odds:** Current pot odds vs. odds of completing a draw

### 8.3 Recommended Action
- Highlighted "Recommended" badge on the statistically optimal action button
- Color-coded confidence: Green (strong recommendation), Yellow (marginal), Red (avoid)
- Brief explanation text (e.g., "You have 32% equity with 9 outs to a flush. Pot odds favor a call.")
- Monte Carlo simulation runs ~1000 random remaining boards to estimate outcomes

### 8.4 Hand Strength Meter
- Visual gauge showing current hand strength from 0-100%
- Updates in real-time as community cards are revealed
- Shows hand ranking label (e.g., "Top Pair, King Kicker")

### 8.5 Toggle & Settings
- Toggle on/off via "Advisor" button in HUD or keyboard shortcut (A key)
- Opacity/transparency slider so it doesn't block gameplay
- Can be enabled per-phase (e.g., only show on river) or always-on
- Disabled by default; persisted in settings via localStorage

---

## 9. Technical Architecture

### 9.1 Project Structure
```
src/
  components/
    Game/         - Main game container, game loop management
    Table/        - Poker table rendering, community cards area
    Cards/        - Card components, deck visualization
    Players/      - Player seats, chip displays, hole cards
    UI/           - Buttons, sliders, modals, overlays
    HUD/          - Heads-up display: pot, blinds, hand info
    Menu/         - Main menu, game setup, settings screens
    Tutorial/     - Tutorial overlays and hand ranking reference
  engine/
    poker/        - Core game logic: deck, hand evaluation, game state
    ai/           - AI decision-making engine per difficulty level
    betting/      - Betting round management, pot calculation, side pots
  hooks/          - Custom React hooks (useGameState, useAI, useSound, etc.)
  context/        - React context providers (GameContext, SettingsContext)
  utils/          - Helper functions (card formatting, chip formatting, etc.)
  types/          - TypeScript type definitions and interfaces
  styles/         - Global styles, theme variables, animations
  assets/
    images/
      cards/      - Card face images (52 cards + card back)
      table/      - Table felt textures, backgrounds
      avatars/    - AI player avatar images
    sounds/       - Sound effect audio files
    fonts/        - Custom typography files
```

### 9.2 Core State Management
- React Context for global game state
- Game phases managed via state machine pattern
- Immutable state updates for predictable game flow

### 9.3 Key Modules
- **Deck Manager:** Shuffle (Fisher-Yates), deal, burn cards
- **Hand Evaluator:** Evaluate best 5-card hand from 7 cards, compare hands
- **Pot Manager:** Main pot, side pots, pot splitting
- **AI Engine:** Decision tree per difficulty, configurable aggression/bluff factors
- **Animation Controller:** Sequenced animations with timing control

---

## 10. Non-Functional Requirements

### 9.1 Performance
- 60fps animations on modern browsers
- Game state updates < 16ms
- AI decision computation < 500ms

### 9.2 Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Responsive design: minimum 1024px width, optimized for 1920x1080

### 9.3 Accessibility
- Keyboard navigation for all game actions
- Color-blind-friendly suit indicators (shape-coded in addition to color)
- Screen reader labels for game state

### 9.4 Data Persistence
- localStorage for settings preferences
- localStorage for lifetime stats
- No server/backend required

---

## 11. Future Considerations (Out of Scope for v1.0)
- Multiplayer (online) mode
- Additional poker variants (Omaha, Five Card Draw)
- Tournament mode with increasing blinds
- Achievement system
- Card/table customization shop
- Mobile-responsive layout
- Replay system for reviewing past hands
