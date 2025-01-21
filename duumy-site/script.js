document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.getElementById("connectMetaMask");
    const logoutButton = document.getElementById("logoutMetaMask");
    const signUpButton = document.getElementById("signUpButton");
    const statusElement = document.getElementById("status");
    const usernameInput = document.getElementById("username");
    const bioInput = document.getElementById("bio");
    const userDetailsDiv = document.getElementById("userDetails");

    const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql"; // Adjust if needed

    // ✅ Ensure buttons exist before adding event listeners
    if (connectButton) {
        connectButton.addEventListener("click", connectMetaMask);
    }
    if (logoutButton) {
        logoutButton.addEventListener("click", logoutMetaMask);
    }
    if (signUpButton) {
        signUpButton.addEventListener("click", registerUser);
    }

    async function connectMetaMask() {
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

            const message = `Login to DAOME with address ${parentAddress}`;
            const signature = await web3.eth.personal.sign(message, parentAddress, "");

            // ✅ Step 1: Try Logging in the User
            const loginResponse = await fetch(GRAPHQL_ENDPOINT, {
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

            const loginResult = await loginResponse.json();
            console.log("📜 Authentication Response:", loginResult);

            if (loginResult.errors) {
                console.log("ℹ️ User is not registered. Proceeding to Sign-Up.");
                document.getElementById("signupSection").style.display = "block";
                localStorage.setItem("pendingParentAddress", parentAddress);
                localStorage.setItem("pendingSignature", signature);
                return;
            }

            const { token, walletAddress, username, bio } = loginResult.data.metaMaskAuth;
            storeUserSession(token, walletAddress, username, bio);

        } catch (error) {
            console.error("❌ Error during login:", error);
            alert("❌ Something went wrong during login. Check console.");
        }
    }

    async function registerUser() {
        const username = usernameInput.value.trim();
        const bio = bioInput.value.trim();
        const parentAddress = localStorage.getItem("pendingParentAddress");
        const signature = localStorage.getItem("pendingSignature");

        if (!username) {
            alert("❌ Username is required for new users.");
            return;
        }

        console.log("📜 Registering New User...");
        const signUpResponse = await fetch(GRAPHQL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: `mutation RegisterUser($signature: String!, $parentAddress: String!, $username: String!, $bio: String) {
                    registerUser(signature: $signature, parentAddress: $parentAddress, username: $username, bio: $bio) {
                        token
                        walletAddress
                        username
                        bio
                    }
                }`,
                variables: { signature, parentAddress, username, bio }
            }),
        });

        const signUpResult = await signUpResponse.json();
        console.log("📜 Sign-Up Response:", signUpResult);

        if (signUpResult.errors) {
            console.error("❌ Sign-Up failed:", signUpResult.errors);
            alert("❌ Sign-Up failed. Check console for details.");
            return;
        }

        const { token, walletAddress, username: savedUsername, bio: savedBio } = signUpResult.data.registerUser;
        storeUserSession(token, walletAddress, savedUsername, savedBio);
    }

    function storeUserSession(token, walletAddress, username, bio) {
        localStorage.setItem("userToken", token);
        localStorage.setItem("walletAddress", walletAddress);
        localStorage.setItem("username", username);
        localStorage.setItem("bio", bio);

        console.log("🎉 User session stored:", username);

        if (connectButton) connectButton.style.display = "none";
        if (logoutButton) logoutButton.style.display = "block";
        if (statusElement) statusElement.innerText = `Connected as: ${username}`;
        if (userDetailsDiv) {
            document.getElementById("usernameDisplay").innerText = username;
            document.getElementById("bioDisplay").innerText = bio || "No bio provided";
            document.getElementById("walletAddressDisplay").innerText = walletAddress;
            userDetailsDiv.style.display = "block";
        }
    }

    function logoutMetaMask() {
        console.log("🔌 Logging out...");
        localStorage.removeItem("userToken");
        localStorage.removeItem("walletAddress");
        localStorage.removeItem("username");
        localStorage.removeItem("bio");
        localStorage.removeItem("pendingParentAddress");
        localStorage.removeItem("pendingSignature");

        if (connectButton) connectButton.style.display = "block";
        if (logoutButton) logoutButton.style.display = "none";
        if (statusElement) statusElement.innerText = "Not connected";
        if (userDetailsDiv) userDetailsDiv.style.display = "none";

        console.log("✅ User logged out.");
        alert("✅ Logged out successfully.");
    }

    // ✅ Check if user is already logged in
    if (localStorage.getItem("userToken")) {
        if (connectButton) connectButton.style.display = "none";
        if (logoutButton) logoutButton.style.display = "block";
        if (statusElement) {
            const savedUsername = localStorage.getItem("username");
            statusElement.innerText = `Connected as: ${savedUsername}`;
        }
    }
});
