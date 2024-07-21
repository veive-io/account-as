import { account } from "./proto/account";
import { Arrays, System, Storage, Protobuf } from "@koinos/sdk-as";
import { IModExecution, MODULE_EXECUTION_TYPE_ID, modexecution } from "@veive/mod-execution-as";
import { ArrayBytes } from "./utils";
import { MODULE_EXECUTION_SPACE_ID } from "./Constants";
import IModuleManager from "./IModuleManager";

export default class ModuleManagerExecution implements IModuleManager {

    contract_id: Uint8Array;

    constructor(
        contract_id: Uint8Array,
    ) {
        this.contract_id = contract_id;
    }

    get storage(): Storage.Map<Uint8Array, account.modules> {
        return new Storage.Map(
            this.contract_id,
            MODULE_EXECUTION_SPACE_ID,
            account.modules.decode,
            account.modules.encode,
            () => new account.modules()
        );
    }

    get default_selector(): modexecution.selector {
        return new modexecution.selector(1);
    }

    install_module(
        contract_id: Uint8Array,
        scopes: Uint8Array[],
        data: Uint8Array,
    ): void {
        const module_interface = new IModExecution(contract_id);
        const manifest = module_interface.manifest();

        System.require(manifest.type_id == MODULE_EXECUTION_TYPE_ID, "[account] wrong module_type_id");
        System.require(scopes.length > 0, "[account] missing scopes");
       
        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            const modules = this.storage.get(scope)! || new account.modules();
            if (ArrayBytes.includes(modules.value, contract_id) == false) {
                modules.value.push(contract_id);
            }
            this.storage.put(scope, modules);
        }

        module_interface.on_install(new modexecution.on_install_args(data));
    }

    uninstall_module(
        contract_id: Uint8Array,
        data: Uint8Array
    ): void {

        const module_interface = new IModExecution(contract_id);
        const module = module_interface.manifest();
        System.require(module.type_id == MODULE_EXECUTION_TYPE_ID, "[account] wrong module_type_id");

        const selectors = this._get_selectors_by_module(contract_id);
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            const current_modules = this.storage.get(selector)!;
            const new_modules = new account.modules();
            new_modules.value = ArrayBytes.remove(current_modules.value, contract_id);
            this.storage.put(selector, new_modules);
        }

        module_interface.on_uninstall(new modexecution.on_uninstall_args(data));
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

    is_module_installed(contract_id: Uint8Array): boolean {
        const selectors = this._get_selectors_by_module(contract_id);
        return selectors.length > 0;
    }

    /**
     * Executes the given operation using all registered executor modules.
     * 
     * @param operation The operation to be executed.
     */
    execute(operation: account.operation): void {
        const executors = this._get_modules_by_operation(operation);

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

    _get_selectors_by_module(contract_id: Uint8Array): Uint8Array[] {
        const result: Uint8Array[] = [];

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

    _get_selector_by_operation_level(operation: account.operation, level: u32): Uint8Array {
        let selector = this.default_selector;

        if (level == 3) {
            selector = new modexecution.selector(operation.entry_point, operation.contract_id);
        }
        else if (level == 2) {
            selector = new modexecution.selector(operation.entry_point);
        }

        return Protobuf.encode<modexecution.selector>(selector, modexecution.selector.encode);
    }

    _get_modules_by_operation(operation: account.operation): Uint8Array[] {
        const result: Uint8Array[] = [];

        const level3_selector = this._get_selector_by_operation_level(operation, 3);
        const level3_modules = this.storage.get(level3_selector);
        if (level3_modules) {
            for (let i = 0; i < level3_modules.value.length; i++) {
                result.push(level3_modules.value[i]);
            }
        }

        const level2_selector = this._get_selector_by_operation_level(operation, 2);
        const level2_modules = this.storage.get(level2_selector);
        if (level2_modules) {
            for (let j = 0; j < level2_modules.value.length; j++) {
                result.push(level2_modules.value[j]);
            }
        }

        const level1_selector = this._get_selector_by_operation_level(operation, 1);
        const level1_modules = this.storage.get(level1_selector);
        if (level1_modules) {
            for (let k = 0; k < level1_modules.value.length; k++) {
                result.push(level1_modules.value[k]);
            }
        }

        return result;
    }
}