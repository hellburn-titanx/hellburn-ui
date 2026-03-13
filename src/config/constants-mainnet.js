// ─── Deployed Addresses (Mainnet) ─────────────────────────────────
// Run sync-addresses.js after deploy, or paste from deployment-mainnet.json
export const ADDRESSES = {
  hellBurnToken: "DEPLOY_FIRST",
  genesisBurn: "DEPLOY_FIRST",
  burnEpochs: "DEPLOY_FIRST",
  hellBurnStaking: "DEPLOY_FIRST",
  buyAndBurn: "DEPLOY_FIRST",
  titanX: "0xF19308F923582A6f7c465e5CE7a9Dc1BEC6665B1",
  dragonX: "0x96a5399D07896f757Bd4c6eF56461F58DB951862",
};

// ─── Chain ────────────────────────────────────────────────────────
export const CHAIN_ID = 1;
export const CHAIN_NAME = "Ethereum";
export const RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY";

// ─── Tokenomics Constants (PRODUCTION) ────────────────────────────
export const LP_RESERVE_PERCENT = 3;
export const GENESIS_DURATION_DAYS = 28;
export const EPOCH_DURATION_DAYS = 8;
export const MAX_STAKE_DAYS = 3500;
export const MIN_STAKE_DAYS = 28;
export const STAKE_UNIT_SECONDS = 86400; // 1 day = 86400 seconds

export const WEEKS = [
  { week: 1, ratio: 100, bonus: 115, label: "1:1", bonusLabel: "+15%" },
  { week: 2, ratio: 95, bonus: 110, label: "1:0.95", bonusLabel: "+10%" },
  { week: 3, ratio: 90, bonus: 105, label: "1:0.90", bonusLabel: "+5%" },
  { week: 4, ratio: 85, bonus: 100, label: "1:0.85", bonusLabel: "—" },
];

export const TITANX_DISTRIBUTION = [
  { label: "Permanent Burn", pct: 35, color: "#ff4500", icon: "🔥" },
  { label: "DragonX Vault", pct: 35, color: "#8b5cf6", icon: "🐉" },
  { label: "Treasury Stake", pct: 22, color: "#f59e0b", icon: "🏦" },
  { label: "LP Fund (Fair Launch)", pct: 8, color: "#64748b", icon: "🔗" },
];

export const STAKE_TIERS = [
  { name: "Bronze", minDays: 28, color: "#cd7f32" },
  { name: "Silver", minDays: 90, color: "#c0c0c0" },
  { name: "Gold", minDays: 369, color: "#ffd700" },
  { name: "Platinum", minDays: 888, color: "#e5e4e2" },
  { name: "Diamond", minDays: 3500, color: "#b9f2ff" },
];

export const getTier = (days) => {
  for (let i = STAKE_TIERS.length - 1; i >= 0; i--) {
    if (days >= STAKE_TIERS[i].minDays) return STAKE_TIERS[i];
  }
  return STAKE_TIERS[0];
};

// ─── External Links ──────────────────────────────────────────────
export const EXPLORER_BASE = "https://etherscan.io";

export const LINKS = {
  whitepaper: "#",          // TODO: PDF URL or hosted link
  gitbook: "#",             // TODO: docs.hellburn.win
  twitter: "https://x.com/hellburn_titanx",
  telegram: "https://t.me/hellburn_crypto",            // TODO: https://t.me/hellburn_official
  discord: "#",             // TODO: https://discord.gg/hellburn
  dexscreener: "#",         // Available after endGenesis() + LP creation
  titanx: "https://titanx.win",
  dragonx: "https://dragonx.win",
};
