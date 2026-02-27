import { useMemo } from "react";
import { Contract } from "ethers";
import { useWallet } from "./useWallet";
import { ADDRESSES } from "@/config/constants";
import { ERC20_ABI, GENESIS_ABI, EPOCHS_ABI, STAKING_ABI, BUYBURN_ABI, MOCK_ERC20_ABI } from "@/config/abis";

function useContract(address, abi) {
  const { signer, provider } = useWallet();
  return useMemo(() => {
    const signerOrProvider = signer || provider;
    if (!signerOrProvider || !address) return null;
    return new Contract(address, abi, signerOrProvider);
  }, [address, abi, signer, provider]);
}

export function useTitanX() { return useContract(ADDRESSES.titanX, ERC20_ABI); }
export function useDragonX() { return useContract(ADDRESSES.dragonX, ERC20_ABI); }
export function useHBURN() { return useContract(ADDRESSES.hellBurnToken, ERC20_ABI); }
export function useGenesis() { return useContract(ADDRESSES.genesisBurn, GENESIS_ABI); }
export function useEpochs() { return useContract(ADDRESSES.burnEpochs, EPOCHS_ABI); }
export function useStaking() { return useContract(ADDRESSES.hellBurnStaking, STAKING_ABI); }
export function useBuyBurn() { return useContract(ADDRESSES.buyAndBurn, BUYBURN_ABI); }

// Mock tokens (testnet only — have public mint())
export function useMockTitanX() { return useContract(ADDRESSES.titanX, MOCK_ERC20_ABI); }
export function useMockDragonX() { return useContract(ADDRESSES.dragonX, MOCK_ERC20_ABI); }
