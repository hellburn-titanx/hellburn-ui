import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useGenesis, useEpochs, useStaking, useBuyBurn, useHBURN } from "@/hooks/useContracts";
import { fmt, fmtETH, bn, timeLeft, getWhitepaperUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { account } = useWallet();
  const genesis = useGenesis();
  const epochs = useEpochs();
  const staking = useStaking();
  const buyBurn = useBuyBurn();
  const hburn = useHBURN();

  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!genesis) return;
    (async () => {
      try {
        const [
          totalTitanBurned, totalMinted, genesisEnd, genesisEnded,
          epochsTitanBurned, epochsDragonBurned, totalETHDist,
          currentEpoch, firstEpochStart,
          totalShares, totalETHReceived,
          buyBurnETH, buyBurnHBURN,
          hburnSupply,
        ] = await Promise.all([
          genesis.totalTitanXBurned(),
          genesis.totalHBURNMinted(),
          genesis.genesisEnd(),
          genesis.genesisEnded(),
          epochs.totalTitanXBurned(),
          epochs.totalDragonXBurned(),
          epochs.totalETHDistributed(),
          epochs.currentEpochId(),
          epochs.firstEpochStart(),
          staking.totalShares(),
          staking.totalETHReceived(),
          buyBurn.totalETHUsed(),
          buyBurn.totalHBURNBurned(),
          hburn.totalSupply(),
        ]);

        setData({
          totalTitanBurned, totalMinted, genesisEnd, genesisEnded,
          epochsTitanBurned, epochsDragonBurned, totalETHDist,
          currentEpoch, firstEpochStart,
          totalShares, totalETHReceived,
          buyBurnETH, buyBurnHBURN, hburnSupply,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    })();
  }, [genesis, epochs, staking, buyBurn, hburn, account]);

  return (
    <>
      {/* ═══ HERO — Scorch fullscreen, content flows below ═══ */}
      <section className="relative -mx-4 sm:-mx-6 -mt-16 sm:-mt-24 mb-8">
        <div className="relative w-full h-[70vh] sm:h-[80vh] overflow-hidden">
          {/* Scorch — full, prominent, the star */}
          <img
            src="/scorch-bg.png"
            alt="Scorch"
            className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
            style={{ filter: "saturate(1.2) contrast(1.05)" }}
          />

          {/* Gradient — top-right darker for title, bottom for stats, center clear for Scorch */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to bottom, rgba(5,5,8,0.3) 0%, rgba(5,5,8,0) 25%, rgba(5,5,8,0) 45%, rgba(5,5,8,0.3) 60%, rgba(5,5,8,0.8) 80%, rgba(5,5,8,1) 100%)",
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to left, rgba(5,5,8,0.6) 0%, rgba(5,5,8,0.2) 30%, transparent 50%)",
          }} />

          {/* Side vignette */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5,5,8,0.4) 100%)",
          }} />

          {/* Title + CTA — top right */}
          <div className="absolute top-4 right-0 px-4 sm:px-6" style={{ top: "1rem" }}>
            <div className="max-w-6xl mx-auto text-right">
              <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl mb-3 tracking-tight">
                <span className="fire-text">Hell</span><span className="fire-text">Burn</span>
              </h1>
              <p className="text-txt-2 text-sm sm:text-base leading-relaxed ml-auto max-w-md">
                Competitive Burn-to-Earn Protocol.<br />
                Perpetual TitanX & <br />DragonX deflation. <br />Real ETH yield.
              </p>
              <div className="flex flex-wrap gap-3 mt-5 justify-end">
                <a href={getWhitepaperUrl()} target="_blank" rel="noopener noreferrer" className="hb-btn-outline inline-flex items-center gap-2 text-sm px-6 py-3">
                  📄 Whitepaper
                </a>
              </div>
            </div>
          </div>
          {/* Stats — bottom of hero, overlapping into content */}
          <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="hb-stat">
                <div className="num">{data ? fmt(data.totalTitanBurned) : "—"}</div>
                <div className="lbl">TitanX Burned (Genesis)</div>
              </div>
              <div className="hb-stat">
                <div className="num">{data ? fmt(data.epochsTitanBurned) : "—"}</div>
                <div className="lbl">TitanX Burned (Epochs)</div>
              </div>
              <div className="hb-stat">
                <div className="num">{data ? fmt(data.epochsDragonBurned) : "—"}</div>
                <div className="lbl">DragonX Burned</div>
              </div>
              <div className="hb-stat">
                <div className="num" style={{ color: "#22c55e" }}>{data ? fmtETH(data.totalETHDist) : "—"}</div>
                <div className="lbl">ETH Distributed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROTOCOL CARDS — below hero ═══ */}
      <div className="space-y-6">

        <div className="grid md:grid-cols-2 gap-6">
          {/* Genesis Status */}
          <div className="hb-card">
            <div className="hb-label"><span className="dot" /> Genesis Phase</div>
            {data?.genesisEnded ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-display font-bold text-lg text-txt-2">Genesis Complete</p>
                <p className="text-xs text-txt-3 mt-2">{data ? fmt(data.totalMinted) : "0"} HBURN minted forever</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs text-txt-3 uppercase tracking-wider mb-1">Time Remaining</p>
                    <p className="font-display font-bold text-2xl text-fire-3">
                      {data ? timeLeft(data.genesisEnd) : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-txt-3 uppercase tracking-wider mb-1">HBURN Minted</p>
                    <p className="font-display font-bold text-lg">{data ? fmt(data.totalMinted) : "—"}</p>
                  </div>
                </div>
                <Link to="/genesis" className="hb-btn block text-center">Enter Genesis Burn →</Link>
              </div>
            )}
          </div>

          {/* Current Epoch */}
          <div className="hb-card">
            <div className="hb-label"><span className="dot" /> Current Burn Epoch</div>
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-xs text-txt-3 uppercase tracking-wider mb-1">Epoch</p>
                <p className="font-display font-bold text-2xl text-fire-3">
                  #{data ? data.currentEpoch.toString() : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-txt-3 uppercase tracking-wider mb-1">ETH in Pool</p>
                <p className="font-display font-bold text-lg text-green-400">
                  {data ? fmtETH(data.totalETHDist) : "—"}
                </p>
              </div>
            </div>
            <Link to="/epochs" className="hb-btn block text-center">Burn to Compete →</Link>
          </div>

          {/* Staking */}
          <div className="hb-card">
            <div className="hb-label"><span className="dot" /> Staking</div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-txt-3 uppercase tracking-wider mb-1">Total Shares</p>
                <p className="font-display font-bold">{data ? fmt(data.totalShares) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-txt-3 uppercase tracking-wider mb-1">ETH Yield Paid</p>
                <p className="font-display font-bold text-green-400">{data ? fmtETH(data.totalETHReceived) : "—"}</p>
              </div>
            </div>
            <Link to="/staking" className="hb-btn block text-center">Stake HBURN →</Link>
          </div>

          {/* Buy & Burn */}
          <div className="hb-card">
            <div className="hb-label"><span className="dot" /> Buy & Burn</div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-txt-3 uppercase tracking-wider mb-1">ETH Used</p>
                <p className="font-display font-bold">{data ? fmtETH(data.buyBurnETH) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-txt-3 uppercase tracking-wider mb-1">HBURN Burned</p>
                <p className="font-display font-bold text-fire-3">{data ? fmt(data.buyBurnHBURN) : "—"}</p>
              </div>
            </div>
            <div className="hb-output">
              <div className="flex justify-between text-xs">
                <span className="text-txt-3">HBURN Supply</span>
                <span className="font-bold">{data ? fmt(data.hburnSupply) : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connect prompt */}
        {!account && (
          <div className="hb-card text-center py-8 border-fire-2/20">
            <p className="text-txt-2 mb-2">Connect your wallet to interact with HellBurn</p>
            <p className="text-xs text-txt-3">MetaMask, WalletConnect, or any EVM wallet</p>
          </div>
        )}
      </div>
    </>
  );
}
