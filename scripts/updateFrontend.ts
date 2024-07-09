/**
 * Script to update constants and abi in the frontend
 */
import { Signer, Contract, Provider, Abi } from "koilib";
import fs from "fs";
import path from "path";
import koinosConfig from "../src/koinos.config.js";

let [inputNetworkName, contractId] = process.argv.slice(2);
let abi: Abi;

async function main() {
  const networkName = inputNetworkName || "harbinger";
  const network = koinosConfig.networks[networkName];
  if (!network) throw new Error(`network ${networkName} not found`);

  if (contractId) {
    // take ABI from the blockchain
    const contract = new Contract({
      id: contractId,
      provider: new Provider(network.rpcNodes),
    });
    abi = await contract.fetchAbi({
      updateFunctions: false,
      updateSerializer: false,
    });
    Object.keys(abi.methods).forEach((m) => {
      if (
        abi.methods[m].entry_point === undefined &&
        abi.methods[m]["entry-point"] !== undefined
      ) {
        abi.methods[m].entry_point = Number(abi.methods[m]["entry-point"]);
      }
      if (
        abi.methods[m].read_only === undefined &&
        abi.methods[m]["read-only"] !== undefined
      ) {
        abi.methods[m].read_only = abi.methods[m]["read-only"];
      }
    });
  } else {
    // take ABI from build folder and contractId koinos.config.js
    if (!network.accounts.contract.privateKeyWif) {
      throw new Error(
        `no private key defined for the contract in ${networkName}`,
      );
    }
    contractId = Signer.fromWif(
      network.accounts.contract.privateKeyWif,
    ).address;
    const abiString = fs.readFileSync(
      path.join(__dirname, "../src/build/smartaccount-abi.json"),
      "utf8",
    );
    abi = JSON.parse(abiString);
  }

  const constantsFile = path.join(
    __dirname,
    "../../website/src/koinos/constants.ts",
  );
  if (fs.existsSync(constantsFile)) {
    const data = fs.readFileSync(constantsFile, "utf8");
    const newData = data
      .split("\n")
      .map((line) => {
        if (line.startsWith("export const CONTRACT_ID = ")) {
          return `export const CONTRACT_ID = "${contractId}";`;
        }
        if (line.startsWith("export const RPC_NODE = ")) {
          return `export const RPC_NODE = "${network.rpcNodes[0]}";`;
        }
        if (line.startsWith("export const NETWORK_NAME = ")) {
          return `export const NETWORK_NAME = "${networkName}";`;
        }
        if (line.startsWith("export const BLOCK_EXPLORER = ")) {
          const blockExplorer =
            networkName === "harbinger"
              ? "https://harbinger.koinosblocks.com"
              : "https://koinosblocks.com";
          return `export const BLOCK_EXPLORER = "${blockExplorer}";`;
        }
        return line;
      })
      .join("\n");
    fs.writeFileSync(constantsFile, newData);
    console.log(`constants updated in the frontend for ${networkName}`);
  } else {
    console.log(`file '${constantsFile}' was not found`);
  }

  const data = `export default ${JSON.stringify(abi, null, 2)}`;
  const abiFile = path.join(__dirname, "../../website/src/koinos/abi.ts");
  fs.writeFileSync(abiFile, data);
  console.log("abi updated in the frontend");
}

main()
  .then(() => {})
  .catch((error) => console.error(error));
