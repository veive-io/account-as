import { IModValidation, MODULE_VALIDATION_TYPE_ID, modvalidation } from "@veive/mod-validation-as";
import { account } from "./proto/account";
import ModuleManager from "./ModuleManager";
import { MODULE_VALIDATION_SPACE_ID } from "./Constants";
import { selector_encode } from "./utils";
import { System } from "@koinos/sdk-as";

export default class ValidationModuleManager extends ModuleManager {

    constructor(contract_id: Uint8Array) {
        super(
            MODULE_VALIDATION_SPACE_ID,
            contract_id,
            MODULE_VALIDATION_TYPE_ID,
            //new IModValidation(contract_id)
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
        const result : Uint8Array[] = [];

        const level3 = this.get_modules_by_operation_3(operation);
        if (level3.length > 0) {
            return level3;
        }

        const level2 = this.get_modules_by_operation_2(operation);
        if (level2.length > 0) {
            return level2;
        }

        const level1 = this.get_modules_by_operation_1(operation);
        if (level1.length > 0) {
            return level1;
        }

        return result;
    }
}