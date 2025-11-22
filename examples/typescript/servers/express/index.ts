import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, Resource, type SolanaAddress, type HederaAddress } from "x402-express";
config();

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress | HederaAddress;
const feePayer = process.env.FEE_PAYER as HederaAddress; // optional, funded with HBAR

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables");
  process.exit(1);
}

console.log("payTo", payTo);
console.log("facilitatorUrl", facilitatorUrl);

const app = express();

// -----------------------------
// x402 Payment Middleware
// -----------------------------
app.use(
  paymentMiddleware(
    payTo,
    {
      // Weather / Hedera payments
      "GET /hedera-usdc": {
        price: "$0.001",
        network: "hedera-testnet",
      },
      "GET /hedera-native": {
        price: {
          amount: "50000000",
          asset: {
            address: "hbar",
            decimals: 8,
          },
        },
        network: "hedera-testnet",
      },
      // Trading signal payment
      "GET /paid-signal": {
        price: "$0.003",
        network: "hedera-testnet",
      },
    },
    {
      url: facilitatorUrl,
    },
  ),
);

// -----------------------------
// Public Endpoints
// -----------------------------
app.get("/weather", (req, res) => {
  res.send({
    report: {
      weather: "sunny",
      temperature: 70,
    },
  });
});

app.get("/signal", (req, res) => {
  res.send({
    report: {
      signal: "BTC/USDT Trade Signal",
      body: "Buy BTC at $90,000, target $92,000, stop loss $89,000",
    },
  });
});

// -----------------------------
// Paid Endpoints (Hedera x402)
// -----------------------------
app.get("/hedera-usdc", (req, res) => {
  res.send({
    message: "You paid $0.001 with USDC on Hedera!",
    data: {
      weather: "sunny on Hedera",
      temperature: 75,
      paid_with: "USDC",
      token_id: "0.0.429274",
      network: "hedera-testnet",
    },
  });
});

app.get("/hedera-native", (req, res) => {
  res.send({
    message: "You paid 0.5 HBAR natively!",
    data: {
      premium_content: "Exclusive Hedera network data with native payment",
      paid_with: "HBAR",
      amount_hbar: "0.5",
    },
  });
});

app.get("/paid-signal", (req, res) => {
  res.send({
    message: "You paid $0.003 with hUSDT on Hedera! Unlocking premium trading signal",
    data: {
      signal: "BTC/USDT Trade Signal",
      body: "Buy BTC at $95,000, target $97,000, stop loss $94,000",
      paid_with: "hUSDT",
      token_id: "0.0.7274170",
      network: "hedera-testnet",
    },
  });
});

// -----------------------------
// Start Server
// -----------------------------
app.listen(4021, () => {
  console.log(`Server listening at http://localhost:${4021}`);
  console.log("  GET /weather");
  console.log("  GET /signal");
  console.log("  GET /hedera-usdc - Hedera testnet USDC payment ($0.001)");
  console.log("  GET /hedera-native - Hedera testnet HBAR payment (0.5 HBAR)");
  console.log("  GET /paid-signal - Hedera testnet hUSDT payment ($0.003)");
});
