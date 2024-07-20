import { account } from "./proto/account";
import ModuleManager from "./ModuleManager";
import { MODULE_EXECUTION_SPACE_ID } from "./Constants";
import { selector_encode } from "./utils";
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

    install_module(
        contract_id: Uint8Array,
        data: Uint8Array
    ): void {
        const module_interface = new IModExecution(contract_id);
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

        module_interface.on_install(new modexecution.on_install_args(data));
    }

    uninstall_module(
        contract_id: Uint8Array,
        data: Uint8Array
    ): void {
        const module_interface = new IModExecution(contract_id);
        const module = module_interface.manifest();
        System.require(module.type_id == this.module_type_id, "[account] wrong module_type_id");

        const selectors = this.get_selectors_by_module(contract_id);
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            this.remove_from_selector(selector, contract_id);
        }

        module_interface.on_uninstall(new modexecution.on_uninstall_args(data));
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