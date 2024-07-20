import { IModValidation, MODULE_VALIDATION_TYPE_ID, modvalidation } from "@veive/mod-validation-as";
import { account } from "./proto/account";
import { MODULE_VALIDATION_SPACE_ID } from "./Constants";
import { selector_encode } from "./utils";
import { Arrays, System } from "@koinos/sdk-as";
import ModuleManager from "./ModuleManager";

export default class ModuleManagerValidation extends ModuleManager {

    constructor(contract_id: Uint8Array) {
        super(
            MODULE_VALIDATION_SPACE_ID,
            contract_id,
            MODULE_VALIDATION_TYPE_ID
        )
    }

    install_module(
        contract_id: Uint8Array,
        data: Uint8Array
    ): void {
        const module_interface = new IModValidation(contract_id);
        const manifest = module_interface.manifest();

        System.require(manifest.type_id == this.module_type_id, "[account] wrong module_type_id");
        System.require(manifest.selectors.length > 0, "[account] missing selectors");

        if (manifest.selectors && manifest.selectors.length > 0) {
            for (let i = 0; i < manifest.selectors.length; i++) {
                const manifest_selector = manifest.selectors[i];
                const selector = new account.selector(manifest_selector.entry_point, manifest_selector.contract_id);
                const selector_bytes = selector_encode(selector);
                this.add_to_selector(selector_bytes, contract_id);
            }
        }

        module_interface.on_install(new modvalidation.on_install_args(data));
    }

    uninstall_module(
        contract_id: Uint8Array,
        data: Uint8Array
    ): void {
        const module_interface = new IModValidation(contract_id);
        const module = module_interface.manifest();
        System.require(module.type_id == this.module_type_id, "[account] wrong module_type_id");

        const selectors = this.get_selectors_by_module(contract_id);
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            this.remove_from_selector(selector, contract_id);
        }

        module_interface.on_uninstall(new modvalidation.on_uninstall_args(data));
    }

    add_to_selector(
        selector: Uint8Array,
        contract_id: Uint8Array
    ): void {
        const modules = this.storage.get(selector)! || new account.modules();
        modules.value = [contract_id];
        this.storage.put(selector, modules);
    }

    get_modules_by_operation(operation: account.operation): Uint8Array[] {
        const result: Uint8Array[] = [];

        const level3_selector = this.get_selector_by_operation(operation, 3);
        const level3_modules = this.get_modules_by_selector(level3_selector);
        if (level3_modules.length > 0) {
            return level3_modules;
        }

        const level2_selector = this.get_selector_by_operation(operation, 2);
        const level2_modules = this.get_modules_by_selector(level2_selector);
        if (level2_modules.length > 0) {
            return level2_modules;
        }

        const level1_selector = this.get_selector_by_operation(operation, 1);
        const level1_modules = this.get_modules_by_selector(level1_selector);
        if (level1_modules.length > 0) {
            return level1_modules;
        }

        return result;
    }

    validate_operation(operation: account.operation): boolean {
        const validators = this.get_modules_by_operation(operation);

        if (validators.length > 0) {
            const validator = validators[0];
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