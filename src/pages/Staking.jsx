import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useStaking, useHBURN, useTitanX, useDragonX, useGenesis } from "@/hooks/useContracts";
import { ADDRESSES, STAKE_TIERS, MIN_STAKE_DAYS, MAX_STAKE_DAYS, getTier } from "@/config/constants";
import { fmt, fmtETH, bn, toWei, timeLeft } from "@/utils";
import TxModal from "@/components/TxModal";
import { Link } from "react-router-dom";

export default function Staking() {
  const { account } = useWallet();
  const staking = useStaking();
  const hburn = useHBURN();
  const titanX = useTitanX();
  const genesis = useGenesis();

  const [genesisActive, setGenesisActive] = useState(false);
  const [genesisEnd, setGenesisEnd] = useState(0);
  const [input, setInput] = useState("");
  const [days, setDays] = useState(369);
  const [hburnBal, setHburnBal] = useState(0n);
  const [stakes, setStakes] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [phoenix, setPhoenix] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [tx, setTx] = useState({ phase: null, msg: "", sub: "" });
  const [fuelStakeId, setFuelStakeId] = useState(null);
  const [fuelAmount, setFuelAmount] = useState("");

  const tier = getTier(days);
  const amt = parseFloat(input) || 0;
  const balNum = bn(hburnBal);

  // Check genesis state
  useEffect(() => {
    if (!genesis) return;
    (async () => {
      try {
        const [ended, end] = await Promise.all([
          genesis.genesisEnded(),
          genesis.genesisEnd(),
        ]);
        setGenesisActive(!ended && Math.floor(Date.now() / 1000) <= Number(end));
        setGenesisEnd(Number(end));
      } catch { /* assume active */ }
    })();
  }, [genesis]);

  // Fetch data
  useEffect(() => {
    if (!staking || !account) return;
    (async () => {
      try {
        const [bal, stakeIds, totalShares, totalETH, isPhoenix, completed] = await Promise.all([
          hburn.balanceOf(account),
          staking.getUserStakes(account),
          staking.totalShares(),
          staking.totalETHReceived(),
          staking.hasPhoenixStatus(account),
          staking.completedStakes(account),
        ]);
        setHburnBal(bal); setPhoenix(isPhoenix); setCompletedCount(Number(completed));
        setGlobalStats({ totalShares, totalETH });

        // Load stake details
        const details = [];
        for (const id of stakeIds) {
          const info = await staking.getStakeInfo(id);
          details.push({
            id: Number(id),
            amount: info[0], shares: info[1],
            startTime: Number(info[2]), endTime: Number(info[3]),
            fuelBonus: Number(info[4]), active: info[5],
            maturityPct: Number(info[6]), pendingETH: info[7],
          });
        }
        setStakes(details.reverse()); // newest first
      } catch (e) { console.error(e); }
    })();
  }, [staking, hburn, account, tx.phase]);

  // Start stake
  const handleStake = useCallback(async () => {
    if (!staking || amt <= 0) return;
    const weiAmt = toWei(input);
    try {
      setTx({ phase: "pending", msg: "Approving HBURN...", sub: "Confirm in wallet" });
      const allowance = await hburn.allowance(account, ADDRESSES.hellBurnStaking);
      if (allowance < weiAmt) {
        const appTx = await hburn.approve(ADDRESSES.hellBurnStaking, weiAmt);
        await appTx.wait();
      }
      setTx({ phase: "pending", msg: "Starting Stake...", sub: `${fmt(amt)} HBURN for ${days} days` });
      const stakeTx = await staking.startStake(weiAmt, days);
      await stakeTx.wait();
      setTx({ phase: "success", msg: "Stake Started!", sub: `${tier.name} tier (${days}d)` });
      setInput("");
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || err.message?.slice(0, 100) || "Failed" });
    }
  }, [staking, hburn, account, input, amt, days, tier]);

  // Re-stake
  const handleReStake = useCallback(async () => {
    if (!staking || amt <= 0 || completedCount === 0) return;
    const weiAmt = toWei(input);
    try {
      setTx({ phase: "pending", msg: "Approving HBURN...", sub: "Confirm in wallet" });
      const allowance = await hburn.allowance(account, ADDRESSES.hellBurnStaking);
      if (allowance < weiAmt) {
        const appTx = await hburn.approve(ADDRESSES.hellBurnStaking, weiAmt);
        await appTx.wait();
      }
      setTx({ phase: "pending", msg: "Re-Staking (1.1x bonus)...", sub: "" });
      const rsTx = await staking.reStake(weiAmt, days);
      await rsTx.wait();
      setTx({ phase: "success", msg: "Re-Stake Started!", sub: "1.1x loyalty bonus applied" });
      setInput("");
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || "Re-stake failed" });
    }
  }, [staking, hburn, account, input, amt, days, completedCount]);

  // End stake
  const handleEndStake = useCallback(async (stakeId) => {
    try {
      setTx({ phase: "pending", msg: `Ending Stake #${stakeId}...`, sub: "Confirm in wallet" });
      const endTx = await staking.endStake(stakeId);
      await endTx.wait();
      setTx({ phase: "success", msg: "Stake Ended!", sub: "HBURN + ETH returned" });
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || "End stake failed" });
    }
  }, [staking]);

  // Add fuel
  const handleFuel = useCallback(async () => {
    if (fuelStakeId === null || !fuelAmount) return;
    const weiAmt = toWei(fuelAmount);
    try {
      setTx({ phase: "pending", msg: "Approving TitanX for fuel...", sub: "" });
      const allowance = await titanX.allowance(account, ADDRESSES.hellBurnStaking);
      if (allowance < weiAmt) {
        const appTx = await titanX.approve(ADDRESSES.hellBurnStaking, weiAmt);
        await appTx.wait();
      }
      setTx({ phase: "pending", msg: "Adding Fuel...", sub: "" });
      const fuelTx = await staking.addFuelTitanX(fuelStakeId, weiAmt);
      await fuelTx.wait();
      setTx({ phase: "success", msg: "Fuel Added!", sub: "Shares increased" });
      setFuelStakeId(null); setFuelAmount("");
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || "Fuel failed" });
    }
  }, [staking, titanX, account, fuelStakeId, fuelAmount]);

  const setPct = (p) => setInput(Math.floor(balNum * p / 100).toString());
  const activeStakes = stakes.filter((s) => s.active);
  const endedStakes = stakes.filter((s) => !s.active);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="font-display font-black text-4xl tracking-tight">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-fire-1/20 text-fire-3 border border-fire-2/40 mr-2 align-middle">3</span>
          <span className="fire-text">Stake</span> HBURN
        </h1>
        <p className="text-txt-2 text-sm mt-2">
          Earn real ETH yield. Longer stakes = more shares. Fuel with TitanX for extra boost.
        </p>
      </div>

      {/* Genesis Lock Overlay */}
      {genesisActive && (
        <div className="hb-card border-fire-2/20 bg-gradient-to-br from-fire-1/5 to-dark-2 text-center py-12">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-display font-bold text-xl text-txt-1 mb-2">Staking Unlocks After Genesis</h2>
          <p className="text-sm text-txt-2 mb-2">
            Stake your HBURN to earn a share of the 20% ETH from each Burn Epoch.
          </p>
          <p className="text-xs text-txt-3 mb-6">
            Genesis ends in: <span className="font-bold text-fire-3">{genesisEnd ? timeLeft(genesisEnd) : "—"}</span>
          </p>
          <Link to="/genesis" className="hb-btn-outline inline-block">
            Go to Genesis →
          </Link>
        </div>
      )}

      {/* Main content — only when genesis ended */}
      {!genesisActive && (<>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="hb-stat"><div className="num">{globalStats ? fmt(globalStats.totalShares) : "—"}</div><div className="lbl">Total Shares</div></div>
        <div className="hb-stat"><div className="num" style={{ color: "#22c55e" }}>{globalStats ? fmtETH(globalStats.totalETH) : "—"}</div><div className="lbl">ETH Paid Out</div></div>
        <div className="hb-stat"><div className="num">{activeStakes.length}</div><div className="lbl">Your Active Stakes</div></div>
        <div className="hb-stat"><div className="num">{phoenix ? "🔥" : completedCount + "/3"}</div><div className="lbl">{phoenix ? "Phoenix Status" : "Phoenix Progress"}</div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stake Form */}
        <div className="hb-card">
          <div className="hb-label"><span className="dot" /> New Stake</div>

          {/* Tier Selector */}
          <div className="flex gap-1 mb-4">
            {STAKE_TIERS.map((t) => (
              <button key={t.name} onClick={() => setDays(t.minDays)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  tier.name === t.name ? "border-fire-2 text-fire-3 bg-fire-1/10" : "border-dark-5 text-txt-3 bg-dark-3"
                }`}>
                <span className="block text-base mb-0.5" style={{ color: t.color }}>◆</span>
                {t.name}
              </button>
            ))}
          </div>

          {/* Duration Slider */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-txt-3 mb-1">
              <span>Duration</span>
              <span className="font-bold text-txt-1">{days} days <span style={{ color: tier.color }}>({tier.name})</span></span>
            </div>
            <input type="range" min={MIN_STAKE_DAYS} max={MAX_STAKE_DAYS} value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-dark-4 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fire-2 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,107,53,0.5)]" />
          </div>

          {/* Amount Input */}
          <div className="relative mb-3">
            <input type="number" className="hb-input" placeholder="0" value={input}
              onChange={(e) => setInput(e.target.value)} disabled={!account} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-dark-4 px-3 py-1.5 rounded-lg text-xs text-txt-2 font-semibold">HBURN</span>
          </div>
          {account && <p className="text-[11px] text-txt-3 mb-3">Balance: {fmt(hburnBal)} HBURN</p>}
          <div className="flex gap-1.5 mb-5">
            {[25, 50, 75, 100].map((p) => (
              <button key={p} className="hb-btn-ghost" onClick={() => setPct(p)} disabled={!account}>{p}%</button>
            ))}
          </div>

          {/* Preview */}
          <div className="hb-output">
            <div className="hb-output-row"><span className="text-xs text-txt-2">Time Bonus</span><span className="font-bold">{(1 + ((days - 28) * 2.5) / (3500 - 28)).toFixed(2)}x</span></div>
            <div className="hb-output-row"><span className="text-xs text-txt-2">Tier</span><span className="font-bold" style={{ color: tier.color }}>◆ {tier.name}</span></div>
            <div className="hb-output-row"><span className="text-xs text-txt-2">Early Exit Penalty</span><span className="text-xs text-txt-3">Locked until 50% maturity</span></div>
          </div>

          <div className="flex gap-2">
            <button className="hb-btn flex-1" onClick={handleStake} disabled={!account || amt <= 0 || amt > balNum}>
              {!account ? "Connect" : amt <= 0 ? "Enter Amount" : `Stake ${fmt(amt)}`}
            </button>
            {completedCount > 0 && (
              <button className="hb-btn flex-1 !from-purple-600 !to-purple-800" onClick={handleReStake}
                disabled={!account || amt <= 0 || amt > balNum}>
                Re-Stake (1.1x)
              </button>
            )}
          </div>
        </div>

        {/* Active Stakes */}
        <div className="hb-card">
          <div className="hb-label"><span className="dot" /> Your Stakes</div>
          {!account ? (
            <p className="text-center text-txt-3 py-8 text-sm">Connect wallet</p>
          ) : activeStakes.length === 0 ? (
            <p className="text-center text-txt-3 py-8 text-sm">No active stakes</p>
          ) : (
            <div className="space-y-3">
              {activeStakes.map((s) => {
                const daysTotal = Math.ceil((s.endTime - s.startTime) / 86400);
                const t = getTier(daysTotal);
                const penaltyPct = s.maturityPct < 50 ? "Locked" : s.maturityPct >= 100 ? "0%" : `${((100 - s.maturityPct) * 2)}%`;

                return (
                  <div key={s.id} className="bg-dark-3 rounded-xl p-4 border border-dark-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-bold" style={{ color: t.color }}>◆ {t.name}</span>
                        <span className="text-xs text-txt-3 ml-2">#{s.id}</span>
                      </div>
                      <span className="text-xs text-green-400 font-bold">{fmtETH(s.pendingETH)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] mb-3">
                      <div><span className="text-txt-3">Amount</span><br /><span className="font-bold">{fmt(s.amount)}</span></div>
                      <div><span className="text-txt-3">Maturity</span><br /><span className="font-bold">{s.maturityPct}%</span></div>
                      <div><span className="text-txt-3">Penalty</span><br /><span className="font-bold">{penaltyPct}</span></div>
                    </div>

                    {/* Maturity progress */}
                    <div className="hb-progress mb-3">
                      <div className="hb-progress-fill" style={{
                        width: `${Math.min(100, s.maturityPct)}%`,
                        background: s.maturityPct >= 100 ? "linear-gradient(90deg, #22c55e, #4ade80)" : undefined,
                      }} />
                    </div>

                    <div className="flex gap-2">
                      <button className="hb-btn-outline flex-1 text-[10px]" onClick={() => handleEndStake(s.id)}
                        disabled={s.maturityPct < 50}>
                        {s.maturityPct < 50 ? "Locked" : s.maturityPct >= 100 ? "Unstake" : `Unstake (${penaltyPct} penalty)`}
                      </button>
                      <button className="hb-btn-ghost !flex-none px-3" onClick={() => setFuelStakeId(s.id)}>⛽</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </>)}

      {/* Fuel Modal */}
      {fuelStakeId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-1/90 backdrop-blur-md"
          onClick={() => setFuelStakeId(null)}>
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-8 max-w-sm w-[90%]" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg mb-4">⛽ Add Fuel to Stake #{fuelStakeId}</h3>
            <p className="text-xs text-txt-2 mb-4">Burn TitanX to boost your stake's shares (max 1.5x).</p>
            <div className="relative mb-4">
              <input type="number" className="hb-input" placeholder="TitanX amount" value={fuelAmount}
                onChange={(e) => setFuelAmount(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="hb-btn flex-1" onClick={handleFuel} disabled={!fuelAmount}>🔥 Add Fuel</button>
              <button className="hb-btn-outline" onClick={() => setFuelStakeId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <TxModal phase={tx.phase} message={tx.msg} subtext={tx.sub} onClose={() => setTx({ phase: null })} />
    </div>
  );
}
