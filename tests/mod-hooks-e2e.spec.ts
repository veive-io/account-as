import { LocalKoinos } from "@roamin/local-koinos";
import { Contract, Signer, Transaction, Provider, utils } from "koilib";
import path from "path";
import { randomBytes } from "crypto";
import { beforeAll, afterAll, it, expect } from "@jest/globals";
import * as dotenv from "dotenv";
import * as modAbi from "@veive/mod-hooks-as/dist/modhooks-abi.json";
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

const modSerializer = new Contract({
    id: modSign.getAddress(),
    abi: modAbi,
    provider
}).serializer;

beforeAll(async () => {
    // start local-koinos node
    await localKoinos.startNode();
    await localKoinos.startBlockProduction();

    // deploy mod contract
    await localKoinos.deployContract(
        modSign.getPrivateKey("wif"),
        path.join(__dirname, "../node_modules/@veive/mod-hooks-as/dist/release/ModHooks.wasm"),
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
    const scope = await modSerializer.serialize({
        entry_point: 1
    }, "scope");

    const { operation: install_module } = await accountContract["install_module"]({
        module_type_id: 4,
        contract_id: modSign.address,
        scopes: [
            utils.encodeBase64url(scope)
        ]
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
    const scope = await modSerializer.serialize({
        entry_point: 1
    }, "scope");

    const { operation: install_module } = await accountContract["install_module"]({
        module_type_id: 4,
        contract_id: modSign.address,
        scopes: [
            utils.encodeBase64url(scope)
        ]
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
    expect(receipt.logs).toContain("[mod-hooks] called module install");

    const { result } = await accountContract["get_modules"]();
    expect(result.value[0]).toStrictEqual(modSign.address);
});

it("trigger module hooks", async () => {
    const { operation: test } = await accountContract["test"]({}, { onlyOperation: true });

    const tx = new Transaction({
        signer: accountSign,
        provider
    });

    const { operation: exec } = await accountContract["execute"]({
        operation: {
            contract_id: test.call_contract.contract_id,
            entry_point: test.call_contract.entry_point
        }
    }, { onlyOperation: true });

    await tx.pushOperation(exec);
    const receipt = await tx.send();
    await tx.wait();
    
    console.log(receipt);

    expect(receipt).toBeDefined();
    expect(receipt.logs).toContain("[mod-hooks] pre_check called");
    expect(receipt.logs).toContain("[mod-hooks] post_check called");
    expect(receipt.logs).toContain(`[account] selected precheck hooks ${modSign.address}`);
    expect(receipt.logs).toContain(`[account] selected precheck hooks ${modSign.address}`);
});

it("uninstall module", async () => {
    const { operation: uninstall_module } = await accountContract["uninstall_module"]({
        module_type_id: 4,
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
    expect(receipt.logs).toContain("[mod-hooks] called module uninstall");

    const { result } = await accountContract["get_modules"]();
    expect(result).toBeUndefined();
});