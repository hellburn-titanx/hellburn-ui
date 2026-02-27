import { formatEther, parseEther } from "ethers";

// Format large numbers: 1.23M, 45.6K, etc.
export function fmt(n) {
  const num = typeof n === "bigint" ? Number(formatEther(n)) : Number(n);
  if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  if (Math.abs(num) >= 1) return num.toFixed(2);
  if (Math.abs(num) >= 0.001) return num.toFixed(4);
  return num.toFixed(6);
}

// Format ETH values
export function fmtETH(wei) {
  if (!wei) return "0";
  return fmt(wei) + " ETH";
}

// Relative time: "3d 12h left" or "ended"
export function timeLeft(endTimestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(endTimestamp) - now;
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h left`;
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m left`;
}

// Shorten address
export function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Safe BigInt → number for display
export function bn(val) {
  if (!val) return 0;
  return Number(formatEther(val));
}

// Parse user input to BigInt (ether)
export function toWei(val) {
  try { return parseEther(String(val || "0")); }
  catch { return 0n; }
}

// Calculate HBURN output for genesis
export function calcGenesisOutput(titanXAmount, weekNum) {
  const ratios = [100, 95, 90, 85];
  const bonuses = [115, 110, 105, 100];
  const w = Math.max(0, Math.min(3, weekNum - 1));
  return (titanXAmount * ratios[w] * bonuses[w]) / 10000;
}

export function getWhitepaperUrl() {
  const lang = (navigator.language || "en").toLowerCase();
  return lang.startsWith("de") ? "/public/HellBurn_Whitepaper_v2.0_DE.pdf" : "/HellBurn_Whitepaper_v2.0_EN.pdf";
}

// Sleep helper for TX animations
export function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
