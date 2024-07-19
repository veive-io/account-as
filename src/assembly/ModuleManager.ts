import { Storage } from "@koinos/sdk-as";
import { account } from "./proto/account";
import { ArrayBytes, selector_encode } from "./utils";

export default class ModuleManager {

    contract_id: Uint8Array;
    module_type_id: u32;
    space_id: u32;

    constructor(
        space_id: u32,
        contract_id: Uint8Array, 
        module_type_id: u32,
    ) {
        this.space_id = space_id;
        this.contract_id = contract_id;
        this.module_type_id = module_type_id;
    }

    get storage(): Storage.Map<Uint8Array, account.modules> {
        return new Storage.Map(
            this.contract_id,
            this.space_id,
            account.modules.decode,
            account.modules.encode,
            () => new account.modules()
        );
    }

    get default_selector(): account.selector {
        return new account.selector(1);
    }

    get_modules(): Uint8Array[] {
        const result: Uint8Array[] = [];
        const selectors = this.storage.getManyKeys(new Uint8Array(0));

        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            const modules = this.storage.get(selector);

            if (modules && modules.value && modules.value.length > 0) {
                for (let j = 0; j < modules.value.length; j++) {
                    const current_contract_id = modules.value[j];
                    if (ArrayBytes.includes(result, current_contract_id) == false) {
                        result.push(current_contract_id);
                    }
                }
            }
        }

        return result;
    }

    remove_from_selector(
        selector: Uint8Array, 
        contract_id: Uint8Array
    ): void {
        const current_modules = this.storage.get(selector)!;
        const new_modules = new account.modules();
        new_modules.value = ArrayBytes.remove(new_modules.value, contract_id);
        this.storage.put(selector, current_modules);
    }

    add_to_selector(
        selector: Uint8Array, 
        contract_id: Uint8Array
    ): void {
        const modules = this.storage.get(selector)! || new account.modules();
        if (ArrayBytes.includes(modules.value, contract_id) == false) {
            modules.value.push(contract_id);
        }
        this.storage.put(selector, modules);
    }

    set_selectors(
        selectors: Uint8Array[], 
        contract_id: Uint8Array
    ): void {
        const current_selectors = this.get_selectors_by_module(contract_id);
        for (let i = 0; i < current_selectors.length; i++) {
            const current_selector = current_selectors[i];
            this.remove_from_selector(current_selector, contract_id);
        }

        for (let j = 0; j < selectors.length; j++) {
            const new_selector = selectors[j];
            this.add_to_selector(new_selector, contract_id);
        }
    }

    get_selectors_by_module(contract_id: Uint8Array): Uint8Array[] {
        const result : Uint8Array[] = [];

        const selectors = this.storage.getManyKeys(new Uint8Array(0));
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            const modules = this.storage.get(selector);

            if (modules && modules.value && ArrayBytes.includes(modules.value, contract_id) == true) {
                result.push(selector);
            }
        }

        return result;
    }

    get_modules_by_selector(selector: Uint8Array): Uint8Array[] {
        const result : Uint8Array[] = [];

        const selectors = this.storage.getManyKeys(new Uint8Array(0));
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            const modules = this.storage.get(selector);

            if (modules && modules.value && modules.value.length > 0) {
                for (let k = 0; k < modules.value.length; k++) {
                    const module = modules.value[k];
                    if (ArrayBytes.includes(result, module) == false) {
                        result.push(module);
                    }
                }
            }
        }

        return result;
    }

    get_modules_by_operation_3(operation: account.operation): Uint8Array[] {
        const level3_selector = new account.selector(operation.entry_point, operation.contract_id);
        const level3_selector_bytes = selector_encode(level3_selector);
        return this.get_modules_by_selector(level3_selector_bytes);
    }

    get_modules_by_operation_2(operation: account.operation): Uint8Array[] {
        const level2_selector = new account.selector(operation.entry_point);
        const level2_selector_bytes = selector_encode(level2_selector);
        return this.get_modules_by_selector(level2_selector_bytes);
    }

    get_modules_by_operation_1(operation: account.operation): Uint8Array[] {
        const level1_selector = this.default_selector;
        const level1_selector_bytes = selector_encode(level1_selector);
        return this.get_modules_by_selector(level1_selector_bytes);
    }

    get_modules_by_operation(operation: account.operation): Uint8Array[] {
        const result = [];
        return result;
    }

    is_module_installed(contract_id: Uint8Array): boolean {
        const selectors = this.get_selectors_by_module(contract_id);
        return selectors.length > 0;
    }
}