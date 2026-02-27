export default function TxModal({ phase, message, subtext, onClose }) {
  // phase: "pending" | "success" | "error" | null
  if (!phase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-1/90 backdrop-blur-md animate-[fadeIn_0.3s]"
      onClick={phase !== "pending" ? onClose : undefined}>
      <div className="bg-dark-2 border border-dark-4 rounded-2xl p-10 text-center max-w-sm w-[90%]"
        onClick={(e) => e.stopPropagation()}>

        {phase === "pending" && (
          <>
            <div className="w-12 h-12 border-[3px] border-dark-4 border-t-fire-2 rounded-full animate-spin mx-auto mb-5" />
            <p className="font-display font-bold mb-2">{message || "Transaction Pending..."}</p>
            <p className="text-xs text-txt-3">{subtext || "Confirm in your wallet"}</p>
          </>
        )}

        {phase === "success" && (
          <>
            <div className="w-12 h-12 bg-green-500/10 border-2 border-green-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-5 animate-[scaleIn_0.3s]">
              ✓
            </div>
            <p className="font-display font-bold mb-2 text-green-400">{message || "Success!"}</p>
            <p className="text-xs text-txt-2">{subtext}</p>
            <button onClick={onClose} className="mt-4 hb-btn-outline">Close</button>
          </>
        )}

        {phase === "error" && (
          <>
            <div className="w-12 h-12 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-5">
              ✕
            </div>
            <p className="font-display font-bold mb-2 text-red-400">Transaction Failed</p>
            <p className="text-xs text-txt-2 break-all">{message}</p>
            <button onClick={onClose} className="mt-4 hb-btn-outline">Close</button>
          </>
        )}
      </div>
    </div>
  );
}
