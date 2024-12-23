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
const CONTRACT_BYTECODE = "608060405234801561001057600080fd5b506040516119b83803806119b8833981810160405281019061003291906104f3565b828281600390816100439190610795565b5080600490816100539190610795565b50505061008a3361006861009260201b60201c565b600a61007491906109d6565b8361007f9190610a21565b61009b60201b60201c565b505050610b54565b60006012905090565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361010d5760006040517fec442f050000000000000000000000000000000000000000000000000000000081526004016101049190610aa4565b60405180910390fd5b61011f6000838361012360201b60201c565b5050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036101755780600260008282546101699190610abf565b92505081905550610248565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905081811015610201578381836040517fe450d38c0000000000000000000000000000000000000000000000000000000081526004016101f893929190610b02565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361029157806002600082825403925050819055506102de565b806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161033b9190610b39565b60405180910390a3505050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6103af82610366565b810181811067ffffffffffffffff821117156103ce576103cd610377565b5b80604052505050565b60006103e1610348565b90506103ed82826103a6565b919050565b600067ffffffffffffffff82111561040d5761040c610377565b5b61041682610366565b9050602081019050919050565b60005b83811015610441578082015181840152602081019050610426565b60008484015250505050565b600061046061045b846103f2565b6103d7565b90508281526020810184848401111561047c5761047b610361565b5b610487848285610423565b509392505050565b600082601f8301126104a4576104a361035c565b5b81516104b484826020860161044d565b91505092915050565b6000819050919050565b6104d0816104bd565b81146104db57600080fd5b50565b6000815190506104ed816104c7565b92915050565b60008060006060848603121561050c5761050b610352565b5b600084015167ffffffffffffffff81111561052a57610529610357565b5b6105368682870161048f565b935050602084015167ffffffffffffffff81111561055757610556610357565b5b6105638682870161048f565b9250506040610574868287016104de565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806105d057607f821691505b6020821081036105e3576105e2610589565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b60006008830261064b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8261060e565b610655868361060e565b95508019841693508086168417925050509392505050565b6000819050919050565b600061069261068d610688846104bd565b61066d565b6104bd565b9050919050565b6000819050919050565b6106ac83610677565b6106c06106b882610699565b84845461061b565b825550505050565b600090565b6106d56106c8565b6106e08184846106a3565b505050565b5b81811015610704576106f96000826106cd565b6001810190506106e6565b5050565b601f8211156107495761071a816105e9565b610723846105fe565b81016020851015610732578190505b61074661073e856105fe565b8301826106e5565b50505b505050565b600082821c905092915050565b600061076c6000198460080261074e565b1980831691505092915050565b6000610785838361075b565b9150826002028217905092915050565b61079e8261057e565b67ffffffffffffffff8111156107b7576107b6610377565b5b6107c182546105b8565b6107cc828285610708565b600060209050601f8311600181146107ff57600084156107ed578287015190505b6107f78582610779565b86555061085f565b601f19841661080d866105e9565b60005b8281101561083557848901518255600182019150602085019450602081019050610810565b86831015610852578489015161084e601f89168261075b565b8355505b6001600288020188555050505b505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60008160011c9050919050565b6000808291508390505b60018511156108ed578086048111156108c9576108c8610867565b5b60018516156108d85780820291505b80810290506108e685610896565b94506108ad565b94509492505050565b60008261090657600190506109c2565b8161091457600090506109c2565b816001811461092a576002811461093457610963565b60019150506109c2565b60ff84111561094657610945610867565b5b8360020a91508482111561095d5761095c610867565b5b506109c2565b5060208310610133831016604e8410600b84101617156109985782820a90508381111561099357610992610867565b5b6109c2565b6109a584848460016108a3565b925090508184048111156109bc576109bb610867565b5b81810290505b9392505050565b600060ff82169050919050565b60006109e1826104bd565b91506109ec836109c9565b9250610a197fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff84846108f6565b905092915050565b6000610a2c826104bd565b9150610a37836104bd565b9250828202610a45816104bd565b91508282048414831517610a5c57610a5b610867565b5b5092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610a8e82610a63565b9050919050565b610a9e81610a83565b82525050565b6000602082019050610ab96000830184610a95565b92915050565b6000610aca826104bd565b9150610ad5836104bd565b9250828201905080821115610aed57610aec610867565b5b92915050565b610afc816104bd565b82525050565b6000606082019050610b176000830186610a95565b610b246020830185610af3565b610b316040830184610af3565b949350505050565b6000602082019050610b4e6000830184610af3565b92915050565b610e5580610b636000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063313ce56711610066578063313ce5671461013457806370a082311461015257806395d89b4114610182578063a9059cbb146101a0578063dd62ed3e146101d057610093565b806306fdde0314610098578063095ea7b3146100b657806318160ddd146100e657806323b872dd14610104575b600080fd5b6100a0610200565b6040516100ad9190610aa9565b60405180910390f35b6100d060048036038101906100cb9190610b64565b610292565b6040516100dd9190610bbf565b60405180910390f35b6100ee6102b5565b6040516100fb9190610be9565b60405180910390f35b61011e60048036038101906101199190610c04565b6102bf565b60405161012b9190610bbf565b60405180910390f35b61013c6102ee565b6040516101499190610c73565b60405180910390f35b61016c60048036038101906101679190610c8e565b6102f7565b6040516101799190610be9565b60405180910390f35b61018a61033f565b6040516101979190610aa9565b60405180910390f35b6101ba60048036038101906101b59190610b64565b6103d1565b6040516101c79190610bbf565b60405180910390f35b6101ea60048036038101906101e59190610cbb565b6103f4565b6040516101f79190610be9565b60405180910390f35b60606003805461020f90610d2a565b80601f016020809104026020016040519081016040528092919081815260200182805461023b90610d2a565b80156102885780601f1061025d57610100808354040283529160200191610288565b820191906000526020600020905b81548152906001019060200180831161026b57829003601f168201915b5050505050905090565b60008061029d61047b565b90506102aa818585610483565b600191505092915050565b6000600254905090565b6000806102ca61047b565b90506102d7858285610495565b6102e2858585610529565b60019150509392505050565b60006012905090565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60606004805461034e90610d2a565b80601f016020809104026020016040519081016040528092919081815260200182805461037a90610d2a565b80156103c75780601f1061039c576101008083540402835291602001916103c7565b820191906000526020600020905b8154815290600101906020018083116103aa57829003601f168201915b5050505050905090565b6000806103dc61047b565b90506103e9818585610529565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b610490838383600161061d565b505050565b60006104a184846103f4565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146105235781811015610513578281836040517ffb8f41b200000000000000000000000000000000000000000000000000000000815260040161050a93929190610d6a565b60405180910390fd5b6105228484848403600061061d565b5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160361059b5760006040517f96c6fd1e0000000000000000000000000000000000000000000000000000000081526004016105929190610da1565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361060d5760006040517fec442f050000000000000000000000000000000000000000000000000000000081526004016106049190610da1565b60405180910390fd5b6106188383836107f4565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff160361068f5760006040517fe602df050000000000000000000000000000000000000000000000000000000081526004016106869190610da1565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036107015760006040517f94280d620000000000000000000000000000000000000000000000000000000081526004016106f89190610da1565b60405180910390fd5b81600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555080156107ee578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516107e59190610be9565b60405180910390a35b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160361084657806002600082825461083a9190610deb565b92505081905550610919565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050818110156108d2578381836040517fe450d38c0000000000000000000000000000000000000000000000000000000081526004016108c993929190610d6a565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361096257806002600082825403925050819055506109af565b806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610a0c9190610be9565b60405180910390a3505050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610a53578082015181840152602081019050610a38565b60008484015250505050565b6000601f19601f8301169050919050565b6000610a7b82610a19565b610a858185610a24565b9350610a95818560208601610a35565b610a9e81610a5f565b840191505092915050565b60006020820190508181036000830152610ac38184610a70565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610afb82610ad0565b9050919050565b610b0b81610af0565b8114610b1657600080fd5b50565b600081359050610b2881610b02565b92915050565b6000819050919050565b610b4181610b2e565b8114610b4c57600080fd5b50565b600081359050610b5e81610b38565b92915050565b60008060408385031215610b7b57610b7a610acb565b5b6000610b8985828601610b19565b9250506020610b9a85828601610b4f565b9150509250929050565b60008115159050919050565b610bb981610ba4565b82525050565b6000602082019050610bd46000830184610bb0565b92915050565b610be381610b2e565b82525050565b6000602082019050610bfe6000830184610bda565b92915050565b600080600060608486031215610c1d57610c1c610acb565b5b6000610c2b86828701610b19565b9350506020610c3c86828701610b19565b9250506040610c4d86828701610b4f565b9150509250925092565b600060ff82169050919050565b610c6d81610c57565b82525050565b6000602082019050610c886000830184610c64565b92915050565b600060208284031215610ca457610ca3610acb565b5b6000610cb284828501610b19565b91505092915050565b60008060408385031215610cd257610cd1610acb565b5b6000610ce085828601610b19565b9250506020610cf185828601610b19565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610d4257607f821691505b602082108103610d5557610d54610cfb565b5b50919050565b610d6481610af0565b82525050565b6000606082019050610d7f6000830186610d5b565b610d8c6020830185610bda565b610d996040830184610bda565b949350505050565b6000602082019050610db66000830184610d5b565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610df682610b2e565b9150610e0183610b2e565b9250828201905080821115610e1957610e18610dbc565b5b9291505056fea26469706673582212201874aa931338c2c618f148fc38dd9e90f2c9f95eaa7d4b1ab6181aa44a858b6d64736f6c634300081a0033"; // Replace with your bytecode
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

// Start command
bot.start((ctx) => {
  ctx.reply("👋 YO YO YO! Welcome to Daome Meme Bot! Ready to create some legendary tokens? Use /create_token to get the meme magic started! 🚀✨");
});

// Create token command
bot.command("create_token", (ctx) => {
  const chatId = ctx.chat.id;
  userSteps[chatId] = {};
  ctx.reply("📜 What’s the epic name of your token, fam?");
});

// Token name step
bot.on("text", (ctx) => {
  const chatId = ctx.chat.id;
  const currentStep = userSteps[chatId];

  if (!currentStep || !currentStep.name) {
    userSteps[chatId].name = ctx.message.text;
    return ctx.reply("💡 Drop the ticker symbol for your token, something iconic and meme-worthy!");
  }

  if (!currentStep.symbol) {
    userSteps[chatId].symbol = ctx.message.text;
    return ctx.reply("🔑 YO YO YO! Paste your private key (payer address) to fund the generated wallet.");
  }

  if (!currentStep.payerPrivateKey) {
    userSteps[chatId].payerPrivateKey = ctx.message.text.trim();
    createToken(ctx, userSteps[chatId]);
    delete userSteps[chatId];
  }
});

// Create token function
const createToken = async (ctx, { name, symbol, payerPrivateKey }) => {
  try {
    const payerAccount = web3.eth.accounts.privateKeyToAccount(payerPrivateKey);
    const payerAddress = payerAccount.address;

    // Generate new wallet for token creation
    const newWallet = web3.eth.accounts.create();
    const generatedPrivateKey = newWallet.privateKey;
    const generatedPublicAddress = newWallet.address;

    // Save the generated wallet
    saveNewWallet(generatedPrivateKey, generatedPublicAddress);

    // Step 1: Fund the generated wallet with 1 AMB
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

    ctx.reply(`✅ 1 AMB dropped from <code>${payerAddress}</code> to <code>${generatedPublicAddress}</code> for those spicy gas fees! 🔥`, { parse_mode: "HTML" });

    // Step 2: Create the token using the generated wallet
    const totalSupply = 1_000_000_000; // Default supply (1 billion)
    const price = 0.000005; // Listing price
    const marketCap = 5000; // Default market cap

    const contract = new web3.eth.Contract(ERC20_ABI);
    const tx = contract.deploy({
      data: CONTRACT_BYTECODE,
      arguments: [name, symbol, totalSupply],
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

    // Step 3: Save to order book
    const tokenDetails = {
      name,
      symbol,
      totalSupply,
      price,
      marketCap,
      contractAddress,
      mintedTo: generatedPublicAddress,
      transactionHash: receipt.transactionHash,
    };
    orderBook.push(tokenDetails);
    saveOrderBook(orderBook);

    ctx.reply(`🎉 Meme Magic Complete! Your legendary token is live! 🚀\n` +
      `🏠 Contract Address: <code>${contractAddress}</code>\n` +
      `📦 Total Supply: <code>${totalSupply}</code>\n` +
      `🔥 Transaction Hash: <code>${receipt.transactionHash}</code>\n\n` +
      `✨ Powered by Daome Meme Bot! 🎭`, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error creating token:", error);
    ctx.reply(`❌ Oops! Daome Meme Bot hit a snag: ${error.message}`);
  }
};

// Start the bot
bot.launch().then(() => console.log("✨ Daome Meme Bot is live and memeing! 🚀"));