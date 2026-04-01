import algosdk from 'algosdk';

const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_PORT = process.env.ALGOD_PORT || 443;

// Configure the Algodv2 client for backend index queries and oracle signing
export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
