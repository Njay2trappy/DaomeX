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

    function transferFrom(address sender, address recipient, uint amount) external returns (bool) {
        require(allowance[sender][msg.sender] >= amount, "ERC20: Insufficient allowance");
        _transfer(sender, recipient, amount);
        allowance[sender][msg.sender] -= amount;
        return true;
    }

    function _transfer(address sender, address recipient, uint amount) internal {
        require(balanceOf[sender] >= amount, "ERC20: Insufficient balance");
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }
}

contract BondingCurve {
    address public token;
    uint public virtualReserve = 20000 ether;  // Virtual liquidity
    uint public slope = 1e18;
    uint public feePercent = 5;
    address public feeTo = 0xa69871BaCe523e353a86117Fb336FCd5942b8cf6;
    uint public initialPrice = 2e13; // 0.00002 AMB
    uint public tokenPrice = initialPrice;
    uint public tokenReserve = 1_000_000_000 ether;  // Total token supply in bonding curve

    event TokensPurchased(address indexed buyer, uint amount, uint cost);
    event TokensBurned(address indexed seller, uint amount, uint refund);

    function initialize(address _token) external {
        require(token == address(0), "BondingCurve: Already initialized");
        token = _token;
    }

    function updatePrice() internal {
        tokenPrice = (virtualReserve * 1e18) / tokenReserve;
    }

    function getMarketCap() external view returns (uint) {
        return virtualReserve;  // Market cap directly reflects the virtual reserve
    }

    function buyTokens() external payable {
        uint fee = (msg.value * feePercent) / (100 - feePercent);
        uint totalCost = msg.value;
        uint netAmount = totalCost - fee;

        require(tokenReserve > 0, "BondingCurve: No tokens in reserve");

        // Calculate price with 2% premium
        uint buyPrice = (tokenPrice * 102) / 100;  // 2% premium applied

        // Calculate the amount of tokens the user will receive
        uint amount = (netAmount * 1e18) / buyPrice;

        require(amount > 0, "BondingCurve: Insufficient ETH to buy");
        require(tokenReserve >= amount, "BondingCurve: Insufficient token reserve");

        // Calculate post-purchase state
        uint expectedTokenReserve = tokenReserve - amount;
        uint expectedVirtualReserve = virtualReserve + netAmount;
        uint expectedPrice = (expectedVirtualReserve * 1e18) / expectedTokenReserve;

        // Transfer purchased tokens to the user
        ERC20(token).transfer(msg.sender, amount);

        // Transfer fee to the designated address
        (bool success, ) = feeTo.call{value: fee, gas: 5000}("");
        require(success, "Fee transfer failed");

        emit TokensPurchased(msg.sender, amount, totalCost);

        // Only update reserves after a successful transaction
        virtualReserve = expectedVirtualReserve;
        tokenReserve = expectedTokenReserve;

        // Set the token price directly to the buy price (reflecting the 2% premium)
        tokenPrice = expectedPrice;
    }


    function sellTokens(uint amount) external {
        require(amount > 0, "Amount must be greater than zero");

        uint userBalance = ERC20(token).balanceOf(msg.sender);
        require(userBalance > 0, "No tokens to sell");
        require(amount <= userBalance, "Insufficient funds");

        // Calculate price with 2% penalty (sell at 98% of the current price)
        uint sellPrice = (tokenPrice * 98) / 100;  // 2% penalty applied
        uint refund = (amount * sellPrice) / 1e18;
        uint fee = (refund * feePercent) / 100;
        uint netRefund = refund - fee;

        require(virtualReserve >= refund, "Insufficient virtual reserve");

        // Calculate post-sale state
        uint expectedTokenReserve = tokenReserve + amount;
        uint expectedVirtualReserve = virtualReserve - netRefund;  // Use netRefund, not refund

        // Calculate expected bonding curve price (without penalty)
        uint expectedPrice = (expectedVirtualReserve * 1e18) / expectedTokenReserve;

        // Transfer tokens from user to bonding curve reserve
        ERC20(token).transferFrom(msg.sender, address(this), amount);

        // Transfer net refund to the user
        (bool success, ) = payable(msg.sender).call{value: netRefund, gas: 5000}("");
        require(success, "Refund transfer failed");

        // Transfer fee to the designated address
        (success, ) = feeTo.call{value: fee, gas: 5000}("");
        require(success, "Fee transfer failed");

        emit TokensBurned(msg.sender, amount, refund);

        // Update reserves and price only after a successful transaction
        virtualReserve = expectedVirtualReserve;
        tokenReserve = expectedTokenReserve;
        tokenPrice = expectedPrice;
    }

}

contract DAOMEFactory {
    address public feeTo = 0xa69871BaCe523e353a86117Fb336FCd5942b8cf6;
    address public feeToSetter;
    uint public creationFee = 1 ether;
    mapping(address => address) public tokenToBondingCurve;
    address[] public allTokens;

    event TokenCreated(address indexed token, address bondingCurve);

    constructor(address _feeToSetter) {
        require(_feeToSetter != address(0), "FeeToSetter cannot be zero address");
        feeToSetter = _feeToSetter;
    }

    function createToken(string memory name, string memory symbol) external payable returns (address token, address bondingCurve) {
        require(msg.value >= creationFee, 'Factory: Insufficient creation fee');

        BondingCurve newBondingCurve = new BondingCurve();
        ERC20 newToken = new ERC20(name, symbol, address(newBondingCurve));
        token = address(newToken);
        
        newBondingCurve.initialize(token);

        bondingCurve = address(newBondingCurve);

        tokenToBondingCurve[token] = bondingCurve;
        allTokens.push(token);

        emit TokenCreated(token, bondingCurve);

        payable(feeTo).transfer(msg.value);
    }
}
