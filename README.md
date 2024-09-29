# Transol

This project demonstrates how to perform actions on the Solana blockchain, such as transferring SOL between wallets. It is built using [Next.js](https://nextjs.org) and leverages the `@solana/actions` and `@solana/web3.js` libraries to interact with the Solana blockchain. Live at [`Transol`](https://transol.ayushagr.me).

## What is it?

The main use of this blink is to provide a simple and efficient way to transfer SOL (Solana's native cryptocurrency) between wallets. This can be useful for developers building decentralized applications (dApps) on the Solana blockchain, as well as for users who need to manage their SOL holdings.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

### Transfer SOL

**Endpoint:** `/api/actions/transfer-sol`

**Method:** GET

**Query Parameters:**

- `to`: The public key of the recipient wallet (optional, defaults to a predefined address).
- `amount`: The amount of SOL to transfer (optional, defaults to 1.0 SOL).

### Transfer SOL (Devnet)

**Endpoint:** `/api/actions/transfer-sol-dev`

**Method:** `GET`

**Query Parameters:**

- `to`: The public key of the recipient wallet (optional, defaults to a predefined address).
- `amount`: The amount of SOL to transfer (optional, defaults to 1.0 SOL).
