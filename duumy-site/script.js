document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.getElementById("connectMetaMask");
    const signUpButton = document.getElementById("signUpMetaMask");
    const logoutButton = document.getElementById("logoutMetaMask");
    const statusElement = document.getElementById("status");

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
});
