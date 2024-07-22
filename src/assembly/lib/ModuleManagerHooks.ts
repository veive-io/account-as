import { account } from "../proto/account";
import { Arrays, System, Storage, Protobuf } from "@koinos/sdk-as";
import { ArrayBytes } from "./utils";
import IModuleManager from "./IModuleManager";
import { IModHooks, MODULE_HOOKS_TYPE_ID, modhooks } from "@veive/mod-hooks-as";
import { MODULE_HOOKS_SPACE_ID } from "../Constants";

export default class ModuleManagerHooks implements IModuleManager {

    contract_id: Uint8Array;

    constructor(contract_id: Uint8Array) {
        this.contract_id = contract_id;
    }

    get storage(): Storage.Map<Uint8Array, account.modules_hooks> {
        return new Storage.Map(
            this.contract_id,
            MODULE_HOOKS_SPACE_ID,
            account.modules_hooks.decode,
            account.modules_hooks.encode,
            () => new account.modules_hooks()
        );
    }

    get default_scope(): modhooks.scope {
        return new modhooks.scope(1);
    }

    install_module(
        contract_id: Uint8Array,
        scopes: Uint8Array[],
        data: Uint8Array,
    ): void {
        const module_interface = new IModHooks(contract_id);
        const manifest = module_interface.manifest();

        System.require(manifest.type_id == MODULE_HOOKS_TYPE_ID, "[account] wrong module_type_id");
        System.require(scopes.length > 0, "[account] missing scopes");

        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            const modules = this.storage.get(scope)! || new account.modules_hooks();
            if (ArrayBytes.includes(modules.value, contract_id) == false) {
                modules.value.push(contract_id);
            }
            this.storage.put(scope, modules);
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

        const scopes = this._get_scopes_by_module(contract_id);
        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            const current_modules = this.storage.get(scope)!;
            const new_modules = new account.modules_hooks();
            new_modules.value = ArrayBytes.remove(current_modules.value, contract_id);
            this.storage.put(scope, new_modules);
        }

        module_interface.on_uninstall(new modhooks.on_uninstall_args(data));
    }

    get_modules(): Uint8Array[] {
        const result: Uint8Array[] = [];
        const scopes = this.storage.getManyKeys(new Uint8Array(0));

        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            const modules = this.storage.get(scope);

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
        const scopes = this._get_scopes_by_module(contract_id);
        return scopes.length > 0;
    }

    _get_scopes_by_module(contract_id: Uint8Array): Uint8Array[] {
        const result: Uint8Array[] = [];

        const scopes = this.storage.getManyKeys(new Uint8Array(0));
        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            const modules = this.storage.get(scope);

            if (modules && modules.value && ArrayBytes.includes(modules.value, contract_id) == true) {
                result.push(scope);
            }
        }

        return result;
    }

    _get_scope_by_operation_level(operation: account.operation, level: u32): Uint8Array {
        let scope = this.default_scope;

        if (level == 3) {
            scope = new modhooks.scope(operation.entry_point, operation.contract_id);
        }
        else if (level == 2) {
            scope = new modhooks.scope(operation.entry_point);
        }

        return Protobuf.encode<modhooks.scope>(scope, modhooks.scope.encode);
    }

    _get_modules_by_operation(operation: account.operation): Uint8Array[] {
        const result: Uint8Array[] = [];

        const level3_scope = this._get_scope_by_operation_level(operation, 3);
        const level3_modules = this.storage.get(level3_scope);
        if (level3_modules) {
            for (let i = 0; i < level3_modules.value.length; i++) {
                result.push(level3_modules.value[i]);
            }
        }

        const level2_scope = this._get_scope_by_operation_level(operation, 2);
        const level2_modules = this.storage.get(level2_scope);
        if (level2_modules) {
            for (let j = 0; j < level2_modules.value.length; j++) {
                result.push(level2_modules.value[j]);
            }
        }

        const level1_scope = this._get_scope_by_operation_level(operation, 1);
        const level1_modules = this.storage.get(level1_scope);
        if (level1_modules) {
            for (let k = 0; k < level1_modules.value.length; k++) {
                result.push(level1_modules.value[k]);
            }
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