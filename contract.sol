// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract ERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint public totalSupply = 1_000_000_000 ether;
    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);

    constructor(string memory _name, string memory _symbol, address bondingCurve) {
        name = _name;
        symbol = _symbol;
        balanceOf[bondingCurve] = totalSupply;
        emit Transfer(address(0), bondingCurve, totalSupply);
    }

    function transfer(address recipient, uint amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint amount) internal {
        require(balanceOf[sender] >= amount, "ERC20: INSUFFICIENT_BALANCE");
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }
}

contract BondingCurve {
    address public token;
    uint public reserve;
    uint public slope = 1e18;
    uint public feePercent = 5;
    address public feeTo = 0xa69871BaCe523e353a86117Fb336FCd5942b8cf6;
    uint public initialPrice = 2e13; // Starting price 0.00002 AMB
    uint public initialMarketCap = 20000 ether; // 20,000 AMB Market Cap

    event TokensPurchased(address indexed buyer, uint amount, uint cost);
    event TokensBurned(address indexed seller, uint amount, uint refund);

    function initialize(address _token) external {
        require(token == address(0), "BondingCurve: ALREADY_INITIALIZED");
        token = _token;
    }

    function buyTokens() external payable {
        uint amount = (msg.value * 1e18) / initialPrice;
        require(amount > 0, "Insufficient amount");
        uint cost = (amount * initialPrice) / 1e18;
        uint fee = (cost * feePercent) / 100;
        uint netCost = cost - fee;
        reserve += netCost;
        (bool success, ) = feeTo.call{value: fee, gas: 5000}("");
        require(success, "Fee transfer failed");
        ERC20(token).transfer(msg.sender, amount);
        emit TokensPurchased(msg.sender, amount, cost);
    }

    function calculateBuyPrice(uint amount) public view returns (uint) {
        return (amount * initialPrice) / 1e18;
    }
}

contract DAOMEFactory {
    address public feeTo = 0xa69871BaCe523e353a86117Fb336FCd5942b8cf6;
    address public feeToSetter;
    uint public creationFee = 1 ether;

    mapping(address => address) public tokenToBondingCurve;
    mapping(address => address) public tokenToBurnCurve;
    address[] public allTokens;

    event DeploymentFailed(string reason);
    event TokenCreated(address indexed token, address bondingCurve, address burnCurve);

    constructor(address _feeToSetter) {
        require(_feeToSetter != address(0), "FeeToSetter cannot be zero address");
        feeToSetter = _feeToSetter;
        emit DeploymentFailed("Factory deployed successfully");
    }

    function createToken(
        string memory name, 
        string memory symbol
    ) external payable returns (address token, address bondingCurve, address burnCurve) {
        require(msg.value >= creationFee, 'AMMFactory: INSUFFICIENT_CREATION_FEE');

        // Deploy Bonding and Burn Curves
        BondingCurve newBondingCurve = new BondingCurve();
        BondingCurve newBurnCurve = new BondingCurve();

        // Deploy ERC-20 token and assign to bonding curve
        ERC20 newToken = new ERC20(name, symbol, address(newBondingCurve));
        token = address(newToken);
        
        newBondingCurve.initialize(token);
        newBurnCurve.initialize(token);
        bondingCurve = address(newBondingCurve);
        burnCurve = address(newBurnCurve);

        // Store mappings
        tokenToBondingCurve[token] = bondingCurve;
        tokenToBurnCurve[token] = burnCurve;
        allTokens.push(token);

        emit TokenCreated(token, bondingCurve, burnCurve);

        (bool success, ) = payable(feeTo).call{value: msg.value, gas: 5000}("");
        require(success, "Fee transfer failed");

        // Return created token addresses
        return (token, bondingCurve, burnCurve);
    }
} 
