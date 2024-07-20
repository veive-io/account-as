import { account } from "./proto/account";
import { MODULE_VALIDATION_SPACE_ID } from "./Constants";
import { Arrays, System } from "@koinos/sdk-as";
import ModuleManager from "./ModuleManager";
import { IModValidation, MODULE_VALIDATION_TYPE_ID, modvalidation } from "@veive/mod-validation-as";

export default class ModuleManagerValidation extends ModuleManager {

    constructor(contract_id: Uint8Array) {
        super(
            MODULE_VALIDATION_SPACE_ID,
            contract_id,
            MODULE_VALIDATION_TYPE_ID
        )
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