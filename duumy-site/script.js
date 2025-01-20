document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.getElementById("connectMetaMask");
    const logoutButton = document.getElementById("logoutMetaMask");
    const statusElement = document.getElementById("status");
    const usernameInput = document.getElementById("username");
    const bioInput = document.getElementById("bio");

    const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql"; // Adjust as needed

    // ✅ Ensure buttons exist before adding event listeners
    if (connectButton) {
        connectButton.addEventListener("click", connectMetaMask);
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

            let username = "";
            let bio = "";

            const isNewUser = !localStorage.getItem("userToken"); // If no token, assume new user
            if (isNewUser) {
                username = prompt("Enter a username:");
                if (!username) {
                    alert("❌ Username is required for new users.");
                    return;
                }
                bio = prompt("Enter a short bio (optional):") || "";
            }

            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `mutation MetaMaskAuth($signature: String!, $parentAddress: String!, $username: String, $bio: String) {
                        metaMaskAuth(signature: $signature, parentAddress: $parentAddress, username: $username, bio: $bio) {
                            token
                            walletAddress
                            username
                            bio
                        }
                    }`,
                    variables: { signature, parentAddress, username, bio }
                }),
            });

            const authResult = await response.json();
            console.log("📜 Authentication Response:", authResult);

            if (authResult.errors) {
                console.error("❌ Authentication failed:", authResult.errors);
                alert("❌ Authentication failed. Check console for details.");
                return;
            }

            const { token, walletAddress, username: savedUsername, bio: savedBio } = authResult.data.metaMaskAuth;
            localStorage.setItem("userToken", token);
            localStorage.setItem("walletAddress", walletAddress);
            localStorage.setItem("username", savedUsername);
            localStorage.setItem("bio", savedBio);

            console.log("🎉 User logged in successfully:", savedUsername);

            // ✅ Update UI
            if (connectButton) connectButton.style.display = "none";
            if (logoutButton) logoutButton.style.display = "block";
            if (statusElement) statusElement.innerText = `Connected as: ${savedUsername}`;
        } catch (error) {
            console.error("❌ Error during login:", error);
            alert("❌ Something went wrong during login. Check console.");
        }
    }

    function logoutMetaMask() {
        console.log("🔌 Logging out...");
        localStorage.removeItem("userToken");
        localStorage.removeItem("walletAddress");
        localStorage.removeItem("username");
        localStorage.removeItem("bio");

        if (connectButton) connectButton.style.display = "block";
        if (logoutButton) logoutButton.style.display = "none";
        if (statusElement) statusElement.innerText = "Not connected";

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
