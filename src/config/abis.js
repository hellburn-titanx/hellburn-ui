// Minimal ABIs — only the functions our UI calls
// Full ABIs can be generated with: npx hardhat compile → artifacts/

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function totalSupply() view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

export const GENESIS_ABI = [
  "function burn(uint256 titanXAmount)",
  "function claimVested()",
  "function endGenesis()",
  "function claimableAmount(address) view returns (uint256)",
  "function currentWeek() view returns (uint256)",
  "function currentMintRatio() view returns (uint256 ratio, uint256 bonus)",
  "function totalTitanXBurned() view returns (uint256)",
  "function totalHBURNMinted() view returns (uint256)",
  "function genesisStart() view returns (uint256)",
  "function genesisEnd() view returns (uint256)",
  "function genesisEnded() view returns (bool)",
  "function getUserTrancheCount(address) view returns (uint256)",
  "event GenesisBurnExecuted(address indexed user, uint256 titanXAmount, uint256 hburnMinted, uint256 immediateAmount, uint256 vestedAmount, uint256 week)",
  "event VestingClaimed(address indexed user, uint256 amount)",
];

export const EPOCHS_ABI = [
  "function burnTitanX(uint256 amount)",
  "function burnDragonX(uint256 amount)",
  "function claimRewards(uint256 epochId)",
  "function batchClaimRewards(uint256[] epochIds)",
  "function finalizeEpoch(uint256 epochId)",
  "function currentEpochId() view returns (uint256)",
  "function epochStartTime(uint256) view returns (uint256)",
  "function epochEndTime(uint256) view returns (uint256)",
  "function isEpochActive(uint256) view returns (bool)",
  "function firstEpochStart() view returns (uint256)",
  "function getUserStreakMultiplier(address) view returns (uint256)",
  "function getUserEpochBurn(uint256,address) view returns (uint256)",
  "function getEpochTotalBurns(uint256) view returns (uint256)",
  "function getEpochRewards(uint256) view returns (uint256)",
  "function getEpochDeposited(uint256) view returns (uint256)",
  "function hasClaimedEpoch(uint256,address) view returns (bool)",
  "function pendingReward(uint256,address) view returns (uint256)",
  "function totalTitanXBurned() view returns (uint256)",
  "function totalDragonXBurned() view returns (uint256)",
  "function totalETHDistributed() view returns (uint256)",
  "function carryOverETH() view returns (uint256)",
  "function epochs(uint256) view returns (uint256 totalWeightedBurns, uint256 ethDeposited, uint256 ethRewards, bool finalized)",
  "event BurnedInEpoch(address indexed user, uint256 indexed epochId, address token, uint256 amount, uint256 weightedAmount, uint256 streakMultiplier)",
  "event EpochFinalized(uint256 indexed epochId, uint256 ethRewards, uint256 totalWeightedBurns)",
  "event RewardsClaimed(address indexed user, uint256 indexed epochId, uint256 ethAmount)",
];

export const STAKING_ABI = [
  "function startStake(uint256 amount, uint256 numDays) returns (uint256)",
  "function reStake(uint256 amount, uint256 numDays) returns (uint256)",
  "function endStake(uint256 stakeId)",
  "function addFuelTitanX(uint256 stakeId, uint256 amount)",
  "function addFuelDragonX(uint256 stakeId, uint256 amount)",
  "function depositETH() payable",
  "function getUserStakes(address) view returns (uint256[])",
  "function getStakeInfo(uint256) view returns (uint256 amount, uint256 shares, uint256 startTime, uint256 endTime, uint256 fuelBonus, bool active, uint256 maturityPct, uint256 pendingETH_)",
  "function pendingETHReward(uint256) view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function totalETHReceived() view returns (uint256)",
  "function hasPhoenixStatus(address) view returns (bool)",
  "function completedStakes(address) view returns (uint256)",
  "function consecutiveRestakes(address) view returns (uint256)",
  "function getTier(uint256) view returns (uint8)",
  "event StakeStarted(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 shares, uint256 duration, bool isRestake)",
  "event StakeEnded(address indexed user, uint256 indexed stakeId, uint256 amountReturned, uint256 ethReward, uint256 penalty)",
  "event FuelAdded(address indexed user, uint256 indexed stakeId, address token, uint256 amount, uint256 newFuelBonus)",
];

export const BUYBURN_ABI = [
  "function executeBuyAndBurn(uint256 minHBURNOut)",
  "function pendingETH() view returns (uint256)",
  "function totalETHUsed() view returns (uint256)",
  "function totalHBURNBurned() view returns (uint256)",
];

// Mock tokens (testnet only) — has public mint()
export const MOCK_ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function mint(address to, uint256 amount)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
];
