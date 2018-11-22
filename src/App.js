import dataUriToBuffer from 'data-uri-to-buffer';
import ipfsAPI from 'ipfs-api';
import React, { Component } from 'react';
import Dropzone from 'react-dropzone'; 
import { utils } from 'web3';

import {
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
  FormControl,
  FormHelperText,
  Input,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@material-ui/core';

import {
  Help
} from '@material-ui/icons'

import Chart from './components/Chart/Chart';
import withContext from './hoc/withContext';

import {
  getBytes32FromMultihash,
  getMultihashFromBytes32,
  getPrice,
  removeDecimals,
} from './utils';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './App.css';

const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' });

const img = {
  display: 'block',
  width: 'auto',
  height: '100%'
};

const mockCurveData = {
  currentPrice: 10,
  exponent: 1,
  inverseSlope: 1000,
  poolBalance: 230,
  totalSupply: 10000,
};

const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 'calc(50% - 100)',
  marginLeft: 30,
};

const thumb = {
  display: 'inline-flex',
  borderRadius: 2,
  border: '1px solid #eaeaea',
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: 'border-box'
};

const thumbInner = {
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden'
};

class App extends Component {
  constructor(props) {
    super(props);
    this.buyWithCBT = this.buyWithCBT.bind(this);
    this.buyWithEth = this.buyWithEth.bind(this);
    this.getBuyAmt = this.getBuyAmt.bind(this);
    this.handleBuy = this.handleBuy.bind(this);
    this.handleSell = this.handleSell.bind(this);
    this.submitHash = this.submitHash.bind(this);
    this.state = {
      addr: 'hello_world',
      anchorEl: null,
      billboard: {},
      billboardAddress: 'unavailable',
      buyAmt: 0,
      createStatus: '',
      currentPrice: 0,
      dialog: false,
      ethBuyPrice: 0,
      ethSellAmount: 0,
      events: [],
      file: '',
      ipfsHash: '',
      ipfsProg: '',
      keys: mockCurveData,
      name: 'none',
      netId: 0,
      sellAmt: 0,
      stackId: null,
      toggleLoading: false,
      top: false,
      txStatus: '',
    }
  }

  async componentDidMount() {
    const { contracts, web3 } = this.props.drizzle;
    const { Convergent_Billboard: billboard } = contracts;

    billboard.events.Advertisement({
      fromBlock: 0,
    })
    .on('data', (event) => {
      const { events } = this.state;
      events.push(event);
      this.setState({ events });
    });

    const me = (await web3.eth.getAccounts())[0];
    const netId = await web3.eth.net.getId();

    const cashedKey = billboard.methods.cashed.cacheCall();
    const exponentKey = billboard.methods.exponent.cacheCall();
    const inverseSlopeKey = billboard.methods.inverseSlope.cacheCall();
    const poolBalanceKey = billboard.methods.poolBalance.cacheCall();
    const totalSupplyKey = billboard.methods.totalSupply.cacheCall();

    const balKey = billboard.methods.balanceOf.cacheCall(me);

    const curveData = {
      exponent: await billboard.methods.exponent().call(),
      inverseSlope: await billboard.methods.inverseSlope().call(),
      poolBalance: await billboard.methods.poolBalance().call(),
      totalSupply: await billboard.methods.totalSupply().call(),
    };

    const currentPrice = (1 / curveData.inverseSlope) * (curveData.totalSupply) ** curveData.exponent;

    this.setState({
      addr: me,
      billboard,
      billboardAddress: billboard.address,
      keys: {
        balKey,
        cashedKey,
        exponentKey,
        inverseSlopeKey,
        poolBalanceKey,
        totalSupplyKey,
      }, 
      currentPrice,
      netId,
    })
  }

  // Only allow up to four decimals places on input.
  validateInput(amount) {
    const zeroes = [
      '0',
      '00',
      '000',
      '0000',
    ]

    const split = amount.split('.');
    if (split[1] && split[1].length && zeroes.indexOf(split[1]) !== -1) {
      // Right hand side of decimals is all zero.
      return { value: split[0], decimals: 0 };
    } else if (split.length === 2) {
      const decimals = split[1].length;
      const value = split[0] * 10**decimals + Number(split[1]);
      return { value, decimals }
    } else {
      return { value: amount, decimals: 0 };
    }
  }

  getBuyAmt(amt) {
    const validated = this.validateInput(amt);
    const amount = utils.toBN(validated.value).mul(utils.toBN(10**18)).div(utils.toBN(10**validated.decimals));
    return amount;
  }

  async handleBuy() {
    const amount = this.getBuyAmt(this.state.buyAmt);
    // USING DRIZZLE and not resetting buyAmt:
    const stackId =
      this.state.billboard.methods.mint.cacheSend(
        amount.toString(),
        {
          from: this.state.addr,
          value: await this.state.billboard.methods.priceToMint(amount.toString()).call()
        });
    // save the `stackId` for later reference
    this.setState({ stackId });
    this.waitForMined();
  }

  waitForMined = () => {
    const interval = setInterval(() => {
      const status = this.getTxStatus();
      if (status === 'pending' && this.state.txStatus != 'pending') {
        toast.info('Waiting for transaction to be mined...', { className: 'blue-background' })
        this.setState({
          txStatus: 'pending',
        })
      }
      if (status === 'success') {
        toast.success('Transaction mined!', { className: 'green-background' });
        clearInterval(this.state.interval);
        this.setState({
          txStatus: 'success',
        })
      }
    }, 1200);
    this.setState({
      interval,
    });
  }

  getTxStatus = () => {
    // get the transaction states from the drizzle state
    const { transactions, transactionStack } = this.props.drizzleState;
    // get the transaction hash using our saved `stackId`
    const txHash = transactionStack[this.state.stackId];
    // if transaction hash does not exist, don't display anything
    if (!txHash) return null;
    // otherwise, return the transaction status
    return transactions[txHash].status;
  };

  handleChange = name => async event => {
    this.setState({
      [name]: event.target.value,
    });
    setTimeout(async () => {
      if (name === 'buyAmt') {
        const amount = this.getBuyAmt(this.state.buyAmt);
        const ethBuyPrice = await this.state.billboard.methods.priceToMint(amount.toString()).call();
        this.setState({
          ethBuyPrice,
        })
      };
      if (name === 'sellAmt') {
        const amount = this.getSellAmt(this.state.sellAmt);
        const ethSellAmount = await this.state.billboard.methods.rewardForBurn(amount.toString()).call();
        this.setState({
          ethSellAmount,
        })
      };
    }, 500);
  }

  getSellAmt(amt) {
    const validated = this.validateInput(this.state.sellAmt)
    const amount = utils.toBN(validated.value).mul(utils.toBN(10**18)).div(utils.toBN(10**validated.decimals));
    return amount;
  }

  async handleSell() {
    const amount = this.getSellAmt(this.state.sellAmt);
    const stackId = this.state.billboard.methods.burn.cacheSend(
      amount.toString(),
      {
        from: this.state.addr,
      });
    this.setState({ stackId });
    this.waitForMined();
  }

  toggleDialog = (open) => () =>  {
    this.setState({
      dialog: open,
    })
  }

  async submitHash() {
    if (!this.state.file) {
      window.alert("Upload an image first!");
      throw 'no image';
    }

    const buff = dataUriToBuffer(this.state.file);
    this.setState({
      toggleLoading: true,
    });

    const result = await ipfs.add(buff, {
      progress: prog => {
        this.setState({
          ipfsProg: prog,
        })
        console.log(`ipfs progress: ${this.state.ipfsProg}%`);
      }
    });

    this.setState({
      ipfsHash: result[0].hash,
      toggleLoading: false,
    });
  }

  async buyWithEth() {
    await this.submitHash()
    const mhash = getBytes32FromMultihash(this.state.ipfsHash);
    const stackId = this.state.billboard.methods.purchaseAdvertisement.cacheSend(
      mhash.digest,
      {
        from: this.state.addr,
        value: await this.state.billboard.methods.priceToMint(utils.toBN(10**18).toString()).call()
      });

    this.setState({
      stackId,
      file: '',
      ipfsHash: '',
    });
    this.toggleDialog(false);
    this.waitForMined();
  }

  async buyWithCBT() {
    await this.submitHash();
    const mhash = getBytes32FromMultihash(this.state.ipfsHash);
    const stackId = this.state.billboard.methods.submit.cacheSend(
      mhash.digest,
      {
        from: this.state.addr
      });

    this.setState({
      stackId,
      file: '',
      ipfsHash: '',
    });
    this.toggleDialog(false);
    this.waitForMined();
  }

  toggleDrawer = (side, open) => () => {
    this.setState({
      [side]: open,
    });
  };

  onDrop(files) {
    const reader = new FileReader();
    reader.onload = e => {
      this.setState({
        file: e.target.result,
      })
    };

    reader.readAsDataURL(files[0]);
  }

  onCancel() {
    this.setState({
      file: '',
    });
  }

  render() {
    const { accounts, accountBalances, contracts: { Convergent_Billboard: billboard } } = this.props.drizzleState;

    if (
      !(this.state.keys.totalSupplyKey in billboard.totalSupply)
      || !(this.state.keys.exponentKey in billboard.exponent)
      || !(this.state.keys.inverseSlopeKey in billboard.inverseSlope)
      || !(this.state.keys.balKey in billboard.balanceOf)
      || !(this.state.keys.cashedKey in billboard.cashed)
      || !(this.state.keys.poolBalanceKey in billboard.poolBalance)) {
      return <span>Still loading...</span>
    }

    const open = Boolean(this.state.anchorEl);

    let curveData = {
      exponent: billboard.exponent[this.state.keys.exponentKey].value,
      inverseSlope: billboard.inverseSlope[this.state.keys.inverseSlopeKey].value,
      poolBalance: billboard.poolBalance[this.state.keys.poolBalanceKey].value,
      totalSupply: billboard.totalSupply[this.state.keys.totalSupplyKey].value,
    };

    const cbtBal = billboard.balanceOf[this.state.keys.balKey].value;
    const cashed = billboard.cashed[this.state.keys.cashedKey].value;

    const currentPrice = getPrice(
      curveData.inverseSlope,
      utils.toBN(curveData.totalSupply).toString(),
      curveData.exponent,
    );

    curveData = Object.assign(curveData, { currentPrice });

    let multihash;
    if (this.state.events && this.state.events.length) {
      multihash = getMultihashFromBytes32({
        digest: this.state.events[this.state.events.length -1].returnValues.what,
        hashFunction: 18,
        size: 32,
      });
    }

    let etherscanStr;
    if (this.state.netId === 1) {
      etherscanStr = 'https://etherscan.io';
    } else {
      etherscanStr = 'https://rinkeby.etherscan.io';
    }

    return (
      <div className="App">
        <header className="App-header">
          <Help className="App-help" style={{ position: 'absolute', top: '5%', right: '5%', left: 'auto' }} onClick={() => window.open('https://medium.com/convergentcx/the-convergent-billboard-6594b933648e')} />
        {/* <Tooltip title={this.state.billboardAddress} placement="top" interactive> */}
          <h1>Convergent Billboard</h1>
        {/* </Tooltip> */}
          <Chart
            curveData={curveData}
            multihash={multihash}
            height="100%"
            width="100%"
            margin={{ top: 0, bottom: 10, left: 0, right: 60 }}
          />

          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>

            {/* <Tooltip title="Open the details page on this speculation market and buy or sell tokens." placement="top"> */}
            <Button color="primary" variant="outlined" onClick={this.toggleDrawer('top', true)}>OPEN SPECULATION MARKET</Button>
            {/* </Tooltip> */}

            <Button
              aria-label="More"
              aria-owns={open ? 'long-menu' : undefined}
              aria-haspopup="true"
              onClick={this.toggleDialog(true)}
              color="primary"
              variant="outlined"
            >
              PURCHASE ADVERTISEMENT
            </Button>

          </div>

          <Dialog
            open={this.state.dialog}
            onClose={this.toggleDialog(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle 
              disableTypography
              id="alert-dialog-title"
              style={{
                backgroundColor: '#f2f2f2',
                display: 'flex',
                justifyContent: 'space-between',
            }}>
              <Typography variant="h6">Buy the Convergent Billboard</Typography><Button onClick={() => alert("Image will be rendered as 200x200 px.")}>protip</Button>
            </DialogTitle>
            <DialogContent             style={{
              backgroundColor: "#f2f2f2",
            }}>
              <DialogContentText id="alert-dialog-description">
                Upload an image to change the billboard. 
                <br />
                Cost of changing the billboard
                is 1 <span style={{color: '#0044ff' }}>Convergent Billboard Token</span> or the current price of {removeDecimals(currentPrice.toString())} ETH.
              </DialogContentText>
              <br />
              <section style={{ display: 'flex', flexDirection: 'row', padding: '10px' }}>
                <div>
                  <Dropzone
                    onDrop={this.onDrop.bind(this)}
                    onFileDialogCancel={this.onCancel.bind(this)}
                  >
                    <p style={{ padding: '5px' }}>Drag your image file here or click to upload.</p>
                  </Dropzone>
                </div>
                <div style={thumbsContainer}>
                  <div style={thumb} key={1}>
                    <div style={thumbInner}>
                      <img
                        src={this.state.file}
                        style={img}
                      />
                    </div>
                  </div>
                </div>
              </section>
              {this.state.toggleLoading &&
              <div>
                <LinearProgress color="secondary" />
                Uploading to IPFS! 📡
              </div>
              }
            </DialogContent>
            <DialogActions style={{ backgroundColor: '#f2f2f2', margin: 0, padding: '10px'}}>
              <Button onClick={this.buyWithEth} color="secondary">
                Buy with ETH
              </Button>
              <Button onClick={this.buyWithCBT} color="secondary" autoFocus>
                Buy with CBT
              </Button>
              {/* <div>{this.getTxStatus()}</div> */}
            </DialogActions>
          </Dialog>

          <Drawer anchor="top" open={this.state.top} onClose={this.toggleDrawer('top', false)}>
            <div
              tabIndex={0}
              role="button"
              style={{
                backgroundColor: '#f2f2f2',
                borderStyle: 'inset',
                borderWidth: '3px',
                padding: '20px'
              }}
            >
              <Typography variant="h6" id="modal-title" align="center" gutterBottom>
                <a href={`${etherscanStr}/address/${this.state.billboardAddress}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  Convergent Billboard
                </a>
              </Typography>
              <Typography variant="subtitle2" align="center" gutterBottom>
                <div>Your Account - <a href={`${etherscanStr}/address/${accounts[0]}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{accounts[0].slice(0, 10) + '...' + accounts[0].slice(-4)}</a></div> Your Balances - {removeDecimals(accountBalances[accounts[0]]).slice(0, 9)} ETH | {removeDecimals(cbtBal)} CBT
              </Typography>
              <br />
              <br />
              <div style={{ display: 'flex' }}>
                <div style={{ flexGrow: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button color="secondary" variant="outlined" onClick={this.handleBuy}>
                    Buy
                  </Button>
                  &nbsp;&nbsp;
                  <FormControl
                    aria-describedby="weight-helper-text"
                  >
                    <Input
                      id="adornment-weight"
                      value={this.state.buyAmt}
                      onChange={this.handleChange('buyAmt')}
                      endAdornment={<InputAdornment position="end">CBT</InputAdornment>}
                      inputProps={{
                        'aria-label': 'Weight',
                      }}
                    />
                    <FormHelperText id="weight-helper-text">Amount</FormHelperText>
                  </FormControl>
                  &nbsp;
                  <Button variant="contained" color="secondary" disabled>
                    With {removeDecimals(this.state.ethBuyPrice || '0').slice(0, 9)} ETH
                  </Button>
                </div>
                <div style={{ flexGrow: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button color="secondary" variant="outlined" onClick={this.handleSell}>
                    Sell
                  </Button>
                  &nbsp;&nbsp;
                  <FormControl
                    aria-describedby="weight-helper-text"
                  >
                    <Input
                      id="adornment-weight"
                      value={this.state.sellAmt}
                      onChange={this.handleChange('sellAmt')}
                      endAdornment={<InputAdornment position="end">CBT</InputAdornment>}
                      inputProps={{
                        'aria-label': 'Weight',
                      }}
                    />
                    <FormHelperText id="weight-helper-text">Amount</FormHelperText>
                  </FormControl>
                  &nbsp;
                  <Button variant="contained" color="secondary" disabled>
                    For {removeDecimals(this.state.ethSellAmount || '0').slice(0, 9)} ETH
                  </Button>
                </div>
              </div>
              
              <br />
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell numeric>Current Price</TableCell>
                    <TableCell numeric>Reserve Balance</TableCell>
                    <TableCell numeric>Total Supply</TableCell>
                    <TableCell numeric>CBT Used</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow key={1}>
                    <TableCell numeric>{removeDecimals(curveData.currentPrice.toString())} Ξ</TableCell>
                    <TableCell numeric>{removeDecimals(billboard.poolBalance[this.state.keys.poolBalanceKey].value)} Ξ</TableCell>
                    <TableCell numeric>{removeDecimals(billboard.totalSupply[this.state.keys.totalSupplyKey].value)} CBT</TableCell>
                    <TableCell numeric>{cashed}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <br />
              {/* <div>{this.getTxStatus()}</div> */}
            </div>
          </Drawer>

          <ToastContainer autoClose={false} closeOnClick />
        </header>
      </div>
    );
  }
}

export default withContext(App);
