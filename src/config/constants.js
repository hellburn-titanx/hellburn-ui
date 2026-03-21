// ─── Deployed Addresses (Sepolia) ─────────────────────────────────
// Update these after mainnet deployment
// ─── Deployed Addresses (Mainnet) ───────────────────────────────────────────
export const ADDRESSES = {
  hellBurnToken:   "0xc4f13b2d48e851e13df10e962dc7ad1ed1201568",
  genesisBurn:     "0xae0e254cd3832ef19401a7f069b9526fc9696693",
  burnEpochs:      "0x473caB6E7589f53841344513FcFF49c2A944d486",
  hellBurnStaking: "0xb85c0c20e5dbe081e8609ed2c0c0384d5afa198c",
  buyAndBurn:      "0x5695fd32aae7107f4a44f4bbd21adf265a027cbb",
  titanX:          "0xF19308F923582A6f7c465e5CE7a9Dc1BEC6665B1",
  dragonX:         "0x96a5399D07896f757Bd4c6eF56461F58DB951862",
};

// ─── Chain ───────────────────────────────────────────────────────────────────
export const CHAIN_ID = 1; // Mainnet
export const CHAIN_NAME = "Ethereum";
export const RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/demo";

// ─── Tokenomics Constants ────────────────────────────────────────────────────
export const LP_RESERVE_PERCENT = 3;
export const GENESIS_DURATION_DAYS = 28;
export const GENESIS_DURATION_HOURS = 672; // 28 * 24
export const EPOCH_DURATION_DAYS = 8;
export const MAX_STAKE_DAYS = 3500;  // Mainnet
export const MIN_STAKE_DAYS = 28;    // Mainnet
export const STAKE_UNIT_SECONDS = 86400; // Mainnet: 1 day = 86400s

export const WEEKS = [
  { week: 1, ratio: 100, bonus: 115, label: "1:1", bonusLabel: "+15%" },
  { week: 2, ratio: 95, bonus: 110, label: "1:0.95", bonusLabel: "+10%" },
  { week: 3, ratio: 90, bonus: 105, label: "1:0.90", bonusLabel: "+5%" },
  { week: 4, ratio: 85, bonus: 100, label: "1:0.85", bonusLabel: "—" },
];

export const TITANX_DISTRIBUTION = [
  { label: "Permanent Burn", pct: 35, color: "#ff4500", icon: "🔥" },
  { label: "DragonX Vault", pct: 35, color: "#8b5cf6", icon: "🐉" },
  { label: "Treasury (Auto-Staked)", pct: 22, color: "#f59e0b", icon: "🏦" },
  { label: "LP Fund (Fair Launch)", pct: 8, color: "#64748b", icon: "🔗" },
];

export const STAKE_TIERS = [
  { name: "Bronze",   minDays: 28,   color: "#cd7f32" },
  { name: "Silver",   minDays: 90,   color: "#c0c0c0" },
  { name: "Gold",     minDays: 369,  color: "#ffd700" },
  { name: "Platinum", minDays: 888,  color: "#e5e4e2" },
  { name: "Diamond",  minDays: 3500, color: "#b9f2ff" },
];

export const getTier = (days) => {
  for (let i = STAKE_TIERS.length - 1; i >= 0; i--) {
    if (days >= STAKE_TIERS[i].minDays) return STAKE_TIERS[i];
  }
  return STAKE_TIERS[0];
};

// ─── External Links ──────────────────────────────────────────────
export const EXPLORER_BASE = CHAIN_ID === 1
  ? "https://etherscan.io"
  : "https://sepolia.etherscan.io";

export const LINKS = {
  whitepaper: "#",          // TODO: update with real URL
  gitbook: "#",             // TODO: update with GitBook docs URL
  twitter: "https://x.com/HellburnTitanX",
  telegram: "https://t.me/hellburn_titanx_crypto",  
  discord: "#",             // TODO: https://discord.gg/hellburn
  dexscreener: "#",         // TODO: https://dexscreener.com/ethereum/...
  titanx: "https://titanx.win",
  dragonx: "https://dragonx.win",
};
