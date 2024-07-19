import { IModValidation, MODULE_VALIDATION_TYPE_ID, modvalidation } from "@veive/mod-validation-as";
import { System, Storage, Arrays, Protobuf } from "@koinos/sdk-as";
import { MODULE_VALIDATION_SPACE_ID } from "./Constants";
import { account } from "./proto/account";


export default class ValidationModuleManager {

    contract_id: Uint8Array;

    constructor(contract_id: Uint8Array) {
        this.contract_id = contract_id;
    }

    get storage(): Storage.Map<Uint8Array, account.selector_mods> {
        return new Storage.Map(
            this.contract_id,
            MODULE_VALIDATION_SPACE_ID,
            account.selector_mods.decode,
            account.selector_mods.encode,
            () => new account.selector_mods()
        );
    }

    get default_selector(): account.selector {
        const selector = new account.selector();
        selector.entry_point = 1;
        return selector;
    }

    install_module(contract_id: Uint8Array, data: Uint8Array): void {
        const validator = new IModValidation(contract_id);
        const validator_manifest = validator.manifest();
        System.require(validator_manifest.type_id == MODULE_VALIDATION_TYPE_ID, "[account] wrong module_type_id");
        System.require(validator_manifest.selectors.length > 0, "[account] missing selectors");

        if (validator_manifest.selectors && validator_manifest.selectors.length > 0) {
            for (let i = 0; i < validator_manifest.selectors.length; i++) {
                const selector = Protobuf.encode<modvalidation.selector>(validator_manifest.selectors[i], modvalidation.selector.encode);
                this.add_to_selector(selector, contract_id);
            }
        }

        validator.on_install(new modvalidation.on_install_args(data));
    }

    uninstall_module(contract_id: Uint8Array, data: Uint8Array): void {
        const validator = new IModValidation(contract_id);
        const validator_manifest = validator.manifest();
        System.require(validator_manifest.type_id == MODULE_VALIDATION_TYPE_ID, "[account] wrong module_type_id");

        const selectors = this.get_module_selectors(contract_id);
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            this.remove_from_selector(selector, contract_id);
        }
        validator.on_uninstall(new modvalidation.on_uninstall_args(data));
    }

    get_modules(): Uint8Array[] {
        const result: Uint8Array[] = [];

        const selectors = this.storage.getManyKeys(new Uint8Array(0));

        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            const selector_mods = this.storage.get(selector);

            if (selector_mods && selector_mods.mods && selector_mods.mods.length > 0) {
                for (let j = 0; j < selector_mods.mods.length; j++) {
                    const current_contract_id = selector_mods.mods[j];
                    if (arrayIncludesBytes(result, current_contract_id) == false) {
                        result.push(current_contract_id);
                    }
                }
            }
        }

        return result;
    }

    remove_from_selector(selector: Uint8Array, contract_id: Uint8Array): void {
        const selector_mods = this.storage.get(selector)!;
        const new_mods = new account.selector_mods();
        new_mods.mods = arrayRemoveBytes(selector_mods.mods, contract_id);
        this.storage.put(selector, new_mods);
    }

    add_to_selector(selector: Uint8Array, contract_id: Uint8Array): void {
        const selector_mods = this.storage.get(selector)! || new account.selector_mods();
        if (selector_mods.mods.includes(contract_id) == false) {
            selector_mods.mods.push(contract_id);
        }
        this.storage.put(selector, selector_mods);
    }

    set_selectors(selectors: Uint8Array[], contract_id: Uint8Array): void {
        const current_selectors = this.get_module_selectors(contract_id);
        for (let i = 0; i < current_selectors.length; i++) {
            const current_selector = current_selectors[i];
            this.remove_from_selector(current_selector, contract_id);
        }

        for (let j = 0; j < selectors.length; j++) {
            const new_selector = selectors[j];
            this.add_to_selector(new_selector, contract_id);
        }
    }

    get_module_selectors(contract_id: Uint8Array): Uint8Array[] {
        const result: Uint8Array[] = [];

        const selectors = this.storage.getManyKeys(new Uint8Array(0));
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            const selector_mods = this.storage.get(selector);

            if (selector_mods && selector_mods.mods && arrayIncludesBytes(selector_mods.mods, contract_id) == true) {
                result.push(selector);
            }
        }

        return result;
    }

    get_operation_modules(operation: account.operation): Uint8Array[] {
        const result: Uint8Array[] = [];

        const default_selector_bytes = this.encode_selector(this.default_selector);
        const default_mods = this.storage.get(default_selector_bytes);
        if (default_mods && default_mods.mods && default_mods.mods.length > 0) {
            for (let i = 0; i < default_mods.mods.length; i++) {
                result.push(default_mods.mods[i]);
            }
        }

        const entry_point_selector = new account.selector();
        entry_point_selector.entry_point = operation.entry_point;
        const entry_point_mods = this.storage.get(this.encode_selector(entry_point_selector));
        if (entry_point_mods && entry_point_mods.mods && entry_point_mods.mods.length > 0) {
            for (let j = 0; j < entry_point_mods.mods.length; j++) {
                result.push(entry_point_mods.mods[j]);
            }
        }

        const contract_id_selector = new account.selector();
        contract_id_selector.entry_point = operation.entry_point;
        contract_id_selector.contract_id = operation.contract_id;
        const contract_id_mods = this.storage.get(this.encode_selector(contract_id_selector));

        if (contract_id_mods && contract_id_mods.mods && contract_id_mods.mods.length > 0) {
            for (let k = 0; k < contract_id_mods.mods.length; k++) {
                result.push(contract_id_mods.mods[k]);
            }
        }

        return result;
    }

    is_module_installed(contract_id: Uint8Array): boolean {
        const selectors = this.get_module_selectors(contract_id);
        return selectors.length > 0;
    }

    encode_selector(selector: account.selector): Uint8Array {
        return Protobuf.encode<account.selector>(selector, account.selector.encode);
    }
}

export function concatenateBytes(bytes1: Uint8Array, bytes2: Uint8Array): Uint8Array {
    const result = new Uint8Array(bytes1.length + bytes2.length);
    result.set(bytes1, 0);
    result.set(bytes2, bytes1.length);
    return result;
}

export function arrayIncludesBytes(array: Uint8Array[], bytes: Uint8Array): boolean {
    for (let i = 0; i < array.length; i++) {
        if (Arrays.equal(array[i], bytes)) {
            return true;
        }
    }

    return false;
}

export function arrayRemoveBytes(array: Uint8Array[], bytes: Uint8Array): Uint8Array[] {
    const result: Uint8Array[] = [];

    for (let i = 0; i < result.length; i++) {
        const item = result[i];
        if (Arrays.equal(item, bytes) == false) {
            result.push(item);
        }
    }

    return result;
}