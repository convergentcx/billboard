import React, { Component } from 'react';
import {
  Button,
  Drawer,
  Input,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
 } from '@material-ui/core';

import Chart from './components/Chart/Chart';

import './App.css';

import withContext from './hoc/withContext';
import {
  getPrice,
  removeDecimals,
} from './utils';

import { utils } from 'web3';

const mockCurveData = {
  currentPrice: 10,
  exponent: 1,
  inverseSlope: 1000,
  poolBalance: 230,
  totalSupply: 10000,
};

class App extends Component {
  constructor(props) {
    super(props);
    this.handleBuy = this.handleBuy.bind(this);
    this.handleSell = this.handleSell.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.state = {
      addr: 'hello_world',
      anchorEl: null,
      billboard: {},
      billboardAddress: 'unavailable',
      buyAmt: '',
      sellAmt: '',
      currentPrice: 0,
      keys: mockCurveData,
      name: 'none',
      top: false,
    }
  }

  async componentDidMount() {
    const { contracts, web3 } = this.props.drizzle;
    const { Convergent_Billboard: billboard } = contracts;
    const me = (await web3.eth.getAccounts())[0];

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
        exponentKey,
        inverseSlopeKey,
        poolBalanceKey,
        totalSupplyKey,
      }, 
      currentPrice,
    })
  }

  async handleBuy() {
    this.state.billboard.methods.mint(String(10**18)).send({
      from: this.state.addr,
      value: await this.state.billboard.methods.priceToMint(String(10**18)).call(),
    });
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  }

  async handleSell() {
    this.state.billboard.methods.burn(String(10**18)).send({
      from: this.state.addr,
    });
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

  toggleDrawer = (side, open) => () => {
    this.setState({
      [side]: open,
    });
  };

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

    const currentPrice = getPrice(
      curveData.inverseSlope,
      utils.toBN(curveData.totalSupply).toString(),
      curveData.exponent,
    );

    curveData = Object.assign(curveData, { currentPrice });

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
              onClick={this.openMenu}
              color="primary"
              variant="outlined"
            >
              PURCHASE ADVERTISEMENT
            </Button>

          </div>

          <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={Boolean(this.state.anchorEl)}
            onClose={this.closeMenu}
          >
            <MenuItem onClick={this.closeMenu}>USE ETH</MenuItem>
            <MenuItem onClick={this.closeMenu}>USE DAI</MenuItem>
            <MenuItem onClick={this.closeMenu}>USE BILLBOARD TOKEN</MenuItem>
          </Menu>

          <Drawer anchor="top" open={this.state.top} onClose={this.toggleDrawer('top', false)}>
            <div
              tabIndex={0}
              role="button"
              // onClick={this.toggleDrawer('top', false)}
              // onKeyDown={this.toggleDrawer('top', false)}
            >
              <Paper elevation={1}>
                <Typography variant="h6" id="modal-title">
                  CONVERGENT BILLBOARD
                </Typography>
                <TextField
                  id="standard-name"
                  label="Buy Amount"
                  // className={classes.textField}
                  value={this.state.buyAmt}
                  onChange={this.handleChange('buyAmt')}
                  margin="normal"
                />
                <Button color="primary" variant="outlined" onClick={this.handleBuy}>
                  Buy
                </Button>
                &nbsp;&nbsp;
                <TextField
                  id="standard-name"
                  label="Sell Amount"
                  // className={classes.textField}
                  value={this.state.sellAmt}
                  onChange={this.handleChange('sellAmt')}
                  margin="normal"
                />
                <Button color="secondary" variant="outlined" onClick={this.handleSell}>
                  Sell
                </Button>
                <Typography variant="subtitle1" id="simple-modal-description">
                  Upload an image and pay one token.
                </Typography>

                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell numeric>Current Price</TableCell>
                      <TableCell numeric>Reserve Balance</TableCell>
                      <TableCell numeric>Total Supply</TableCell>
                      <TableCell numeric>BILL Tokens Used</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow key={1}>
                      <TableCell numeric>{removeDecimals(curveData.currentPrice.toString())} Ξ</TableCell>
                      <TableCell numeric>{removeDecimals(billboard.poolBalance[this.state.keys.poolBalanceKey].value)} Ξ</TableCell>
                      <TableCell numeric>{removeDecimals(billboard.totalSupply[this.state.keys.totalSupplyKey].value)} BILLs</TableCell>
                      <TableCell numeric>{0}</TableCell>
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
