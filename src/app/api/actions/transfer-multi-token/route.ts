import {
  ActionGetRequest,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createPostResponse,
  createActionHeaders,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { VERIFIED_CURRENCY } from "./types";
import { NextRequest } from "next/server";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
} from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const headers = createActionHeaders();

const DECIMALS: any = {
  [VERIFIED_CURRENCY.SOL]: LAMPORTS_PER_SOL, // Solana has 9 decimals, but LAMPORTS_PER_SOL = 10^9
  [VERIFIED_CURRENCY.USDC]: 1_000_000, // USDC has 6 decimals
  [VERIFIED_CURRENCY.BONK]: 100_000, // BONK has 5 decimals
  [VERIFIED_CURRENCY.SEND]: 1_000_000, // SEND has 6 decimals
};

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const disabledStatus = false;
    const baseHref = `/api/actions/transfer-multi-token`;
    const payload: ActionGetResponse = {
      type: "action",
      label: "Multi-Token Transfer",
      title: "Transfer Multiple Tokens",
      icon: new URL("/logo.png", requestUrl.origin).toString(),
      disabled: disabledStatus,
      description:
        "Easily transfer multiple tokens including SOL, USDC, BONK, and SEND using this feature.",
      links: {
        actions: [
          {
            href: `${baseHref}?walletAddress={walletAddress}&amount={amount}&token={token}&cluster={cluster}`,
            label: "Transfer Tokens",
            type: "post",
            parameters: [
              {
                name: "token",
                label: "Choose token",
                type: "radio",
                options: [
                  {
                    label: VERIFIED_CURRENCY.SOL,
                    value: VERIFIED_CURRENCY.SOL,
                    selected: true,
                  },
                  {
                    label: VERIFIED_CURRENCY.USDC,
                    value: VERIFIED_CURRENCY.USDC,
                    selected: false,
                  },
                  {
                    label: VERIFIED_CURRENCY.SEND,
                    value: VERIFIED_CURRENCY.SEND,
                    selected: false,
                  },
                  {
                    label: VERIFIED_CURRENCY.BONK,
                    value: VERIFIED_CURRENCY.BONK,
                    selected: false,
                  },
                ],
              },
              {
                name: "walletAddress",
                label: "Recipient Wallet Address",
                required: true,
                type: "text",
              },
              {
                name: "amount",
                label: "Amount to Transfer",
                required: true,
                type: "number",
              },
            ],
          },
        ],
      },
    };
    return Response.json(payload, {
      headers,
    });
  } catch (error) {
    console.log(error);
  }
};

export const OPTIONS = GET;

export async function POST(req: NextRequest) {
  try {
    const body: ActionPostRequest = await req.json();
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response("Invalid account", {
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const walletAddress = req.nextUrl.searchParams.get("walletAddress") ?? "";
    const token = req.nextUrl.searchParams.get("token") ?? "SOL";
    const amount = req.nextUrl.searchParams.get("amount") ?? "1";
    const cluster = req.nextUrl.searchParams.get("cluster") ?? "devnet";
    const userAddress = account.toBase58();
    const transferAmount = parseFloat(amount);

    const recipientAccount = new PublicKey(walletAddress);
    const transferAmountWithDecimals = transferAmount * DECIMALS[token];

    if (token === VERIFIED_CURRENCY.SOL) {
      const transferSolInstruction = SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: recipientAccount,
        lamports: transferAmountWithDecimals,
      });

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const transaction = new Transaction({
        feePayer: account,
        blockhash,
        lastValidBlockHeight,
      }).add(transferSolInstruction);

      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          type: "transaction",
          transaction,
          message: `Send ${transferAmount} SOL to ${recipientAccount.toBase58()}`,
        },
      });
      return Response.json(payload, {
        headers,
      });
    } else {
      const USDC_MINT_ADDRESS = new PublicKey(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      );
      const BONK_MINT_ADDRESS = new PublicKey(
        "bonkMLw9Gyn4F3dqwxaHgcqLQxvchiYLfjDjEVXCEMf"
      );
      const SEND_MINT_ADDRESS = new PublicKey(
        "CZWADf5pH1J9SdASXjTN2dBhD9GjuVscbz1htojexto8"
      );

      let mintAddress;
      switch (token) {
        case VERIFIED_CURRENCY.USDC:
          mintAddress = USDC_MINT_ADDRESS;
          break;
        case VERIFIED_CURRENCY.BONK:
          mintAddress = BONK_MINT_ADDRESS;
          break;
        case VERIFIED_CURRENCY.SEND:
          mintAddress = SEND_MINT_ADDRESS;
          break;
        default:
          mintAddress = USDC_MINT_ADDRESS;
      }

      const userTokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        account,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const recipientTokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        recipientAccount,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createInstruction = createTransferInstruction(
        userTokenAccount,
        recipientTokenAccount,
        account,
        transferAmountWithDecimals
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: account,
        blockhash,
        lastValidBlockHeight,
      }).add(createInstruction);

      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          type: "transaction",
          transaction,
          message: `Send ${transferAmount} tokens to ${recipientAccount.toBase58()}`,
        },
      });

      return Response.json(payload, {
        headers,
      });
    }
  } catch (error) {
    console.log(error);
  }
}
