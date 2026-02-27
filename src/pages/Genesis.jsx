import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useGenesis, useTitanX, useHBURN } from "@/hooks/useContracts";
import { ADDRESSES, WEEKS, TITANX_DISTRIBUTION, GENESIS_DURATION_DAYS, GENESIS_DURATION_HOURS } from "@/config/constants";
import { fmt, fmtETH, bn, toWei, calcGenesisOutput, timeLeft } from "@/utils";
import TxModal from "@/components/TxModal";

export default function Genesis() {
  const { account } = useWallet();
  const genesis = useGenesis();
  const titanX = useTitanX();
  const hburn = useHBURN();

  const [input, setInput] = useState("");
  const [balance, setBalance] = useState(0n);
  const [hburnBal, setHburnBal] = useState(0n);
  const [week, setWeek] = useState(1);
  const [claimable, setClaimable] = useState(0n);
  const [stats, setStats] = useState(null);
  const [tx, setTx] = useState({ phase: null, msg: "", sub: "" });

  // Fetch data
  useEffect(() => {
    if (!genesis || !account) return;
    (async () => {
      try {
        const [bal, hBal, w, claim, burned, minted, end, ended] = await Promise.all([
          titanX.balanceOf(account),
          hburn.balanceOf(account),
          genesis.currentWeek(),
          genesis.claimableAmount(account),
          genesis.totalTitanXBurned(),
          genesis.totalHBURNMinted(),
          genesis.genesisEnd(),
          genesis.genesisEnded(),
        ]);
        setBalance(bal); setHburnBal(hBal); setWeek(Number(w));
        setClaimable(claim);
        setStats({ burned, minted, end, ended });
      } catch (e) { console.error(e); }
    })();
  }, [genesis, titanX, hburn, account, tx.phase]);

  const amt = parseFloat(input) || 0;
  const weekData = WEEKS[Math.min(3, Math.max(0, week - 1))];
  const hburnOut = calcGenesisOutput(amt, week);
  const immediate = hburnOut * 0.25;
  const vested = hburnOut * 0.75;
  const balNum = bn(balance);

  // Burn TX
  const handleBurn = useCallback(async () => {
    if (!genesis || amt <= 0) return;
    const weiAmt = toWei(input);
    try {
      setTx({ phase: "pending", msg: "Approving TitanX...", sub: "Confirm in wallet" });
      const allowance = await titanX.allowance(account, ADDRESSES.genesisBurn);
      if (allowance < weiAmt) {
        const approveTx = await titanX.approve(ADDRESSES.genesisBurn, weiAmt);
        await approveTx.wait();
      }
      setTx({ phase: "pending", msg: "Burning TitanX...", sub: "Transaction pending" });
      const burnTx = await genesis.burn(weiAmt);
      await burnTx.wait();
      setTx({ phase: "success", msg: "Burn Complete!", sub: `Received ${fmt(immediate)} HBURN instantly` });
      setInput("");
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || err.message?.slice(0, 100) || "Transaction failed" });
    }
  }, [genesis, titanX, account, input, amt, immediate]);

  // Claim TX
  const handleClaim = useCallback(async () => {
    if (!genesis) return;
    try {
      setTx({ phase: "pending", msg: "Claiming Vested HBURN...", sub: "Confirm in wallet" });
      const claimTx = await genesis.claimVested();
      await claimTx.wait();
      setTx({ phase: "success", msg: "Claimed!", sub: `${fmt(claimable)} HBURN received` });
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || err.message?.slice(0, 100) || "Claim failed" });
    }
  }, [genesis, claimable]);

  const setPct = (p) => setInput(Math.floor(balNum * p / 100).toString());
  const now = Math.floor(Date.now() / 1000);
  const genesisActive = stats && !stats.ended && now <= Number(stats.end);
  const hoursLeft = stats ? Math.max(0, ((Number(stats.end) - Date.now() / 1000) / 3600).toFixed(1)) : 0;
  const progressPct = stats ? Math.min(100, ((GENESIS_DURATION_HOURS - hoursLeft) / GENESIS_DURATION_HOURS) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="font-display font-black text-4xl tracking-tight">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-fire-1/20 text-fire-3 border border-fire-2/40 mr-2 align-middle">1</span>
          <span className="fire-text">Genesis</span> Burn
        </h1>
        <p className="text-txt-2 text-sm mt-2">
          Burn TitanX → Mint HBURN. Week {week}/4.{" "}
          {genesisActive ? `${hoursLeft}h left.` : "Genesis ended — minting closed."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="hb-stat"><div className="num">{stats ? fmt(stats.burned) : "—"}</div><div className="lbl">TitanX Burned</div></div>
        <div className="hb-stat"><div className="num">{stats ? fmt(stats.minted) : "—"}</div><div className="lbl">HBURN Minted</div></div>
        <div className="hb-stat"><div className="num" style={{ color: "#22c55e" }}>{hoursLeft}h</div><div className="lbl">Hours Left</div></div>
        <div className="hb-stat"><div className="num">W{week}</div><div className="lbl">Current Week</div></div>
      </div>

      {/* Progress */}
      <div className="hb-card">
        <div className="hb-progress"><div className="hb-progress-fill" style={{ width: `${progressPct}%` }} /></div>
        <div className="flex justify-between mt-2 text-[10px] text-txt-3 tracking-wider">
          <span>HOUR {Math.round(GENESIS_DURATION_HOURS - hoursLeft)}</span><span>HOUR {GENESIS_DURATION_HOURS}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Burn Form */}
        <div className="hb-card">
          <div className="hb-label"><span className="dot" /> Burn TitanX</div>

          {!genesisActive ? (
            /* ── Genesis Ended State ───────────────────────── */
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="font-display font-bold text-lg text-txt-1 mb-2">Genesis Minting Closed</h3>
              <p className="text-sm text-txt-2 mb-4">
                The Genesis phase has ended. No more HBURN can be minted.
              </p>
              <div className="hb-output mb-4">
                <div className="hb-output-row"><span className="text-xs text-txt-2">Total TitanX Burned</span><span className="font-bold text-fire-3">{stats ? fmt(stats.burned) : "—"}</span></div>
                <div className="hb-output-row"><span className="text-xs text-txt-2">Total HBURN Minted</span><span className="font-bold text-green-400">{stats ? fmt(stats.minted) : "—"}</span></div>
              </div>
              {claimable > 0n && (
                <button className="hb-btn !from-green-600 !to-emerald-500" onClick={handleClaim}>
                  🎁 Claim {fmtETH(claimable)} Vested HBURN
                </button>
              )}
            </div>
          ) : (
            /* ── Active Burn Form ──────────────────────────── */
            <>
              {/* Week Indicator */}
              <div className="flex gap-1.5 mb-5">
                {WEEKS.map((w) => (
                  <div key={w.week} className={`flex-1 py-3 px-2 rounded-xl text-center text-xs border transition-all relative ${
                    w.week === week ? "bg-fire-1/10 border-fire-2 text-fire-3 shadow-[0_0_20px_rgba(255,69,0,0.1)]" : "bg-dark-3 border-dark-5 text-txt-2"
                  }`}>
                    <span className="font-bold text-sm block">W{w.week}</span>
                    <span className="opacity-70">{w.label}</span>
                    {w.bonus > 100 && (
                      <span className="absolute -top-2 -right-1 bg-fire-1 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        {w.bonusLabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="relative mb-3">
                <input type="number" className="hb-input" placeholder="0" value={input}
                  onChange={(e) => setInput(e.target.value)} disabled={!account} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-dark-4 px-3 py-1.5 rounded-lg text-xs text-txt-2 font-semibold tracking-wider">
                  TITANX
                </span>
              </div>
              {account && <p className="text-[11px] text-txt-3 mb-3">Balance: {fmt(balance)} TITANX</p>}
              <div className="flex gap-1.5 mb-5">
                {[25, 50, 75, 100].map((p) => (
                  <button key={p} className="hb-btn-ghost" onClick={() => setPct(p)} disabled={!account}>{p}%</button>
                ))}
              </div>

              {/* Output Preview */}
              <div className="hb-output">
                <div className="hb-output-row"><span className="text-xs text-txt-2">You Receive</span><span className="font-display font-bold text-fire-3">{amt > 0 ? fmt(hburnOut) + " HBURN" : "—"}</span></div>
                <hr className="hb-divider" />
                <div className="hb-output-row"><span className="text-xs text-txt-2">↳ Instant (25%)</span><span className="text-green-400 text-sm font-bold">{amt > 0 ? fmt(immediate) : "—"}</span></div>
                <div className="hb-output-row"><span className="text-xs text-txt-2">↳ Vested (75%)</span><span className="text-txt-3 text-sm">{amt > 0 ? fmt(vested) : "—"}</span></div>
                <hr className="hb-divider" />
                <div className="hb-output-row"><span className="text-xs text-txt-2">Rate</span><span className="text-xs">{(weekData.ratio * weekData.bonus / 10000).toFixed(4)} HBURN/TITANX</span></div>
              </div>

              <button className="hb-btn" onClick={handleBurn}
                disabled={!account || amt <= 0 || amt > balNum}>
                {!account ? "Connect Wallet" : amt > balNum ? "Insufficient Balance" : amt <= 0 ? "Enter Amount" : `🔥 Burn ${fmt(amt)} TitanX`}
              </button>
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          {/* Distribution */}
          <div className="hb-card">
            <div className="hb-label"><span className="dot" /> TitanX Distribution</div>
            <div className="flex h-2 rounded-full overflow-hidden mb-3">
              {TITANX_DISTRIBUTION.map((d) => <div key={d.label} style={{ width: `${d.pct}%`, background: d.color }} />)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TITANX_DISTRIBUTION.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-[11px] text-txt-2">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                  <span>{d.icon} {d.label}</span>
                  <span className="ml-auto font-bold text-txt-1">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vesting Claim */}
          <div className="hb-card border-fire-2/15 bg-gradient-to-br from-fire-1/5 to-purple-500/3">
            <div className="hb-label"><span className="dot" /> Your Vesting</div>
            {account ? (
              <>
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-txt-3 uppercase tracking-wider mb-1">HBURN Balance</p>
                    <p className="font-display font-bold text-xl">{fmt(hburnBal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-txt-3 uppercase tracking-wider mb-1">Claimable Now</p>
                    <p className="font-display font-bold text-xl text-green-400">{fmt(claimable)}</p>
                  </div>
                </div>
                <button className="hb-btn-outline w-full text-center" onClick={handleClaim}
                  disabled={!claimable || claimable === 0n}>
                  {claimable > 0n ? `Claim ${fmt(claimable)} HBURN` : "Nothing to Claim"}
                </button>
              </>
            ) : (
              <p className="text-center text-txt-3 py-6 text-sm">Connect wallet to view vesting</p>
            )}
          </div>
        </div>
      </div>

      <TxModal phase={tx.phase} message={tx.msg} subtext={tx.sub} onClose={() => setTx({ phase: null })} />
    </div>
  );
}
