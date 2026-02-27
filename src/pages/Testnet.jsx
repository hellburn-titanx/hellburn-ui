import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useMockTitanX, useMockDragonX, useGenesis, useEpochs, useStaking } from "@/hooks/useContracts";
import { ADDRESSES, CHAIN_ID } from "@/config/constants";
import { fmt, fmtETH, toWei } from "@/utils";
import TxModal from "@/components/TxModal";

const FAUCET_PRESETS = [
  { label: "1M", value: "1000000" },
  { label: "10M", value: "10000000" },
  { label: "50M", value: "50000000" },
  { label: "100M", value: "100000000" },
];

const TIME_PRESETS = [
  { label: "1 hour", seconds: 3600 },
  { label: "1 day", seconds: 86400 },
  { label: "7 days", seconds: 604800 },
  { label: "14 days", seconds: 1209600 },
  { label: "28 days", seconds: 2419200 },
  { label: "90 days", seconds: 7776000 },
];

export default function Testnet() {
  const { account, provider, signer } = useWallet();
  const mockTitanX = useMockTitanX();
  const mockDragonX = useMockDragonX();
  const genesis = useGenesis();
  const epochs = useEpochs();
  const staking = useStaking();

  const [titanBal, setTitanBal] = useState(0n);
  const [dragonBal, setDragonBal] = useState(0n);
  const [faucetAmount, setFaucetAmount] = useState("10000000");
  const [tx, setTx] = useState({ phase: null, msg: "", sub: "" });

  const [timeDays, setTimeDays] = useState(1);
  const [timeWarpSupported, setTimeWarpSupported] = useState(null);
  const [blockTime, setBlockTime] = useState(null);
  const [protocolState, setProtocolState] = useState(null);

  // Check balances
  useEffect(() => {
    if (!mockTitanX || !account) return;
    (async () => {
      try {
        const [tBal, dBal] = await Promise.all([
          mockTitanX.balanceOf(account),
          mockDragonX.balanceOf(account),
        ]);
        setTitanBal(tBal);
        setDragonBal(dBal);
      } catch { /* ignore */ }
    })();
  }, [mockTitanX, mockDragonX, account, tx.phase]);

  // Check if time warp is supported (local Hardhat node)
  useEffect(() => {
    if (!provider) return;
    (async () => {
      try {
        const block = await provider.getBlock("latest");
        setBlockTime(block.timestamp);

        // Test if evm_increaseTime works — this only succeeds on Hardhat/Anvil
        await provider.send("evm_snapshot", []);
        setTimeWarpSupported(true);
      } catch {
        setTimeWarpSupported(false);
      }
    })();
  }, [provider]);

  // Load protocol state
  useEffect(() => {
    if (!genesis || !epochs || !staking) return;
    (async () => {
      try {
        const [genesisEnd, genesisEnded, currentEpoch, firstEpochStart, totalShares] = await Promise.all([
          genesis.genesisEnd(),
          genesis.genesisEnded(),
          epochs.currentEpochId(),
          epochs.firstEpochStart(),
          staking.totalShares(),
        ]);

        const now = Math.floor(Date.now() / 1000);
        const genesisEndTs = Number(genesisEnd);
        const firstEpochTs = Number(firstEpochStart);

        setProtocolState({
          genesisEnded,
          genesisHoursLeft: Math.max(0, ((genesisEndTs - now) / 3600).toFixed(1)),
          genesisEndTs,
          currentEpoch: Number(currentEpoch),
          firstEpochTs,
          epochsStarted: now >= firstEpochTs,
          epochsHoursUntil: Math.max(0, ((firstEpochTs - now) / 3600).toFixed(1)),
          totalShares,
        });
      } catch (e) { console.error(e); }
    })();
  }, [genesis, epochs, staking, tx.phase, blockTime]);

  // ─── Faucet ───────────────────────────────────────────────────
  const handleMint = useCallback(async (token) => {
    const contract = token === "titanX" ? mockTitanX : mockDragonX;
    const name = token === "titanX" ? "TitanX" : "DragonX";
    if (!contract || !account) return;
    try {
      setTx({ phase: "pending", msg: `Minting ${fmt(parseFloat(faucetAmount))} ${name}...`, sub: "Confirm in wallet" });
      const mintTx = await contract.mint(account, toWei(faucetAmount));
      await mintTx.wait();
      setTx({ phase: "success", msg: `${name} Minted!`, sub: `${fmt(parseFloat(faucetAmount))} ${name} added to your wallet` });
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || err.message?.slice(0, 100) || "Mint failed" });
    }
  }, [mockTitanX, mockDragonX, account, faucetAmount]);

  const handleMintBoth = useCallback(async () => {
    if (!mockTitanX || !mockDragonX || !account) return;
    try {
      setTx({ phase: "pending", msg: "Minting TitanX + DragonX...", sub: "2 transactions" });
      const tx1 = await mockTitanX.mint(account, toWei(faucetAmount));
      await tx1.wait();
      const tx2 = await mockDragonX.mint(account, toWei(faucetAmount));
      await tx2.wait();
      setTx({ phase: "success", msg: "Both Tokens Minted!", sub: `${fmt(parseFloat(faucetAmount))} of each` });
    } catch (err) {
      setTx({ phase: "error", msg: err.reason || err.message?.slice(0, 100) || "Mint failed" });
    }
  }, [mockTitanX, mockDragonX, account, faucetAmount]);

  // ─── Time Warp ────────────────────────────────────────────────
  const handleTimeWarp = useCallback(async (seconds) => {
    if (!provider) return;
    try {
      setTx({ phase: "pending", msg: `Warping ${Math.round(seconds / 86400)} day(s)...`, sub: "Advancing blockchain time" });
      await provider.send("evm_increaseTime", [seconds]);
      await provider.send("evm_mine", []);
      const block = await provider.getBlock("latest");
      setBlockTime(block.timestamp);
      setTx({ phase: "success", msg: "Time Warped!", sub: `Block time: ${new Date(block.timestamp * 1000).toLocaleString()}` });
    } catch (err) {
      setTx({ phase: "error", msg: err.message?.includes("evm_increaseTime")
        ? "Time warp not supported on this network. Use local Hardhat node."
        : err.message?.slice(0, 100) || "Time warp failed"
      });
    }
  }, [provider]);

  const handleSliderWarp = useCallback(() => {
    handleTimeWarp(timeDays * 86400);
  }, [timeDays, handleTimeWarp]);

  // Is this testnet?
  const isTestnet = CHAIN_ID !== 1;

  if (!isTestnet) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="font-display font-bold text-xl text-txt-1">Testnet Only</h2>
        <p className="text-sm text-txt-2 mt-2">This page is only available on testnet deployments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="font-display font-black text-4xl tracking-tight">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40 mr-2 align-middle">🧪</span>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Testnet</span> Tools
        </h1>
        <p className="text-txt-2 text-sm mt-2">
          Faucet for mock tokens + time simulation for beta testing.
        </p>
      </div>

      {/* Protocol Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="hb-stat">
          <div className="num" style={{ color: protocolState?.genesisEnded ? "#22c55e" : "#ff4500" }}>
            {protocolState?.genesisEnded ? "✅" : `${protocolState?.genesisHoursLeft ?? "—"}h`}
          </div>
          <div className="lbl">{protocolState?.genesisEnded ? "Genesis Done" : "Genesis Left"}</div>
        </div>
        <div className="hb-stat">
          <div className="num" style={{ color: protocolState?.epochsStarted ? "#22c55e" : "#f59e0b" }}>
            {protocolState?.epochsStarted ? `#${protocolState?.currentEpoch}` : `${protocolState?.epochsHoursUntil ?? "—"}h`}
          </div>
          <div className="lbl">{protocolState?.epochsStarted ? "Current Epoch" : "Until Epochs"}</div>
        </div>
        <div className="hb-stat">
          <div className="num">{fmt(titanBal)}</div>
          <div className="lbl">Your TitanX</div>
        </div>
        <div className="hb-stat">
          <div className="num" style={{ color: "#8b5cf6" }}>{fmt(dragonBal)}</div>
          <div className="lbl">Your DragonX</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ─── FAUCET ─────────────────────────────────────────── */}
        <div className="hb-card">
          <div className="hb-label">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse_slow" /> Token Faucet
          </div>
          <p className="text-xs text-txt-2 mb-5">
            Mint mock TitanX and DragonX to your wallet for testing. These are test tokens with no real value.
          </p>

          {/* Amount Presets */}
          <div className="flex gap-1.5 mb-4">
            {FAUCET_PRESETS.map((p) => (
              <button key={p.value} onClick={() => setFaucetAmount(p.value)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  faucetAmount === p.value
                    ? "border-purple-500 text-purple-400 bg-purple-500/10"
                    : "border-dark-5 text-txt-3 bg-dark-3"
                }`}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="relative mb-5">
            <input type="number" className="hb-input" placeholder="Custom amount"
              value={faucetAmount} onChange={(e) => setFaucetAmount(e.target.value)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-dark-4 px-3 py-1.5 rounded-lg text-xs text-txt-2 font-semibold">
              TOKENS
            </span>
          </div>

          {/* Mint Buttons */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button className="hb-btn flex-1 !from-fire-1 !to-fire-ember"
                onClick={() => handleMint("titanX")} disabled={!account || !faucetAmount}>
                🔥 Mint TitanX
              </button>
              <button className="hb-btn flex-1 !from-purple-600 !to-purple-800"
                onClick={() => handleMint("dragonX")} disabled={!account || !faucetAmount}>
                🐉 Mint DragonX
              </button>
            </div>
            <button className="hb-btn !from-pink-600 !to-orange-500 w-full"
              onClick={handleMintBoth} disabled={!account || !faucetAmount}>
              ✨ Mint Both ({fmt(parseFloat(faucetAmount) || 0)} each)
            </button>
          </div>

          {!account && (
            <p className="text-center text-xs text-txt-3 mt-4">Connect wallet to use faucet</p>
          )}
        </div>

        {/* ─── TIME WARP ──────────────────────────────────────── */}
        <div className="hb-card">
          <div className="hb-label">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse_slow" /> Time Warp
          </div>

          {timeWarpSupported === false ? (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5 mb-5">
              <p className="text-sm text-yellow-400 font-semibold mb-2">⚠️ Nicht verfügbar auf Sepolia</p>
              <p className="text-xs text-txt-2 leading-relaxed mb-3">
                Time Warp funktioniert nur auf einem <strong className="text-txt-1">lokalen Hardhat Node</strong>, weil echte Testnets keine Zeitmanipulation erlauben.
              </p>
              <div className="bg-dark-3 rounded-lg p-3 font-mono text-[11px] text-txt-2 leading-relaxed">
                <span className="text-txt-3"># Terminal 1: Lokalen Node starten</span><br />
                npx hardhat node<br /><br />
                <span className="text-txt-3"># Terminal 2: Contracts deployen</span><br />
                npx hardhat run scripts/deploy-testnet.js \<br />
                &nbsp;&nbsp;--network localhost<br /><br />
                <span className="text-txt-3"># UI auf localhost zeigen lassen</span><br />
                <span className="text-txt-3"># (RPC_URL → http://127.0.0.1:8545)</span>
              </div>
              <p className="text-[10px] text-txt-3 mt-3">
                Tipp: Der lokale Node behält alle Accounts. Tester können mit MetaMask → Netzwerk hinzufügen → localhost:8545 verbinden.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-txt-2 mb-5">
                Simuliere den Zeitablauf um Genesis, Epochs und Staking-Maturity zu testen.
                Verschiebt <code className="text-purple-400">block.timestamp</code> auf der lokalen Chain.
              </p>

              {/* Current Block Time */}
              {blockTime && (
                <div className="bg-dark-3 rounded-lg p-3 mb-5 text-center">
                  <p className="text-[10px] text-txt-3 uppercase tracking-wider mb-1">Block Time</p>
                  <p className="font-mono text-sm text-txt-1">{new Date(blockTime * 1000).toLocaleString()}</p>
                </div>
              )}

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {TIME_PRESETS.map((p) => (
                  <button key={p.label} onClick={() => handleTimeWarp(p.seconds)}
                    className="hb-btn-ghost !flex-none px-4 text-[11px]">
                    ⏩ {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Slider */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-txt-3 mb-2">
                  <span>Custom Warp</span>
                  <span className="font-bold text-txt-1">{timeDays} day{timeDays !== 1 ? "s" : ""}</span>
                </div>
                <input type="range" min={1} max={365} value={timeDays}
                  onChange={(e) => setTimeDays(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-dark-4 cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                <div className="flex justify-between text-[10px] text-txt-3 mt-1">
                  <span>1 day</span><span>1 year</span>
                </div>
              </div>

              <button className="hb-btn !from-blue-600 !to-cyan-500 w-full" onClick={handleSliderWarp}>
                ⏩ Warp {timeDays} Day{timeDays !== 1 ? "s" : ""} Forward
              </button>
            </>
          )}

          {/* Beta Timings */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] text-txt-3 uppercase tracking-wider mb-3">⏱️ Beta Timings (vs Mainnet)</p>
            <div className="space-y-1.5">
              {[
                { param: "Genesis Duration", mainnet: "28 days", beta: "12 hours" },
                { param: "Genesis Weeks", mainnet: "7 days", beta: "3 hours" },
                { param: "Vesting", mainnet: "28 days", beta: "6 hours" },
                { param: "Epoch Duration", mainnet: "8 days", beta: "2 hours" },
                { param: "Min Stake", mainnet: "28 days", beta: "1 hour" },
                { param: "Max Stake", mainnet: "3,500 days", beta: "24 hours" },
                { param: "Grace Period", mainnet: "7 days", beta: "1 hour" },
              ].map((r) => (
                <div key={r.param} className="flex items-center text-xs rounded-lg px-3 py-1.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-txt-2 flex-1">{r.param}</span>
                  <span className="text-txt-3 w-20 text-right line-through opacity-50">{r.mainnet}</span>
                  <span className="text-fire-3 w-20 text-right font-bold">{r.beta}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Guide */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] text-txt-3 uppercase tracking-wider mb-3">Testing Cheat Sheet</p>
            <div className="space-y-2 text-xs text-txt-2">
              <div className="flex gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-fire-1/20 text-fire-3 border border-fire-2/40 flex-shrink-0">1</span>
                <span><strong className="text-txt-1">Genesis (12h):</strong> Mint TitanX → Burn in Genesis → Claim vested HBURN over 6h</span>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-fire-1/20 text-fire-3 border border-fire-2/40 flex-shrink-0">2</span>
                <span><strong className="text-txt-1">Epochs (2h each):</strong> After Genesis ends → Burn TitanX/DragonX → Finalize → Claim ETH</span>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-fire-1/20 text-fire-3 border border-fire-2/40 flex-shrink-0">3</span>
                <span><strong className="text-txt-1">Staking (min 1h):</strong> Stake HBURN → Wait maturity → Unstake → Check penalties</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Addresses Quick Reference */}
      <div className="hb-card">
        <div className="hb-label">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse_slow" /> Deployed Addresses
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { label: "Mock TitanX", addr: ADDRESSES.titanX },
            { label: "Mock DragonX", addr: ADDRESSES.dragonX },
            { label: "HBURN Token", addr: ADDRESSES.hellBurnToken },
            { label: "Genesis", addr: ADDRESSES.genesisBurn },
            { label: "Epochs", addr: ADDRESSES.burnEpochs },
            { label: "Staking", addr: ADDRESSES.hellBurnStaking },
            { label: "Buy & Burn", addr: ADDRESSES.buyAndBurn },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-2 bg-dark-3 rounded-lg px-3 py-2">
              <span className="text-xs text-txt-2 min-w-[100px]">{c.label}</span>
              <code className="font-mono text-[10px] text-txt-3 truncate flex-1">{c.addr}</code>
              <button className="text-[10px] text-txt-3 hover:text-fire-3 transition-colors flex-shrink-0"
                onClick={() => navigator.clipboard.writeText(c.addr)} title="Copy">
                📋
              </button>
            </div>
          ))}
        </div>
      </div>

      <TxModal phase={tx.phase} message={tx.msg} subtext={tx.sub} onClose={() => setTx({ phase: null })} />
    </div>
  );
}
