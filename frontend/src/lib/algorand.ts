import algosdk from 'algosdk';
import { Market } from '@/types/market';

const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';
const ALGOD_PORT = process.env.NEXT_PUBLIC_ALGOD_PORT || 443;
const APP_ID = parseInt(process.env.NEXT_PUBLIC_APP_ID || '0');

export class AlgorandService {
  public algodClient: algosdk.Algodv2;
  public appId: number;

  constructor() {
    this.algodClient = new algosdk.Algodv2(
      ALGOD_TOKEN,
      ALGOD_SERVER,
      ALGOD_PORT
    );
    this.appId = APP_ID;
  }

  // decodeStringAtOffset helper
  private decodeStringAtOffset(data: Uint8Array, offset: number): string {
    if (offset >= data.length) return '';
    const length = (data[offset] << 8) | data[offset + 1];
    return new TextDecoder().decode(data.slice(offset + 2, offset + 2 + length));
  }

  private decodeUint64(data: Uint8Array, offset: number): number {
    if (offset + 8 > data.length) return 0;
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return Number(view.getBigUint64(offset, false)); // Big endian
  }

  public async getMarket(id: number): Promise<Market> {
    const boxName = new Uint8Array(11); // "mkt" + 8 bytes
    boxName.set(new TextEncoder().encode("mkt"), 0);
    const view = new DataView(boxName.buffer);
    view.setBigUint64(3, BigInt(id), false);

    const boxResponse = await this.algodClient.getApplicationBoxByName(this.appId, boxName).do();
    const data = typeof boxResponse.value === 'string'
      ? new Uint8Array(Buffer.from(boxResponse.value, 'base64'))
      : boxResponse.value;

    return this.decodeMarketState(id, data);
  }

  public async getAllMarkets(): Promise<Market[]> {
    if (!this.appId) return [];

    try {
      // First get all boxes
      const boxes = await this.algodClient.getApplicationBoxes(this.appId).do();
      const markets: Market[] = [];

      for (const box of boxes.boxes) {
        // Find boxes starting with 'mkt'
        if (box.name.length === 11 &&
          box.name[0] === 109 && // m
          box.name[1] === 107 && // k
          box.name[2] === 116) { // t

          const view = new DataView(box.name.buffer, box.name.byteOffset, box.name.byteLength);
          const id = Number(view.getBigUint64(3, false));
          try {
            const market = await this.getMarket(id);
            markets.push(market);
          } catch (err) {
            console.error(`Failed to fetch market ${id}`, err);
          }
        }
      }
      return markets.sort((a, b) => b.id - a.id);
    } catch (error) {
      console.error('Error fetching all markets:', error);
      return [];
    }
  }

  private decodeMarketState(id: number, data: Uint8Array): Market {
    const titleOffset = (data[0] << 8) | data[1];
    const outcome0Offset = (data[2] << 8) | data[3];
    const outcome1Offset = (data[4] << 8) | data[5];
    const outcome2Offset = (data[6] << 8) | data[7];
    const outcome3Offset = (data[8] << 8) | data[9];

    const numOutcomes = data[10];
    const endTimestamp = this.decodeUint64(data, 11);
    const winningIndex = data[19];
    const isCancelled = data[20] === 1; // 0x01

    const pool0 = this.decodeUint64(data, 21);
    const pool1 = this.decodeUint64(data, 29);
    const pool2 = this.decodeUint64(data, 37);
    const pool3 = this.decodeUint64(data, 45);
    const totalPool = this.decodeUint64(data, 53);

    const creatorBytes = data.slice(61, 93);
    const creator = algosdk.encodeAddress(creatorBytes);

    const title = this.decodeStringAtOffset(data, titleOffset);
    const outcomes: string[] = [];
    if (numOutcomes > 0) outcomes.push(this.decodeStringAtOffset(data, outcome0Offset));
    if (numOutcomes > 1) outcomes.push(this.decodeStringAtOffset(data, outcome1Offset));
    if (numOutcomes > 2) outcomes.push(this.decodeStringAtOffset(data, outcome2Offset));
    if (numOutcomes > 3) outcomes.push(this.decodeStringAtOffset(data, outcome3Offset));

    return {
      id,
      title,
      outcomes,
      numOutcomes,
      endTimestamp,
      winningIndex,
      isCancelled,
      pools: [pool0, pool1, pool2, pool3],
      totalPool,
      creator
    };
  }

  public async buildCreateMarketTxns(
    activeAccount: string,
    title: string,
    validOutcomes: string[],
    endTimestamp: number
  ): Promise<algosdk.Transaction[]> {
    const sp = await this.algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer();

    // MBR payment for box storage
    const mbrPaymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: activeAccount,
      receiver: algosdk.getApplicationAddress(this.appId),
      amount: 200_000,
      suggestedParams: sp
    });

    // Read global state to find next market ID for the box array
    let nextMarketId = 1;
    try {
      const appInfo = await this.algodClient.getApplicationByID(this.appId).do();
      const globalState = appInfo.params.globalState || [];
      const mcKey = btoa('mc'); // 'mc' in base64
      const mcPair = globalState.find((ks: any) => ks.key === mcKey);
      if (mcPair) {
        nextMarketId = Number(mcPair.value.uint) + 1;
      }
    } catch (e) {
      console.warn("Could not read market_counter", e);
    }

    const marketBoxName = new Uint8Array(11);
    marketBoxName.set(new TextEncoder().encode("mkt"), 0);
    const view = new DataView(marketBoxName.buffer);
    view.setBigUint64(3, BigInt(nextMarketId), false);

    const contract = new algosdk.ABIContract({
      name: "PredictionMarket",
      desc: "",
      networks: {},
      methods: [
        {
          name: "create_market",
          args: [
            { type: "string", name: "title" },
            { type: "string", name: "outcome_0" },
            { type: "string", name: "outcome_1" },
            { type: "string", name: "outcome_2" },
            { type: "string", name: "outcome_3" },
            { type: "uint8", name: "num_outcomes" },
            { type: "uint64", name: "end_timestamp" },
            { type: "pay", name: "mbr_payment" }
          ],
          returns: { type: "uint64" }
        }
      ]
    });

    const method = contract.getMethodByName("create_market");

    atc.addMethodCall({
      appID: this.appId,
      method,
      methodArgs: [
        title,
        validOutcomes[0] || "",
        validOutcomes[1] || "",
        validOutcomes[2] || "",
        validOutcomes[3] || "",
        validOutcomes.length,
        endTimestamp,
        { txn: mbrPaymentTxn, signer: algosdk.makeEmptyTransactionSigner() }
      ],
      sender: activeAccount,
      suggestedParams: sp,
      boxes: [
        { appIndex: 0, name: marketBoxName }
      ],
      signer: algosdk.makeEmptyTransactionSigner()
    });

    const txns = atc.buildGroup();
    return txns.map(t => t.txn);
  }

  public async buildPlaceBetTxns(
    activeAccount: string,
    marketId: number,
    outcomeIndex: number,
    amount: number
  ): Promise<algosdk.Transaction[]> {
    const sp = await this.algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer();

    const betPaymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: activeAccount,
      receiver: algosdk.getApplicationAddress(this.appId),
      amount: amount * 1_000_000,
      suggestedParams: sp
    });

    const marketBoxName = new Uint8Array(11);
    marketBoxName.set(new TextEncoder().encode("mkt"), 0);
    const view1 = new DataView(marketBoxName.buffer);
    view1.setBigUint64(3, BigInt(marketId), false);

    const betBoxName = new Uint8Array(43);
    betBoxName.set(new TextEncoder().encode("bet"), 0);
    const view2 = new DataView(betBoxName.buffer);
    view2.setBigUint64(3, BigInt(marketId), false);
    betBoxName.set(algosdk.decodeAddress(activeAccount).publicKey, 11);

    const contract = new algosdk.ABIContract({
      name: "PredictionMarket",
      desc: "",
      networks: {},
      methods: [
        {
          name: "place_bet",
          args: [
            { type: "uint64", name: "market_id" },
            { type: "uint8", name: "option_index" },
            { type: "pay", name: "payment" }
          ],
          returns: { type: "void" }
        }
      ]
    });

    const method = contract.getMethodByName("place_bet");

    atc.addMethodCall({
      appID: this.appId,
      method,
      methodArgs: [
        marketId,
        outcomeIndex,
        { txn: betPaymentTxn, signer: algosdk.makeEmptyTransactionSigner() }
      ],
      sender: activeAccount,
      suggestedParams: sp,
      boxes: [
        { appIndex: 0, name: marketBoxName },
        { appIndex: 0, name: betBoxName }
      ],
      signer: algosdk.makeEmptyTransactionSigner()
    });

    const txns = atc.buildGroup();
    return txns.map(t => t.txn);
  }

  public async waitForConfirmation(txId: string): Promise<Record<string, any>> {
    const status = await this.algodClient.status().do();
    let lastRound = Number(status.lastRound);
    while (true) {
      const pendingInfo = await this.algodClient.pendingTransactionInformation(txId).do();
      if (pendingInfo.confirmedRound !== null && pendingInfo.confirmedRound !== undefined && Number(pendingInfo.confirmedRound) > 0) {
        return pendingInfo;
      }
      if (pendingInfo.poolError != null && pendingInfo.poolError.length > 0) {
        throw new Error(`Transaction failed: ${pendingInfo.poolError}`);
      }
      lastRound++;
      await this.algodClient.statusAfterBlock(lastRound).do();
    }
  }
}

export const algorandService = new AlgorandService();

export function microAlgosToAlgo(microAlgos: number): number {
  return microAlgos / 1000000;
}

export function truncateAddress(address: string, length = 4): string {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function getTimeRemaining(endTime: number) {
  const total = endTime * 1000 - Date.now();
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  
  return { total, days, hours, minutes, seconds };
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export const lora = {
  tx: (txId: string) => `https://lora.algonode.network/testnet/transaction/${txId}`,
  account: (address: string) => `https://lora.algonode.network/testnet/account/${address}`,
  app: (appId: number | string) => `https://lora.algonode.network/testnet/application/${appId}`
};
