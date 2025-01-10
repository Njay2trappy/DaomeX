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
    uint public feePercent = 1; // Fee percentage for buy/sell transactions
    address public feeTo = 0xFB9d8C2218e310a40276d1C6f6D0cF3f725fc0d7;
    uint public initialPrice = 2e13; // 0.00002 AMB
    uint public tokenPrice = initialPrice;
    uint public tokenReserve = 1_000_000_000 ether;  // Total token supply in bonding curve

    event TokensPurchased(address indexed buyer, uint amount, uint totalCost);
    event TokensBurned(address indexed seller, uint amount, uint netRefund);

    function initialize(address _token) external {
        require(token == address(0), "BondingCurve: Already initialized");
        token = _token;
    }

    function updatePrice() internal {
        require(tokenReserve > 0, "BondingCurve: Token reserve must be positive");
        tokenPrice = (virtualReserve * 1e18) / tokenReserve;
    }

    function getMarketCap() external view returns (uint) {
        return virtualReserve; // Market cap directly reflects the virtual reserve
    }

    function buyTokens(uint slippageTolerancePercent) external payable {
        require(msg.value > 0, "BondingCurve: ETH required for purchase");
        require(tokenReserve > 0, "BondingCurve: No tokens in reserve");

        uint fee = (msg.value * feePercent) / 100;
        uint netAmount = msg.value - fee;

        // Calculate expected virtual reserve and price
        uint expectedVirtualReserve = virtualReserve + netAmount;
        uint expectedPrice = (expectedVirtualReserve * 1e18) / tokenReserve;

        // Apply slippage check
        uint maxAcceptablePrice = (tokenPrice * (100 + slippageTolerancePercent)) / 100;
        require(expectedPrice <= maxAcceptablePrice, "BondingCurve: Slippage too high");

        // Calculate token amount
        uint amount = (netAmount * 1e18) / expectedPrice;
        require(amount > 0, "BondingCurve: Insufficient ETH to buy tokens");
        require(tokenReserve >= amount, "BondingCurve: Insufficient token reserve");

        // Transfer tokens to buyer
        ERC20(token).transfer(msg.sender, amount);

        // Update reserves and price
        virtualReserve = expectedVirtualReserve;
        tokenReserve -= amount;
        tokenPrice = expectedPrice;

        // Transfer fee to fee recipient
        (bool success, ) = feeTo.call{value: fee}("");
        require(success, "BondingCurve: Fee transfer failed");

        emit TokensPurchased(msg.sender, amount, msg.value);
    }

    function sellTokens(uint amount, uint slippagePercent) external {
        require(amount > 0, "BondingCurve: Amount must be greater than zero");

        uint userBalance = ERC20(token).balanceOf(msg.sender);
        require(userBalance >= amount, "BondingCurve: Insufficient token balance");

        // Calculate sell percentage and fee
        uint sellPercentage = (amount * 1e18) / tokenReserve;
        uint feePercentage = sellPercentage / 1e16; // Increase fee by 0.1% for every 1%
        if (feePercentage > 10) {
            feePercentage = 10; // Cap fee at 10%
        }

        // Calculate sell price and refund
        uint sellPrice = (tokenPrice * (100 - feePercentage)) / 100;
        uint refund = (amount * sellPrice) / 1e18;
        require(refund > 0, "BondingCurve: Refund too small");
        require(virtualReserve >= refund, "BondingCurve: Insufficient virtual reserve");

        // Calculate expected reserves and price
        uint expectedTokenReserve = tokenReserve + amount;
        uint expectedVirtualReserve = virtualReserve - refund;
        uint expectedPrice = (expectedVirtualReserve * 1e18) / expectedTokenReserve;

        // Apply slippage tolerance
        uint maxSlippage = (tokenPrice * (100 - slippagePercent)) / 100;
        require(expectedPrice >= maxSlippage, "BondingCurve: Slippage too high");

        // Transfer tokens from user and refund AMB
        ERC20(token).transferFrom(msg.sender, address(this), amount);

        // Calculate and transfer refund
        uint fee = (refund * feePercent) / 100;
        uint netRefund = refund - fee;

        (bool success, ) = payable(msg.sender).call{value: netRefund}("");
        require(success, "BondingCurve: Refund transfer failed");

        // Transfer fee to fee recipient
        (success, ) = feeTo.call{value: fee}("");
        require(success, "BondingCurve: Fee transfer failed");

        emit TokensBurned(msg.sender, amount, netRefund);

        // Update reserves and token price
        tokenReserve = expectedTokenReserve;
        virtualReserve = expectedVirtualReserve;
        tokenPrice = expectedPrice;
    }
}

contract DAOMEFactory {
    address public feeTo = 0x65c4088F90D40FA1d1F7e286E45abc66dcEa01ff;
    address public feeToSetter;
    uint public creationFee = 100 ether;
    struct TokenDetails {
        string metadataURI;
        string imageURI;
        address bondingCurve;
        string identifier;
    }
    mapping(address => TokenDetails) public tokenDetails;
    address[] public allTokens;

    event TokenCreated(address indexed token, address bondingCurve, string metadataURI, string imageURI, string identifier);

    constructor(address _feeToSetter) {
        require(_feeToSetter != address(0), "FeeToSetter cannot be zero address");
        feeToSetter = _feeToSetter;
    }

    function createToken(string memory name, string memory symbol, string memory metadataURI, string memory imageURI) external payable returns (address token, address bondingCurve, string memory identifier) {
        require(msg.value >= creationFee, "Factory: Insufficient creation fee");

        BondingCurve newBondingCurve = new BondingCurve();
        ERC20 newToken = new ERC20(name, symbol, address(newBondingCurve));
        token = address(newToken);

        newBondingCurve.initialize(token);
        bondingCurve = address(newBondingCurve);

        // Generate identifier
        string memory appendedIdentifier = string(abi.encodePacked(toAsciiString(token), "DAOME"));

        tokenDetails[token] = TokenDetails({
            metadataURI: metadataURI,
            imageURI: imageURI,
            bondingCurve: bondingCurve,
            identifier: appendedIdentifier
        });

        allTokens.push(token);

        emit TokenCreated(token, bondingCurve, metadataURI, imageURI, appendedIdentifier);

        (bool success, ) = feeTo.call{value: msg.value}("");
        require(success, "Fee transfer failed");

        return (token, bondingCurve, appendedIdentifier);
    }

    function getTokenDetails(address token) external view returns (string memory name, string memory symbol, string memory metadataURI, string memory imageURI, address bondingCurve, string memory identifier) {
        TokenDetails memory details = tokenDetails[token];
        ERC20 tokenContract = ERC20(token);
        return (tokenContract.name(), tokenContract.symbol(), details.metadataURI, details.imageURI, details.bondingCurve, details.identifier);
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42); // 2 extra bytes for "0x"
        s[0] = "0";
        s[1] = "x";
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i + 2] = char(hi);
            s[2 * i + 3] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
