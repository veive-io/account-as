import { account } from "./proto/account";
import ModuleManager from "./ModuleManager";
import { MODULE_EXECUTION_SPACE_ID } from "./Constants";
import { Arrays, System } from "@koinos/sdk-as";
import { IModExecution, MODULE_EXECUTION_TYPE_ID, modexecution } from "@veive/mod-execution-as";

export default class ModuleManagerExecution extends ModuleManager {

    constructor(contract_id: Uint8Array) {
        super(
            MODULE_EXECUTION_SPACE_ID,
            contract_id,
            MODULE_EXECUTION_TYPE_ID
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
     * Executes the given operation using all registered executor modules.
     * 
     * @param operation The operation to be executed.
     */
    execute(operation: account.operation): void {
        const executors = this.get_modules();

        if (executors && executors.length > 0) {
            const caller = System.getCaller().caller;

            for (let i = 0; i < executors.length; i++) {
                if (caller && caller.length > 0 && Arrays.equal(caller, executors[i])) {
                    continue;
                }

                const args = new modexecution.execute_args();
                const op = new modexecution.operation();
                op.contract_id = operation.contract_id;
                op.entry_point = operation.entry_point;
                op.args = operation.args;
                args.operation = op;

                const module = new IModExecution(executors[i]);
                module.execute(args);
            }
        }
    }
}