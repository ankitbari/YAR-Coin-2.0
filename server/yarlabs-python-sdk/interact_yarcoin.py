from web3 import Web3
import os, json
from dotenv import load_dotenv
load_dotenv()
RPC = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
MY_ADDRESS = Web3.to_checksum_address(os.getenv("WALLET_ADDRESS"))
CONTRACT_ADDRESS = Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS"))

# Connect to blockchain
w3 = Web3(Web3.HTTPProvider(RPC))

# Load compiled contract
with open("compiled.json", "r", encoding="utf-8") as f:
    compiled = json.load(f)

abi = compiled["contracts"]["YARCoin.sol"]["YARCoin"]["abi"]
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

# Function to get token balance
def get_balance(addr):
    bal = contract.functions.balanceOf(Web3.to_checksum_address(addr)).call()
    # Adjust for 18 decimals
    return bal / (10 ** 18)

# Show your balance
print("My balance:", get_balance(MY_ADDRESS))

# Transfer example
to_addr = input("Enter recipient address (or leave empty to skip): ").strip()
if to_addr:
    recipient = Web3.to_checksum_address(to_addr)
    amount = float(input("Enter amount of YAR to send: "))
    token_amount = int(amount * (10 ** 18))

    nonce = w3.eth.get_transaction_count(MY_ADDRESS)
    tx = contract.functions.transfer(recipient, token_amount).build_transaction({
        "from": MY_ADDRESS,
        "nonce": nonce,
        "gas": 100000,
        "gasPrice": w3.eth.gas_price,
        "chainId": 31337
    })

    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print("Transfer TX:", tx_hash.hex())

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print("Transfer mined. Status:", receipt.status)
    print("New balance:", get_balance(MY_ADDRESS))