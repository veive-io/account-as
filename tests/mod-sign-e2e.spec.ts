import { LocalKoinos } from "@roamin/local-koinos";
import { Contract, Signer, Transaction, Provider, utils } from "koilib";
import path from "path";
import { randomBytes } from "crypto";
import { beforeAll, afterAll, it, expect } from "@jest/globals";
import * as dotenv from "dotenv";
import * as modAbi from "@veive/mod-validation-as/dist/modvalidation-abi.json";
import * as accountAbi from "../build/account-abi.json";

dotenv.config();

jest.setTimeout(600000);

const localKoinos = new LocalKoinos();
const provider = localKoinos.getProvider() as unknown as Provider;

const modSign = new Signer({
    privateKey: randomBytes(32).toString("hex"),
    provider
});

const accountSign = new Signer({
    privateKey: randomBytes(32).toString("hex"),
    provider
});

const accountContract = new Contract({
    id: accountSign.getAddress(),
    abi: accountAbi,
    provider
}).functions;

beforeAll(async () => {
    // start local-koinos node
    await localKoinos.startNode();
    await localKoinos.startBlockProduction();

    // deploy mod contract
    await localKoinos.deployContract(
        modSign.getPrivateKey("wif"),
        path.join(__dirname, "../node_modules/@veive/mod-sign-as/dist/release/ModSign.wasm"),
        modAbi
    );

    // deploy account contract
    await localKoinos.deployContract(
        accountSign.getPrivateKey("wif"),
        path.join(__dirname, "../build/release/Account.wasm"),
        accountAbi,
        {},
        {
            authorizesCallContract: true,
            authorizesTransactionApplication: false,
            authorizesUploadContract: false,
        }
    );
});

afterAll(() => {
    // stop local-koinos node
    localKoinos.stopNode();
});

it("install module error: caller must be itself", async () => {
     const { operation: install_module } = await accountContract["install_module"]({
        module_type_id: 3,
        contract_id: modSign.address
    }, { onlyOperation: true });

    const tx = new Transaction({
        signer: accountSign,
        provider
    });

    await tx.pushOperation(install_module);

    let error = undefined;
    try {
        await tx.send();
    } catch (e) {
        error = e;
    }

    expect(error).toBeDefined();
});

it("install module", async () => {
    const { operation: install_module } = await accountContract["install_module"]({
        module_type_id: 3,
        contract_id: modSign.address
    }, { onlyOperation: true });

    const tx = new Transaction({
        signer: accountSign,
        provider
    });

    const { operation: exec } = await accountContract["execute_user"]({
        operation: {
            contract_id: install_module.call_contract.contract_id,
            entry_point: install_module.call_contract.entry_point,
            args: install_module.call_contract.args
        }
    }, { onlyOperation: true });

    await tx.pushOperation(exec);
    const receipt = await tx.send();
    await tx.wait();

    expect(receipt).toBeDefined();
    expect(receipt.logs).toContain("[mod-sign] called module install");

    const { result } = await accountContract["get_modules"]();
    expect(result.value).toStrictEqual([modSign.address]);
});

it("trigger module is_valid_signature", async () => {
    const { operation: test } = await accountContract["test"]({}, { onlyOperation: true });

    const tx1 = new Transaction({
        signer: accountSign,
        provider
    });

    await tx1.pushOperation(test);
    await tx1.prepare();
    await tx1.sign();

    const tx2 = new Transaction({
        signer: accountSign,
        provider
    });

    const { operation: is_valid_signature } = await accountContract["is_valid_signature"]({
        sender: accountSign.address,
        signature: tx1.transaction.signatures[0],
        tx_id: tx1.transaction.id
    }, { onlyOperation: true });

    await tx2.pushOperation(is_valid_signature);
    const receipt = await tx2.send();
    await tx2.wait();
    
    expect(receipt).toBeDefined();
    expect(receipt.logs).toContain("[mod-sign] is_valid_signature called");
    expect(receipt.logs).toContain(`[account] selected sign ${modSign.address}`);
});

it("uninstall module", async () => {
    const { operation: uninstall_module } = await accountContract["uninstall_module"]({
        module_type_id: 3,
        contract_id: modSign.address
    }, { onlyOperation: true });

    const tx = new Transaction({
        signer: accountSign,
        provider
    });

    const { operation: exec } = await accountContract["execute_user"]({
        operation: {
            contract_id: uninstall_module.call_contract.contract_id,
            entry_point: uninstall_module.call_contract.entry_point,
            args: uninstall_module.call_contract.args
        }
    }, { onlyOperation: true });

    await tx.pushOperation(exec);
    const receipt = await tx.send();
    await tx.wait();

    expect(receipt).toBeDefined();
    expect(receipt.logs).toContain("[mod-sign] called module uninstall");

    const { result } = await accountContract["get_modules"]();
    expect(result).toBeUndefined();
});