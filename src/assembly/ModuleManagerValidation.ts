import { account } from "./proto/account";
import { Arrays, System, Storage, Protobuf } from "@koinos/sdk-as";
import { ArrayBytes } from "./utils";
import IModuleManager from "./IModuleManager";
import { IModHooks, MODULE_HOOKS_TYPE_ID, modhooks } from "@veive/mod-hooks-as";
import { IModValidation, MODULE_VALIDATION_TYPE_ID, modvalidation } from "@veive/mod-validation-as";

export default class ModuleManagerHooks implements IModuleManager {

    contract_id: Uint8Array;

    constructor(
        contract_id: Uint8Array,
    ) {
        this.contract_id = contract_id;
    }

    get storage(): Storage.Map<Uint8Array, account.module_validation> {
        return new Storage.Map(
            this.contract_id,
            MODULE_VALIDATION_TYPE_ID,
            account.module_validation.decode,
            account.module_validation.encode,
            () => new account.module_validation()
        );
    }

    get default_selector(): modhooks.selector {
        return new modhooks.selector(1);
    }

    install_module(
        contract_id: Uint8Array,
        scopes: Uint8Array[],
        data: Uint8Array,
    ): void {
        const module_interface = new IModHooks(contract_id);
        const manifest = module_interface.manifest();

        System.require(manifest.type_id == MODULE_HOOKS_TYPE_ID, "[account] wrong module_type_id");

        if (scopes.length > 0) {
            for (let i = 0; i < manifest.selectors.length; i++) {
                const scope = scopes[i];
                const module = new account.module_validation(contract_id);
                this.storage.put(scope, module);
            }
        }

        module_interface.on_install(new modhooks.on_install_args(data));
    }

    uninstall_module(
        contract_id: Uint8Array,
        data: Uint8Array
    ): void {

        const module_interface = new IModHooks(contract_id);
        const module = module_interface.manifest();
        System.require(module.type_id == MODULE_HOOKS_TYPE_ID, "[account] wrong module_type_id");

        const selectors = this._get_selectors_by_module(contract_id);
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            this.storage.remove(selector);
        }

        module_interface.on_uninstall(new modhooks.on_uninstall_args(data));
    }

    get_modules(): Uint8Array[] {
        const result: Uint8Array[] = [];
        const selectors = this.storage.getManyValues(new Uint8Array(0));

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

    is_module_installed(contract_id: Uint8Array): boolean {
        const selectors = this._get_selectors_by_module(contract_id);
        return selectors.length > 0;
    }

    _get_selectors_by_module(contract_id: Uint8Array): Uint8Array[] {
        const result: Uint8Array[] = [];

        const selectors = this.storage.getManyKeys(new Uint8Array(0));
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            const module = this.storage.get(selector);

            if (module && module.value && Arrays.equal(module.value, contract_id) == true) {
                result.push(selector);
            }
        }

        return result;
    }

    _get_selector_by_operation_level(operation: account.operation, level: u32): Uint8Array {
        let selector = this.default_selector;

        if (level == 3) {
            selector = new modhooks.selector(operation.entry_point, operation.contract_id);
        }
        else if (level == 2) {
            selector = new modhooks.selector(operation.entry_point);
        }

        return Protobuf.encode<modhooks.selector>(selector, modhooks.selector.encode);
    }

    _get_module_by_operation(operation: account.operation): Uint8Array|null {
        const level3_selector = this._get_selector_by_operation_level(operation, 3);
        const level3_module = this.storage.get(level3_selector);
        if (level3_module) {
            return level3_module.value;
        }

        const level2_selector = this._get_selector_by_operation_level(operation, 2);
        const level2_module = this.storage.get(level2_selector);
        if (level2_module) {
            return level2_module.value;
        }

        const level1_selector = this._get_selector_by_operation_level(operation, 1);
        const level1_module = this.storage.get(level1_selector);
        if (level1_module) {
            return level1_module.value;
        }

        return null;
    }

    validate_operation(operation: account.operation): boolean {
        const validator = this._get_module_by_operation(operation);

        if (validator != null) {
            const caller = System.getCaller().caller;

            const op = new modvalidation.operation();
            op.contract_id = operation.contract_id;
            op.entry_point = operation.entry_point;
            op.args = operation.args;

            const args = new modvalidation.is_valid_operation_args(op);
            if (caller && caller.length > 0 && Arrays.equal(caller, validator)) {
                return true;
            }

            const module = new IModValidation(validator);
            const res = module.is_valid_operation(args);

            if (res.value == true) {
                return true;
            }

            // the first time you don't have validators and you need to install the first module
        } else {
            return true;
        }

        return false;
    }
}