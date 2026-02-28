import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useEpochs, useStaking, useHBURN, useGenesis } from "@/hooks/useContracts";
import { ADDRESSES } from "@/config/constants";
import { fmt, fmtETH, bn, timeLeft } from "@/utils";
import { getTier, STAKE_UNIT_SECONDS } from "@/config/constants";

export default function Portfolio() {
  const { account } = useWallet();
  const epochs = useEpochs();
  const staking = useStaking();
  const hburn = useHBURN();
  const genesis = useGenesis();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0);

  // Live countdown
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!epochs || !staking || !hburn || !account) return;
    setLoading(true);

    (async () => {
      try {
        // ─── Balances ──────────────────────────────────────────
        const hburnBal = await hburn.balanceOf(account);

        // ─── Genesis Info ──────────────────────────────────────
        let genesisTranches = 0;
        let genesisClaimable = 0n;
        try {
          genesisTranches = Number(await genesis.getUserTrancheCount(account));
          genesisClaimable = await genesis.claimableAmount(account);
        } catch {}

        // ─── Stakes ────────────────────────────────────────────
        const stakeIds = await staking.getUserStakes(account);
        const allStakes = [];
        let totalStaked = 0n;
        let totalPendingETH = 0n;
        let activeCount = 0;
        let completedCount = Number(await staking.completedStakes(account));

        for (const id of stakeIds) {
          const info = await staking.getStakeInfo(id);
          const s = {
            id: Number(id),
            amount: info[0], shares: info[1],
            startTime: Number(info[2]), endTime: Number(info[3]),
            fuelBonus: Number(info[4]), active: info[5],
            maturityPct: Number(info[6]), pendingETH: info[7],
          };
          allStakes.push(s);
          if (s.active) {
            activeCount++;
            totalStaked += s.amount;
            totalPendingETH += s.pendingETH;
          }
        }
        allStakes.reverse(); // newest first

        // ─── Epochs ────────────────────────────────────────────
        const currentEid = Number(await epochs.currentEpochId());
        const epochHistory = [];
        let totalEpochRewards = 0n;
        let totalTXBurned = 0n;
        let totalDXBurned = 0n;
        let epochsParticipated = 0;

        for (let i = 0; i <= currentEid; i++) {
          const myBurn = await epochs.getUserEpochBurn(i, account);
          if (myBurn === 0n) continue;

          epochsParticipated++;
          const [epochInfo, totalBurns, epochRewards, pending, claimed] = await Promise.all([
            epochs.epochs(i),
            epochs.getEpochTotalBurns(i),
            epochs.getEpochRewards(i),
            epochs.pendingReward(i, account),
            epochs.hasClaimedEpoch(i, account),
          ]);

          const myShare = totalBurns > 0n ? Number(myBurn * 10000n / totalBurns) / 100 : 0;
          const myReward = epochInfo.finalized && totalBurns > 0n
            ? (epochRewards * myBurn / totalBurns)
            : 0n;

          if (claimed) totalEpochRewards += myReward;

          epochHistory.push({
            id: i,
            myBurn,
            totalBurns,
            myShare,
            ethRewards: epochRewards,
            myReward,
            finalized: epochInfo.finalized,
            claimed,
            pending,
            isCurrent: i === currentEid,
          });
        }

        // ─── Phoenix ───────────────────────────────────────────
        let phoenix = false;
        let streak = 10;
        try {
          phoenix = await staking.hasPhoenixStatus(account);
          streak = Number(await epochs.getUserStreakMultiplier(account));
        } catch {}

        setData({
          hburnBal, genesisTranches, genesisClaimable,
          allStakes, totalStaked, totalPendingETH, activeCount, completedCount,
          epochHistory, totalEpochRewards, epochsParticipated,
          currentEpoch: currentEid, phoenix, streak,
        });
      } catch (e) {
        console.error("Portfolio load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [epochs, staking, hburn, genesis, account]);

  if (!account) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📊</div>
        <h1 className="font-display font-bold text-xl text-txt-1 mb-2">Portfolio</h1>
        <p className="text-sm text-txt-3">Connect wallet to view your history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 animate-pulse">🔥</div>
        <p className="text-sm text-txt-3">Loading your portfolio...</p>
      </div>
    );
  }

  if (!data) return null;

  const d = data;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="font-display font-black text-4xl tracking-tight">
          📊 <span className="fire-text">Portfolio</span>
        </h1>
        <p className="text-txt-2 text-sm mt-2">Your complete HellBurn history & performance</p>
      </div>

      {/* ─── Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="hb-stat">
          <div className="num">{fmt(d.hburnBal)}</div>
          <div className="lbl">HBURN Balance</div>
        </div>
        <div className="hb-stat">
          <div className="num">{fmt(d.totalStaked)}</div>
          <div className="lbl">HBURN Staked</div>
        </div>
        <div className="hb-stat">
          <div className="num" style={{ color: "#22c55e" }}>{fmtETH(d.totalPendingETH)}</div>
          <div className="lbl">Pending Stake ETH</div>
        </div>
        <div className="hb-stat">
          <div className="num" style={{ color: "#22c55e" }}>{fmtETH(d.totalEpochRewards)}</div>
          <div className="lbl">ETH Earned (Epochs)</div>
        </div>
      </div>

      {/* ─── Status Badges ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[11px] px-3 py-1.5 rounded-full bg-dark-3 border border-dark-5 text-txt-2">
          {d.phoenix ? "🔥 Phoenix" : `🏔 Phoenix: ${d.completedCount}/3`}
        </span>
        <span className="text-[11px] px-3 py-1.5 rounded-full bg-dark-3 border border-dark-5 text-txt-2">
          🔗 Streak: {(d.streak / 10).toFixed(1)}x
        </span>
        <span className="text-[11px] px-3 py-1.5 rounded-full bg-dark-3 border border-dark-5 text-txt-2">
          📦 {d.epochsParticipated} Epoch{d.epochsParticipated !== 1 ? "s" : ""} participated
        </span>
        <span className="text-[11px] px-3 py-1.5 rounded-full bg-dark-3 border border-dark-5 text-txt-2">
          🎯 {d.activeCount} active stake{d.activeCount !== 1 ? "s" : ""} / {d.completedCount} completed
        </span>
        {d.genesisTranches > 0 && (
          <span className="text-[11px] px-3 py-1.5 rounded-full bg-fire-1/10 border border-fire-2/20 text-fire-3">
            🌋 Genesis: {d.genesisTranches} tranche{d.genesisTranches !== 1 ? "s" : ""}
            {d.genesisClaimable > 0n && ` · ${fmt(d.genesisClaimable)} claimable`}
          </span>
        )}
      </div>

      {/* ─── Epoch History ──────────────────────────────────── */}
      <div className="hb-card">
        <div className="hb-label"><span className="dot" /> Epoch History</div>
        {d.epochHistory.length === 0 ? (
          <p className="text-center text-txt-3 py-6 text-sm">No epoch participation yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-txt-3 text-[10px] uppercase tracking-wider border-b border-dark-5">
                  <th className="text-left py-2 px-2">Epoch</th>
                  <th className="text-right py-2 px-2">Your Burns</th>
                  <th className="text-right py-2 px-2">Share</th>
                  <th className="text-right py-2 px-2">ETH Pool</th>
                  <th className="text-right py-2 px-2">Your Reward</th>
                  <th className="text-right py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {d.epochHistory.map((e) => (
                  <tr key={e.id} className="border-b border-dark-5/50 hover:bg-dark-3/50 transition-colors">
                    <td className="py-2.5 px-2 font-bold">
                      #{e.id}
                      {e.isCurrent && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-fire-1/10 text-fire-3 border border-fire-2/20">
                          LIVE
                        </span>
                      )}
                    </td>
                    <td className="text-right py-2.5 px-2 font-mono">{fmt(e.myBurn)}</td>
                    <td className="text-right py-2.5 px-2">{e.myShare.toFixed(1)}%</td>
                    <td className="text-right py-2.5 px-2 text-txt-2">{fmtETH(e.ethRewards)}</td>
                    <td className="text-right py-2.5 px-2 font-bold" style={{ color: e.myReward > 0n ? "#22c55e" : undefined }}>
                      {e.finalized ? fmtETH(e.myReward) : "—"}
                    </td>
                    <td className="text-right py-2.5 px-2">
                      {e.isCurrent ? (
                        <span className="text-fire-3">Active</span>
                      ) : !e.finalized ? (
                        <span className="text-amber-400">Pending</span>
                      ) : e.claimed ? (
                        <span className="text-green-400">✓ Claimed</span>
                      ) : e.pending > 0n ? (
                        <span className="text-yellow-300">Claimable</span>
                      ) : (
                        <span className="text-txt-3">No reward</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Stake History ──────────────────────────────────── */}
      <div className="hb-card">
        <div className="hb-label"><span className="dot" /> Stake History</div>
        {d.allStakes.length === 0 ? (
          <p className="text-center text-txt-3 py-6 text-sm">No stakes yet</p>
        ) : (
          <div className="space-y-2">
            {d.allStakes.map((s) => {
              const numDays = Math.round((s.endTime - s.startTime) / STAKE_UNIT_SECONDS);
              const t = getTier(numDays);
              const now = Math.floor(Date.now() / 1000);
              const secsLeft = Math.max(0, s.endTime - now);
              const hLeft = Math.floor(secsLeft / 3600);
              const mLeft = Math.floor((secsLeft % 3600) / 60);
              const sLeft = Math.floor(secsLeft % 60);
              const ended = secsLeft === 0;
              const startStr = new Date(s.startTime * 1000).toLocaleString();
              const endStr = new Date(s.endTime * 1000).toLocaleString();

              return (
                <div key={s.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl px-4 py-3 border ${
                    s.active ? "bg-dark-3 border-dark-5" : "bg-dark-3/50 border-dark-5/50 opacity-60"
                  }`}>
                  {/* Left: Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg" style={{ color: t.color }}>◆</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">#{s.id}</span>
                        <span className="text-[10px] font-bold" style={{ color: t.color }}>{t.name}</span>
                        <span className="text-[10px] text-txt-3">{numDays}d</span>
                        {!s.active && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-dark-4 text-txt-3">Ended</span>}
                      </div>
                      <div className="text-[10px] text-txt-3 mt-0.5">
                        {startStr} → {endStr}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Amount & Maturity */}
                  <div className="flex items-center gap-4 text-[11px]">
                    <div className="text-center">
                      <div className="font-bold">{fmt(s.amount)}</div>
                      <div className="text-txt-3">HBURN</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{s.maturityPct}%</div>
                      <div className="text-txt-3">Mature</div>
                    </div>
                    {s.fuelBonus > 0 && (
                      <div className="text-center">
                        <div className="font-bold text-amber-400">+{(s.fuelBonus / 100).toFixed(0)}%</div>
                        <div className="text-txt-3">Fuel</div>
                      </div>
                    )}
                  </div>

                  {/* Right: Time / ETH */}
                  <div className="text-right text-[11px]">
                    {s.active && (
                      <div className={`font-bold ${ended ? "text-green-400" : "text-fire-3"}`}>
                        {ended ? "✅ Ready" : hLeft > 0 ? `${hLeft}h ${mLeft}m ${sLeft}s` : `${mLeft}m ${sLeft}s`}
                      </div>
                    )}
                    <div className="font-bold text-green-400">{fmtETH(s.pendingETH)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
