from web3 import Web3
import secrets
import json
import pandas as pd

# Connect to AirDAO RPC
RPC_URL = "https://network.ambrosus.io/"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Function to generate a random wallet address
def generate_wallet(wallet_id):
    # Generate random private key
    private_key = secrets.token_hex(32)
    private_key = "0x" + private_key

    # Get account from private key
    account = w3.eth.account.from_key(private_key)

    # Return wallet details with ID
    return {
        "id": wallet_id,
        "address": account.address,
        "private_key": private_key
    }

# Generate and store 10 wallets in JSON and Excel files
if __name__ == "__main__":
    num_wallets = 500
    wallet_list = []

    for i in range(num_wallets):
        wallet = generate_wallet(i + 1)
        wallet_list.append(wallet)

    # Save to JSON file
    with open("multidata.json", "w") as json_file:
        json.dump(wallet_list, json_file, indent=4)

    # Save to Excel file
    df = pd.DataFrame(wallet_list)
    df.to_excel("multidata.xlsx", index=False)

    print(f"{num_wallets} wallet addresses saved to multidata.json and multidata.xlsx")
