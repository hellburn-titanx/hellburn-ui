import { useState, useMemo } from "react";

const WEEKS = [
  { week: 1, ratio: 1.0, bonus: 1.15, label: "1:1.15", color: "#ff4500" },
  { week: 2, ratio: 0.95, bonus: 1.10, label: "1:1.045", color: "#ff6b35" },
  { week: 3, ratio: 0.90, bonus: 1.05, label: "1:0.945", color: "#ff8c5a" },
  { week: 4, ratio: 0.85, bonus: 1.00, label: "1:0.85", color: "#ffad80" },
];

const DIST = [
  { label: "Permanent Burn", pct: 35, color: "#ff4500", icon: "🔥" },
  { label: "DragonX Vault", pct: 35, color: "#8b5cf6", icon: "🐉" },
  { label: "Treasury Stake", pct: 22, color: "#f59e0b", icon: "🏦" },
  { label: "LP Fund", pct: 8, color: "#10b981", icon: "🔗" },
];

const fmt = (n, d = 2) => {
  if (n >= 1e12) return (n / 1e12).toFixed(d) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(d) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(d) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(d) + "K";
  return n.toFixed(d);
};

const fmtUSD = (n) => "$" + fmt(n);

function Slider({ label, value, onChange, min, max, step = 1, unit = "", format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs tracking-widest uppercase" style={{ color: "#8a8a9a" }}>{label}</span>
        <span className="font-mono text-sm font-bold" style={{ color: "#f0f0f5" }}>
          {format ? format(value) : value.toLocaleString()}{unit}
        </span>
      </div>
      <div className="relative h-8 flex items-center">
        <div className="absolute w-full h-1 rounded-full" style={{ background: "#1e1e2e" }} />
        <div className="absolute h-1 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ff4500, #ff6b35)" }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-8 opacity-0 cursor-pointer" style={{ zIndex: 2 }} />
        <div className="absolute w-3.5 h-3.5 rounded-full border-2 pointer-events-none"
          style={{ left: `calc(${pct}% - 7px)`, background: "#ff4500", borderColor: "#ff6b35", boxShadow: "0 0 12px rgba(255,69,0,0.5)" }} />
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, accent = false, glow = false }) {
  return (
    <div className="rounded-xl p-3.5 border" style={{
      background: glow ? "linear-gradient(135deg, rgba(255,69,0,0.08), rgba(16,185,129,0.05))" : "#111119",
      borderColor: glow ? "rgba(255,69,0,0.25)" : "#1e1e2e",
      boxShadow: glow ? "0 0 20px rgba(255,69,0,0.08)" : "none",
    }}>
      <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#5a5a6a" }}>{label}</div>
      <div className="font-mono text-lg font-bold" style={{ color: accent ? "#ff4500" : "#f0f0f5" }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "#6a6a7a" }}>{sub}</div>}
    </div>
  );
}

function Section({ title, icon, children, accent = "#ff4500" }) {
  return (
    <div className="rounded-2xl border p-5 mb-5" style={{ background: "#0c0c14", borderColor: "#1a1a28" }}>
      <h2 className="flex items-center gap-2 text-base font-bold tracking-tight mb-4" style={{ color: "#f0f0f5" }}>
        <span className="flex items-center justify-center w-7 h-7 rounded-lg text-sm"
          style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button onClick={onClick} className="px-4 py-2 text-xs font-semibold rounded-lg transition-all" style={{
      background: active ? "rgba(255,69,0,0.12)" : "transparent",
      color: active ? "#ff6b35" : "#5a5a6a",
      border: active ? "1px solid rgba(255,69,0,0.3)" : "1px solid transparent",
    }}>{children}</button>
  );
}

export default function HellBurnCalculator() {
  const [tab, setTab] = useState("genesis");
  const [titanXAmount, setTitanXAmount] = useState(10000000000);
  const [titanXPrice, setTitanXPrice] = useState(0.00000008);
  const [ethPrice, setEthPrice] = useState(2080);

  // Genesis
  const [selectedWeek, setSelectedWeek] = useState(0);

  // Staking
  const [stakeDays, setStakeDays] = useState(369);
  const [stakeAmount, setStakeAmount] = useState(5000000000);
  const [totalTVL, setTotalTVL] = useState(50000000000);
  const [epochETH, setEpochETH] = useState(0.5);

  // DCA
  const [monthlyUSD, setMonthlyUSD] = useState(500);
  const [dcaMonths, setDcaMonths] = useState(12);
  const [treasuryAPY, setTreasuryAPY] = useState(10);

  const genesis = useMemo(() => {
    const w = WEEKS[selectedWeek];
    const totalMint = titanXAmount * w.ratio * w.bonus;
    const lpReserve = totalMint * 0.03;
    const userAmount = totalMint * 0.97;
    const immediate = userAmount * 0.25;
    const vested = userAmount * 0.75;
    const investUSD = titanXAmount * titanXPrice;
    const titanXDist = {
      burn: titanXAmount * 0.35,
      dragonX: titanXAmount * 0.35,
      treasury: titanXAmount * 0.22,
      lpFund: titanXAmount * 0.08,
    };
    return { totalMint, lpReserve, userAmount, immediate, vested, investUSD, titanXDist, rate: w.ratio * w.bonus * 0.97 };
  }, [titanXAmount, selectedWeek, titanXPrice]);

  const staking = useMemo(() => {
    const tierNames = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
    const tierMins = [28, 90, 369, 888, 3500];
    const tierColors = ["#cd7f32", "#c0c0c0", "#ffd700", "#e5e4e2", "#b9f2ff"];
    let tierIdx = 0;
    for (let i = tierMins.length - 1; i >= 0; i--) {
      if (stakeDays >= tierMins[i]) { tierIdx = i; break; }
    }
    const shareWeight = stakeAmount * stakeDays;
    const sharePct = totalTVL > 0 ? (stakeAmount / totalTVL) * 100 : 100;
    const epochsPerYear = 365 / 8;
    const yearlyETH = epochETH * epochsPerYear * (sharePct / 100);
    const yearlyUSD = yearlyETH * ethPrice;
    const apy = (stakeAmount > 0 && titanXPrice > 0) ? (yearlyUSD / (stakeAmount * titanXPrice)) * 100 : 0;
    return {
      tier: tierNames[tierIdx], tierColor: tierColors[tierIdx], tierIdx,
      shareWeight, sharePct, yearlyETH, yearlyUSD, apy, epochsPerYear,
    };
  }, [stakeAmount, stakeDays, totalTVL, epochETH, ethPrice, titanXPrice]);

  const dca = useMemo(() => {
    const months = [];
    let totalInvested = 0;
    let totalTitanXBurned = 0;
    let totalHBURN = 0;
    let cumulativeLPReserve = 0;
    let cumulativeLPFundTitanX = 0;
    let cumulativeTreasuryTitanX = 0;
    let cumulativeTreasuryETHYield = 0;
    let cumulativeBuyBurnETH = 0;
    let hburnSupply = 0;
    let hburnBurned = 0;

    for (let m = 1; m <= dcaMonths; m++) {
      const titanXBought = monthlyUSD / titanXPrice;
      totalInvested += monthlyUSD;
      totalTitanXBurned += titanXBought;

      // Genesis only first month, rest is epochs
      const isGenesis = m === 1;
      let monthHBURN = 0;
      let monthLPReserve = 0;

      if (isGenesis) {
        const totalMint = titanXBought * 1.0 * 1.15; // Week 1
        monthLPReserve = totalMint * 0.03;
        monthHBURN = totalMint * 0.97;
        cumulativeLPReserve += monthLPReserve;
        hburnSupply += totalMint;
      }

      // TitanX distribution (both genesis and epochs)
      const treasuryTX = titanXBought * 0.22;
      const lpFundTX = titanXBought * 0.08;
      cumulativeTreasuryTitanX += treasuryTX;
      cumulativeLPFundTitanX += lpFundTX;

      // Treasury yield (cumulative, monthly)
      const monthlyTreasuryYield = (cumulativeTreasuryTitanX * titanXPrice * (treasuryAPY / 100)) / 12;
      cumulativeTreasuryETHYield += monthlyTreasuryYield;

      // Epoch rewards from treasury yield (simplified)
      const epochRewardETH = monthlyTreasuryYield;
      const buyBurnETH = epochRewardETH * 0.20;
      cumulativeBuyBurnETH += buyBurnETH;

      // BuyAndBurn: buys HBURN at "market" and burns
      // Simplified: assume HBURN price = LP value / supply
      if (hburnSupply > 0) {
        const hburnPrice = (cumulativeLPFundTitanX * titanXPrice) / hburnSupply || 0.000001;
        const hburnBoughtAndBurned = hburnPrice > 0 ? (buyBurnETH / hburnPrice) : 0;
        hburnBurned += hburnBoughtAndBurned;
        hburnSupply = Math.max(0, hburnSupply - hburnBoughtAndBurned);
      }

      months.push({
        month: m,
        invested: totalInvested,
        titanXBurned: totalTitanXBurned,
        hburnHeld: totalHBURN,
        lpReserve: cumulativeLPReserve,
        lpFundTitanX: cumulativeLPFundTitanX,
        treasuryTitanX: cumulativeTreasuryTitanX,
        treasuryYield: cumulativeTreasuryETHYield,
        buyBurnTotal: cumulativeBuyBurnETH,
        hburnBurned,
        hburnSupply,
      });

      totalHBURN += monthHBURN;
    }

    return { months, final: months[months.length - 1] };
  }, [monthlyUSD, dcaMonths, titanXPrice, treasuryAPY, ethPrice]);

  return (
    <div style={{ background: "#08080f", color: "#f0f0f5", minHeight: "100vh", fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-2xl">🔥</span>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Hell<span style={{ color: "#ff4500" }}>Burn</span> Calculator
            </h1>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
            🔗 FAIR LAUNCH v3.0
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "#111119" }}>
          <TabButton active={tab === "genesis"} onClick={() => setTab("genesis")}>🔥 Genesis</TabButton>
          <TabButton active={tab === "staking"} onClick={() => setTab("staking")}>💎 Staking</TabButton>
          <TabButton active={tab === "dca"} onClick={() => setTab("dca")}>📈 DCA Simulation</TabButton>
        </div>

        {/* Global Prices */}
        <Section title="Market Prices" icon="💲" accent="#f59e0b">
          <div className="grid grid-cols-2 gap-4">
            <Slider label="TitanX Price" value={titanXPrice} onChange={setTitanXPrice}
              min={0.00000001} max={0.000001} step={0.00000001} format={(v) => "$" + v.toFixed(8)} />
            <Slider label="ETH Price" value={ethPrice} onChange={setEthPrice}
              min={1000} max={5000} step={50} format={(v) => "$" + v.toLocaleString()} />
          </div>
        </Section>

        {/* ═══════ GENESIS TAB ═══════ */}
        {tab === "genesis" && (
          <>
            <Section title="Genesis Burn" icon="🔥">
              <Slider label="TitanX Amount" value={titanXAmount} onChange={setTitanXAmount}
                min={1000000000} max={100000000000} step={1000000000} format={fmt} />

              {/* Week Selector */}
              <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#5a5a6a" }}>Week</div>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {WEEKS.map((w, i) => (
                  <button key={i} onClick={() => setSelectedWeek(i)}
                    className="relative rounded-xl py-3 text-center transition-all border"
                    style={{
                      background: selectedWeek === i ? "rgba(255,69,0,0.1)" : "#111119",
                      borderColor: selectedWeek === i ? "rgba(255,69,0,0.4)" : "#1a1a28",
                      boxShadow: selectedWeek === i ? "0 0 15px rgba(255,69,0,0.1)" : "none",
                    }}>
                    <div className="font-bold text-sm" style={{ color: selectedWeek === i ? "#ff4500" : "#8a8a9a" }}>W{w.week}</div>
                    <div className="text-[10px]" style={{ color: "#5a5a6a" }}>{w.label}</div>
                    {w.bonus > 1 && (
                      <div className="absolute -top-1.5 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: "#ff4500", color: "#fff" }}>+{((w.bonus - 1) * 100).toFixed(0)}%</div>
                    )}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatBox label="You Receive (97%)" value={fmt(genesis.userAmount)} sub="HBURN" accent glow />
                <StatBox label="Investment" value={fmtUSD(genesis.investUSD)} sub={`${fmt(titanXAmount)} TitanX`} />
                <StatBox label="↳ Instant (25%)" value={fmt(genesis.immediate)} sub="HBURN" />
                <StatBox label="↳ Vested (75%)" value={fmt(genesis.vested)} sub="28 days linear" />
              </div>

              {/* LP Reserve */}
              <div className="rounded-xl p-3.5 border mb-4" style={{ background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.15)" }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest" style={{ color: "#10b981" }}>🔗 LP Reserve (3%)</div>
                    <div className="font-mono text-base font-bold mt-1" style={{ color: "#10b981" }}>{fmt(genesis.lpReserve)} HBURN</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest" style={{ color: "#5a5a6a" }}>Effective Rate</div>
                    <div className="font-mono text-sm font-bold mt-1" style={{ color: "#f0f0f5" }}>{genesis.rate.toFixed(4)} HBURN/TX</div>
                  </div>
                </div>
              </div>

              {/* Distribution */}
              <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#5a5a6a" }}>TitanX Distribution</div>
              <div className="flex h-2 rounded-full overflow-hidden mb-3">
                {DIST.map((d) => <div key={d.label} style={{ width: `${d.pct}%`, background: d.color }} />)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DIST.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg" style={{ background: "#111119" }}>
                    <span style={{ color: "#8a8a9a" }}>{d.icon} {d.label}</span>
                    <span className="font-bold" style={{ color: d.color }}>{fmt(titanXAmount * d.pct / 100)}</span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ═══════ STAKING TAB ═══════ */}
        {tab === "staking" && (
          <Section title="Staking Projections" icon="💎" accent="#8b5cf6">
            <Slider label="Stake Amount (HBURN)" value={stakeAmount} onChange={setStakeAmount}
              min={100000000} max={50000000000} step={100000000} format={fmt} />
            <Slider label="Stake Duration" value={stakeDays} onChange={setStakeDays}
              min={28} max={3500} step={1} unit=" days" />
            <Slider label="Total Protocol TVL (HBURN)" value={totalTVL} onChange={setTotalTVL}
              min={1000000000} max={500000000000} step={1000000000} format={fmt} />
            <Slider label="Avg ETH per Epoch" value={epochETH} onChange={setEpochETH}
              min={0.01} max={10} step={0.01} format={(v) => v.toFixed(2) + " ETH"} />

            {/* Tier Display */}
            <div className="flex items-center gap-3 rounded-xl p-4 border mb-4" style={{
              background: `${staking.tierColor}08`,
              borderColor: `${staking.tierColor}30`,
            }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black"
                style={{ background: `${staking.tierColor}15`, color: staking.tierColor, border: `1px solid ${staking.tierColor}40` }}>
                {staking.tier[0]}
              </div>
              <div>
                <div className="font-bold" style={{ color: staking.tierColor }}>{staking.tier} Tier</div>
                <div className="text-[10px]" style={{ color: "#5a5a6a" }}>{stakeDays} days · Higher tier = more rewards</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Your Share" value={staking.sharePct.toFixed(2) + "%"} sub="of protocol" />
              <StatBox label="Yearly ETH" value={staking.yearlyETH.toFixed(3)} sub={fmtUSD(staking.yearlyUSD)} accent glow />
              <StatBox label="Est. APY" value={staking.apy.toFixed(1) + "%"} sub="in ETH terms" />
              <StatBox label="Epochs/Year" value={staking.epochsPerYear.toFixed(0)} sub="every 8 days" />
            </div>

            <div className="mt-4 p-3 rounded-lg text-[10px] leading-relaxed" style={{ background: "#111119", color: "#5a5a6a" }}>
              ⚠️ Projections based on constant ETH per epoch. Actual rewards depend on protocol activity, number of stakers, and epoch burns. Not financial advice.
            </div>
          </Section>
        )}

        {/* ═══════ DCA TAB ═══════ */}
        {tab === "dca" && (
          <Section title="DCA Simulation" icon="📈" accent="#10b981">
            <Slider label="Monthly Investment" value={monthlyUSD} onChange={setMonthlyUSD}
              min={50} max={5000} step={50} format={(v) => "$" + v.toLocaleString()} />
            <Slider label="Duration" value={dcaMonths} onChange={setDcaMonths}
              min={1} max={36} step={1} unit=" months" />
            <Slider label="Treasury APY" value={treasuryAPY} onChange={setTreasuryAPY}
              min={1} max={30} step={1} unit="%" />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatBox label="Total Invested" value={fmtUSD(dca.final.invested)} sub={`${dcaMonths} months`} />
              <StatBox label="TitanX Burned" value={fmt(dca.final.titanXBurned)} sub="total" accent glow />
              <StatBox label="HBURN Held" value={fmt(dca.final.hburnHeld)} sub="from Genesis" />
              <StatBox label="LP Reserve" value={fmt(dca.final.lpReserve)} sub="HBURN locked" />
            </div>

            {/* Fair Launch Breakdown */}
            <div className="rounded-xl border p-4 mb-4" style={{ background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.15)" }}>
              <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#10b981" }}>🔗 Fair Launch Accumulation</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#8a8a9a" }}>LP Fund TitanX (8%)</span>
                  <span className="font-bold" style={{ color: "#10b981" }}>{fmt(dca.final.lpFundTitanX)} TX</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#8a8a9a" }}>LP Fund Value</span>
                  <span className="font-bold">{fmtUSD(dca.final.lpFundTitanX * titanXPrice)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#8a8a9a" }}>Treasury Staked (22%)</span>
                  <span className="font-bold" style={{ color: "#f59e0b" }}>{fmt(dca.final.treasuryTitanX)} TX</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#8a8a9a" }}>Treasury ETH Yield</span>
                  <span className="font-bold">{fmtUSD(dca.final.treasuryYield)}</span>
                </div>
                <div style={{ borderTop: "1px solid #1a1a28", margin: "6px 0" }} />
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#8a8a9a" }}>BuyAndBurn Total</span>
                  <span className="font-bold" style={{ color: "#ff4500" }}>{fmtUSD(dca.final.buyBurnTotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#8a8a9a" }}>HBURN Burned (deflation)</span>
                  <span className="font-bold" style={{ color: "#ff4500" }}>{fmt(dca.final.hburnBurned)}</span>
                </div>
              </div>
            </div>

            {/* Monthly Timeline */}
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#5a5a6a" }}>Monthly Progression</div>
            <div className="overflow-x-auto">
              <div className="rounded-xl border overflow-hidden" style={{ background: "#111119", borderColor: "#1a1a28" }}>
                <table className="w-full text-[10px]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a28" }}>
                      {["Mo", "Invested", "TX Burned", "Treasury", "BuyBurn", "HBURN Burned"].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-semibold" style={{ color: "#5a5a6a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dca.months.filter((_, i) => i % Math.ceil(dcaMonths / 12) === 0 || i === dca.months.length - 1).map((m) => (
                      <tr key={m.month} style={{ borderBottom: "1px solid #1a1a2808" }}>
                        <td className="px-2 py-1.5 font-bold" style={{ color: "#ff4500" }}>{m.month}</td>
                        <td className="px-2 py-1.5" style={{ color: "#f0f0f5" }}>{fmtUSD(m.invested)}</td>
                        <td className="px-2 py-1.5">{fmt(m.titanXBurned)}</td>
                        <td className="px-2 py-1.5" style={{ color: "#f59e0b" }}>{fmtUSD(m.treasuryYield)}</td>
                        <td className="px-2 py-1.5" style={{ color: "#ff4500" }}>{fmtUSD(m.buyBurnTotal)}</td>
                        <td className="px-2 py-1.5" style={{ color: "#ff6b35" }}>{fmt(m.hburnBurned)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg text-[10px] leading-relaxed" style={{ background: "#111119", color: "#5a5a6a" }}>
              ⚠️ Vereinfachte Simulation. Reale Ergebnisse hängen ab von: TitanX-Preis-Entwicklung, ETH-Preis, Anzahl der Teilnehmer, Epoch-Aktivität, und Treasury-Staking-Yield. Keine Finanzberatung.
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] py-4" style={{ color: "#3a3a4a" }}>
          HellBurn Protocol · Fair Launch v3.0 · Calculator v1.0
        </div>
      </div>
    </div>
  );
}
