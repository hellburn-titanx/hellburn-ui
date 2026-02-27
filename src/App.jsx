import { Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/hooks/useWallet";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Genesis from "@/pages/Genesis";
import Epochs from "@/pages/Epochs";
import Staking from "@/pages/Staking";
import Testnet from "@/pages/Testnet";

export default function App() {
  return (
    <WalletProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="genesis" element={<Genesis />} />
          <Route path="epochs" element={<Epochs />} />
          <Route path="staking" element={<Staking />} />
          <Route path="testnet" element={<Testnet />} />
        </Route>
      </Routes>
    </WalletProvider>
  );
}
