import { LocalKoinos } from "@roamin/local-koinos";
import { Contract, Signer, Transaction, Provider, utils } from "koilib";
import path from "path";
import { randomBytes } from "crypto";
import { beforeAll, afterAll, it, expect } from "@jest/globals";
import * as dotenv from "dotenv";
import * as modAbi from "@veive-io/mod-validation-as/dist/modvalidation-abi.json";
import * as accountAbi from "../build/account-abi.json";
import * as fs from "fs";

dotenv.config();

jest.setTimeout(600000);

const localKoinos = new LocalKoinos();
const provider = localKoinos.getProvider() as unknown as Provider;

const modValidation = new Signer({
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
    id: modValidation.getAddress(),
    abi: modAbi,
    provider
}).serializer;

beforeAll(async () => {
    // start local-koinos node
    await localKoinos.startNode();
    await localKoinos.startBlockProduction();

    // deploy mod contract
    await localKoinos.deployContract(
        modValidation.getPrivateKey("wif"),
        path.join(__dirname, "../node_modules/@veive-io/mod-validation-as/dist/release/ModValidation.wasm"),
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
            authorizesTransactionApplication: true,
            authorizesUploadContract: true,
        }
    );
});

afterAll(() => {
    // stop local-koinos node
    localKoinos.stopNode();
});

it("install module error: caller must be itself", async () => {
    const scope = await modSerializer.serialize({
        operation_type: 'contract_call'
    }, "scope");

    const { operation: install_module } = await accountContract["install_module"]({
        module_type_id: 1,
        contract_id: modValidation.address,
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

it("check module type is supported", async () => {
    const { result } = await accountContract["is_module_type_supported"]({
        module_type_id: 1
    });

    expect(result.value).toStrictEqual(true);
})

it("install module", async () => {
    const scope1 = await modSerializer.serialize({operation_type: 'contract_call'}, "scope");
    const scope2 = await modSerializer.serialize({operation_type: 'contract_upload'}, "scope");
    const scope3 = await modSerializer.serialize({operation_type: 'transaction_application'}, "scope");

    const { operation: install_module } = await accountContract["install_module"]({
        module_type_id: 1,
        contract_id: modValidation.address,
        scopes: [
            utils.encodeBase64url(scope1),
            utils.encodeBase64url(scope2),
            utils.encodeBase64url(scope3)
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
    expect(receipt.logs).toContain("[mod-validation] called module install");

    const { result: r1 } = await accountContract["get_modules"]();
    expect(r1.value).toStrictEqual([modValidation.address]);

    const { result: r2 } = await accountContract["is_module_installed"]({
        module_type_id: 1,
        contract_id: modValidation.address
    });
    expect(r2.value).toStrictEqual(true);
});

it("trigger module is_authorized", async () => {
    const { operation: test } = await accountContract["test"]({}, { onlyOperation: true });

    const tx = new Transaction({
        signer: accountSign,
        provider
    });

    const { operation: exec } = await accountContract["execute_user"]({
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
    expect(receipt.logs).toContain("[mod-validation] is_authorized called");
    expect(receipt.logs).toContain(`[account] selected validation ${modValidation.address}`);
});

it("trigger authorize with deploy", async () => {
    const wasm = fs.readFileSync(path.join(__dirname, "../build/release/Account.wasm"));
    const bytecode = new Uint8Array(wasm);

    const tx = new Transaction({
        signer: accountSign,
        provider
    });

    const smartContract = new Contract({
        id: accountSign.getAddress(),
        abi: accountAbi,
        provider,
        bytecode,
        signer: accountSign
    });
    
    const { operation } = await smartContract.deploy({
        abi: JSON.stringify(accountAbi),
        authorizesCallContract: true,
        authorizesTransactionApplication: true,
        authorizesUploadContract: true,
        onlyOperation: true
    });

    await tx.pushOperation(operation);
    const receipt = await tx.send();
    await tx.wait();

    console.log(receipt);
});


it("uninstall module", async () => {
    const { operation: uninstall_module } = await accountContract["uninstall_module"]({
        module_type_id: 1,
        contract_id: modValidation.address
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
    expect(receipt.logs).toContain("[mod-validation] called module uninstall");

    const { result: r1 } = await accountContract["get_modules"]();
    expect(r1).toBeUndefined();

    const { result: r2 } = await accountContract["is_module_installed"]({
        module_type_id: 1,
        contract_id: modValidation.address
    });
    expect(r2).toBeUndefined();
});