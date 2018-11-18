import React, { Component } from 'react';
import {
  Area,
  CartesianGrid,
  AreaChart,
  Label,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import * as d3 from 'd3';

import {
  getPrice,
  removeDecimals,
} from '../../utils';

import { utils } from 'web3';

export default class Chart extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }
  
  componentDidMount() {
    const context = d3.select(this.ref);

    context.append("svg:pattern")
    .attr("id", "rainbow")
    .attr("width", 200)
    .attr("height", 200)
    .attr("patternUnits", "userSpaceOnUse")
    .append("svg:image")
    .attr("xlink:href", `https://gateway.ipfs.io/ipfs/${this.props.multihash}`)
    .attr("width", 200)
    .attr("height", 200)
    .attr("x", 0)
    .attr("y", 0);
  }

  componentWillUpdate() {
    const context = d3.select(this.ref);

    context.select("pattern")
    .select("image")
    .attr("xlink:href", `https://gateway.ipfs.io/ipfs/${this.props.multihash}`)
  }
  
  getChartData() {
    let { 
      currentPrice,
      exponent,
      inverseSlope,
      poolBalance,
      totalSupply,
    } = this.props.curveData;

    poolBalance = utils.toBN(poolBalance);
    totalSupply = utils.toBN(totalSupply);

    const currentPoint = {
      x: parseFloat(removeDecimals(totalSupply.toString())).toFixed(4),
      y: parseFloat(removeDecimals(currentPrice.toString())).toFixed(4),
    };

    let data = [
      {supply: 0, sell: 0, value: 0}
    ];

    const step = utils.toBN(10**17);
    for (let i = step; i.lte(utils.toBN(5000).mul(step)); i = i.add(step)) {
      const price = getPrice(inverseSlope, i, exponent);
      if (i.lte(totalSupply)) {
        data.push({ 
          supply: parseFloat(removeDecimals(i)).toFixed(4), 
          sell: parseFloat(removeDecimals(price)).toFixed(4), 
          value: parseFloat(removeDecimals(price)).toFixed(4),
        });
      } else if (i.gt(totalSupply)) {
        data.push({
          supply: parseFloat(removeDecimals(i)).toFixed(4), 
          buy: parseFloat(removeDecimals(price)).toFixed(4), 
          value: parseFloat(removeDecimals(price)).toFixed(4),
        });
      }
    }

    return {
      data, 
      currentPoint,
    };
  }

  render () {
    const { height, margin, width } = this.props;

    const { data, currentPoint } = this.getChartData();

    return (
      <div style={{ height: "70vh", width: "90vw"}}>
      <ResponsiveContainer height={height} width={width}>
        <AreaChart
          data={data}
          margin={margin}
          style={{ margin: 'auto' }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="supply" type={ 'number' } domain={[0, 500]}>
            {/* <Label value="Token Supply" position="bottom" dy={0} fill='white' /> */}
          </XAxis>
          <YAxis dataKey="value" type={ 'number' } domain={[0, 0.5]}>
            {/* <Label value="Price" position="left" angle='-90' dy={-10} offset={10} fill='white' /> */}
          </YAxis>
          <Tooltip
            content={(props) => <div style={{ color: '#0095b3' }}>
              <div>Supply: {parseFloat(props.label)}</div>    {console.log(JSON.stringify(props.payload))}
              <div>{props.payload && props.payload.length ?
                props.payload[0].payload.buy && 'Buy: ' + props.payload[0].payload.buy || 'Sell: ' + props.payload[0].payload.sell
                : ''}</div>
            </div>}
            cursor={{
              fill: '',
              stroke: '#0095b3',
            }}
          />
          <Area isAnimationActive={false} dots={false} stackOffset={'none'} dataKey="value" name={'price'} key={'price'} stroke='#0095b3' fill='none'/>
          <Area
            isAnimationActive={false}
            stackOffset={'none'} 
            dataKey="sell" 
            stroke="#0095b3"
            fill='url(#rainbow)'
          />
          <ReferenceDot
            isFront={true}
            ifOverflow="extendDomain"
            x={currentPoint.x}
            y={currentPoint.y}
            r={4}
            fill=""
            stroke="#0095b3"
          >
            <Label value={currentPoint.y}
              position="top"
              fill="#0095b3"
            />
          </ReferenceDot>
        </AreaChart>
      </ResponsiveContainer>
      <svg ref={(ref) => this.ref = ref} />
      </div>
    );
  }
}
