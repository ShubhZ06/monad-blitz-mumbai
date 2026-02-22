# MonadMons TCG - Implementation Plan & Task List

## 1. Project Setup & Architecture
**Objective:** Initialize the environments for both frontend applications and smart contracts development.
**Tasks:**
- [x] **Task 1.1:** Initialize the project using Next.js (App Router) with Tailwind CSS (`npx create-next-app`).
- [x] **Task 1.2:** Install Web3 dependencies: RainbowKit, Wagmi, and Viem.
- [x] **Task 1.3:** Setup Hardhat (or Foundry) in a `contracts` directory for Solidity development.
- [x] **Task 1.4:** Register/setup a free, fast RPC endpoint for Monad Testnet (Chain ID: 10143) via dRPC or Chainstack.
- [ ] **Task 1.5:** Setup Supabase project and gather API credentials.

## 2. Smart Contract Development
**Objective:** Develop, test, and deploy the core game economy and escrow contracts.
**Tasks:**
- [x] **Task 2.1:** Create `MonadMons.sol` (ERC-721 Contract):
  - Define NFT metadata structures (Stats: Attack, Defense, etc.).
  - Implement `mintStarter()`: Restricted to users with 0 balance.
  - Implement `claimDaily()`: Use mapping `lastFreeMintTime`, enforce 24-hour cooldown, mint standard tier.
  - Implement `buyCard()`: Payable function (e.g., 0.1 MON), mints premium tier.
- [x] **Task 2.2:** Create `BattleEscrow.sol`:
  - Implement deposit logic (`stakeNFT()`): Transfers NFT from user to escrow.
  - Implement withdrawal logic (`resolveBattle()`): Transfers both NFTs to the winner (callable via winner's UI).
- [x] **Task 2.3:** Write deploy scripts for Monad Testnet and execute deployments.

## 3. Frontend Development & Web3 Integration
**Objective:** Build the core UI and connect the application to the Monad Testnet.
**Tasks:**
- [x] **Task 3.1:** Setup `WagmiConfig` and `RainbowKitProvider` configured for Monad Testnet.
- [x] **Task 3.2:** Build the UI layout (Navbar including "Connect Wallet" button).
- [x] **Task 3.3:** Build "Shop & Claim" Page:
  - Add "Mint Starter" button (triggers `mintStarter`).
  - Add "Claim Daily Free Card" button (triggers `claimDaily` with cooldown indicator).
  - Add "Buy Premium Card" button (triggers `buyCard` paying MON).
- [x] **Task 3.4:** Build "My Collection" Dashboard to display user's NFTs and their stats.

## 4. Multiplayer Sync (Supabase) & Battle Logic
**Objective:** Implement the real-time multiplayer Top-Trumps battle.
**Tasks:**
- [x] **Task 4.1:** Set up Supabase schema/tables for lobbies (`RoomID`, `Player1`, `Player2`, `GameState`).
- [x] **Task 4.2:** Build the Battle Lobby UI (Input 4-digit code to join or create a room).
- [x] **Task 4.3:** Implement Supabase Realtime channels to sync the room state between the two players.
- [x] **Task 4.4:** Build the turn-based Top-Trumps logic and the Battle UI.

## 5. Escrow Integration & Game Loop Polish
**Objective:** Connect the end-to-end game loop using the `BattleEscrow.sol`.
**Tasks:**
- [ ] **Task 5.1:** Update Lobby Logic to require staking an NFT into `BattleEscrow.sol` before matching.
- [ ] **Task 5.2:** Implement End-of-Battle resolution: The victor's frontend client calls the smart contract to claim both NFTs from Escrow.
- [ ] **Task 5.3:** Validate edge cases: Opponent disconnects or transactions fail.
- [ ] **Task 5.4:** Complete UI polishing: Ensure the interface feels like a premium Web3 game using modern aesthetics, transitions, and proper layouts.
