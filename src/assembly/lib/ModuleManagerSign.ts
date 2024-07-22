import { MODULE_SIGN_SPACE_ID } from "../Constants";
import { account } from "../proto/account";
import IModuleManager from "./IModuleManager";
import { System, Storage, Base58, Arrays } from "@koinos/sdk-as";
import { modsign, IModSign, MODULE_SIGN_TYPE_ID } from "@veive/mod-sign-as";

export default class ModuleManagerSign implements IModuleManager {

    contract_id: Uint8Array;

    constructor(contract_id: Uint8Array) {
        this.contract_id = contract_id;
    }

    get storage(): Storage.Obj<account.module_sign> {
        return new Storage.Obj(
          this.contract_id,
          MODULE_SIGN_SPACE_ID,
          account.module_sign.decode,
          account.module_sign.encode,
          () => new account.module_sign()
        );
    }

    install_module(contract_id: Uint8Array, scopes: Uint8Array[], data: Uint8Array): void {
        const module_interface = new IModSign(contract_id);
        const manifest = module_interface.manifest();

        System.require(manifest.type_id == MODULE_SIGN_TYPE_ID, "[account] wrong module_type_id");

        const module = new account.module_sign(contract_id);
        this.storage.put(module);
        module_interface.on_install(new modsign.on_install_args(data));
    }

    uninstall_module(contract_id: Uint8Array, data: Uint8Array): void {
        const module_interface = new IModSign(contract_id);
        const module = module_interface.manifest();

        System.require(module.type_id == MODULE_SIGN_TYPE_ID, "[account] wrong module_type_id");

        this.storage.remove();
        module_interface.on_uninstall(new modsign.on_uninstall_args(data));
    }

    get_modules(): Uint8Array[] {
        const result : Uint8Array[] = [];
        const module = this.storage.get();
        if (module && module.value) {
            result.push(module.value!);
        }

        return result;
    }

    is_module_installed(contract_id: Uint8Array): boolean {
        const module = this.storage.get();
        if (module && module.value && Arrays.equal(module.value, contract_id)) {
            return true;
        }

        return false;
    }

    /**
     * Validates the signature using all registered sign modules.
     * 
     * @param sender The sender's address.
     * @param signature The signature to validate.
     * @param tx_id The transaction ID.
     * @returns `true` if any sign module validates the signature successfully, otherwise `false`.
     */
    validate_signature(sender: Uint8Array, signature: Uint8Array, tx_id: Uint8Array): boolean {
        const module = this.storage.get();

        if (module && module.value) {
            System.log(`[account] selected sign ${Base58.encode(module.value!)}`);

            const args = new modsign.is_valid_signature_args();
            args.sender = sender;
            args.signature = signature;
            args.tx_id = tx_id;
            
            const module_interface = new IModSign(module.value!);
            const res = module_interface.is_valid_signature(args);
    
            if (res.value == true) {
                return true;
            }
        }

        System.log(`[account] no sign found`);

        return false;
    }

}