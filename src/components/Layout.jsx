import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useGenesis } from "@/hooks/useContracts";
import { CHAIN_NAME, CHAIN_ID, ADDRESSES, EXPLORER_BASE, LINKS } from "@/config/constants";
import { getWhitepaperUrl } from "@/utils";
import FireCanvas from "./FireCanvas";

const PHASES = [
  { to: "/genesis", label: "Genesis", step: 1, desc: "Mint HBURN" },
  { to: "/epochs", label: "Epochs", step: 2, desc: "Earn ETH" },
  { to: "/staking", label: "Staking", step: 3, desc: "Stake HBURN" },
];

const CONTRACT_LINKS = [
  { label: "HBURN Token", addr: ADDRESSES.hellBurnToken },
  { label: "Genesis", addr: ADDRESSES.genesisBurn },
  { label: "Epochs", addr: ADDRESSES.burnEpochs },
  { label: "Staking", addr: ADDRESSES.hellBurnStaking },
  { label: "Buy & Burn", addr: ADDRESSES.buyAndBurn },
];

const SOCIAL_ITEMS = [
  /*{ label: "𝕏 Twitter", href: LINKS.twitter, icon: "𝕏" },
  { label: "Telegram", href: LINKS.telegram, icon: "✈" },
  { label: "Discord", href: LINKS.discord, icon: "💬" },*/
];

export default function Layout() {
  const { account, shortAddr, connecting, isCorrectChain, connect, disconnect, switchChain } = useWallet();
  const genesis = useGenesis();
  const [genesisActive, setGenesisActive] = useState(true);
  const isTestnet = CHAIN_ID !== 1;

  // Track genesis state for phase indicators
  useEffect(() => {
    if (!genesis) return;
    (async () => {
      try {
        const [ended, genesisEnd] = await Promise.all([
          genesis.genesisEnded(),
          genesis.genesisEnd(),
        ]);
        const now = Math.floor(Date.now() / 1000);
        // Genesis is inactive if ended flag set OR time has passed
        setGenesisActive(!ended && now <= Number(genesisEnd));
      } catch { /* fallback: assume active */ }
    })();
  }, [genesis]);

  const activePhase = genesisActive ? 1 : 3; // 1=genesis active, 3=all unlocked

  return (
    <div className="min-h-screen relative flex flex-col" style={{
      background: "#050508",
    }}>
      {/* Scorch Background — subtle on subpages, Dashboard has its own hero */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/scorch-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 15%",
          backgroundRepeat: "no-repeat",
          opacity: 0.08,
        }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 40%, transparent 20%, rgba(5,5,8,0.7) 70%, rgba(5,5,8,0.95) 100%)",
        }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 60%, rgba(255,69,0,0.04) 0%, transparent 50%)",
        }} />
      </div>
      <FireCanvas />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06]" style={{
        background: "rgba(5, 5, 8, 0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="font-display font-black text-2xl fire-text tracking-tight hover:opacity-80 transition-opacity">
            HELLBURN
          </NavLink>

          {/* Nav — Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end
              className={({ isActive }) => `hb-nav-link ${isActive ? "active" : ""}`}>
              Dashboard
            </NavLink>
            {PHASES.map(({ to, label, step }) => {
              const isLocked = step === 1 ? !genesisActive : genesisActive;
              return (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `hb-nav-link flex items-center gap-2 ${isActive ? "active" : ""} ${isLocked ? "opacity-40" : ""}`
                  }>
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold leading-none
                    ${step <= activePhase
                      ? "bg-fire-1/20 text-fire-3 border border-fire-2/40"
                      : "bg-dark-4/60 text-txt-3 border border-dark-5"
                    }`}>
                    {step}
                  </span>
                  {label}
                  {isLocked && <span className="text-[9px]">🔒</span>}
                </NavLink>
              );
            })}
            {isTestnet && (
              <NavLink to="/testnet"
                className={({ isActive }) =>
                  `hb-nav-link flex items-center gap-2 ${isActive ? "!text-purple-400 !bg-purple-500/10" : ""}`
                }>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold leading-none bg-purple-500/20 text-purple-400 border border-purple-500/40">
                  🧪
                </span>
                Testnet
              </NavLink>
            )}
          </nav>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {account && !isCorrectChain && (
              <button onClick={switchChain}
                className="text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">
                Switch to {CHAIN_NAME}
              </button>
            )}
            {account ? (
              <button onClick={disconnect}
                className="px-4 py-2 bg-dark-4 border border-fire-2/30 rounded-lg text-sm font-mono">
                {shortAddr}
              </button>
            ) : (
              <button onClick={connect} disabled={connecting}
                className="px-5 py-2 bg-gradient-to-r from-fire-1 to-fire-2 rounded-lg text-sm font-semibold uppercase tracking-wider text-white hover:-translate-y-0.5 transition-all">
                {connecting ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          <NavLink to="/" end
            className={({ isActive }) => `hb-nav-link whitespace-nowrap text-xs ${isActive ? "active" : ""}`}>
            Dashboard
          </NavLink>
          {PHASES.map(({ to, label, step }) => {
            const isLocked = step === 1 ? !genesisActive : genesisActive;
            return (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `hb-nav-link whitespace-nowrap text-xs flex items-center gap-1.5 ${isActive ? "active" : ""} ${isLocked ? "opacity-40" : ""}`
                }>
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold
                  ${step <= activePhase
                    ? "bg-fire-1/20 text-fire-3 border border-fire-2/40"
                    : "bg-dark-4/60 text-txt-3 border border-dark-5"
                  }`}>
                  {step}
                </span>
                {label}
                {isLocked && <span className="text-[8px]">🔒</span>}
              </NavLink>
            );
          })}
          {isTestnet && (
            <NavLink to="/testnet"
              className={({ isActive }) =>
                `hb-nav-link whitespace-nowrap text-xs flex items-center gap-1.5 ${isActive ? "!text-purple-400 !bg-purple-500/10" : ""}`
              }>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                🧪
              </span>
              Testnet
            </NavLink>
          )}
        </nav>
      </header>

      {/* Page Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-8 flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] mt-auto" style={{
        background: "rgba(5, 5, 8, 0.35)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Brand */}
            <div>
              <div className="font-display font-black text-xl fire-text tracking-tight mb-3">HELLBURN</div>
              <p className="text-xs text-txt-3 leading-relaxed mb-4">
                Competitive Burn-to-Earn protocol</p>
              <div className="flex gap-2">
                {SOCIAL_ITEMS.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-dark-3 border border-dark-5 flex items-center justify-center text-sm text-txt-2 hover:border-fire-2 hover:text-fire-3 transition-all"
                    title={s.label}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-[10px] uppercase tracking-[2px] text-txt-3 mb-3">Resources</h4>
              <div className="space-y-2">
                <a href={getWhitepaperUrl()} target="_blank" rel="noopener noreferrer"
                  className="block text-xs text-txt-2 hover:text-fire-3 transition-colors">
                  📄 Whitepaper
                </a>
              </div>
            </div>

            {/* Ecosystem */}
            <div>
              <h4 className="text-[10px] uppercase tracking-[2px] text-txt-3 mb-3">Ecosystem</h4>
              <div className="space-y-2">
                <a href={LINKS.titanx} target="_blank" rel="noopener noreferrer"
                  className="block text-xs text-txt-2 hover:text-fire-3 transition-colors">
                  🔥 TitanX
                </a>
                <a href={LINKS.dragonx} target="_blank" rel="noopener noreferrer"
                  className="block text-xs text-txt-2 hover:text-fire-3 transition-colors">
                  🐉 DragonX
                </a>
              </div>
            </div>

            {/* Contracts */}
            <div>
              <h4 className="text-[10px] uppercase tracking-[2px] text-txt-3 mb-3">Verified Contracts</h4>
              <div className="space-y-1.5">
                {CONTRACT_LINKS.map((c) => (
                  <a key={c.label}
                    href={`${EXPLORER_BASE}/address/${c.addr}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 group text-xs">
                    <span className="text-txt-2 group-hover:text-fire-3 transition-colors">{c.label}</span>
                    <span className="font-mono text-[9px] text-txt-3 group-hover:text-fire-2 transition-colors">
                      {c.addr.slice(0, 6)}...{c.addr.slice(-4)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-6 border-t border-dark-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-txt-3">
              ⚠️ Smart contracts are unaudited. Use at your own risk. DYOR.
            </p>
            <p className="text-[10px] text-txt-3">
              HellBurn Protocol © {new Date().getFullYear()} — Built on TitanX
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
