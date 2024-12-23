// Use this bot to create tokens
const { Telegraf } = require("telegraf");
const Web3 = require("web3");
const fs = require("fs");

// Bot token
const BOT_TOKEN = "8090241465:AAFmV7GChZL1FkANhb1sFgMrnvIG0XWubhA";

// RPC URLs
const PRIMARY_RPC_URL = "https://network.ambrosus.io/";
const BACKUP_RPC_URL = "https://rpc.airdao.io/";

// Initialize web3 with primary RPC
//const web3 = new Web3("https://network.ambrosus.io/");

let web3 = new Web3(new Web3.providers.HttpProvider(PRIMARY_RPC_URL));

// Fallback to backup RPC if primary fails
web3.eth.net.isListening()
  .then(() => console.log(`🌐 Connected to Primary RPC: ${PRIMARY_RPC_URL}`))
  .catch(() => {
    console.log("🚨 Primary RPC failed. Switching to backup RPC...");
    web3 = new Web3(new Web3.providers.HttpProvider(BACKUP_RPC_URL));
    web3.eth.net.isListening()
      .then(() => console.log(`🌐 Connected to Backup RPC: ${BACKUP_RPC_URL}`))
      .catch(() => {
        console.error("🚨 Failed to connect to both RPC endpoints. Daome Meme Bot cannot function!");
        process.exit(1);
      });
  });

// ERC-20 Contract Bytecode and ABI (replace with your own)
const CONTRACT_BYTECODE = "608060405234801561001057600080fd5b506040516118b63803806118b6833981810160405281019061003291906104d7565b8383816003908161004391906107a9565b50806004908161005391906107a9565b505050610066338361007f60201b60201c565b806005908161007591906107a9565b505050505061099b565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036100f15760006040517fec442f050000000000000000000000000000000000000000000000000000000081526004016100e891906108bc565b60405180910390fd5b6101036000838361010760201b60201c565b5050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160361015957806002600082825461014d9190610906565b9250508190555061022c565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050818110156101e5578381836040517fe450d38c0000000000000000000000000000000000000000000000000000000081526004016101dc93929190610949565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361027557806002600082825403925050819055506102c2565b806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161031f9190610980565b60405180910390a3505050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6103938261034a565b810181811067ffffffffffffffff821117156103b2576103b161035b565b5b80604052505050565b60006103c561032c565b90506103d1828261038a565b919050565b600067ffffffffffffffff8211156103f1576103f061035b565b5b6103fa8261034a565b9050602081019050919050565b60005b8381101561042557808201518184015260208101905061040a565b60008484015250505050565b600061044461043f846103d6565b6103bb565b9050828152602081018484840111156104605761045f610345565b5b61046b848285610407565b509392505050565b600082601f83011261048857610487610340565b5b8151610498848260208601610431565b91505092915050565b6000819050919050565b6104b4816104a1565b81146104bf57600080fd5b50565b6000815190506104d1816104ab565b92915050565b600080600080608085870312156104f1576104f0610336565b5b600085015167ffffffffffffffff81111561050f5761050e61033b565b5b61051b87828801610473565b945050602085015167ffffffffffffffff81111561053c5761053b61033b565b5b61054887828801610473565b9350506040610559878288016104c2565b925050606085015167ffffffffffffffff81111561057a5761057961033b565b5b61058687828801610473565b91505092959194509250565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806105e457607f821691505b6020821081036105f7576105f661059d565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b60006008830261065f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610622565b6106698683610622565b95508019841693508086168417925050509392505050565b6000819050919050565b60006106a66106a161069c846104a1565b610681565b6104a1565b9050919050565b6000819050919050565b6106c08361068b565b6106d46106cc826106ad565b84845461062f565b825550505050565b600090565b6106e96106dc565b6106f48184846106b7565b505050565b5b818110156107185761070d6000826106e1565b6001810190506106fa565b5050565b601f82111561075d5761072e816105fd565b61073784610612565b81016020851015610746578190505b61075a61075285610612565b8301826106f9565b50505b505050565b600082821c905092915050565b600061078060001984600802610762565b1980831691505092915050565b6000610799838361076f565b9150826002028217905092915050565b6107b282610592565b67ffffffffffffffff8111156107cb576107ca61035b565b5b6107d582546105cc565b6107e082828561071c565b600060209050601f8311600181146108135760008415610801578287015190505b61080b858261078d565b865550610873565b601f198416610821866105fd565b60005b8281101561084957848901518255600182019150602085019450602081019050610824565b868310156108665784890151610862601f89168261076f565b8355505b6001600288020188555050505b505050505050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006108a68261087b565b9050919050565b6108b68161089b565b82525050565b60006020820190506108d160008301846108ad565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610911826104a1565b915061091c836104a1565b9250828201905080821115610934576109336108d7565b5b92915050565b610943816104a1565b82525050565b600060608201905061095e60008301866108ad565b61096b602083018561093a565b610978604083018461093a565b949350505050565b6000602082019050610995600083018461093a565b92915050565b610f0c806109aa6000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c8063313ce56711610066578063313ce5671461015d57806370a082311461017b57806395d89b41146101ab578063a9059cbb146101c9578063dd62ed3e146101f95761009e565b806303ee438c146100a357806306fdde03146100c1578063095ea7b3146100df57806318160ddd1461010f57806323b872dd1461012d575b600080fd5b6100ab610229565b6040516100b89190610b60565b60405180910390f35b6100c96102b7565b6040516100d69190610b60565b60405180910390f35b6100f960048036038101906100f49190610c1b565b610349565b6040516101069190610c76565b60405180910390f35b61011761036c565b6040516101249190610ca0565b60405180910390f35b61014760048036038101906101429190610cbb565b610376565b6040516101549190610c76565b60405180910390f35b6101656103a5565b6040516101729190610d2a565b60405180910390f35b61019560048036038101906101909190610d45565b6103ae565b6040516101a29190610ca0565b60405180910390f35b6101b36103f6565b6040516101c09190610b60565b60405180910390f35b6101e360048036038101906101de9190610c1b565b610488565b6040516101f09190610c76565b60405180910390f35b610213600480360381019061020e9190610d72565b6104ab565b6040516102209190610ca0565b60405180910390f35b6005805461023690610de1565b80601f016020809104026020016040519081016040528092919081815260200182805461026290610de1565b80156102af5780601f10610284576101008083540402835291602001916102af565b820191906000526020600020905b81548152906001019060200180831161029257829003601f168201915b505050505081565b6060600380546102c690610de1565b80601f01602080910402602001604051908101604052809291908181526020018280546102f290610de1565b801561033f5780601f106103145761010080835404028352916020019161033f565b820191906000526020600020905b81548152906001019060200180831161032257829003601f168201915b5050505050905090565b600080610354610532565b905061036181858561053a565b600191505092915050565b6000600254905090565b600080610381610532565b905061038e85828561054c565b6103998585856105e0565b60019150509392505050565b60006012905090565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60606004805461040590610de1565b80601f016020809104026020016040519081016040528092919081815260200182805461043190610de1565b801561047e5780601f106104535761010080835404028352916020019161047e565b820191906000526020600020905b81548152906001019060200180831161046157829003601f168201915b5050505050905090565b600080610493610532565b90506104a08185856105e0565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b61054783838360016106d4565b505050565b600061055884846104ab565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146105da57818110156105ca578281836040517ffb8f41b20000000000000000000000000000000000000000000000000000000081526004016105c193929190610e21565b60405180910390fd5b6105d9848484840360006106d4565b5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036106525760006040517f96c6fd1e0000000000000000000000000000000000000000000000000000000081526004016106499190610e58565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036106c45760006040517fec442f050000000000000000000000000000000000000000000000000000000081526004016106bb9190610e58565b60405180910390fd5b6106cf8383836108ab565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16036107465760006040517fe602df0500000000000000000000000000000000000000000000000000000000815260040161073d9190610e58565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036107b85760006040517f94280d620000000000000000000000000000000000000000000000000000000081526004016107af9190610e58565b60405180910390fd5b81600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555080156108a5578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161089c9190610ca0565b60405180910390a35b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036108fd5780600260008282546108f19190610ea2565b925050819055506109d0565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905081811015610989578381836040517fe450d38c00000000000000000000000000000000000000000000000000000000815260040161098093929190610e21565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610a195780600260008282540392505081905550610a66565b806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610ac39190610ca0565b60405180910390a3505050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610b0a578082015181840152602081019050610aef565b60008484015250505050565b6000601f19601f8301169050919050565b6000610b3282610ad0565b610b3c8185610adb565b9350610b4c818560208601610aec565b610b5581610b16565b840191505092915050565b60006020820190508181036000830152610b7a8184610b27565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610bb282610b87565b9050919050565b610bc281610ba7565b8114610bcd57600080fd5b50565b600081359050610bdf81610bb9565b92915050565b6000819050919050565b610bf881610be5565b8114610c0357600080fd5b50565b600081359050610c1581610bef565b92915050565b60008060408385031215610c3257610c31610b82565b5b6000610c4085828601610bd0565b9250506020610c5185828601610c06565b9150509250929050565b60008115159050919050565b610c7081610c5b565b82525050565b6000602082019050610c8b6000830184610c67565b92915050565b610c9a81610be5565b82525050565b6000602082019050610cb56000830184610c91565b92915050565b600080600060608486031215610cd457610cd3610b82565b5b6000610ce286828701610bd0565b9350506020610cf386828701610bd0565b9250506040610d0486828701610c06565b9150509250925092565b600060ff82169050919050565b610d2481610d0e565b82525050565b6000602082019050610d3f6000830184610d1b565b92915050565b600060208284031215610d5b57610d5a610b82565b5b6000610d6984828501610bd0565b91505092915050565b60008060408385031215610d8957610d88610b82565b5b6000610d9785828601610bd0565b9250506020610da885828601610bd0565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610df957607f821691505b602082108103610e0c57610e0b610db2565b5b50919050565b610e1b81610ba7565b82525050565b6000606082019050610e366000830186610e12565b610e436020830185610c91565b610e506040830184610c91565b949350505050565b6000602082019050610e6d6000830184610e12565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610ead82610be5565b9150610eb883610be5565b9250828201905080821115610ed057610ecf610e73565b5b9291505056fea264697066735822122066f3150dcb13e780c64c41be4ef510920985e6da1ca4ed2d29872d7648a240f564736f6c634300081a0033"; // Replace with your bytecode
const ERC20_ABI =[
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "symbol",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "initialSupply",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_metadataURI",
				"type": "string"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "allowance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "metadataURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];


// Paths to save generated wallets and order book
const NEW_WALLET_FILE = "New_wallet.json";
const ORDER_BOOK_FILE = "order_book.json";

// Initialize the bot
const bot = new Telegraf(BOT_TOKEN);

// In-memory user steps
const userSteps = {};

// Load or initialize the order book
const loadOrderBook = () => {
  try {
    if (fs.existsSync(ORDER_BOOK_FILE)) {
      return JSON.parse(fs.readFileSync(ORDER_BOOK_FILE, "utf8"));
    }
    return [];
  } catch (error) {
    console.error("❌ Error loading order book:", error);
    return [];
  }
};

const saveOrderBook = (orderBook) => {
  try {
    fs.writeFileSync(ORDER_BOOK_FILE, JSON.stringify(orderBook, null, 4));
    console.log("📚 Order book updated by Daome Meme Bot.");
  } catch (error) {
    console.error("❌ Error saving order book:", error);
  }
};

let orderBook = loadOrderBook();

// Save a new wallet to JSON
const saveNewWallet = (privateKey, publicAddress) => {
  try {
    const walletData = { privateKey, publicAddress };
    let wallets = [];
    if (fs.existsSync(NEW_WALLET_FILE)) {
      wallets = JSON.parse(fs.readFileSync(NEW_WALLET_FILE, "utf8"));
    }
    wallets.push(walletData);
    fs.writeFileSync(NEW_WALLET_FILE, JSON.stringify(wallets, null, 4));
    console.log("💾 New wallet saved by Daome Meme Bot:", walletData);
  } catch (error) {
    console.error("❌ Error saving new wallet:", error);
  }
};

const axios = require("axios");

// Define your Pinata API keys
const PINATA_API_KEY = "1449febbb19f35611046";
const PINATA_SECRET_API_KEY = "32d1e1e4f72b623b879cb1f0c02ac3d6846648586abe4fe22f0fc58f72d09d67";

const STATIC_IMAGE_URI = "https://gray-rare-salamander-705.mypinata.cloud/ipfs/QmNfNeSnC3VSH6TKQx6WPFLbcHhyyUQqcnrmjQc5vDYHUz";


/*  const uploadToIPFS = async (fileUrl) => {
    try {
      // Step 1: Fetch the file as a binary stream
      const response = await axios.get(fileUrl, { responseType: "stream" });
  
      // Step 2: Create FormData and append the file stream
      const formData = new FormData();
      formData.append("file", response.data, "token_image.jpg"); // Add a filename
  
      // Step 3: Send the file to Pinata
      const pinataResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          },
        }
      );
  
      // Return the IPFS URL for the uploaded file
      return `https://gateway.pinata.cloud/ipfs/${pinataResponse.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading to IPFS:", error.message);
      if (error.response) {
        console.error("Error Response Data:", error.response.data);
      }
      throw new Error("Failed to upload to IPFS.");
    }
}; */

const uploadMetadataToIPFS = async (metadata) => {
    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        metadata,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          },
        }
      );
  
      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading metadata to IPFS:", error.message);
      throw new Error("Failed to upload token metadata to IPFS.");
    }
};

// Start token creation process
bot.command("create_token", (ctx) => {
    const chatId = ctx.chat.id;
    userSteps[chatId] = {};
    ctx.reply("📜 What’s the epic name of your token, fam?");
});
  
// Handle text inputs for token details
bot.on("text", (ctx) => {
    const chatId = ctx.chat.id;
    const currentStep = userSteps[chatId];
  
    if (!currentStep) {
      return ctx.reply("❌ Please start by using /create_token.");
    }
  
    if (!currentStep.name) {
      userSteps[chatId].name = ctx.message.text;
      return ctx.reply("💡 Drop the ticker symbol for your token!");
    }
  
    if (!currentStep.symbol) {
      userSteps[chatId].symbol = ctx.message.text;
  
      // Skip image upload and use static URI
      userSteps[chatId].imageURI = STATIC_IMAGE_URI;
  
      return ctx.reply("🔑 Please provide your private key to fund the transaction.");
    }
  
    if (!currentStep.payerPrivateKey) {
      userSteps[chatId].payerPrivateKey = ctx.message.text.trim();
      createToken(ctx, userSteps[chatId]);
      delete userSteps[chatId]; // Clear user data after token creation
    }
});

/* bot.on("photo", async (ctx) => {
    const chatId = ctx.chat.id;
    const currentStep = userSteps[chatId];
  
    if (!currentStep || !currentStep.name || !currentStep.symbol) {
      return ctx.reply("⚠️ Please complete the previous steps (name and symbol) before uploading a photo!");
    }
  
    try {
      // Step 1: Get the file ID of the highest resolution photo
      const fileId = ctx.message.photo.pop().file_id;
  
      // Step 2: Get the file URL from Telegram
      const fileLink = await ctx.telegram.getFileLink(fileId);
  
      // Step 3: Upload the photo to IPFS
      const imageURI = await uploadToIPFS(fileLink.href);
  
      // Step 4: Save the IPFS URI
      userSteps[chatId].imageURI = imageURI;
      ctx.reply("✅ Image uploaded successfully! Now, please provide your private key to fund the transaction.");
    } catch (error) {
      console.error("Error uploading photo:", error);
      ctx.reply("❌ Failed to process your photo. Please try again.");
    }
});  */
  
  

const createToken = async (ctx, { name, symbol, payerPrivateKey, imageURI }) => {
    try {
      const payerAccount = web3.eth.accounts.privateKeyToAccount(payerPrivateKey);
      const payerAddress = payerAccount.address;
  
      // Generate a new wallet for token creation
      const newWallet = web3.eth.accounts.create();
      const generatedPrivateKey = newWallet.privateKey;
      const generatedPublicAddress = newWallet.address;
  
      // Save the generated wallet
      saveNewWallet(generatedPrivateKey, generatedPublicAddress);
  
      // Step 1: Fund the generated wallet
      const gasPrice = await web3.eth.getGasPrice();
      const fundTx = {
        from: payerAddress,
        to: generatedPublicAddress,
        value: web3.utils.toWei("1", "ether"), // 1 AMB
        gas: 21000,
        gasPrice,
        chainId: await web3.eth.getChainId(),
      };
  
      const signedFundTx = await web3.eth.accounts.signTransaction(fundTx, payerPrivateKey);
      await web3.eth.sendSignedTransaction(signedFundTx.rawTransaction);
  
      ctx.reply(
        `✅ 1 AMB sent from <code>${payerAddress}</code> to <code>${generatedPublicAddress}</code> for gas fees!`,
        { parse_mode: "HTML" }
      );
  
      // Step 2: Prepare metadata
      const totalSupply = 1_000_000_000; // Default total supply
      const tokenMetadata = {
        name,
        symbol,
        image: imageURI, // Use the static image URI
        description: "A legendary token created with Daome Meme Bot.",
        attributes: [
          { trait_type: "Creator", value: "Daome Meme Bot" },
          { trait_type: "Network", value: "AirDAO" },
          { trait_type: "Total Supply", value: totalSupply },
        ],
      };
  
      // Upload metadata JSON to IPFS
      const metadataURI = await uploadMetadataToIPFS(tokenMetadata);
  
      // Step 3: Deploy the token contract
      const contract = new web3.eth.Contract(ERC20_ABI);
      const tx = contract.deploy({
        data: CONTRACT_BYTECODE,
        arguments: [name, symbol, totalSupply.toString(), metadataURI], // Pass metadata URI to the constructor
      });
  
      const deployGas = await tx.estimateGas({ from: generatedPublicAddress });
      const deployTx = {
        from: generatedPublicAddress,
        data: tx.encodeABI(),
        gas: deployGas,
        gasPrice,
        chainId: await web3.eth.getChainId(),
      };
  
      const signedDeployTx = await web3.eth.accounts.signTransaction(deployTx, generatedPrivateKey);
      const receipt = await web3.eth.sendSignedTransaction(signedDeployTx.rawTransaction);
  
      const contractAddress = receipt.contractAddress;
  
      // Step 4: Save token details to the order book
      const tokenDetails = {
        name,
        symbol,
        imageURI,
        metadataURI,
        totalSupply,
        contractAddress,
        mintedTo: generatedPublicAddress,
        transactionHash: receipt.transactionHash,
      };
  
      orderBook.push(tokenDetails);
      saveOrderBook(orderBook);
  
      // Reply with the token details
      ctx.reply(
        `🎉 Your token is live with metadata! 🚀\n\n` +
          `🏷️ <b>Name:</b> <code>${name}</code>\n` +
          `🔖 <b>Symbol:</b> <code>${symbol}</code>\n` +
          `📦 <b>Total Supply:</b> <code>${totalSupply.toLocaleString()}</code>\n` +
          `🏠 <b>Contract Address:</b> <code>${contractAddress}</code>\n` +
          `🌐 <b>Metadata URI:</b> <code>${metadataURI}</code>\n` +
          `🔗 <b>Transaction Hash:</b> <code>${receipt.transactionHash}</code>\n\n` +
          `✨ Powered by Daome Meme Bot!`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error("Error creating token:", error);
      ctx.reply(`❌ Oops! Daome Meme Bot encountered an error: ${error.message}`);
    }
};
  
// Start the bot
bot.launch().then(() => console.log("✨ Daome Meme Bot is live and memeing! 🚀"));