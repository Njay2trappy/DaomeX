document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.getElementById("connectMetaMask");
    const signUpButton = document.getElementById("signUpMetaMask");
    const logoutButton = document.getElementById("logoutMetaMask");
    const statusElement = document.getElementById("status");
    const imageUploadForm = document.getElementById("imageUploadForm");
    const tokenImageInput = document.getElementById("tokenImage");
    const imageInput = document.getElementById("imageInput");
    const imageStatus = document.getElementById("imageStatus");
    const createTokenForm = document.getElementById("createTokenForm");
    const createTokenStatus = document.getElementById("createTokenStatus");
    const buyTokenForm = document.getElementById("buyTokenForm");
    const approveTokenForm = document.getElementById("approveTokenForm");

    let uploadedImageURI = "";

    const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql"; // Adjust as needed

    // ✅ Ensure buttons exist before adding event listeners
    if (connectButton) {
        connectButton.addEventListener("click", connectMetaMask);
    }
    if (signUpButton) {
        signUpButton.addEventListener("click", signUpUser);
    }
    if (logoutButton) {
        logoutButton.addEventListener("click", logoutMetaMask);
    }
    if (createTokenForm) createTokenForm.addEventListener("submit", handleTokenCreation);
    // ✅ Image Upload Handling
    if (imageUploadForm) {
        imageUploadForm.addEventListener("submit", async (event) => {
            event.preventDefault();
    
            const imageFile = imageInput.files[0];
            if (!imageFile) {
                alert("❌ Please select an image to upload.");
                return;
            }
    
            console.log(`📤 Preparing to upload image: ${imageFile.name}`);
    
            // Prepare form data for file upload
            const formData = new FormData();
            formData.append("operations", JSON.stringify({
                query: `mutation UploadImage($file: Upload!) {
                    uploadImage(file: $file)
                }`,
                variables: { file: null },
            }));
            formData.append("map", JSON.stringify({ "0": ["variables.file"] }));
            formData.append("0", imageFile);
    
            try {
                const response = await fetch(GRAPHQL_ENDPOINT, {
                    method: "POST",
                    body: formData,
                });
    
                const result = await response.json();
                console.log("📜 Image Upload Response:", result);
    
                if (result.errors) {
                    console.error("❌ Image upload failed:", result.errors);
                    alert("❌ Image upload failed. Check the console for details.");
                    return;
                }
    
                const ipfsURI = result.data.uploadImage;
                console.log("✅ Image uploaded successfully:", ipfsURI);
    
                // Store image URI in local storage
                localStorage.setItem("imageURI", ipfsURI);
                console.log("📦 Image URI stored in local storage:", ipfsURI);
    
                // Update the UI to reflect the uploaded image
                alert(`✅ Image uploaded successfully! IPFS URI: ${ipfsURI}`);
                if (imageStatus) imageStatus.innerText = `Image uploaded: ${ipfsURI}`;
            } catch (error) {
                console.error("❌ Error during image upload:", error);
                alert("❌ Something went wrong during image upload. Check console.");
            }
        });
    }   

    async function connectMetaMask() {
        try {
            if (!window.ethereum) {
                alert("❌ MetaMask is not installed. Please install it first.");
                return;
            }
    
            console.log("🔗 Requesting MetaMask connection...");
            const web3 = new Web3(window.ethereum);
    
            // ✅ Request MetaMask to return the active account
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            if (accounts.length === 0) {
                alert("❌ No account found. Please unlock MetaMask.");
                return;
            }
    
            // ✅ Always use the active MetaMask account
            const parentAddress = accounts[0];
            console.log(`✅ MetaMask Connected: ${parentAddress}`);
    
            // ✅ Generate a unique message with a timestamp to prevent replay attacks
            const message = `Login to DAOME with address ${parentAddress}`;
            console.log(`📜 Signing Message: ${message}`);
    
            // ✅ Request MetaMask to sign using the ACTIVE MetaMask address
            const signature = await web3.eth.personal.sign(message, parentAddress, "");
            console.log(`📝 Generated Signature: ${signature}`);
    
            // ✅ Send to backend for authentication
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `mutation MetaMaskAuth($signature: String!, $parentAddress: String!) {
                        metaMaskAuth(signature: $signature, parentAddress: $parentAddress) {
                            token
                            parentAddress
                            walletAddress
                            username
                            bio
                        }
                    }`,
                    variables: { signature, parentAddress }
                }),
            });
    
            const authResult = await response.json();
            console.log("📜 Authentication Response:", authResult);
    
            if (authResult.errors) {
                console.error("❌ Authentication failed:", authResult.errors);
                alert("❌ Authentication failed. User not found. Please sign up.");
                return;
            }
    
            const { token, walletAddress, username, bio } = authResult.data.metaMaskAuth;
            localStorage.setItem("userToken", token);
            localStorage.setItem("parentAddress", parentAddress);
            localStorage.setItem("walletAddress", walletAddress);
            localStorage.setItem("username", username);
            localStorage.setItem("bio", bio);
    
            console.log("🎉 User logged in successfully:", username);
    
            // ✅ Update UI
            if (connectButton) connectButton.style.display = "none";
            if (logoutButton) logoutButton.style.display = "block";
            if (statusElement) statusElement.innerText = `Connected as: ${username}`;
        } catch (error) {
            console.error("❌ Error during login:", error);
            alert("❌ Something went wrong during login. Check console.");
        }
    }
    async function signUpUser() {
        try {
            if (!window.ethereum) {
                alert("❌ MetaMask is not installed. Please install it first.");
                return;
            }

            console.log("🔗 Connecting to MetaMask...");
            const web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: "eth_requestAccounts" });

            const accounts = await web3.eth.getAccounts();
            if (accounts.length === 0) {
                alert("❌ No account found. Please unlock MetaMask.");
                return;
            }

            const parentAddress = accounts[0];
            console.log(`✅ MetaMask Connected: ${parentAddress}`);

            let username = prompt("Enter a username:");
            if (!username) {
                alert("❌ Username is required for new users.");
                return;
            }
            let bio = prompt("Enter a short bio (optional):") || "";

            console.log(`📜 Signing up user: ${username} at address ${parentAddress}`);

            // ✅ Generate a signature for sign-up authentication
            const message = `Sign up for DAOME with address ${parentAddress}`;
            const signature = await web3.eth.personal.sign(message, parentAddress, "");
            console.log(`📝 Generated Signature for Sign-Up: ${signature}`);

            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `mutation SignUp($username: String!, $bio: String, $parentAddress: String!, $signature: String!) {
                        signUp(username: $username, bio: $bio, parentAddress: $parentAddress, signature: $signature) {
                            username
                            bio
                            walletAddress
                        }
                    }`,
                    variables: { username, bio, parentAddress, signature }
                }),
            });

            const signUpResult = await response.json();
            console.log("📜 Sign-Up Response:", signUpResult);

            if (signUpResult.errors) {
                console.error("❌ Sign-Up failed:", signUpResult.errors);
                alert("❌ Sign-Up failed. Check console for details.");
                return;
            }

            const { username: savedUsername, bio: savedBio, walletAddress } = signUpResult.data.signUp;
            console.log("🎉 New user signed up successfully:", savedUsername);

            alert(`✅ User signed up successfully! Username: ${savedUsername}`);

            // ✅ Update UI to show login button
            if (signUpButton) signUpButton.style.display = "none";
            if (connectButton) connectButton.style.display = "block";
        } catch (error) {
            console.error("❌ Error during sign-up:", error);
            alert("❌ Something went wrong during sign-up. Check console.");
        }
    }
    /*async function createToken(name, symbol, description, twitter, telegram, website, imageFile) {
        try {
            // Step 1: Upload Image
            const formData = new FormData();
            formData.append("file", imageFile);
    
            const imageResponse = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("userToken")}` },
                body: formData,
            });
    
            const imageResult = await imageResponse.json();
            if (imageResult.errors) {
                throw new Error("Image upload failed");
            }
    
            const imageURI = imageResult.data.uploadImage;
            console.log(`🖼️ Image uploaded: ${imageURI}`);
    
            // Step 2: Create Token
            const tokenResponse = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("userToken")}`,
                },
                body: JSON.stringify({
                    query: `mutation CreateToken($name: String!, $symbol: String!, $description: String, $twitter: String, $telegram: String, $website: String, $imageURI: String!) {
                        createToken(name: $name, symbol: $symbol, description: $description, twitter: $twitter, telegram: $telegram, website: $website, imageURI: $imageURI) {
                            name
                            symbol
                            address
                            transactionHash
                        }
                    }`,
                    variables: { name, symbol, description, twitter, telegram, website, imageURI },
                }),
            });
    
            const tokenResult = await tokenResponse.json();
            if (tokenResult.errors) {
                throw new Error("Token creation failed");
            }
    
            console.log(`🎉 Token created:`, tokenResult.data.createToken);
            alert(`Token created successfully! Address: ${tokenResult.data.createToken.address}`);
        } catch (error) {
            console.error("❌ Error during token creation:", error);
            alert("Token creation failed. Check console for details.");
        }
    }*/
    // 🔄 Function to upload the image
    /*async function handleImageUpload(event) {
        event.preventDefault();

        const formData = new FormData(imageUploadForm);
        const imageFile = formData.get("tokenImage");

        if (!imageFile || imageFile.size === 0) {
            alert("❌ Please select an image to upload.");
            return;
        }

        try {
            console.log("📤 Uploading image...");
            const uploadResponse = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
                body: createMultipartBody(
                    `mutation UploadImage($file: Upload!) {
                        uploadImage(file: $file)
                    }`,
                    { file: imageFile }
                ),
            });

            const uploadResult = await uploadResponse.json();
            if (uploadResult.errors) {
                console.error("❌ Image upload failed:", uploadResult.errors);
                alert("❌ Image upload failed.");
                return;
            }

            uploadedImageURI = uploadResult.data.uploadImage;
            console.log(`🖼️ Image uploaded successfully. URI: ${uploadedImageURI}`);
            imageStatus.innerText = `Image uploaded successfully! URI: ${uploadedImageURI}`;
        } catch (error) {
            console.error("❌ Error during image upload:", error);
            alert("❌ Something went wrong during image upload. Check console.");
        }
    }*/

    // 🔄 Function to create the token
    async function handleTokenCreation(event) {
        event.preventDefault();
    
        if (!window.ethereum) {
            alert("❌ MetaMask is not installed. Please install it first.");
            return;
        }
    
        const formData = new FormData(createTokenForm);
        const name = formData.get("tokenName");
        const symbol = formData.get("tokenSymbol");
        const description = formData.get("tokenDescription");
        const twitter = formData.get("tokenTwitter");
        const telegram = formData.get("tokenTelegram");
        const website = formData.get("tokenWebsite");
        const imageURI = localStorage.getItem("imageURI");
    
        if (!imageURI) {
            alert("❌ Please upload an image before creating a token.");
            return;
        }
    
        try {
            console.log(`📜 Initiating token creation for: ${name} (${symbol})`);
    
            // Step 1: Request the encoded transaction data from the backend
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
                body: JSON.stringify({
                    query: `mutation CreateToken($name: String!, $symbol: String!, $description: String, $twitter: String, $telegram: String, $website: String, $imageURI: String!) {
                        createToken(name: $name, symbol: $symbol, description: $description, twitter: $twitter, telegram: $telegram, website: $website, imageURI: $imageURI) {
                            encodedTx {
                                from
                                to
                                data
                                value
                                gas
                            }
                        }
                    }`,
                    variables: { name, symbol, description, twitter, telegram, website, imageURI },
                }),
            });
    
            const result = await response.json();
            console.log("📜 Backend Response:", result);
    
            if (result.errors) {
                console.error("❌ Token creation failed:", result.errors);
                alert("❌ Token creation failed. Check the console for details.");
                return;
            }
    
            const { from, to, data, value, gas } = result.data.createToken.encodedTx;
    
            // Step 2: Sign and send the transaction via MetaMask
            const web3 = new Web3(window.ethereum);
            const receipt = await web3.eth.sendTransaction({
                from,
                to,
                data,
                value,
                gas,
            });
    
            console.log("🎉 Transaction successfully sent:", receipt);
            alert(`✅ Token created successfully! Transaction Hash: ${receipt.transactionHash}`);
    
            // Step 3: Confirm token creation on backend (mutation for database update)
            console.log("📤 Sending transaction confirmation to backend...");
            const confirmResponse = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
                body: JSON.stringify({
                    query: `mutation ConfirmTokenCreation($transactionHash: String!, $name: String!, $symbol: String!, $description: String, $twitter: String, $telegram: String, $website: String) {
                        confirmTokenCreation(transactionHash: $transactionHash, name: $name, symbol: $symbol, description: $description, twitter: $twitter, telegram: $telegram, website: $website) {
                            mint
                            name
                            symbol
                            totalSupply
                            balanceOf
                            bondingCurve
                            creator
                            transactionHash
                            description
                            imageURI
                            metadataURI
                            twitter
                            telegram
                            website
                            pool
                            usdMarketCap
                            usdPrice
                            fdv
                            mint_authority
                            freeze_authority
                            liquidity_burned
                            migrated
                            burn_curve
                            tokenPrice
                            virtualReserve
                            tokenReserve
                            marketCap
                        }
                    }`,
                    variables: { transactionHash: receipt.transactionHash, name, symbol, description, twitter, telegram, website },
                }),
            });
    
            const confirmResult = await confirmResponse.json();
            console.log("✅ Token Confirmation Response:", confirmResult);
    
            if (confirmResult.errors) {
                console.error("❌ Error confirming token creation:", confirmResult.errors);
                alert("❌ Token confirmation failed. Check the console for details.");
                return;
            }
    
            alert(`✅ Token creation confirmed! Address: ${confirmResult.data.confirmTokenCreation.tokenAddress}`);
    
        } catch (error) {
            console.error("❌ Error during token creation:", error);
            alert("❌ Something went wrong. Check the console for details.");
        }
    }
    async function handleBuyTokens(event) {
        event.preventDefault();
    
        if (!window.ethereum) {
            alert("❌ MetaMask is not installed. Please install it first.");
            return;
        }
    
        const formData = new FormData(buyTokenForm);
        const MintOrAddress = formData.get("MintOrAddress");
        const amount = formData.get("amount");
        const slippageTolerance = formData.get("slippageTolerance");
    
        try {
            console.log(`📜 Preparing to buy tokens: ${MintOrAddress} with amount ${amount}`);
    
            // Step 1: Request encoded transaction data from the backend
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation BuyTokens($MintOrAddress: String!, $amount: String!, $slippageTolerance: String!) {
                            buyTokens(MintOrAddress: $MintOrAddress, amount: $amount, slippageTolerance: $slippageTolerance) {
                                encodedTx {
                                    from
                                    to
                                    data
                                    value
                                    gas
                                }
                            }
                        }
                    `,
                    variables: { MintOrAddress, amount, slippageTolerance },
                }),
            });
    
            const result = await response.json();
    
            if (result.errors) {
                console.error("❌ Error fetching encoded transaction:", result.errors);
                alert("❌ Token purchase failed. Check console for details.");
                return;
            }
    
            // Extract encoded transaction data
            const encodedTx = result.data.buyTokens.encodedTx;
            console.log("📜 Encoded Transaction:", encodedTx);
    
            const web3 = new Web3(window.ethereum);
    
            // Step 2: Prompt user to sign & send transaction via MetaMask
            const receipt = await web3.eth.sendTransaction({
                from: encodedTx.from,
                to: encodedTx.to,
                data: encodedTx.data,
                value: encodedTx.value,
                gas: encodedTx.gas,
            });
    
            console.log("✅ Transaction Successful:", receipt);
            alert(`✅ Transaction Successful! Hash: ${receipt.transactionHash}`);
    
            // Step 3: Immediately confirm the token purchase in the backend
            console.log(`📥 Confirming token purchase for hash: ${receipt.transactionHash}`);
    
            const confirmResponse = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
                body: JSON.stringify({
                    query: `mutation ConfirmTokenPurchase($transactionHash: String!) {
                        confirmTokenPurchase(transactionHash: $transactionHash) {
                            quantity
                            amountPaid
                            timestamp
                            buyer
                            transactionHash
                            bondingCurve
                        }
                    }`,
                    variables: { transactionHash: receipt.transactionHash },
                }),
            });
    
            const confirmResult = await confirmResponse.json();
    
            if (confirmResult.errors) {
                console.error("❌ Error confirming token purchase:", confirmResult.errors);
                alert("❌ Token purchase confirmation failed. Check console.");
                return;
            }
    
            console.log("✅ Token purchase confirmed:", confirmResult.data.confirmTokenPurchase);
            alert(`✅ Token purchase confirmed! Transaction Hash: ${confirmResult.data.confirmTokenPurchase.transactionHash}`);
    
        } catch (error) {
            console.error("❌ Error during token purchase:", error);
            alert("❌ An error occurred. Check console for details.");
        }
    }
    async function approveToken(event) {
        event.preventDefault();
    
        if (!window.ethereum) {
            alert("❌ MetaMask is not installed. Please install it first.");
            return;
        }
    
        const formData = new FormData(approveTokenForm);
        const MintOrAddress = formData.get("approveMintOrAddress");
        const amount = formData.get("approveAmount");
    
        try {
            console.log(`📜 Requesting approval for: ${MintOrAddress} with amount ${amount}`);
    
            // Step 1: Request encoded transaction from backend
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation ApproveToken($MintOrAddress: String!, $amount: String!) {
                            approveToken(MintOrAddress: $MintOrAddress, amount: $amount) {
                                encodedTx {
                                    from
                                    to
                                    data
                                    gas
                                }
                                token
                                tokenAddress
                                bondingCurveAddress
                                amountApproved
                            }
                        }
                    `,
                    variables: { MintOrAddress, amount },
                }),
            });
    
            const result = await response.json();
            if (result.errors) {
                console.error("❌ Error fetching approval transaction:", result.errors);
                alert("❌ Token approval failed. Check console for details.");
                return;
            }
    
            const { from, to, data, gas } = result.data.approveToken.encodedTx;
    
            // Step 2: Sign and send the transaction using MetaMask
            const web3 = new Web3(window.ethereum);
            const receipt = await web3.eth.sendTransaction({ from, to, data, gas });
    
            console.log("✅ Approval Transaction Successful:", receipt);
            alert(`✅ Token Approved Successfully! Transaction Hash: ${receipt.transactionHash}`);
    
        } catch (error) {
            console.error("❌ Error during token approval:", error);
            alert("❌ An error occurred. Check console for details.");
        }
    }
    function logoutMetaMask() {
        console.log("🔌 Logging out...");
        localStorage.removeItem("userToken");
        localStorage.removeItem("walletAddress");
        localStorage.removeItem("username");
        localStorage.removeItem("bio");

        if (connectButton) connectButton.style.display = "block";
        if (signUpButton) signUpButton.style.display = "block";
        if (logoutButton) logoutButton.style.display = "none";
        if (statusElement) statusElement.innerText = "Not connected";

        console.log("✅ User logged out.");
        alert("✅ Logged out successfully.");
    }

    // ✅ Check if user is already logged in
    if (localStorage.getItem("userToken")) {
        if (connectButton) connectButton.style.display = "none";
        if (signUpButton) signUpButton.style.display = "none";
        if (logoutButton) logoutButton.style.display = "block";
        if (statusElement) {
            const savedUsername = localStorage.getItem("username");
            statusElement.innerText = `Connected as: ${savedUsername}`;
        }
    }
    if (createTokenForm) {
        createTokenForm.addEventListener("submit", handleTokenCreation);
    }
    if (buyTokenForm) {
        buyTokenForm.addEventListener("submit", handleBuyTokens);
    }
    if (approveTokenForm) {
        approveTokenForm.addEventListener("submit", approveToken);
    }
});


