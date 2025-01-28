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
    uint public virtualReserve = 20000 ether;
    uint public slope = 1e18;
    uint public feePercent = 1; // Fee percentage for buy/sell transactions
    address public feeTo;
    uint public initialPrice = 2e13; // Initial token price
    uint public tokenPrice = initialPrice;
    uint public tokenReserve = 1_000_000_000 ether; // Total token supply in bonding curve

    // Events with indexed parameters
    event TokensPurchased(
        address indexed buyer,     // Indexed buyer address
        uint indexed amount,       // Indexed tokens bought
        uint indexed totalCost     // Indexed AMB paid
    );

    event TokensBurned(
        address indexed seller,    // Indexed seller address
        uint indexed amount,       // Indexed tokens sold
        uint indexed netRefund     // Indexed net refund (AMB)
    );

    constructor(address _feeTo) {
        require(_feeTo != address(0), "BondingCurve: feeTo cannot be zero address");
        feeTo = _feeTo;
    }

    function initialize(address _token) external {
        require(token == address(0), "BondingCurve: Already initialized");
        token = _token;
    }

    function buyTokens(uint slippageTolerancePercent) external payable {
        require(msg.value > 0, "BondingCurve: ETH required for purchase");
        require(tokenReserve > 0, "BondingCurve: No tokens in reserve");

        uint fee = (msg.value * feePercent) / 100;
        uint netAmount = msg.value - fee;

        // ✅ Transfer fee FIRST to feeTo address
        (bool feeSuccess, ) = feeTo.call{value: fee}("");
        require(feeSuccess, "BondingCurve: Fee transfer failed");

        // ✅ Now, use the remaining (netAmount) to buy tokens
        uint expectedVirtualReserve = virtualReserve + netAmount;
        uint expectedPrice = (expectedVirtualReserve * 1e18) / tokenReserve;

        uint maxAcceptablePrice = (tokenPrice * (100 + slippageTolerancePercent)) / 100;
        require(expectedPrice <= maxAcceptablePrice, "BondingCurve: Slippage too high");

        uint tokensBought = (netAmount * 1e18) / expectedPrice;
        uint expectedtokenReserve = tokenReserve - tokensBought;

        require(tokensBought > 0, "BondingCurve: Insufficient ETH to buy tokens");
        require(tokenReserve >= tokensBought, "BondingCurve: Insufficient token reserve");

        ERC20(token).transfer(msg.sender, tokensBought);

        // ✅ Update virtual reserve and token price
        virtualReserve = expectedVirtualReserve;
        tokenReserve = expectedtokenReserve;
        tokenPrice = expectedPrice;

        // ✅ Emit event after a successful purchase
        emit TokensPurchased(msg.sender, tokensBought, msg.value);
    }

function sellTokens(uint amount, uint slippagePercent) external {
    require(amount > 0, "BondingCurve: Amount must be greater than zero");

    uint userBalance = ERC20(token).balanceOf(msg.sender);
    require(userBalance >= amount, "BondingCurve: Insufficient token balance");

    uint sellPercentage = (amount * 1e18) / tokenReserve;
    uint feePercentage = sellPercentage / 1e16; // Increase fee by 0.1% for every 1%
    if (feePercentage > 10) {
        feePercentage = 10; // Cap fee at 10%
    }

    uint sellPrice = (tokenPrice * (100 - feePercentage)) / 100;
    uint refund = (amount * sellPrice) / 1e18;
    require(refund > 0, "BondingCurve: Refund too small");
    require(virtualReserve >= refund, "BondingCurve: Insufficient virtual reserve");

    uint expectedTokenReserve = tokenReserve + amount;
    uint expectedVirtualReserve = virtualReserve - refund;
    uint expectedPrice = (expectedVirtualReserve * 1e18) / expectedTokenReserve;

    uint maxSlippage = (tokenPrice * (100 - slippagePercent)) / 100;
    require(expectedPrice >= maxSlippage, "BondingCurve: Slippage too high");

    ERC20(token).transferFrom(msg.sender, address(this), amount);

    uint fee = (refund * feePercent) / 100;
    uint netRefund = refund - fee;

    (bool success, ) = payable(msg.sender).call{value: netRefund}("");
    require(success, "BondingCurve: Refund transfer failed");

    // ✅ Fee transfer is optional: if it fails, transaction still proceeds
    (success, ) = feeTo.call{value: fee}("");
    if (!success) {
        // Emit an event if the fee transfer fails (for tracking issues)
        emit FeeTransferFailed(feeTo, fee);
    }

    // Emit event with indexed parameters
    emit TokensBurned(msg.sender, amount, netRefund);

    tokenReserve = expectedTokenReserve;
    virtualReserve = expectedVirtualReserve;
    tokenPrice = expectedPrice;
}

// ✅ New event for tracking failed fee transfers
event FeeTransferFailed(address indexed recipient, uint amount);
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

    event TokenCreated(
        address indexed token,          // Indexed token address
        address indexed bondingCurve,   // Indexed bonding curve address
        string metadataURI,
        string imageURI,
        string identifier
    );

    constructor(address _feeToSetter) {
        require(_feeToSetter != address(0), "FeeToSetter cannot be zero address");
        feeToSetter = _feeToSetter;
    }

    function createToken(
        string memory name,
        string memory symbol,
        string memory metadataURI,
        string memory imageURI
    ) external payable returns (address token, address bondingCurve, string memory identifier) {
        require(msg.value >= creationFee, "Factory: Insufficient creation fee");

        // Deploy BondingCurve contract
        BondingCurve newBondingCurve = new BondingCurve(feeTo);

        // Deploy ERC20 token contract
        ERC20 newToken = new ERC20(name, symbol, address(newBondingCurve));
        token = address(newToken);

        // Initialize bonding curve
        newBondingCurve.initialize(token);
        bondingCurve = address(newBondingCurve);

        // Generate unique identifier
        string memory appendedIdentifier = string(abi.encodePacked(toAsciiString(token), "DAOME"));

        // Store token details
        tokenDetails[token] = TokenDetails({
            metadataURI: metadataURI,
            imageURI: imageURI,
            bondingCurve: bondingCurve,
            identifier: appendedIdentifier
        });

        allTokens.push(token);

        // Emit the event with a placeholder transaction hash
        emit TokenCreated(token, bondingCurve, metadataURI, imageURI, appendedIdentifier);

        // Transfer creation fee to feeTo
        (bool success, ) = feeTo.call{value: msg.value}("");
        require(success, "Fee transfer failed");

        return (token, bondingCurve, appendedIdentifier);
    }

    function getTokenDetails(address token) 
        external 
        view 
        returns (
            string memory name,
            string memory symbol,
            string memory identifier,
            address bondingCurve,
            string memory metadataURI,
            string memory imageURI
        ) 
    {
        require(tokenDetails[token].bondingCurve != address(0), "Token not found");

        TokenDetails memory details = tokenDetails[token];
        ERC20 tokenContract = ERC20(token);

        return (
            tokenContract.name(),
            tokenContract.symbol(),
            details.identifier,
            details.bondingCurve,
            details.metadataURI,
            details.imageURI
        );
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42);
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