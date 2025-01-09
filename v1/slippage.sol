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
    address public feeTo = 0xFB9d8C2218e310a40276d1C6f6D0cF3f725fc0d7;
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


    function buyTokens(uint slippageTolerancePercent) external payable {
        uint fee = (msg.value * feePercent) / 100;
        uint totalCost = msg.value;
        uint netAmount = totalCost - fee;

        require(tokenReserve > 0, "BondingCurve: No tokens in reserve");

        // Calculate expected virtual reserve after purchase
        uint expectedVirtualReserve = virtualReserve + netAmount;
        uint expectedPrice = (expectedVirtualReserve * 1e18) / tokenReserve;

        // Calculate the amount of tokens at the expected price
        uint amount = (netAmount * 1e18) / expectedPrice;

        // Apply slippage check: ensure the new price does not exceed tolerance
        uint maxAcceptablePrice = (tokenPrice * (100 + slippageTolerancePercent)) / 100;
        require(expectedPrice <= maxAcceptablePrice, "Slippage too high");

        require(amount > 0, "Insufficient ETH to buy");
        require(tokenReserve >= amount, "Insufficient token reserve");

        // Transfer purchased tokens to the user
        ERC20(token).transfer(msg.sender, amount);

        // Update reserves and price
        virtualReserve = expectedVirtualReserve;
        tokenReserve -= amount;
        tokenPrice = expectedPrice;

        // Transfer fee
        (bool success, ) = feeTo.call{value: fee, gas: 5000}("");
        require(success, "Fee transfer failed");

        emit TokensPurchased(msg.sender, amount, totalCost);
    }

    function sellTokens(uint amount, uint slippagePercent) external {
        require(amount > 0, "Amount must be greater than zero");

        uint userBalance = ERC20(token).balanceOf(msg.sender);
        require(userBalance >= amount, "Insufficient token balance");

        // Calculate the expected token reserve after the sale
        uint expectedTokenReserve = tokenReserve + amount;

        // Calculate the sell price using the expected token reserve and current virtual reserve
        uint sellPrice = (virtualReserve * 1e18) / expectedTokenReserve;

        // Apply a 2% deduction to get the expected price (98% of sellPrice)
        uint expectedPrice = (sellPrice * 98) / 100;

        // Calculate the minimum acceptable price based on slippage
        uint minAcceptablePrice = (tokenPrice * (100 - slippagePercent)) / 100;

        // Ensure the expected price does not exceed the current price adjusted by slippage
        require(expectedPrice >= minAcceptablePrice, "Slippage too high");

        // Calculate the amount of AMB the user will receive
        uint refund = (amount * expectedPrice) / 1e18;

        require(virtualReserve >= refund, "Insufficient virtual reserve");

        // Calculate fee directly from the refund
        uint fee = (refund * feePercent) / 100;
        uint netRefund = refund - fee;

        // Transfer tokens from the user to the bonding curve
        ERC20(token).transferFrom(msg.sender, address(this), amount);

        // Transfer AMB (after fee deduction) to the user
        (bool success, ) = payable(msg.sender).call{value: netRefund, gas: 5000}("");
        require(success, "Refund transfer failed");

        // Transfer fee to the designated address
        (success, ) = feeTo.call{value: fee, gas: 5000}("");
        require(success, "Fee transfer failed");

        emit TokensBurned(msg.sender, amount, netRefund);

        // Update reserves and token price after a successful transaction
        tokenReserve = expectedTokenReserve;
        virtualReserve -= refund;  // Deduct full refund (before fee)
        
        // Update the token price to reflect the expected price (98% of sell price)
        tokenPrice = expectedPrice;
    }


}

contract DAOMEFactory {
    address public feeTo = 0x65c4088F90D40FA1d1F7e286E45abc66dcEa01ff;
    address public feeToSetter;
    uint public creationFee = 100 ether;
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
