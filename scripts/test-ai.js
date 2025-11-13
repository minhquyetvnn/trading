// Script để test Trading Signals locally
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testTradingSignals() {
  console.log('🧪 Testing Trading Signals System...\n');

  try {
    // 1. Generate signal
    console.log('1️⃣ Generating trading signal for BTC...');
    const signalResponse = await axios.post(`${BASE_URL}/api/signals/generate`, {
      coin: 'BTC',
      capital: 1000
    });

    if (signalResponse.data.success) {
      const signal = signalResponse.data.signal;
      console.log('✅ Signal generated successfully!');
      console.log('Action:', signal.action);
      console.log('Confidence:', signal.confidence + '%');
      console.log('Entry Price:', signal.entryPrice);
      console.log('Stop Loss:', signal.stopLoss);
      console.log('TP1:', signal.takeProfit1);
      console.log('TP2:', signal.takeProfit2);
      console.log('TP3:', signal.takeProfit3);
      console.log('Position Size:', signal.positionSize);
      console.log('Risk/Reward:', signal.riskRewardRatio + ':1');
      console.log('Signal ID:', signal.id);
      console.log('');
    }

    // 2. Get active signals
    console.log('2️⃣ Fetching active signals...');
    const activeResponse = await axios.get(`${BASE_URL}/api/signals/active`);

    if (activeResponse.data.success) {
      console.log('✅ Active signals retrieved!');
      console.log('Count:', activeResponse.data.count);
      activeResponse.data.signals.forEach(signal => {
        console.log(`  - ${signal.coin}: ${signal.action} at $${signal.entryPrice} (P/L: $${signal.pnlUSD})`);
      });
      console.log('');
    }

    // 3. Get portfolio stats
    console.log('3️⃣ Fetching portfolio stats...');
    const portfolioResponse = await axios.get(`${BASE_URL}/api/signals/portfolio`);

    if (portfolioResponse.data.success) {
      const portfolio = portfolioResponse.data.portfolio;
      console.log('✅ Portfolio stats retrieved!');
      console.log('Current Capital:', '$' + portfolio.currentCapital);
      console.log('Net Profit:', '$' + portfolio.netProfit);
      console.log('Win Rate:', portfolio.winRate + '%');
      console.log('Total Trades:', portfolio.totalTrades);
      console.log('Active Positions:', portfolio.activePositions);
      console.log('');
    }

    // 4. Update prices
    console.log('4️⃣ Updating signal prices...');
    const updateResponse = await axios.get(`${BASE_URL}/api/signals/update-prices`);

    if (updateResponse.data.success) {
      console.log('✅ Prices updated!');
      console.log('Updated:', updateResponse.data.updated, 'signals');
      console.log('');
    }

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTradingSignals();
