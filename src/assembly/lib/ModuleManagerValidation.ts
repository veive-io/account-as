import { account } from "../proto/account";
import { Arrays, System, Storage, Protobuf, Base58, authority } from "@koinos/sdk-as";
import { ArrayBytes } from "./utils";
import IModuleManager from "./IModuleManager";
import { IModValidation, MODULE_VALIDATION_TYPE_ID, modvalidation } from "@veive-io/mod-validation-as";
import { MODULE_VALIDATION_SPACE_ID } from "../Constants";

export default class ModuleManagerValidation implements IModuleManager {

    contract_id: Uint8Array;

    constructor(contract_id: Uint8Array) {
        this.contract_id = contract_id;
    }

    get storage(): Storage.Map<Uint8Array, account.module_validation> {
        return new Storage.Map(
            this.contract_id,
            MODULE_VALIDATION_SPACE_ID,
            account.module_validation.decode,
            account.module_validation.encode,
            () => new account.module_validation()
        );
    }

    install_module(
        contract_id: Uint8Array,
        scopes: Uint8Array[],
        data: Uint8Array,
    ): void {
        const module_interface = new IModValidation(contract_id);
        const manifest = module_interface.manifest();

        System.require(manifest.type_id == MODULE_VALIDATION_TYPE_ID, "[account] wrong module_type_id");
        System.require(scopes.length > 0, "[account] missing scopes");

        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            const module = new account.module_validation(contract_id);
            this.storage.put(scope, module);
        }

        module_interface.on_install(new modvalidation.on_install_args(data));
    }

    uninstall_module(
        contract_id: Uint8Array,
        data: Uint8Array
    ): void {
        const module_interface = new IModValidation(contract_id);
        const module = module_interface.manifest();
        System.require(module.type_id == MODULE_VALIDATION_TYPE_ID, "[account] wrong module_type_id");

        const scopes = this._get_scopes_by_module(contract_id);
        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            this.storage.remove(scope);
        }

        module_interface.on_uninstall(new modvalidation.on_uninstall_args(data));
    }

    get_modules(): Uint8Array[] {
        const result: Uint8Array[] = [];
        const modules = this.storage.getManyValues(new Uint8Array(0));

        if (modules && modules.length > 0) {
            for (let j = 0; j < modules.length; j++) {
                const module = modules[j].value!;
                if (ArrayBytes.includes(result, module) == false) {
                    result.push(module);
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
            const module = this.storage.get(scope);

            if (module && module.value && Arrays.equal(module.value, contract_id) == true) {
                result.push(scope);
            }
        }

        return result;
    }

    _get_scope_by_level(operation: authority.call_data, level: u32): Uint8Array {
        let scope = new modvalidation.scope('contract_call');

        if (level == 3) {
            scope = new modvalidation.scope('contract_call', operation.entry_point, operation.contract_id);
        }
        else if (level == 2) {
            scope = new modvalidation.scope('contract_call', operation.entry_point);
        }

        return Protobuf.encode<modvalidation.scope>(scope, modvalidation.scope.encode);
    }

    _get_module_by_call_data(operation: authority.call_data): Uint8Array|null {
        const level3_scope = this._get_scope_by_level(operation, 3);
        const level3_module = this.storage.get(level3_scope);
        if (level3_module && level3_module.value) {
            System.log(`[account] selected scope contract_call + ${operation.entry_point.toString()} + ${Base58.encode(operation.contract_id)}`);
            return level3_module.value;
        }

        const level2_scope = this._get_scope_by_level(operation, 2);
        const level2_module = this.storage.get(level2_scope);
        if (level2_module && level2_module.value) {
            System.log(`[account] selected scope contract_call + ${operation.entry_point.toString()}`);
            return level2_module.value;
        }

        const level1_scope = this._get_scope_by_level(operation, 1);
        const level1_module = this.storage.get(level1_scope);
        if (level1_module && level1_module.value) {
            System.log(`[account] selected scope contract_call`);
            return level1_module.value;
        }

        return null;
    }

    authorize(args: authority.authorize_arguments): boolean {
        let module : Uint8Array|null = null;

        if (args.type == authority.authorization_type.contract_call) {
            module = module = this._get_module_by_call_data(args.call!);
        }
        else if (args.type == authority.authorization_type.contract_upload) {
            System.log(`[account] selected scope contract_upload`);
            const scope = new modvalidation.scope('contract_upload');
            const scope_encoded = Protobuf.encode<modvalidation.scope>(scope, modvalidation.scope.encode);
            module = this.storage.get(scope_encoded)!.value;
        }
        else if (args.type == authority.authorization_type.transaction_application) {
            System.log(`[account] selected scope transaction_application`);
            const scope = new modvalidation.scope('transaction_application');
            const scope_encoded = Protobuf.encode<modvalidation.scope>(scope, modvalidation.scope.encode);
            module = this.storage.get(scope_encoded)!.value;
        }

        if (module != null) {
            System.log(`[account] selected validator ${Base58.encode(module)}`);

            const caller = System.getCaller().caller;
            if (caller && caller.length > 0 && Arrays.equal(caller, module)) {
                System.log(`[account] validation same caller ${Base58.encode(caller)}`)
                return false;
            }

            const mod_args = new modvalidation.authorize_arguments();
            mod_args.type = args.type;

            if (args.type == authority.authorization_type.contract_call && args.call != null) {
                mod_args.call = new modvalidation.call_data();
                mod_args.call!.caller = args.call!.caller;
                mod_args.call!.contract_id = args.call!.contract_id;
                mod_args.call!.entry_point = args.call!.entry_point;
                mod_args.call!.data = args.call!.data;
            }

            const module_interface = new IModValidation(module);
            const res = module_interface.is_authorized(mod_args);

            System.log(`[account] operation_type=${args.type}, ${args.type == authority.authorization_type.contract_call ? 'entry_point='+args.call!.entry_point.toString() : ''} authorization ${res.value == true ? 'ok' : 'nok'}`);

            return res.value;
        }

        System.log(`[account] no validation found, skip`);

        return true;
    }
}