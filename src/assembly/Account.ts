import { System, Storage, authority, Arrays } from "@koinos/sdk-as";
import { modhooks, IModHooks } from "@veive/mod-hooks-as";
import { modexecution, IModExecution } from "@veive/mod-execution-as";
import { modvalidation, IModValidation } from "@veive/mod-validation-as";
import { mod, IMod } from "@veive/mod-as";
import { account } from "./proto/account";
import { 
  MODULE_VALIDATION_SPACE_ID, 
  MODULE_HOOKS_SPACE_ID, 
  MODULE_EXECUTION_SPACE_ID,
  MODULE_TYPE_VALIDATION,
  MODULE_TYPE_HOOK,
  MODULE_TYPE_EXECUTION
} from "./Constants";

export class Account {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array = System.getContractId();

  mod_validate: Storage.Map<Uint8Array, account.mod> =
    new Storage.Map(
      this.contractId,
      MODULE_VALIDATION_SPACE_ID,
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

  mod_execute: Storage.Map<Uint8Array, account.mod> =
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

    const data = this._pre_check(args.operation!);
    this._execute(args.operation!);
    this._post_check(data);
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

    const data = this._pre_check(args.operation!);
    this._execute(args.operation!);
    this._post_check(data);
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

    const module = new IMod(args.contract_id!);
    const manifest = module.manifest();

    const new_module = new account.mod();
    if (manifest.type_id == MODULE_TYPE_VALIDATION) {
      this.mod_validate.put(args.contract_id!, new_module);
    } else if (manifest.type_id == MODULE_TYPE_HOOK) {
      this.mod_hooks.put(args.contract_id!, new_module);
    } else if (manifest.type_id == MODULE_TYPE_EXECUTION) {
      this.mod_execute.put(args.contract_id!, new_module);
    } else {
      System.fail('unsupported module_type_id');
    }

    let data = new Uint8Array(0);
    if (args.data && args.data!.length > 0) {
      data = args.data!;
    }

    const on_install_args = new mod.on_install_args(data);
    module.on_install(on_install_args);
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

    const module = new IMod(args.contract_id!);
    const manifest = module.manifest();

    if (manifest.type_id == MODULE_TYPE_VALIDATION) {
      this.mod_validate.remove(args.contract_id!);
    } else if (manifest.type_id == MODULE_TYPE_HOOK) {
      this.mod_hooks.remove(args.contract_id!);
    } else if (manifest.type_id == MODULE_TYPE_EXECUTION) {
      this.mod_execute.remove(args.contract_id!);
    } else {
      System.fail('unsupported module_type_id');
    }

    let data = new Uint8Array(0);
    if (args.data && args.data!.length > 0) {
      data = args.data!;
    }

    const on_uninstall_args = new mod.on_uninstall_args(data);
    module.on_uninstall(on_uninstall_args);
  }

  /**
   * Checks if a module is installed.
   * 
   * This method returns a boolean indicating whether the specified module is installed, based on the module type.
   * 
   * @external
   */
  is_module_installed(args: account.is_module_installed_args): account.is_module_installed_result {
    const result = new account.is_module_installed_result();
    if (args.module_type_id == MODULE_TYPE_VALIDATION) {
      result.value = this.mod_validate.has(args.contract_id!);
    } else if (args.module_type_id == MODULE_TYPE_HOOK) { 
      result.value = this.mod_hooks.has(args.contract_id!);
    } else if (args.module_type_id == MODULE_TYPE_EXECUTION) {
      result.value = this.mod_execute.has(args.contract_id!);
    } else {
      System.fail('unsupported module_type_id');
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
    result.value = args.module_type_id == MODULE_TYPE_VALIDATION ||
      args.module_type_id == MODULE_TYPE_HOOK ||
      args.module_type_id == MODULE_TYPE_EXECUTION;

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

    const validateModules = this.mod_validate.getManyKeys(new Uint8Array(0));
    for (let i = 0; i < validateModules.length; i++) {
      result.value.push(validateModules[i]);
    }

    const hookModules = this.mod_hooks.getManyKeys(new Uint8Array(0));
    for (let i = 0; i < hookModules.length; i++) {
      result.value.push(hookModules[i]);
    }

    const executeModules = this.mod_execute.getManyKeys(new Uint8Array(0));
    for (let i = 0; i < executeModules.length; i++) {
      result.value.push(executeModules[i]);
    }

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
    result.value = this._validate_op(args.operation!);
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
   */
  authorize(args: authority.authorize_arguments): authority.authorize_result {
    const result = new authority.authorize_result(false);

    if (args.type == authority.authorization_type.contract_call) {
      const operation = new account.operation();
      operation.contract_id = args.call.contract_id;
      operation.entry_point = args.call.entry_point;
      operation.args = args.call.data;

      result.value = this.is_valid_operation(new account.is_valid_operation_args(operation));
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
    System.require(this.mod_execute.has(caller) == false, "caller cannot be registered execution module");
  }

  /**
   * Ensures that the function can only be called by a registered execution module.
   * 
   * This method checks if the caller is a registered execution module. If not, it throws an error.
   * This is used to protect functions that should only be invoked by execution modules.
   */
  _require_only_xecutor(): void {
    const caller = System.getCaller().caller;
    System.require(this.mod_execute.has(caller) == true, "caller must be a module");
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
    System.require( this._validate_op(operation) == true, 'operation is not valid');
  }

  /**
   * Validates the signature using all registered validator modules.
   * 
   * @param sender The sender's address.
   * @param signature The signature to validate.
   * @param tx_id The transaction ID.
   * @returns `true` if any validator module validates the signature successfully, otherwise `false`.
   */
  _validate_signature(sender: Uint8Array, signature: Uint8Array, tx_id: Uint8Array): boolean {
    const validators = this.mod_validate.getManyKeys(new Uint8Array(0));

    if (validators && validators.length > 0) {
      const caller = System.getCaller().caller;

      const args = new modvalidation.is_valid_signature_args();
      args.sender = sender;
      args.signature = signature;
      args.tx_id = tx_id;
      
      for (let i = 0; i < validators.length; i++) {
        if (caller && caller.length > 0 && Arrays.equal(caller, validators[i])) {
          continue;
        }
  
        const validatorModule = this.mod_validate.get(validators[i]);
        if (validatorModule) {
          const module = new IModValidation(validators[i]);
          const res = module.is_valid_signature(args);
  
          if (res.value == true) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Validates the operation using all registered validator modules.
   * 
   * @param operation The operation to validate.
   * @returns `true` if all validator modules validate the operation successfully, otherwise `false`.
   */
  _validate_op(operation: account.operation): boolean {
    const validators = this.mod_validate.getManyKeys(new Uint8Array(0));

    if (validators && validators.length > 0) {
      const caller = System.getCaller().caller;

      const op = new modvalidation.operation();
      op.contract_id = operation.contract_id;
      op.entry_point = operation.entry_point;
      op.args = operation.args;
  
      const args = new modvalidation.is_valid_operation_args(op);
  
      for (let i = 0; i < validators.length; i++) {
        if (caller && caller.length > 0 && Arrays.equal(caller, validators[i])) {
          continue;
        }
  
        const validatorModule = this.mod_validate.get(validators[i]);
        if (validatorModule) {
          const module = new IModValidation(validators[i]);
          const res = module.is_valid_operation(args);
  
          if (res.value == false) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Performs pre-checks using all registered hook modules.
   * 
   * @param operation The operation to be pre-checked.
   * @returns An array of pre-check data returned by each hook module.
   */
  _pre_check(operation: account.operation): Uint8Array[] {
    const hooks = this.mod_hooks.getManyKeys(new Uint8Array(0));
    const data: Uint8Array[] = [];
    
    if (hooks && hooks.length > 0) {
      const caller = System.getCaller().caller;

      for (let i = 0; i < hooks.length; i++) {
        if (caller && caller.length > 0 && Arrays.equal(caller, hooks[i])) {
          continue;
        }
  
        const hookModule = this.mod_hooks.get(hooks[i]);
        if (hookModule) {
          const args = new modhooks.pre_check_args();
          const op = new modhooks.operation();
          op.contract_id = operation.contract_id;
          op.entry_point = operation.entry_point;
          op.args = operation.args;
          args.operation = op;
          args.sender = caller;
  
          const module = new IModHooks(hooks[i]);
          const res = module.pre_check(args);
  
          if (res.value!) {
            data.push(res.value!);
          } else {
            data.push(new Uint8Array(0));
          }
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
  _post_check(preCheckData: Uint8Array[]): void {
    const hooks = this.mod_hooks.getManyKeys(new Uint8Array(0));

    if (hooks && hooks.length > 0) {
      const caller = System.getCaller().caller;
    
      for (let i = 0; i < hooks.length; i++) {
        if (caller && caller.length > 0 && Arrays.equal(caller, hooks[i])) {
          continue;
        }
  
        const hookModule = this.mod_hooks.get(hooks[i]);
        if (hookModule) {
          const args = new modhooks.post_check_args();
          args.data = preCheckData[i];
  
          const module = new IModHooks(hooks[i]);
          module.post_check(args);
        }
      }
    }
  }

  /**
   * Executes the given operation using all registered executor modules.
   * 
   * @param operation The operation to be executed.
   */
  _execute(operation: account.operation): void {
    const executors = this.mod_execute.getManyKeys(new Uint8Array(0));

    if (executors && executors.length > 0) {
      const caller = System.getCaller().caller;
    
      for (let i = 0; i < executors.length; i++) {
        if (caller && caller.length > 0 && Arrays.equal(caller, executors[i])) {
          continue;
        }
  
        const executeModule = this.mod_execute.get(executors[i]);
        if (executeModule) {
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

}
