from web3 import Web3
from solcx import compile_standard, install_solc
import json, os
from dotenv import load_dotenv

# from interact_yarcoin import MY_ADDRESS

load_dotenv()

RPC = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
MY_WAL_ADDRESS = os.getenv("WALLET_ADDRESS")

install_solc("0.8.24")

with open("YARCoin.sol", "r", encoding="utf-8") as f:
    source = f.read()

compiled = compile_standard({
    "language": "Solidity",
    "sources": {"YARCoin.sol": {"content": source}},
    "settings": {
        "outputSelection": {"*": {"*": ["abi", "evm.bytecode.object"]}}
    }
}, solc_version="0.8.24")

with open("compiled.json", "w", encoding="utf-8") as f:
    json.dump(compiled, f, indent=2)

contract_data = compiled["contracts"]["YARCoin.sol"]["YARCoin"]
bytecode = contract_data["evm"]["bytecode"]["object"]
abi = contract_data["abi"]

MY_WAL_ADDRESS = Web3.to_checksum_address(MY_WAL_ADDRESS)

w3 = Web3(Web3.HTTPProvider(RPC))

YAR = w3.eth.contract(abi=abi, bytecode=bytecode)

nonce = w3.eth.get_transaction_count(MY_WAL_ADDRESS)
construct_txn = YAR.constructor(1_000_000).build_transaction({
    "from": MY_WAL_ADDRESS,
    "nonce": nonce,
    "gas": 3_000_000,
    "gasPrice": w3.eth.gas_price,
    "chainId": 31337
})

signed = w3.eth.account.sign_transaction(construct_txn, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
print("Deploy TX sent. Hash:", tx_hash.hex())

print("Waiting for receipt...")
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("Contract deployed at:", receipt.contractAddress)