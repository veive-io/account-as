import { account } from "./proto/account";
import ModuleManager from "./ModuleManager";
import { MODULE_HOOKS_SPACE_ID } from "./Constants";
import { Arrays, System } from "@koinos/sdk-as";
import { IModHooks, MODULE_HOOKS_TYPE_ID, modhooks } from "@veive/mod-hooks-as";

export default class ModuleManagerHooks extends ModuleManager {

    constructor(contract_id: Uint8Array) {
        super(
            MODULE_HOOKS_SPACE_ID,
            contract_id,
            MODULE_HOOKS_TYPE_ID
        )
    }

    get_modules_by_operation(operation: account.operation): Uint8Array[] {
        const result: Uint8Array[] = [];

        const level3_selector = this.get_selector_by_operation(operation, 3);
        const level3_modules = this.get_modules_by_selector(level3_selector);
        for (let i = 0; i < level3_modules.length; i++) {
            result.push(level3_modules[i]);
        }

        const level2_selector = this.get_selector_by_operation(operation, 2);
        const level2_modules = this.get_modules_by_selector(level2_selector);
        for (let j = 0; j < level2_modules.length; j++) {
            result.push(level2_modules[j]);
        }

        const level1_selector = this.get_selector_by_operation(operation, 1);
        const level1_modules = this.get_modules_by_selector(level1_selector);
        for (let k = 0; k < level1_modules.length; k++) {
            result.push(level1_modules[k]);
        }
        return result;
    }

    /**
     * Performs pre-checks using all registered hook modules.
     * 
     * @param operation The operation to be pre-checked.
     * @returns An array of pre-check data returned by each hook module.
     */
    pre_check(operation: account.operation): Uint8Array[] {
        const modules = this.get_modules();
        const data: Uint8Array[] = [];

        if (modules && modules.length > 0) {
            const caller = System.getCaller().caller;

            for (let i = 0; i < modules.length; i++) {
                if (caller && caller.length > 0 && Arrays.equal(caller, modules[i])) {
                    continue;
                }

                const args = new modhooks.pre_check_args();
                const op = new modhooks.operation();
                op.contract_id = operation.contract_id;
                op.entry_point = operation.entry_point;
                op.args = operation.args;

                args.operation = op;
                args.sender = caller;

                const module = new IModHooks(modules[i]);
                const res = module.pre_check(args);

                if (res && res.value && res.value!.length > 0) {
                    data.push(res.value!);
                } else {
                    data.push(new Uint8Array(0));
                }   
            }
        }

        return data;
    }

    /**
     * Performs post-checks using all registered hook modules.
     * 
     * @param preCheckData The array of pre-check data returned by each hook module during the pre-check phase.
     */
    post_check(preCheckData: Uint8Array[]): void {
        const modules = this.get_modules();

        if (modules && modules.length > 0) {
            const caller = System.getCaller().caller;

            for (let i = 0; i < modules.length; i++) {
                if (caller && caller.length > 0 && Arrays.equal(caller, modules[i])) {
                    continue;
                }

                const args = new modhooks.post_check_args();
                args.data = preCheckData[i];

                const module = new IModHooks(modules[i]);
                module.post_check(args);
            }
        }
    }
}