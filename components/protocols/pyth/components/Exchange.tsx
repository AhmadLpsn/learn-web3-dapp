import {
  Col,
  Space,
  Switch,
  message,
  Statistic,
  Card,
  Button,
  InputNumber,
  Table,
  Row,
} from 'antd';
import {useGlobalState} from 'context';
import {SyncOutlined} from '@ant-design/icons';
import {useEffect, useState} from 'react';
import {clusterApiUrl, Connection, Keypair, PublicKey} from '@solana/web3.js';
import {PythConnection, getPythProgramKeyForCluster} from '@pythnetwork/client';
import {DollarCircleFilled} from '@ant-design/icons';
import {Chart} from './Chart';
import Wallet from '@project-serum/sol-wallet-adapter';
import {EventEmitter} from 'events';
import {PYTH_NETWORKS, SOLANA_NETWORKS} from 'types/index';
// import {SwapClient} from '@figment-pyth/lib/swap';
import {JupiterProvider, useJupiter} from '@jup-ag/react-hook';
import {CustomWallet} from '@figment-pyth/lib/wallet';

const connection = new Connection(clusterApiUrl(PYTH_NETWORKS.DEVNET));
const pythPublicKey = getPythProgramKeyForCluster(PYTH_NETWORKS.DEVNET);
const pythConnection = new PythConnection(connection, pythPublicKey);

let _wallet: Wallet | null = null;
const useWallet = (): Wallet => {
  if (_wallet) return _wallet;
  _wallet = new Wallet('https://www.sollet.io', SOLANA_NETWORKS.DEVNET);
  return _wallet;
};

interface FakeWallet {
  sol_balance: number;
  usdc_balance: number;
}

interface Order {
  side: 'buy' | 'sell';
  size: number;
  price: number;
  fromToken: string;
  toToken: string;
}

const signalListener = new EventEmitter();

const useExtendedWallet = () => {
  const [wallet, setWallet] = useState<FakeWallet>({
    sol_balance: 100,
    usdc_balance: 10000,
  });

  const [worth, setWorth] = useState({initial: 0, current: 0});
};

const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112';
const SERUM_MINT_ADDRESS = 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt';
const USDT_MINT_ADDRESS = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const OrderBookWrapper: React.FC = ({children}) => {
  const wallet = useWallet();
  return (
    <JupiterProvider
      cluster={SOLANA_NETWORKS.DEVNET}
      connection={connection}
      userPublicKey={wallet.publicKey || undefined}
    >
      {children}
    </JupiterProvider>
  );
};

const OrderBook = () => {
  return (
    <OrderBookWrapper>
      <Exchange />
    </OrderBookWrapper>
  );
};

const useOrderBook = (wallet: CustomWallet) => {
  const [inputMint] = useState<PublicKey>(new PublicKey(SOL_MINT_ADDRESS));
  const [outputMint] = useState<PublicKey>(new PublicKey(USDC_MINT_ADDRESS));
  // const USDC_MINT_ADDRESS = '';
  const jupiterAtoB = useJupiter({
    amount: 1 * 10 ** 6, // raw input amount of tokens
    inputMint,
    outputMint,
    slippage: 1, // 1% slippage
    debounceTime: 250, // debounce ms time before refresh
  });

  // const jupiterBtoA = useJupiter({
  //   amount: 1 * 10 ** 6, // raw input amount of tokens
  //   outputMint,
  //   inputMint,
  //   slippage: 1, // 1% slippage
  //   debounceTime: 250, // debounce ms time before refresh
  // });

  const [orders, setOrders] = useState<Order[]>([]);

  const buy = async () => {
    if (jupiterAtoB?.routes && jupiterAtoB.routes.length > 0) {
      await jupiterAtoB.exchange({
        wallet,
        route: jupiterAtoB?.routes[0],
        confirmationWaiterFactory: async (txid) => {
          console.log('sending transaction');
          await connection.confirmTransaction(txid);
          console.log('confirmed transaction');

          return await connection.getTransaction(txid, {
            commitment: 'confirmed',
          });
        },
      });
    } else {
      console.log("can't buy");
    }
  };

  const sell = () => {
    console.log('sell');
    // await jupiter.exchange({
    //   wallet,
    //   route,
    //   confirmationWaiterFactory: async (txid) => {
    //     console.log('sending transaction');
    //     await connection.confirmTransaction(txid);
    //     console.log('confirmed transaction');

    //     return await connection.getTransaction(txid, {
    //       commitment: 'confirmed',
    //     });
    //   },
    // });
  };
  return {
    buy,
    sell,
  };
};

const _account = Keypair.fromSecretKey(
  new Uint8Array([
    175, 193, 241, 226, 223, 32, 155, 13, 1, 120, 157, 36, 15, 39, 141, 146,
    197, 180, 138, 112, 167, 209, 70, 94, 103, 202, 166, 62, 81, 18, 143, 49,
    125, 253, 127, 53, 71, 38, 254, 214, 30, 170, 71, 69, 80, 46, 52, 76, 101,
    246, 34, 16, 96, 4, 164, 39, 220, 88, 184, 201, 138, 180, 181, 238,
  ]),
);

const Exchange = () => {
  const {state, dispatch} = useGlobalState();

  // Fake wallet for testing.
  const [wallet, setWallet] = useState<FakeWallet>({
    sol_balance: 100,
    usdc_balance: 10000,
  });
  // const [swapClient, setSwapClient] = useState<SwapClient | null>(null);
  const _wallet = useWallet();
  const {buy, sell} = useOrderBook(_wallet as unknown as CustomWallet);
  // const [swap, setSwap] = useState<SwapClient | null>(null);
  useEffect(() => {
    async function _init(): Promise<void> {
      // const _swapClient = await SwapClient.initialize(
      //   connection,
      //   SOLANA_NETWORKS.DEVNET,
      //   _account,
      //   SOL_MINT_ADDRESS,
      //   SERUM_MINT_ADDRESS,
      // );
      // setSwapClient(_swapClient);
    }
  }, [wallet]);

  // state for tracking user worth with current Market Price.
  const [worth, setWorth] = useState({initial: 0, current: 0});

  // Reset the wallet to the initial state.
  const resetWallet = (sol_amount = 10) => {
    if (!price) return;
    // setWallet({
    //   sol_balance: sol_amount,
    //   usdc_balance: sol_amount * price,
    // });
    const worth = sol_amount * price * 2;
    setWorth({initial: worth, current: worth});
  };
  // amount of Ema to buy/sell signal.
  const [yieldExpectation, setYield] = useState<number>(0.001);
  const [orderSize, setOrderSize] = useState<number>(20); // USDC
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [symbol, setSymbol] = useState<string | undefined>(undefined);
  const [orderBook, setOrderbook] = useState<Order[]>([]);

  useEffect(() => {
    if (price) {
      dispatch({
        type: 'SetIsCompleted',
      });
    }
    // update the current worth each price update.
    const currentWorth = wallet?.sol_balance * price! + wallet.usdc_balance;
    setWorth({...worth, current: currentWorth});
  }, [price, setPrice]);

  useEffect(() => {
    signalListener.once('*', () => {
      resetWallet();
    });
    const buyHandler = signalListener.on('buy', (price: number) => {
      if (wallet.usdc_balance <= orderSize) return; // not enough balance
      setOrderbook((_orderBook) => [
        {
          side: 'buy',
          size: orderSize,
          price: price,
          fromToken: 'usdc',
          toToken: 'sol',
        },
        ..._orderBook,
      ]);
      const solChange = orderSize / price!;

      setWallet((_wallet) => ({
        sol_balance: _wallet.sol_balance + solChange,
        usdc_balance: _wallet.usdc_balance - orderSize,
      }));
    });

    const sellHandler = signalListener.on('sell', (price: number) => {
      const orderSizeSol = orderSize / price;
      if (wallet.sol_balance <= orderSizeSol) return; // not enough balance
      setOrderbook((_orderBook) => [
        {
          side: 'sell',
          size: orderSizeSol,
          price: price,
          fromToken: 'sol',
          toToken: 'usdc',
        },
        ..._orderBook,
      ]);

      setWallet((_wallet) => ({
        sol_balance: _wallet.sol_balance - orderSizeSol,
        usdc_balance: _wallet.usdc_balance + orderSizeSol * price!,
      }));
    });
    return () => {
      signalListener.removeAllListeners();
    };
  }, [yieldExpectation, orderSize, wallet]);

  const [data, setData] = useState<any[]>([]);
  const getPythData = async (checked: boolean) => {
    pythConnection.onPriceChange((product, price) => {
      // sample output: SRM/USD: $8.68725 ±$0.0131
      if (
        product.symbol === 'Crypto.SOL/USD' &&
        price.price &&
        price.confidence
      ) {
        console.log(
          `${product.symbol}: $${price.price} \xB1$${price.confidence}`,
        );
        setPrice(price.price);

        const newData: {
          price: number;
          priceConfidenceRange: number[];
          ts: number;
          sma: undefined | number;
          ema: undefined | number;
          trend: undefined | boolean;
        } = {
          price: price.price,
          priceConfidenceRange: [
            price?.price! - price?.confidence!,
            price?.price! + price?.confidence!,
          ],
          ts: +new Date(),
          sma: undefined,
          ema: undefined,
          trend: undefined,
        };
        const window = 10;
        const smoothingFactor = 2 / (window + 1);
        /**
         * Calculate Simple moving average:
         *   https://en.wikipedia.org/wiki/Moving_average#Simple_moving_average
         * Calculate Exponential moving average:
         *   https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average
         * The Exponential moving average has a better reaction to price changes.
         *
         * Ref: https://blog.oliverjumpertz.dev/the-moving-average-simple-and-exponential-theory-math-and-implementation-in-javascript
         */
        setData((data) => {
          if (data.length > window) {
            const windowSlice = data.slice(data.length - window, data.length);
            const sum = windowSlice.reduce(
              (prev, curr) => prev + curr.price,
              0,
            );
            newData.sma = sum / window;

            const previousEma = newData.ema || newData.sma;
            const currentEma =
              (newData.price - previousEma) * smoothingFactor + previousEma;
            newData.ema = currentEma;

            const trend = newData.ema / data[data.length - 1].ema;
            if (trend * 100 > 100 + yieldExpectation) {
              signalListener.emit('buy', newData.price);
            } else if (trend * 100 < 100 - yieldExpectation) {
              signalListener.emit('sell', newData.price);
            }
          }
          return [...data, newData];
        });
        setSymbol('Crypto.SOL/USD');
      } else if (product.symbol === 'Crypto.SOL/USD' && !price.price) {
        console.log(`${product.symbol}: price currently unavailable`);
        setPrice(0);
        setSymbol('Crypto.SOL/USD');
      }
    });

    if (!checked) {
      message.info('Stopping Pyth price feed!');
      pythConnection.stop();
    } else {
      message.info('Starting Pyth price feed!');
      pythConnection.start();
    }
  };
  return (
    <Col>
      <Space direction="vertical" size="large">
        <Space direction="horizontal">
          <Card
            size="small"
            title={symbol}
            style={{width: 400}}
            extra={
              <Switch
                checkedChildren={<SyncOutlined spin />}
                unCheckedChildren={'Price feed Off'}
                onChange={getPythData}
              />
            }
          >
            <Statistic value={price} prefix={<DollarCircleFilled />} />{' '}
          </Card>
          <Card title={'Yield Expectation'} size={'small'}>
            <InputNumber
              value={yieldExpectation}
              onChange={(e) => setYield(e)}
              prefix="%"
            />
            <InputNumber
              value={orderSize}
              onChange={(e) => setOrderSize(e)}
              prefix="USDC"
            />
          </Card>
        </Space>
        <Space direction="horizontal" size="large">
          <Card
            title="wallet"
            extra={<Button onClick={() => resetWallet()}>Reset Wallet</Button>}
          >
            <Row>
              <Col span={12}>
                <Statistic
                  value={wallet?.sol_balance}
                  precision={6}
                  title={'SOL'}
                />
              </Col>

              <Col span={12}>
                <Statistic
                  value={wallet?.usdc_balance}
                  precision={6}
                  title={'USDC'}
                />
              </Col>

              <Col span={12}>
                <Statistic
                  value={wallet?.sol_balance * price! + wallet.usdc_balance}
                  precision={6}
                  title={'TOTAL WORTH'}
                />
              </Col>

              <Col span={12}>
                <Statistic
                  value={(worth.initial / worth.current) * 100 - 100}
                  prefix={'%'}
                  precision={6}
                  title={'Change'}
                />
              </Col>
            </Row>
          </Card>
        </Space>
        <Card>
          <Chart data={data} />
        </Card>
        <Card>
          <Statistic value={orderBook.length} title={'Number of Operations'} />
          <Table
            dataSource={orderBook}
            columns={[
              {
                title: 'Side',
                dataIndex: 'side',
                key: 'side',
              },
              {
                title: 'Price',
                dataIndex: 'price',
                key: 'price',
              },
              {
                title: 'Size',
                dataIndex: 'size',
                key: 'size',
              },
              {
                title: 'From',
                dataIndex: 'fromToken',
                key: 'fromToken',
              },
              {
                title: 'To',
                dataIndex: 'toToken',
                key: 'toToken',
              },
            ]}
          ></Table>
        </Card>
      </Space>
    </Col>
  );
};

export default OrderBook;
