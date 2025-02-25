export default interface IModuleManager {
    contract_id: Uint8Array;

    install_module(contract_id: Uint8Array, scopes: Uint8Array[], data: Uint8Array): void;
    uninstall_module(contract_id: Uint8Array, data: Uint8Array): void;
    get_modules(): Uint8Array[];
    is_module_installed(contract_id: Uint8Array): boolean;
}