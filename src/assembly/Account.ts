import { System, Storage, authority, Arrays } from "@koinos/sdk-as";
import { modhooks, IModHooks, MODULE_HOOKS_TYPE_ID } from "@veive/mod-hooks-as";
import { modexecution, IModExecution, MODULE_EXECUTION_TYPE_ID } from "@veive/mod-execution-as";
import { modvalidation, IModValidation, MODULE_VALIDATION_TYPE_ID } from "@veive/mod-validation-as";
import { modsign, IModSign, MODULE_SIGN_TYPE_ID } from "@veive/mod-sign-as";
import { account } from "./proto/account";
import { 
  MODULE_HOOKS_SPACE_ID, 
  MODULE_EXECUTION_SPACE_ID,
  MODULE_SIGN_SPACE_ID
} from "./Constants";
import ModuleManagerValidation from "./ModuleManagerValidation";
import ModuleManagerHooks from "./ModuleManagerHooks";
import ModuleManagerExecution from "./ModuleManagerExecution";

export class Account {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array = System.getContractId();

  mod_sign: Storage.Map<Uint8Array, account.mod> =
    new Storage.Map(
      this.contractId,
      MODULE_SIGN_SPACE_ID,
      account.mod.decode,
      account.mod.encode,
      () => new account.mod()
    );

  mod_hooks: Storage.Map<Uint8Array, account.mod> =
    new Storage.Map(
      this.contractId,
      MODULE_HOOKS_SPACE_ID,
      account.mod.decode,
      account.mod.encode,
      () => new account.mod()
    );

  mod_execution: Storage.Map<Uint8Array, account.mod> =
    new Storage.Map(
      this.contractId,
      MODULE_EXECUTION_SPACE_ID,
      account.mod.decode,
      account.mod.encode,
      () => new account.mod()
    );

  /**
   * Executes the given operation after performing pre-checks and post-checks.
   * 
   * This method ensures that the caller is not itself and is not a registered execution module,
   * performs pre-checks using all registered hook modules, executes the operation using all registered executor modules,
   * and performs post-checks using all registered hook modules.
   * 
   * @external
   */
  execute(args: account.execute_args): void {
    this._require_valid_operation(args.operation!);
    this._require_not_self();
    this._require_not_executor();

    const module_manager_hooks = new ModuleManagerHooks(this.contractId);
    const data = module_manager_hooks.pre_check(args.operation!);

    const module_manager_execution = new ModuleManagerExecution(this.contractId);
    module_manager_execution.execute(args.operation!);

    module_manager_hooks.post_check(data);
  }

  /**
   * Executes the given operation if the caller is a registered execution module.
   * 
   * This method ensures that the caller is not itself and is a registered execution module,
   * performs pre-checks using all registered hook modules, executes the operation using all registered executor modules,
   * and performs post-checks using all registered hook modules.
   * 
   * @external
   */
  execute_executor(args: account.execute_executor_args): void {
    this._require_valid_operation(args.operation!);
    this._require_not_self();
    this._require_only_xecutor();

    const module_manager_hooks = new ModuleManagerHooks(this.contractId);
    const data = module_manager_hooks.pre_check(args.operation!);

    const module_manager_execution = new ModuleManagerExecution(this.contractId);
    module_manager_execution.execute(args.operation!);

    module_manager_hooks.post_check(data);
  }

  /**
   * Executes a user operation directly.
   * 
   * This method ensures that the caller is allowed, and then directly calls the contract's entry point with the provided arguments.
   * 
   * @external
   */
  execute_user(args: account.execute_user_args): void {
    this._require_valid_operation(args.operation!);
    this._require_not_caller();

    let call_args = new Uint8Array(0);
    if (args.operation!.args && args.operation!.args!.length > 0) {
      call_args = args.operation!.args!;
    }

    System.call(
      args.operation!.contract_id!,
      args.operation!.entry_point,
      call_args
    );
  }

  /**
   * Installs a new module of the specified type.
   * This method adds a new module to the appropriate storage map based on the module type.
   * 
   * @external
   */
  install_module(args: account.install_module_args): void {
    this._require_only_self();

    let data = new Uint8Array(0);
    if (args.data && args.data!.length > 0) {
      data = args.data!;
    }

    const mod_manager = new ModuleManagerValidation(this.contractId);
    mod_manager.install_module(args.contract_id!, data);
  }
  
  /**
   * Uninstalls a module of the specified type.
   * 
   * This method removes a module from the appropriate storage map based on the module type.
   * 
   * @external
   */
  uninstall_module(args: account.uninstall_module_args): void {
    this._require_only_self();

    let data = new Uint8Array(0);
    if (args.data && args.data!.length > 0) {
      data = args.data!;
    }

    const mod_manager = new ModuleManagerValidation(this.contractId);
    mod_manager.uninstall_module(args.contract_id!, data);
  }

  /**
   * Checks if a module is installed.
   * 
   * This method returns a boolean indicating whether the specified module is installed, based on the module type.
   * 
   * @external
   * @readonly
   */
  is_module_installed(args: account.is_module_installed_args): account.is_module_installed_result {
    const result = new account.is_module_installed_result(false);

    switch (args.module_type_id) {
      case MODULE_VALIDATION_TYPE_ID:
        const mod_manager_validation = new ModuleManagerValidation(this.contractId);
        result.value = mod_manager_validation.is_module_installed(args.contract_id!); 
        break;
      case MODULE_EXECUTION_TYPE_ID:
        const mod_manager_execution = new ModuleManagerExecution(this.contractId);
        result.value = mod_manager_execution.is_module_installed(args.contract_id!); 
        break;
      case MODULE_HOOKS_TYPE_ID:
        const module_manager_hooks = new ModuleManagerHooks(this.contractId);
        result.value = module_manager_hooks.is_module_installed(args.contract_id!); 
        break;
    }

    return result;
  }

  /**
   * Checks if a module type is supported.
   * 
   * This method returns a boolean indicating whether the specified module type is supported.
   * 
   * @external
   * @readonly
   */
  is_module_type_supported(args: account.is_module_type_supported_args): account.is_module_type_supported_result {
    const result = new account.is_module_type_supported_result();
    result.value = args.module_type_id == MODULE_VALIDATION_TYPE_ID ||
      args.module_type_id == MODULE_HOOKS_TYPE_ID ||
      args.module_type_id == MODULE_EXECUTION_TYPE_ID ||
      args.module_type_id == MODULE_SIGN_TYPE_ID;

    return result;
  }

  /**
   * Retrieves all installed modules.
   * 
   * This method returns a list of all installed modules across all types.
   * 
   * @external
   * @readonly
   */
  get_modules(): account.get_modules_result {
    const result = new account.get_modules_result([]);

    const mod_manager = new ModuleManagerValidation(this.contractId);
    result.value = mod_manager.get_modules();

    return result;
  }

  /**
   * Validates the signature by invoking the validation logic.
   * 
   * This method checks the validity of a signature using all registered validator modules.
   * The signature is valid if AT LEAST one of the validators is valid.
   * 
   * @external
   */
  is_valid_signature(args: account.is_valid_signature_args): account.is_valid_signature_result {
    const result = new account.is_valid_signature_result(false);
    result.value = this._validate_signature(args.sender!, args.signature!, args.tx_id!);
    return result;
  }

  /**
   * Validates an operation by invoking the validation logic.
   * 
   * This method checks the validity of an operation using all registered validator modules.
   * The operation is valid if ALL validators are valid.
   * 
   * @external
   */
  is_valid_operation(args: account.is_valid_operation_args): account.is_valid_operation_result {
    const result = new account.is_valid_operation_result();
    const module_manager = new ModuleManagerValidation(this.contractId);
    result.value = module_manager.validate_operation(args.operation!);
    return result;
  }

  /**
   * Initializes the account.
   * 
   * Placeholder for the account initialization logic.
   * 
   * @external
   */
  init_account(args: account.init_account_args): void {
    // Placeholder for init_account method implementation
  }

  /**
   * @external
   */
  test(): void {
    System.log('this is test call');
  }

  /**
   * Authorizes an operation.
   * 
   * This method checks if a given operation is authorized based on the type and the provided arguments.
   * 
   * @external
   */
  authorize(args: authority.authorize_arguments): authority.authorize_result {
    const result = new authority.authorize_result(false);

    if (args.type == authority.authorization_type.contract_call) {
      System.log(`[mod-account] validating ${args.call!.entry_point.toString()}`);

      const operation = new account.operation();
      operation.contract_id = args.call!.contract_id;
      operation.entry_point = args.call!.entry_point;
      operation.args = args.call!.data;

      result.value = this.is_valid_operation(new account.is_valid_operation_args(operation)).value;

      if (result.value == true) {
        System.log(`[mod-account] authorized ${args.call!.entry_point.toString()}`);
      } else {
        System.log(`[mod-account] unauthorized ${args.call!.entry_point.toString()}`);
      }
    }

    return result;
  }

  /**
   * Ensures that the function can only be called by the contract itself.
   * 
   * This method checks if the caller is the contract itself. If not, it throws an error.
   * This is used to protect functions that should only be invoked internally by the contract.
   */
  _require_only_self(): void {
    const caller = System.getCaller().caller;
    System.require(Arrays.equal(caller, this.contractId) == true, "caller must be itself");
  }

  /**
   * Ensures that the function cannot be called by the contract itself.
   * 
   * This method checks if the caller is not the contract itself. If it is, it throws an error.
   * This is used to protect functions that should only be invoked by external callers.
   */
  _require_not_self(): void {
    const caller = System.getCaller().caller;
    System.require(Arrays.equal(caller, this.contractId) == false, "caller cannot be itself");
  }

  /**
   * Ensures that the function cannot be called by a registered execution module.
   * 
   * This method checks if the caller is not a registered execution module. If it is, it throws an error.
   * This is used to protect functions that should not be invoked by execution modules.
   */
  _require_not_executor(): void {
    const caller = System.getCaller().caller;
    System.require(this.mod_execution.has(caller) == false, "caller cannot be registered execution module");
  }

  /**
   * Ensures that the function can only be called by a registered execution module.
   * 
   * This method checks if the caller is a registered execution module. If not, it throws an error.
   * This is used to protect functions that should only be invoked by execution modules.
   */
  _require_only_xecutor(): void {
    const caller = System.getCaller().caller;
    System.require(this.mod_execution.has(caller) == true, "caller must be a module");
  }

  /**
   * Ensures that the function can only be called when there is no caller.
   * 
   * This method checks if there is no caller. If there is a caller, it throws an error.
   * This is used to protect functions that should not be invoked by any caller.
   */
  _require_not_caller(): void {
    const caller = System.getCaller().caller;
    System.require(caller.length == 0, "caller not allowed");
  }

  /**
   * Ensures that the operation is valid
   */
  _require_valid_operation(operation: account.operation): void {
    const module_manager = new ModuleManagerValidation(this.contractId);
    System.require( module_manager.validate_operation(operation) == true, 'operation is not valid');
  }

  /**
   * Validates the signature using all registered sign modules.
   * 
   * @param sender The sender's address.
   * @param signature The signature to validate.
   * @param tx_id The transaction ID.
   * @returns `true` if any sign module validates the signature successfully, otherwise `false`.
   */
  _validate_signature(sender: Uint8Array, signature: Uint8Array, tx_id: Uint8Array): boolean {
    const modules = this.mod_sign.getManyKeys(new Uint8Array(0));

    if (modules && modules.length > 0) {
      const caller = System.getCaller().caller;

      const args = new modsign.is_valid_signature_args();
      args.sender = sender;
      args.signature = signature;
      args.tx_id = tx_id;
      
      for (let i = 0; i < modules.length; i++) {
        if (caller && caller.length > 0 && Arrays.equal(caller, modules[i])) {
          continue;
        }
  
        const validatorModule = this.mod_sign.get(modules[i]);
        if (validatorModule) {
          const module = new IModSign(modules[i]);
          const res = module.is_valid_signature(args);
  
          if (res.value == true) {
            return true;
          }
        }
      }
    }

    return false;
  }

}
