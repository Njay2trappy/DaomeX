// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

contract DAOMEFactory {
    address public feeTo = 0xa69871BaCe523e353a86117Fb336FCd5942b8cf6;
    address public feeToSetter;
    mapping(address => address) public tokenToBondingCurve;
    mapping(address => address) public tokenToBurnCurve;
    address[] public allTokens;
    uint public creationFee = 100 ether; // 100 AMB for token creation

    event TokenCreated(address indexed token, address bondingCurve, address burnCurve);

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function createToken(string memory name, string memory symbol) external payable returns (address token, address bondingCurve, address burnCurve) {
        require(msg.value >= creationFee, 'AMMFactory: INSUFFICIENT_CREATION_FEE');

        // Deploy Bonding Curve
        BondingCurve newBondingCurve = new BondingCurve();
        BondingCurve newBurnCurve = new BondingCurve();
        
        // Deploy ERC-20 token and assign to bonding curve
        ERC20 newToken = new ERC20(name, symbol, address(newBondingCurve));
        token = address(newToken);
        
        // Initialize bonding and burn curves with token address
        newBondingCurve.initialize(token);
        newBurnCurve.initialize(token);
        bondingCurve = address(newBondingCurve);
        burnCurve = address(newBurnCurve);
        
        // Store mappings of token to bonding and burn curves
        tokenToBondingCurve[token] = bondingCurve;
        tokenToBurnCurve[token] = burnCurve;
        allTokens.push(token);

        emit TokenCreated(token, bondingCurve, burnCurve);
        
        // Transfer creation fee to the fee recipient
        payable(feeTo).transfer(msg.value);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'AMMFactory: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'AMMFactory: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
}

contract ERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint public totalSupply = 1_000_000_000 ether; // 1 billion supply
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
    uint public slope = 1e18; // Linear slope by default
    uint public feePercent = 5; // 5% fee
    address public feeTo = 0xa69871BaCe523e353a86117Fb336FCd5942b8cf6;

    event TokensPurchased(address indexed buyer, uint amount, uint cost);
    event TokensBurned(address indexed seller, uint amount, uint refund);

    function initialize(address _token) external {
        require(token == address(0), "BondingCurve: ALREADY_INITIALIZED");
        token = _token;
    }

    function buyTokens(uint amount) external payable {
        uint cost = calculateBuyPrice(amount);
        require(msg.value >= cost, "Insufficient payment");
        uint fee = (cost * feePercent) / 100;
        uint netCost = cost - fee;
        reserve += netCost;
        payable(feeTo).transfer(fee);
        emit TokensPurchased(msg.sender, amount, cost);
    }

    function sellTokens(uint amount) external {
        uint refund = calculateSellPrice(amount);
        uint fee = (refund * feePercent) / 100;
        uint netRefund = refund - fee;
        reserve -= refund;
        payable(msg.sender).transfer(netRefund);
        payable(feeTo).transfer(fee);
        emit TokensBurned(msg.sender, amount, refund);
    }

    function calculateBuyPrice(uint amount) public view returns (uint) {
        return (slope * (amount));
    }

    function calculateSellPrice(uint amount) public view returns (uint) {
        return (slope * (amount)) / 2; // Smoother sell curve
    }
} 
