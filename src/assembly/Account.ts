import { System, Storage, authority, Arrays } from "@koinos/sdk-as";
import { modhooks, IModhooks } from "@veive/modhooks-as";
import { modexecution, IModexecution } from "@veive/modexecution-as";
import { modvalidation, IModvalidation } from "@veive/modvalidation-as";
import { account } from "./proto/account";

const MODULE_VALIDATE_SPACE_ID = 1;
const MODULE_HOOKS_SPACE_ID = 2;
const MODULE_EXECUTE_SPACE_ID = 3;

const MODULE_TYPE_VALIDATOR = 1;
const MODULE_TYPE_HOOK = 2;
const MODULE_TYPE_EXECUTOR = 3;

export class Account {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array = System.getContractId();

  mod_validate: Storage.Map<Uint8Array, account.mod> =
    new Storage.Map(
      this.contractId,
      MODULE_VALIDATE_SPACE_ID,
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
      MODULE_EXECUTE_SPACE_ID,
      account.mod.decode,
      account.mod.encode,
      () => new account.mod()
    );

  /**
   * @external
   */
  execute(args: account.execute_args): void {
    const caller = System.getCaller().caller;

    System.require(Arrays.equal(caller, this.contractId) === false, "caller cannot be itself");
    System.require(this.mod_execute.has(caller) == false, "caller cannot be registered execution module");

    const preCheckData = this._pre_check(caller, args.operation!);
    this._execute(args.operation!);
    this._post_check(preCheckData);
  }

  /**
   * @external
   */
  execute_executor(args: account.execute_executor_args): void {
    const caller = System.getCaller().caller;

    System.require(Arrays.equal(caller, this.contractId) === false, "caller cannot be itself");
    System.require(this.mod_execute.has(caller), "caller must be registered execution module");

    const preCheckData = this._pre_check(caller, args.operation!);
    this._execute(args.operation!);
    this._post_check(preCheckData);
  }

  /**
   * @external
   */
  execute_user(args: account.execute_user_args): void {
    const caller = System.getCaller().caller;

    System.require(caller.length == 0, "caller not allowed");

    System.call(
      args.operation!.contract_id!, 
      args.operation!.entry_point, 
      args.operation!.data!
    );
  }

  /**
   * @external
   */
  install_module(args: account.install_module_args): void {
    const newModule = new account.mod();
    if (args.module_type_id == MODULE_TYPE_VALIDATOR) {
      this.mod_validate.put(args.contract_id!, newModule);
    } else if (args.module_type_id == MODULE_TYPE_HOOK) {
      this.mod_hooks.put(args.contract_id!, newModule);
    } else if (args.module_type_id == MODULE_TYPE_EXECUTOR) {
      this.mod_execute.put(args.contract_id!, newModule);
    }
  }

  /**
   * @external
   */
  uninstall_module(args: account.uninstall_module_args): void {
    if (args.module_type_id == MODULE_TYPE_VALIDATOR) { // Validator
      this.mod_validate.remove(args.contract_id!);
    } else if (args.module_type_id == MODULE_TYPE_HOOK) { // Hook
      this.mod_hooks.remove(args.contract_id!);
    } else if (args.module_type_id == MODULE_TYPE_EXECUTOR) { // Executor
      this.mod_execute.remove(args.contract_id!);
    }
  }

  /**
   * @external
   * @readonly
   */
  is_module_installed(args: account.is_module_installed_args): account.is_module_installed_result {
    const result = new account.is_module_installed_result();
    if (args.module_type_id == MODULE_TYPE_VALIDATOR) { // Validator
      result.value = this.mod_validate.has(args.contract_id!);
    } else if (args.module_type_id == MODULE_TYPE_HOOK) { // Hook
      result.value = this.mod_hooks.has(args.contract_id!);
    } else if (args.module_type_id == MODULE_TYPE_EXECUTOR) { // Executor
      result.value = this.mod_execute.has(args.contract_id!);
    }
    return result;
  }

  /**
   * @external
   * @readonly
   */
  is_module_type_supported(args: account.is_module_type_supported_args): account.is_module_type_supported_result {
    const result = new account.is_module_type_supported_result();
    result.value = args.module_type_id == MODULE_TYPE_VALIDATOR || args.module_type_id == MODULE_TYPE_HOOK || args.module_type_id == MODULE_TYPE_EXECUTOR;
    return result;
  }

  /**
   * @external
   * @readonly
   */
  get_modules(): account.get_modules_result {
    const result = new account.get_modules_result();

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
   * @external
   */
  is_valid_signature(args: account.is_valid_signature_args): account.is_valid_signature_result {
    const result = new account.is_valid_signature_result(false);
    result.value = this._validate_signature(args.sender!, args.signature!, args.tx_id!);
    return result;
  }

  /**
   * @external
   */
  is_valid_operation(args: account.is_valid_operation_args): account.is_valid_operation_result {
    const result = new account.is_valid_operation_result();
    result.value = this._validate_op(args.operation!);
    return result;
  }

  /**
   * @external
   */
  init_account(args: account.init_account_args): void {
    // Placeholder for init_account method implementation
  }

  /**
   * Authorize an operation.
   * @external
   */
  authorize(args: authority.authorize_arguments): authority.authorize_result {
    let result = new authority.authorize_result(false);

    if (args.type == authority.authorization_type.contract_call) {
    }

    return result;
  }


  _validate_signature(sender: Uint8Array, signature: Uint8Array, tx_id: Uint8Array): boolean {
    const caller = System.getCaller().caller;

    const args = new modvalidation.is_valid_signature_args();
    args.sender = sender;
    args.signature = signature;
    args.tx_id = tx_id;

    const validators = this.mod_validate.getManyKeys(new Uint8Array(0));
    for (let i = 0; i < validators.length; i++) {

      if (caller && caller.length > 0 && Arrays.equal(caller, validators[i])) {
        continue;
      }

      const validatorModule = this.mod_validate.get(validators[i]);
      if (validatorModule) {
        const mod = new IModvalidation(validators[i]);
        const res = mod.is_valid_signature(args);

        if (res.value == true) {
          return true;
        }
      }
    }

    return false;
  }

  _validate_op(operation: account.operation): boolean {
    const caller = System.getCaller().caller;

    const op = new modvalidation.operation();
    op.contract_id = operation.contract_id;
    op.entry_point = operation.entry_point;
    op.data = operation.data;

    const args = new modvalidation.is_valid_operation_args(op);

    const validators = this.mod_validate.getManyKeys(new Uint8Array(0));
    for (let i = 0; i < validators.length; i++) {

      if (caller && caller.length > 0 && Arrays.equal(caller, validators[i])) {
        continue;
      }

      const validatorModule = this.mod_validate.get(validators[i]);
      if (validatorModule) {
        const mod = new IModvalidation(validators[i]);
        const res = mod.is_valid_operation(args);

        if (res.value == false) {
          return false;
        }
      }
    }

    return true;
  }

  _pre_check(sender: Uint8Array, operation: account.operation): Uint8Array[] {
    const caller = System.getCaller().caller;

    const preCheckData: Uint8Array[] = [];
    const hooks = this.mod_hooks.getManyKeys(new Uint8Array(0));
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
        op.data = operation.data;
        args.operation = op;
        args.sender = sender;

        const mod = new IModhooks(hooks[i]);
        const res = mod.pre_check(args);

        if (res.value!) {
          preCheckData.push(res.value!);
        } else {
          preCheckData.push(new Uint8Array(0));
        }

      }
    }
    return preCheckData;
  }

  _execute(operation: account.operation): void {
    const caller = System.getCaller().caller;

    const executors = this.mod_execute.getManyKeys(new Uint8Array(0));
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
        op.data = operation.data;
        args.operation = op;

        const mod = new IModexecution(executors[i]);
        mod.execute(args);
      }
    }
  }

  _post_check(preCheckData: Uint8Array[]): void {
    const caller = System.getCaller().caller;
    const hooks = this.mod_hooks.getManyKeys(new Uint8Array(0));

    for (let i = 0; i < hooks.length; i++) {

      if (caller && caller.length > 0 && Arrays.equal(caller, hooks[i])) {
        continue;
      }

      const hookModule = this.mod_hooks.get(hooks[i]);
      if (hookModule) {

        const args = new modhooks.post_check_args();
        args.data = preCheckData[i];

        const mod = new IModhooks(hooks[i]);
        mod.post_check(args);
      }
    }
  }
}
