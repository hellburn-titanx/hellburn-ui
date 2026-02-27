// ─── Deployed Addresses (Sepolia) ─────────────────────────────────
// Update these after mainnet deployment
export const ADDRESSES = {
  hellBurnToken: "0x5a1A7f60B872f0A6F9Bc9935484aE9e813899860",
  genesisBurn: "0x57a2e10C64936FBCCdF1A6522A67B9a6C6bcc644",
  burnEpochs: "0x3b2956EAb2EB94409Ed47922c3057Cab576F8828",
  hellBurnStaking: "0xD748e6A93A182f424948d9a0F29785798334dFD0",
  buyAndBurn: "0x691544332a66e1d53ae6904b3F7B3E6259AADb30",
  titanX: "0xd2F698c37C1447a0312459A09296577958864196",
  dragonX: "0xc6bC262DF37FaE51a1d2Dd61c402Dc52A8CC9AC3",
};

// ─── Chain ────────────────────────────────────────────────────────
export const CHAIN_ID = 11155111; // Sepolia. Change to 1 for mainnet.
export const CHAIN_NAME = "Sepolia";
export const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/demo";

// ─── Tokenomics Constants ─────────────────────────────────────────
export const GENESIS_DURATION_DAYS = 28;
export const GENESIS_DURATION_HOURS = 12; // Beta: 12h instead of 28 days
export const EPOCH_DURATION_DAYS = 8;
export const MAX_STAKE_DAYS = 3500;
export const MIN_STAKE_DAYS = 28;

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
  { label: "Genesis Fund", pct: 8, color: "#64748b", icon: "⚙️" },
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
export const EXPLORER_BASE = CHAIN_ID === 1
  ? "https://etherscan.io"
  : "https://sepolia.etherscan.io";

export const LINKS = {
  whitepaper: "#",          // TODO: update with real URL
  gitbook: "#",             // TODO: update with GitBook docs URL
  twitter: "#",             // TODO: https://twitter.com/hellburn
  telegram: "#",            // TODO: https://t.me/hellburn
  discord: "#",             // TODO: https://discord.gg/hellburn
  dexscreener: "#",         // TODO: https://dexscreener.com/ethereum/...
  titanx: "https://titanx.win",
  dragonx: "https://dragonx.win",
};
