// ─── Deployed Addresses (Sepolia) ─────────────────────────────────
// Update these after mainnet deployment
export const ADDRESSES = {
  hellBurnToken: "0xE96ff25b301cf99e90C657a8cC10565DAdFD01F8",
  genesisBurn: "0x92c78B689a9E0E4daA85823b0aFc837Cc2d67206",
  burnEpochs: "0x2E2c7e011e0fD8043EB76Ce28ad74eC9CF963f3b",
  hellBurnStaking: "0x44F896671e0187dc51B956Fb431f8d380bC3e04F",
  buyAndBurn: "0x3B3adbaf4167129C75342C54a2cb9C8755157349",
  titanX: "0xbE57b315975bFbcB992C76DC28fb21DeAa4A403D",
  dragonX: "0x66bBD615975e4f88D629797f0D04209C9891c47D",
};

// ─── Chain ────────────────────────────────────────────────────────
export const CHAIN_ID = 11155111; // Sepolia. Change to 1 for mainnet.
export const CHAIN_NAME = "Sepolia";
export const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/demo";

// ─── Tokenomics Constants ─────────────────────────────────────────
export const LP_RESERVE_PERCENT = 3; // 3% of minted HBURN → LP reserve
export const GENESIS_DURATION_DAYS = 28;
export const GENESIS_DURATION_HOURS = 12; // Beta: 12h instead of 28 days
export const EPOCH_DURATION_DAYS = 8;
export const MAX_STAKE_DAYS = 24;    // Beta: 24 days (mainnet: 3500)
export const MIN_STAKE_DAYS = 1;      // Beta: 1 day (mainnet: 28)
export const STAKE_UNIT_SECONDS = 3600; // Beta: 1 "day" = 1 hour (mainnet: 86400)

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
  { name: "Bronze", minDays: 1, color: "#cd7f32" },     // Beta (mainnet: 28)
  { name: "Silver", minDays: 4, color: "#c0c0c0" },     // Beta (mainnet: 90)
  { name: "Gold", minDays: 8, color: "#ffd700" },        // Beta (mainnet: 369)
  { name: "Platinum", minDays: 16, color: "#e5e4e2" },   // Beta (mainnet: 888)
  { name: "Diamond", minDays: 24, color: "#b9f2ff" },    // Beta (mainnet: 3500)
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
  telegram: "https://t.me/hellburn_crypto",            // TODO: https://t.me/hellburn
  discord: "#",             // TODO: https://discord.gg/hellburn
  dexscreener: "#",         // TODO: https://dexscreener.com/ethereum/...
  titanx: "https://titanx.win",
  dragonx: "https://dragonx.win",
};
