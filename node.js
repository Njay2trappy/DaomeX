const Web3 = require("web3");
const web3 = new Web3();

// Hexadecimal value to decode
const hexValue = "0x0000000000000000000000000000000000000000000000008ac7230489e80000";

// Decode the value as a BigNumber
const weiValue = web3.utils.toBN(hexValue);

// Convert the value from wei to ETH/AMB (18 decimals)
const etherValue = web3.utils.fromWei(weiValue, "ether");

// Output the results
console.log("Amount in wei:", weiValue.toString());  // Full value in wei
console.log("Amount in ETH/AMB:", etherValue);       // Human-readable value