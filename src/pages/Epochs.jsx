import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useEpochs, useTitanX, useDragonX, useGenesis } from "@/hooks/useContracts";
import { ADDRESSES, EPOCH_DURATION_DAYS } from "@/config/constants";
import { fmt, fmtETH, bn, toWei, timeLeft } from "@/utils";
import TxModal from "@/components/TxModal";
import { Link } from "react-router-dom";

export default function Epochs() {
  const { account } = useWallet();
  const epochs = useEpochs();
  const titanX = useTitanX();
  const dragonX = useDragonX();
  const genesis = useGenesis();

  const [genesisActive, setGenesisActive] = useState(false);
  const [genesisEnd, setGenesisEnd] = useState(0);
  const [token, setToken] = useState("titanX"); // "titanX" | "dragonX"
  const [input, setInput] = useState("");
  const [balTX, setBalTX] = useState(0n);
  const [balDX, setBalDX] = useState(0n);
  const [epochData, setEpochData] = useState(null);
  const [userBurn, setUserBurn] = useState(0n);
  const [streak, setStreak] = useState(10);
  const [pastEpochs, setPastEpochs] = useState([]);
  const [tx, setTx] = useState({ phase: null, msg: "", sub: "" });
  const [tick, setTick] = useState(0);

  // Live countdown
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

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
    if (!epochs || !account) return;
    (async () => {
      try {
        const [bTX, bDX, epochId, firstStart, titanBurned, dragonBurned, ethDist, streakMult] = await Promise.all([
          titanX.balanceOf(account),
          dragonX.balanceOf(account),
          epochs.currentEpochId(),
          epochs.firstEpochStart(),
          epochs.totalTitanXBurned(),
          epochs.totalDragonXBurned(),
          epochs.totalETHDistributed(),
          epochs.getUserStreakMultiplier(account),
        ]);
        setBalTX(bTX); setBalDX(bDX); setStreak(Number(streakMult));

        const eid = Number(epochId);
        const epochEnd = await epochs.epochEndTime(epochId);
        const epochDeposited = await epochs.getEpochDeposited(epochId);
        const totalBurns = await epochs.getEpochTotalBurns(epochId);
        const myBurn = await epochs.getUserEpochBurn(epochId, account);
        setUserBurn(myBurn);

        setEpochData({ epochId: eid, epochEnd, epochDeposited, totalBurns, titanBurned, dragonBurned, ethDist, firstStart });

        // Load past epochs with user participation
        const past = [];
        for (let i = Math.max(0, eid - 10); i < eid; i++) {
          const [myBurnPast, epochInfo] = await Promise.all([
            epochs.getUserEpochBurn(i, account),
            epochs.epochs(i),
          ]);
          const finalized = epochInfo.finalized;
          const pending = finalized ? await epochs.pendingReward(i, account) : 0n;
          const hasBurns = myBurnPast > 0n;
          // Show if: user burned (needs finalize or claim) OR not finalized (anyone can finalize)
          if (hasBurns || !finalized) {
            past.push({ id: i, reward: pending, finalized, hasBurns, ethDeposited: epochInfo.ethDeposited });
          }
        }
        setPastEpochs(past);
      } catch (e) { console.error(e); }
    })();
  }, [epochs, titanX, dragonX, account, tx.phase]);

  const bal = token === "titanX" ? balTX : balDX;
  const amt = parseFloat(input) || 0;
  const balNum = bn(bal);
  const weight = token === "dragonX" ? 2 : 1;

  // Burn
  const handleBurn = useCallback(async () => {
    if (!epochs || amt <= 0) return;
    const weiAmt = toWei(input);
    const tokenContract = token === "titanX" ? titanX : dragonX;
    const contractAddr = ADDRESSES.burnEpochs;

    try {
      setTx({ phase: "pending", msg: `Approving ${token === "titanX" ? "TitanX" : "DragonX"}...`, sub: "Confirm in wallet" });
      const allowance = await tokenContract.allowance(account, contractAddr);
      if (allowance < weiAmt) {
        const appTx = await tokenContract.approve(contractAddr, weiAmt);
        await appTx.wait();
      }
      setTx({ phase: "pending", msg: "Burning...", sub: "Transaction pending" });
      const burnTx = token === "titanX"
        ? await epochs.burnTitanX(weiAmt)
        : await epochs.burnDragonX(weiAmt);
      await burnTx.wait();
      setTx({ phase: "success", msg: "Burned!", sub: `${fmt(amt)} ${token === "titanX" ? "TitanX" : "DragonX"} burned (${weight}x weight)` });
      setInput("");
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || err.message?.slice(0, 100) || "Failed" });
    }
  }, [epochs, titanX, dragonX, account, input, amt, token, weight]);

  // Claim single
  const handleClaim = useCallback(async (epochId) => {
    try {
      setTx({ phase: "pending", msg: `Claiming Epoch #${epochId}...`, sub: "Confirm in wallet" });
      const claimTx = await epochs.claimRewards(epochId);
      await claimTx.wait();
      setTx({ phase: "success", msg: "ETH Claimed!", sub: "" });
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || "Claim failed" });
    }
  }, [epochs]);

  // Finalize epoch
  const handleFinalize = useCallback(async (epochId) => {
    try {
      setTx({ phase: "pending", msg: `Finalizing Epoch #${epochId}...`, sub: "Distributes ETH rewards" });
      const finTx = await epochs.finalizeEpoch(epochId);
      await finTx.wait();
      setTx({ phase: "success", msg: `Epoch #${epochId} Finalized!`, sub: "Rewards are now claimable" });
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || "Finalize failed" });
    }
  }, [epochs]);

  // Batch claim
  const handleBatchClaim = useCallback(async () => {
    const claimable = pastEpochs.filter((e) => e.finalized && e.reward > 0n);
    if (claimable.length === 0) return;
    try {
      setTx({ phase: "pending", msg: "Claiming all rewards...", sub: "Confirm in wallet" });
      const ids = claimable.map((e) => e.id);
      const claimTx = await epochs.batchClaimRewards(ids);
      await claimTx.wait();
      setTx({ phase: "success", msg: "All Rewards Claimed!", sub: "" });
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || "Batch claim failed" });
    }
  }, [epochs, pastEpochs]);

  const setPct = (p) => setInput(Math.floor(balNum * p / 100).toString());
  const streakDisplay = (streak / 10).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="font-display font-black text-4xl tracking-tight">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-fire-1/20 text-fire-3 border border-fire-2/40 mr-2 align-middle">2</span>
          Burn <span className="fire-text">Epochs</span>
        </h1>
        <p className="text-txt-2 text-sm mt-2">
          8-day competitive cycles. Burn TitanX/DragonX → Earn ETH.
        </p>
      </div>

      {/* Genesis Lock Overlay */}
      {genesisActive && (
        <div className="hb-card border-fire-2/20 bg-gradient-to-br from-fire-1/5 to-dark-2 text-center py-12">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-display font-bold text-xl text-txt-1 mb-2">Epochs Unlock After Genesis</h2>
          <p className="text-sm text-txt-2 mb-2">
            The competitive burn epochs begin once the 28-day Genesis phase ends.
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
      {/* Epoch Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="hb-stat"><div className="num">#{epochData?.epochId ?? "—"}</div><div className="lbl">Current Epoch</div></div>
        <div className="hb-stat"><div className="num" style={{ color: "#22c55e" }}>{epochData ? timeLeft(epochData.epochEnd) : "—"}</div><div className="lbl">Ends In</div></div>
        <div className="hb-stat"><div className="num">{fmtETH(epochData?.epochDeposited)}</div><div className="lbl">ETH This Epoch</div></div>
        <div className="hb-stat"><div className="num">{streakDisplay}x</div><div className="lbl">Your Streak</div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Burn Form */}
        <div className="hb-card">
          <div className="hb-label"><span className="dot" /> Burn to Compete</div>

          {/* Token Toggle */}
          <div className="flex gap-2 mb-5">
            {["titanX", "dragonX"].map((t) => (
              <button key={t} onClick={() => { setToken(t); setInput(""); }}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  token === t ? "bg-fire-1/10 border-fire-2 text-fire-3" : "bg-dark-3 border-dark-5 text-txt-2"
                }`}>
                {t === "titanX" ? "🔥 TitanX (1x)" : "🐉 DragonX (2x)"}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="relative mb-3">
            <input type="number" className="hb-input" placeholder="0" value={input}
              onChange={(e) => setInput(e.target.value)} disabled={!account} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-dark-4 px-3 py-1.5 rounded-lg text-xs text-txt-2 font-semibold">
              {token === "titanX" ? "TITANX" : "DRAGONX"}
            </span>
          </div>
          {account && <p className="text-[11px] text-txt-3 mb-3">Balance: {fmt(bal)}</p>}
          <div className="flex gap-1.5 mb-5">
            {[25, 50, 75, 100].map((p) => (
              <button key={p} className="hb-btn-ghost" onClick={() => setPct(p)} disabled={!account}>{p}%</button>
            ))}
          </div>

          {/* Preview */}
          <div className="hb-output">
            <div className="hb-output-row"><span className="text-xs text-txt-2">Weighted Burn</span><span className="font-bold text-fire-3">{amt > 0 ? fmt(amt * weight * streak / 10) : "—"}</span></div>
            <div className="hb-output-row"><span className="text-xs text-txt-2">Token Weight</span><span className="text-sm">{weight}x</span></div>
            <div className="hb-output-row"><span className="text-xs text-txt-2">Streak Bonus</span><span className="text-sm">{streakDisplay}x</span></div>
            <hr className="hb-divider" />
            <div className="hb-output-row"><span className="text-xs text-txt-2">Your Share</span>
              <span className="text-xs">{epochData && bn(epochData.totalBurns) > 0
                ? ((bn(userBurn) + amt * weight * streak / 10) / (bn(epochData.totalBurns) + amt * weight * streak / 10) * 100).toFixed(1) + "%"
                : amt > 0 ? "100%" : "—"
              }</span>
            </div>
          </div>

          <button className="hb-btn" onClick={handleBurn} disabled={!account || amt <= 0 || amt > balNum}>
            {!account ? "Connect Wallet" : amt <= 0 ? "Enter Amount" : `🔥 Burn ${fmt(amt)} ${token === "titanX" ? "TitanX" : "DragonX"}`}
          </button>
        </div>

        {/* Past Epochs & Rewards */}
        <div className="hb-card">
          <div className="hb-label"><span className="dot" /> Past Epochs & Rewards</div>
          {!account ? (
            <p className="text-center text-txt-3 py-8 text-sm">Connect wallet to view rewards</p>
          ) : pastEpochs.length === 0 ? (
            <p className="text-center text-txt-3 py-8 text-sm">No past epochs with activity</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {pastEpochs.map((e) => (
                  <div key={e.id} className="flex items-center justify-between bg-dark-3 rounded-lg px-4 py-3 border border-dark-5">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-sm">#{e.id}</span>
                      {!e.finalized ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Needs Finalization
                        </span>
                      ) : e.reward > 0n ? (
                        <span className="text-green-400 font-bold text-sm">{fmtETH(e.reward)}</span>
                      ) : (
                        <span className="text-[10px] text-txt-3">
                          {e.hasBurns ? "Claimed" : "No burns"}
                        </span>
                      )}
                    </div>
                    <div>
                      {!e.finalized ? (
                        <button className="hb-btn text-[10px] py-1.5 px-4" onClick={() => handleFinalize(e.id)}>
                          ⚡ Finalize
                        </button>
                      ) : e.reward > 0n ? (
                        <button className="hb-btn-outline text-[10px] py-1.5 px-4" onClick={() => handleClaim(e.id)}>
                          Claim ETH
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              {pastEpochs.some((e) => e.finalized && e.reward > 0n) && (
                <button className="hb-btn w-full" onClick={handleBatchClaim}>
                  Claim All ({pastEpochs.filter((e) => e.finalized && e.reward > 0n).length} epochs)
                </button>
              )}
            </>
          )}

          {/* Global Stats */}
          <div className="mt-6 pt-4 border-t border-dark-5">
            <p className="text-[10px] text-txt-3 uppercase tracking-wider mb-3">Lifetime Burns</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-3 rounded-lg p-3 text-center">
                <p className="font-display font-bold text-fire-3">{epochData ? fmt(epochData.titanBurned) : "—"}</p>
                <p className="text-[9px] text-txt-3 mt-1">TitanX Burned</p>
              </div>
              <div className="bg-dark-3 rounded-lg p-3 text-center">
                <p className="font-display font-bold" style={{ color: "#8b5cf6" }}>{epochData ? fmt(epochData.dragonBurned) : "—"}</p>
                <p className="text-[9px] text-txt-3 mt-1">DragonX Burned</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>)}

      <TxModal phase={tx.phase} message={tx.msg} subtext={tx.sub} onClose={() => setTx({ phase: null })} />
    </div>
  );
}
