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

  const TRUST_POINTS = [
    { icon: "🔐", title: "No Admin Key", desc: "No owner, no multisig, no upgrade proxy. Once deployed, the contracts are immutable." },
    { icon: "🔗", title: "Fair Launch LP", desc: "3% LP reserve + 8% TitanX fund — the contract creates the Uniswap V3 LP automatically. No insider tokens." },
    { icon: "🔥", title: "LP Locked Forever", desc: "The LP-NFT is permanently held by the contract. No withdraw function exists. Nobody can rug." },
    { icon: "📜", title: "Fully Verified", desc: "All contracts verified on Etherscan. Read the code yourself — every function, every line." },
  ];

  return (
    <>
      {/* ═══ HERO — Scorch fullscreen ═══ */}
     <section className="relative -mx-4 sm:-mx-6 -mt-16 sm:-mt-24 mb-6">
	  <div className="relative w-full pt-20 sm:pt-28 pb-10 sm:pb-14 text-center">
		<h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl mb-3 tracking-tight">
		  <span className="fire-text">Hell</span><span className="fire-text">Burn</span>
		</h1>
		<p className="text-txt-2 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-5">
		  Fair Launch Burn-to-Earn Protocol.<br />
		  Trustless LP. Perpetual TitanX &amp; DragonX deflation. Real ETH yield.
		</p>
		<div className="flex flex-wrap gap-3 justify-center">
		  <Link to="/genesis" className="hb-btn inline-block w-auto text-sm px-8 py-3">
			Enter Genesis →
		  </Link>
		  <a href={getWhitepaperUrl()} target="_blank" rel="noopener noreferrer" className="hb-btn-outline inline-flex items-center gap-2 text-sm px-6 py-3">
			📄 Whitepaper
		  </a>
		</div>
	  </div>
	</section>

      <div className="space-y-6">

        {/* ═══ HOW IT WORKS — moved above stats ═══ */}
        <div className="hb-card">
          <h2 className="font-display font-bold text-xl text-txt-1 text-center mb-6">How HellBurn Works</h2>
          <p className="text-sm text-txt-2 text-center mb-8 max-w-2xl mx-auto">
            A Fair Launch Burn-to-Earn protocol. Burn TitanX &amp; DragonX to earn ETH, stake HBURN for yield, and benefit from perpetual deflation. Trustless LP — no insider tokens.
          </p>

          <div className="grid sm:grid-cols-4 gap-4 mb-6">
            {/* Phase 0 — Trust */}
            <div className="bg-emerald-500/[0.04] rounded-xl p-5 border border-emerald-500/20 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-3">0</div>
              <h3 className="font-bold text-sm text-emerald-400 mb-2">Fair Launch</h3>
              <p className="text-[12px] text-txt-3 leading-relaxed">No admin key. No team tokens. LP created trustlessly by the contract and locked forever. Fully verified on Etherscan.</p>
            </div>

            {/* Phase 1 — Genesis */}
            <div className="bg-dark-3/60 rounded-xl p-5 border border-dark-5 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-fire-1/20 text-fire-3 border border-fire-2/40 mb-3">1</div>
              <h3 className="font-bold text-sm text-txt-1 mb-2">Genesis Phase</h3>
              <p className="text-[12px] text-txt-3 leading-relaxed">Burn TitanX to mint HBURN at favorable ratios. 4 weeks with decreasing rates. 25% instant, 75% vested. 3% LP reserve.</p>
              <Link to="/genesis" className="text-[11px] text-fire-3 hover:text-fire-2 mt-3 inline-block">Enter Genesis &rarr;</Link>
            </div>

            {/* Phase 2 — Epochs */}
            <div className="bg-dark-3/60 rounded-xl p-5 border border-dark-5 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-fire-1/20 text-fire-3 border border-fire-2/40 mb-3">2</div>
              <h3 className="font-bold text-sm text-txt-1 mb-2">Burn Epochs</h3>
              <p className="text-[12px] text-txt-3 leading-relaxed">Competitive 8-day cycles. Burn TitanX (1x) or DragonX (2x) for the ETH pool. Build a streak up to 3x for bigger rewards.</p>
              <Link to="/epochs" className="text-[11px] text-fire-3 hover:text-fire-2 mt-3 inline-block">Burn to Compete &rarr;</Link>
            </div>

            {/* Phase 3 — Staking */}
            <div className="bg-dark-3/60 rounded-xl p-5 border border-dark-5 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-fire-1/20 text-fire-3 border border-fire-2/40 mb-3">3</div>
              <h3 className="font-bold text-sm text-txt-1 mb-2">Stake HBURN</h3>
              <p className="text-[12px] text-txt-3 leading-relaxed">Lock HBURN to earn real ETH yield. 5 tiers from Bronze to Diamond. Fuel with TitanX/DragonX. Complete 3 stakes for Phoenix.</p>
              <Link to="/staking" className="text-[11px] text-fire-3 hover:text-fire-2 mt-3 inline-block">Stake HBURN &rarr;</Link>
            </div>
          </div>

          {/* Trust Points */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {TRUST_POINTS.map((t) => (
              <div key={t.title} className="bg-dark-3/40 rounded-lg p-3 border border-dark-5">
                <div className="text-lg mb-1">{t.icon}</div>
                <h4 className="text-[11px] font-bold text-txt-1 mb-1">{t.title}</h4>
                <p className="text-[10px] text-txt-3 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Flywheel */}
          <div className="bg-dark-3/40 rounded-lg p-4 border border-dark-5">
            <h4 className="text-xs font-bold text-txt-2 mb-2 text-center">The Flywheel</h4>
            <p className="text-[11px] text-txt-3 text-center max-w-xl mx-auto leading-relaxed">
              Fair Launch LP (auto-created) &rarr; Epoch burns &rarr; ETH split: 80% to stakers, 20% to Buy &amp; Burn &rarr; HBURN bought &amp; burned &rarr; supply decreases &rarr; value increases &rarr; more incentive to burn &amp; stake. LP fees also fuel the burn.
            </p>
          </div>
        </div>

        {/* ═══ STATS — now below How It Works ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

        {/* ═══ PROTOCOL CARDS ═══ */}
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
