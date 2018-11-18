import React, { Component } from 'react';
import {
  Button,
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
  // Menu,
  // MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@material-ui/core';

import Dropzone from 'react-dropzone'; 

import dataUriToBuffer from 'data-uri-to-buffer';
import ipfsAPI from 'ipfs-api';

import Chart from './components/Chart/Chart';

import './App.css';

import withContext from './hoc/withContext';
import {
  getPrice,
  removeDecimals,
} from './utils';

import { utils } from 'web3';

const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' });

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
  marginTop: 16
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

const img = {
  display: 'block',
  width: 'auto',
  height: '100%'
};

class App extends Component {
  constructor(props) {
    super(props);
    this.handleBuy = this.handleBuy.bind(this);
    this.handleSell = this.handleSell.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.buyWithEth = this.buyWithEth.bind(this);
    this.buyWithCBT = this.buyWithCBT.bind(this);
    this.submitHash = this.submitHash.bind(this);
    this.state = {
      addr: 'hello_world',
      anchorEl: null,
      billboard: {},
      billboardAddress: 'unavailable',
      buyAmt: '',
      createStatus: '',
      currentPrice: 0,
      dialog: false,
      files: [],
      keys: mockCurveData,
      name: 'none',
      sellAmt: '',
      top: false,
    }
  }

  async componentDidMount() {
    const { contracts, web3 } = this.props.drizzle;
    const { Convergent_Billboard: billboard } = contracts;
    const me = (await web3.eth.getAccounts())[0];

    const cashedKey = billboard.methods.cashed.cacheCall();
    const exponentKey = billboard.methods.exponent.cacheCall();
    const inverseSlopeKey = billboard.methods.inverseSlope.cacheCall();
    const poolBalanceKey = billboard.methods.poolBalance.cacheCall();
    const totalSupplyKey = billboard.methods.totalSupply.cacheCall();

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
        cashedKey,
        exponentKey,
        inverseSlopeKey,
        poolBalanceKey,
        totalSupplyKey,
      }, 
      currentPrice,
    })
  }

  componentDidUpdate() {
    console.log(this.state.createStatus);
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
    } else if (split[1] && split[1].length) {
      const decimals = split[1].length;
      const value = split[0] * 10**decimals + Number(split[1]);
      return { value, decimals }
    } else {
      return { value: amount, decimals: 0 };
    }
  }

  async handleBuy() {
    const validated = this.validateInput(this.state.buyAmt);
    const amount = utils.toBN(validated.value).mul(utils.toBN(10**18)).div(utils.toBN(10**validated.decimals));
    this.state.billboard.methods.mint(amount.toString()).send({
      from: this.state.addr,
      value: await this.state.billboard.methods.priceToMint(amount.toString()).call(),
    });
    this.setState({
      buyAmt: '',
    })
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  }

  async handleSell() {
    const validated = this.validateInput(this.state.sellAmt)
    const amount = utils.toBN(validated.value).mul(utils.toBN(10**18)).div(utils.toBN(10**validated.decimals));
    this.state.billboard.methods.burn(amount.toString()).send({
      from: this.state.addr,
    });
    this.setState({
      sellAmt: '',
    })
  }

  openMenu(event) {
    this.setState({
      anchorEl: event.currentTarget,
    })
  }

  closeMenu() {
    this.setState({
      anchorEl: null,
    })
  }

  toggleDialog = (open) => () =>  {
    this.setState({
      dialog: open,
    })
  }

  async submitHash() {
    if (this.state.files[0] === undefined) {
      window.alert("Please upload an image first!");
      return;
    }
    const buff = dataUriToBuffer(this.state.files[0].preview);
    const result = await ipfs.add(buff, {
      progress: prog => {
        this.setState({
          createStatus: 'Uploaded ' + prog + '% to IPFS'
        });
      }
    });
    console.log(result);
  }

  async buyWithEth() {
    this.submitHash()
    this.state.billboard.methods.purchaseAdvertisement("0x" + "00".repeat(32)).send({
      from: this.state.addr,
      value: await this.state.billboard.methods.priceToMint(utils.toBN(10**18).toString()).call(),
    });
    this.toggleDialog(false);
  }

  async buyWithCBT() {
    await this.submitHash();
    this.state.billboard.methods.submit("0x" + "00".repeat(32)).send({
      from: this.state.addr,
    });
    this.toggleDialog(false);
  }

  toggleDrawer = (side, open) => () => {
    this.setState({
      [side]: open,
    });
  };

  onDrop(files) {
    const reader = new FileReader();
    reader.onload = e => {
      let dataURL
    }
    this.setState({
      files: files.map(file => ({
        ...file,
        preview: URL.createObjectURL(file)
      }))
    });
  }

  onCancel() {
    this.setState({
      files: []
    });
  }

  render() {
    const { Convergent_Billboard: billboard } = this.props.drizzleState.contracts;

    if (
      !(this.state.keys.totalSupplyKey in billboard.totalSupply)
      || !(this.state.keys.exponentKey in billboard.exponent)
      || !(this.state.keys.inverseSlopeKey in billboard.inverseSlope)) {
      return <span>Still loading...</span>
    }

    const open = Boolean(this.state.anchorEl);

    let curveData = {
      exponent: billboard.exponent[this.state.keys.exponentKey].value,
      inverseSlope: billboard.inverseSlope[this.state.keys.inverseSlopeKey].value,
      poolBalance: billboard.poolBalance[this.state.keys.poolBalanceKey].value,
      totalSupply: billboard.totalSupply[this.state.keys.totalSupplyKey].value,
    };

    const cashed = billboard.cashed[this.state.keys.cashedKey].value;

    const currentPrice = getPrice(
      curveData.inverseSlope,
      utils.toBN(curveData.totalSupply).toString(),
      curveData.exponent,
    );

    curveData = Object.assign(curveData, { currentPrice });

    const {files} = this.state;

    let count = 0;
    const thumbs = files.map(file => (
      <div style={thumb} key={count++}>
        <div style={thumbInner}>
          <img
            src={file.preview}
            style={img}
          />
        </div>
      </div>
    ));

    return (
      <div className="App">
        <header className="App-header">
        <Tooltip title={this.state.billboardAddress} placement="top" interactive>
          <h1>Convergent Billboard</h1>
        </Tooltip>
          <Chart
            curveData={curveData}
            height="100%"
            width="100%"
            margin={{ top: 10, bottom: 10, left: 40, right: 40 }}
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
            <DialogTitle id="alert-dialog-title">{"Buy the Convergent Billboard"}</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Upload an image to change the billboard. Cost of changing the billboard
                is 1 Convergent Billboard Token or the current price of {removeDecimals(currentPrice.toString())} ETH.
              </DialogContentText>
              <br />
              <section>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <Dropzone
                    onDrop={this.onDrop.bind(this)}
                    onFileDialogCancel={this.onCancel.bind(this)}
                  >
                    <p>Drag your image file here or click to upload.</p>
                  </Dropzone>
                </div>
                  <div style={thumbsContainer}>
                    {thumbs}
                  </div>
              </section>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.buyWithEth} color="primary">
                Buy with ETH
              </Button>
              <Button onClick={this.buyWithCBT} color="primary" autoFocus>
                Buy with CBT
              </Button>
            </DialogActions>
          </Dialog>

          {/* <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={Boolean(this.state.anchorEl)}
            onClose={this.closeMenu}
          >
            <MenuItem onClick={this.closeMenu}>USE ETH</MenuItem>
            <MenuItem onClick={this.closeMenu}>USE DAI</MenuItem>
            <MenuItem onClick={this.closeMenu}>USE BILLBOARD TOKEN</MenuItem>
          </Menu> */}

          <Drawer anchor="top" open={this.state.top} onClose={this.toggleDrawer('top', false)}>
            <div
              tabIndex={0}
              role="button"
              // onClick={this.toggleDrawer('top', false)}
              // onKeyDown={this.toggleDrawer('top', false)}
            >
              <Paper elevation={1}>
                <Typography variant="h6" id="modal-title" align='center' gutterBottom>
                  CONVERGENT BILLBOARD
                </Typography>
                <div style={{ display: 'flex' }}>
                  <div style={{ flexGrow: 3, display: 'flex', justifyContent: 'center' }}>
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
                &nbsp;&nbsp;
                <Button color="primary" variant="outlined" onClick={this.handleBuy}>
                  Buy
                </Button>
                </div>
                <div style={{ flexGrow: 3, display: 'flex', justifyContent: 'center' }}>
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
                &nbsp;&nbsp;
                <Button color="secondary" variant="outlined" onClick={this.handleSell}>
                  Sell
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

              </Paper>
            </div>
          </Drawer>

        </header>
      </div>
    );
  }
}

export default withContext(App);
