export const CONTRACTS = {
  // Replace after deployment or load from env
  sepolia: {
    timeToken: import.meta.env.VITE_TTK_ADDRESS || "0x0000000000000000000000000000000000000000",
    timeEscrow: import.meta.env.VITE_ESCROW_ADDRESS || "0x0000000000000000000000000000000000000000",
  },
  polygonMumbai: {
    timeToken: import.meta.env.VITE_TTK_ADDRESS || "0x0000000000000000000000000000000000000000",
    timeEscrow: import.meta.env.VITE_ESCROW_ADDRESS || "0x0000000000000000000000000000000000000000",
  },
} as const


