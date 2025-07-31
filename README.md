# 🐦 Flappymon – Web3 Gacha Platformer Game

**Flappymon** is a browser-based Web3 game that combines fast-paced real-time gameplay with decentralized smart contract mechanics. Featuring gasless transactions, a token-based economy, NFT-based skill upgrades, and a full on-chain marketplace — it's a showcase of modern full-stack Web3 development done right.

> 🚀 Built with Next.js 15, Phaser.js, Solidity, EIP-2612 gasless approvals, and a sprinkle of chaos.

---

## 🎥 Demo

https://flappymon.game  
*(Live demo + walkthrough video available on the homepage)*

---

## 🧰 Tech Stack

### 🔷 Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** (UI styling)
- **Phaser.js** (Game rendering & physics)
- **Zustand** (Global state management)
- **Wagmi + Viem** (Wallet + smart contract integration)

### 🔶 Smart Contracts (Solidity)
- `FLAPTOKEN.sol`: ERC20 token w/ EIP-2612 permit support
- `Flappymon.sol`: ERC721 NFT for playable characters
- `SkillNFT.sol`: Burnable ERC721 NFTs for in-game skills
- `NFTMarketplace.sol`: Custom on-chain skill marketplace

### ⚙️ Backend & Infra
- **Next.js API Routes** (backend logic)
- **Pinata SDK v2.4.8** (IPFS metadata pinning)
- **Ethers.js** (server-side wallet tx signing)
- **Sepolia Testnet** (deployment network)
- **Vercel** (frontend hosting)

---

## 🏠 Homepage Overview

The landing page introduces players to the Flappymon ecosystem, including:

- Dynamic **wallet connection** (via MetaMask)
- Real-time **character preview** + onboarding guide
- Sections for:
  - Inventory
  - Marketplace
  - Whitepaper
  - Community
- Featured App: Flappymon (playable directly in-browser)
- $FLAP Faucet: Claim 500 tokens (gasless) via backend wallet
- Quick access to NFT Marketplace, Inventory, and Support

---

## 💰 Token & Wallet Integration

- **$FLAP Token** (ERC20) is the main in-game currency
- Users can **claim tokens** via a backend-controlled faucet
- **EIP-2612 permit** support = **gasless approval flow**
- All key transactions use **signature-based execution**

---

## 📦 Inventory

The Inventory page displays:

- ✅ $FLAP token balance
- ✅ Owned **Flappymon characters**
- ✅ Owned **Skill NFTs**

Players can:
- List skills for sale in the Marketplace (e.g. 100 $FLAP)
- Cancel listings if still the owner
- View live status of their assets

---

## 🛒 Marketplace

The Marketplace allows players to:
- Buy listed **Skill NFTs** using `$FLAP`
- Cancel listings (if they own the NFT)
- Transactions update in real-time via on-chain events

All purchases:
- Use **permit-based token approvals**
- Are executed securely via verified smart contract calls

---

## 🎮 Gameplay Mechanics

Enter the game via **Game Start** after wallet connection.

- Built in **Phaser.js**
- Endless-runner mechanics
- Controls:
  - 🖱️ Left Click: Jump
  - ⌨️ Spacebar: Use equipped Skill
  - ⌨️ Key 1: Use Consumable
- Rewards: Players earn `$FLAP` based on score

---

## 🧬 Skill Mechanics

### 🔧 Level Up
- Combine **two identical Skills** (same type & level)
- Creates a higher-level version

### 🔓 Unlock New Skills
- Combine **two different Skills** of same rarity
- Unlocks a new random skill of equal rarity

#### Rarities
| Tier | Examples |
|------|----------|
| Common | Dash, Floating |
| Rare | Gap Manipulation, Disappear |
| Epic | Pipe Destroyer |

---

## 🎰 Gacha System

Two gacha machines (accessible on homepage):
- **Skill Gacha**: Mint random Skill NFTs
- **Flappymon Gacha**: Mint playable characters

Each pull:
- Uses **MetaMask permit signature**
- Calls backend API → executes mint
- Results show in inventory immediately

---

## 🧾 Conclusion

Flappymon demonstrates a full-stack Web3 gaming experience:

- 🎮 Real-time browser gameplay
- 🎁 On-chain NFTs + skill system
- 💸 Token economy w/ gasless approvals
- 🛍️ Fully functional marketplace
- 🧠 Modular, scalable architecture
- 🔐 Secure backend wallet handling & smart contract interoperability

This project represents a polished, end-to-end decentralized app using modern tools from the Web3 and gaming stack.

---

## 🪪 License

MIT

---

## 👤 Author

Built with ✨ by Ashof

