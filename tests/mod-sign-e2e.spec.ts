import { LocalKoinos } from "@roamin/local-koinos";
import { Contract, Signer, Transaction, Provider, utils } from "koilib";
import path from "path";
import { randomBytes } from "crypto";
import { beforeAll, afterAll, it, expect } from "@jest/globals";
import * as dotenv from "dotenv";
import * as modAbi from "@veive-io/mod-validation-as/dist/modvalidation-abi.json";
import * as accountAbi from "../build/account-abi.json";

dotenv.config();

jest.setTimeout(600000);

const localKoinos = new LocalKoinos();
const provider = localKoinos.getProvider() as unknown as Provider;

const modSign1 = new Signer({
    privateKey: randomBytes(32).toString("hex"),
    provider
});

const modSign2 = new Signer({
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
        modSign1.getPrivateKey("wif"),
        path.join(__dirname, "../node_modules/@veive-io/mod-sign-as/dist/release/ModSign.wasm"),
        modAbi
    );

    await localKoinos.deployContract(
        modSign2.getPrivateKey("wif"),
        path.join(__dirname, "../node_modules/@veive-io/mod-sign-as/dist/release/ModSign.wasm"),
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

/*
it("install module error: caller must be itself", async () => {
     const { operation: install_module } = await accountContract["install_module"]({
        module_type_id: 3,
        contract_id: modSign1.address
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
*/

it("install module", async () => {
    const { operation: install_module1 } = await accountContract["install_module"]({
        module_type_id: 3,
        contract_id: modSign1.address
    }, { onlyOperation: true });

    const { operation: install_module2 } = await accountContract["install_module"]({
        module_type_id: 3,
        contract_id: modSign2.address
    }, { onlyOperation: true });

    const tx = new Transaction({
        signer: accountSign,
        provider
    });

    const { operation: exec1 } = await accountContract["execute_user"]({
        operation: {
            contract_id: install_module1.call_contract.contract_id,
            entry_point: install_module1.call_contract.entry_point,
            args: install_module1.call_contract.args
        }
    }, { onlyOperation: true });

    const { operation: exec2 } = await accountContract["execute_user"]({
        operation: {
            contract_id: install_module2.call_contract.contract_id,
            entry_point: install_module2.call_contract.entry_point,
            args: install_module2.call_contract.args
        }
    }, { onlyOperation: true });

    await tx.pushOperation(exec1);
    await tx.pushOperation(exec2);
    const receipt = await tx.send();
    await tx.wait();

    expect(receipt).toBeDefined();
    expect(receipt.logs).toContain("[mod-sign] called module install");

    const { result } = await accountContract["get_modules"]();
    expect(result.value.length).toStrictEqual(2);
});

/*
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
    expect(receipt.logs).toContain(`[account] selected sign ${modSign1.address}`);
});
*/

it("uninstall module", async () => {
    const { operation: uninstall_module } = await accountContract["uninstall_module"]({
        module_type_id: 3,
        contract_id: modSign1.address
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

    console.log(receipt);

    const { result: r1 } = await accountContract["get_modules"]();
    expect(r1!.value).toBeDefined();
    expect(r1.value.length).toStrictEqual(1);

    const { result: r2 } = await accountContract["is_module_installed"]({
        module_type_id: 3,
        contract_id: modSign2.address
    });
    expect(r2!.value).toStrictEqual(true);

    const { result: r3 } = await accountContract["is_module_installed"]({
        module_type_id: 3,
        contract_id: modSign1.address
    });
    expect(r3).toBeUndefined();
});
