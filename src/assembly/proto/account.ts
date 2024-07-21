import { Writer, Reader } from "as-proto";

export namespace account {
  @unmanaged
  export class mod {
    static encode(message: mod, writer: Writer): void {}

    static decode(reader: Reader, length: i32): mod {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new mod();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    constructor() {}
  }

  export class operation {
    static encode(message: operation, writer: Writer): void {
      const unique_name_contract_id = message.contract_id;
      if (unique_name_contract_id !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_contract_id);
      }

      if (message.entry_point != 0) {
        writer.uint32(16);
        writer.uint32(message.entry_point);
      }

      const unique_name_args = message.args;
      if (unique_name_args !== null) {
        writer.uint32(26);
        writer.bytes(unique_name_args);
      }
    }

    static decode(reader: Reader, length: i32): operation {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new operation();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.contract_id = reader.bytes();
            break;

          case 2:
            message.entry_point = reader.uint32();
            break;

          case 3:
            message.args = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    contract_id: Uint8Array | null;
    entry_point: u32;
    args: Uint8Array | null;

    constructor(
      contract_id: Uint8Array | null = null,
      entry_point: u32 = 0,
      args: Uint8Array | null = null
    ) {
      this.contract_id = contract_id;
      this.entry_point = entry_point;
      this.args = args;
    }
  }

  export class execute_args {
    static encode(message: execute_args, writer: Writer): void {
      const unique_name_operation = message.operation;
      if (unique_name_operation !== null) {
        writer.uint32(10);
        writer.fork();
        operation.encode(unique_name_operation, writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): execute_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new execute_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.operation = operation.decode(reader, reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    operation: operation | null;

    constructor(operation: operation | null = null) {
      this.operation = operation;
    }
  }

  export class execute_executor_args {
    static encode(message: execute_executor_args, writer: Writer): void {
      const unique_name_operation = message.operation;
      if (unique_name_operation !== null) {
        writer.uint32(10);
        writer.fork();
        operation.encode(unique_name_operation, writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): execute_executor_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new execute_executor_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.operation = operation.decode(reader, reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    operation: operation | null;

    constructor(operation: operation | null = null) {
      this.operation = operation;
    }
  }

  export class execute_user_args {
    static encode(message: execute_user_args, writer: Writer): void {
      const unique_name_operation = message.operation;
      if (unique_name_operation !== null) {
        writer.uint32(10);
        writer.fork();
        operation.encode(unique_name_operation, writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): execute_user_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new execute_user_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.operation = operation.decode(reader, reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    operation: operation | null;

    constructor(operation: operation | null = null) {
      this.operation = operation;
    }
  }

  export class install_module_args {
    static encode(message: install_module_args, writer: Writer): void {
      if (message.module_type_id != 0) {
        writer.uint32(8);
        writer.uint32(message.module_type_id);
      }

      const unique_name_contract_id = message.contract_id;
      if (unique_name_contract_id !== null) {
        writer.uint32(18);
        writer.bytes(unique_name_contract_id);
      }

      const unique_name_scopes = message.scopes;
      if (unique_name_scopes.length !== 0) {
        for (let i = 0; i < unique_name_scopes.length; ++i) {
          writer.uint32(26);
          writer.bytes(unique_name_scopes[i]);
        }
      }

      const unique_name_data = message.data;
      if (unique_name_data !== null) {
        writer.uint32(34);
        writer.bytes(unique_name_data);
      }
    }

    static decode(reader: Reader, length: i32): install_module_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new install_module_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.module_type_id = reader.uint32();
            break;

          case 2:
            message.contract_id = reader.bytes();
            break;

          case 3:
            message.scopes.push(reader.bytes());
            break;

          case 4:
            message.data = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    module_type_id: u32;
    contract_id: Uint8Array | null;
    scopes: Array<Uint8Array>;
    data: Uint8Array | null;

    constructor(
      module_type_id: u32 = 0,
      contract_id: Uint8Array | null = null,
      scopes: Array<Uint8Array> = [],
      data: Uint8Array | null = null
    ) {
      this.module_type_id = module_type_id;
      this.contract_id = contract_id;
      this.scopes = scopes;
      this.data = data;
    }
  }

  export class uninstall_module_args {
    static encode(message: uninstall_module_args, writer: Writer): void {
      if (message.module_type_id != 0) {
        writer.uint32(8);
        writer.uint32(message.module_type_id);
      }

      const unique_name_contract_id = message.contract_id;
      if (unique_name_contract_id !== null) {
        writer.uint32(18);
        writer.bytes(unique_name_contract_id);
      }

      const unique_name_data = message.data;
      if (unique_name_data !== null) {
        writer.uint32(26);
        writer.bytes(unique_name_data);
      }
    }

    static decode(reader: Reader, length: i32): uninstall_module_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new uninstall_module_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.module_type_id = reader.uint32();
            break;

          case 2:
            message.contract_id = reader.bytes();
            break;

          case 3:
            message.data = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    module_type_id: u32;
    contract_id: Uint8Array | null;
    data: Uint8Array | null;

    constructor(
      module_type_id: u32 = 0,
      contract_id: Uint8Array | null = null,
      data: Uint8Array | null = null
    ) {
      this.module_type_id = module_type_id;
      this.contract_id = contract_id;
      this.data = data;
    }
  }

  export class is_module_installed_args {
    static encode(message: is_module_installed_args, writer: Writer): void {
      if (message.module_type_id != 0) {
        writer.uint32(8);
        writer.uint32(message.module_type_id);
      }

      const unique_name_contract_id = message.contract_id;
      if (unique_name_contract_id !== null) {
        writer.uint32(18);
        writer.bytes(unique_name_contract_id);
      }

      const unique_name_data = message.data;
      if (unique_name_data !== null) {
        writer.uint32(26);
        writer.bytes(unique_name_data);
      }
    }

    static decode(reader: Reader, length: i32): is_module_installed_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new is_module_installed_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.module_type_id = reader.uint32();
            break;

          case 2:
            message.contract_id = reader.bytes();
            break;

          case 3:
            message.data = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    module_type_id: u32;
    contract_id: Uint8Array | null;
    data: Uint8Array | null;

    constructor(
      module_type_id: u32 = 0,
      contract_id: Uint8Array | null = null,
      data: Uint8Array | null = null
    ) {
      this.module_type_id = module_type_id;
      this.contract_id = contract_id;
      this.data = data;
    }
  }

  @unmanaged
  export class is_module_installed_result {
    static encode(message: is_module_installed_result, writer: Writer): void {
      if (message.value != false) {
        writer.uint32(8);
        writer.bool(message.value);
      }
    }

    static decode(reader: Reader, length: i32): is_module_installed_result {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new is_module_installed_result();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.bool();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: bool;

    constructor(value: bool = false) {
      this.value = value;
    }
  }

  @unmanaged
  export class is_module_type_supported_args {
    static encode(
      message: is_module_type_supported_args,
      writer: Writer
    ): void {
      if (message.module_type_id != 0) {
        writer.uint32(8);
        writer.uint32(message.module_type_id);
      }
    }

    static decode(reader: Reader, length: i32): is_module_type_supported_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new is_module_type_supported_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.module_type_id = reader.uint32();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    module_type_id: u32;

    constructor(module_type_id: u32 = 0) {
      this.module_type_id = module_type_id;
    }
  }

  @unmanaged
  export class is_module_type_supported_result {
    static encode(
      message: is_module_type_supported_result,
      writer: Writer
    ): void {
      if (message.value != false) {
        writer.uint32(8);
        writer.bool(message.value);
      }
    }

    static decode(
      reader: Reader,
      length: i32
    ): is_module_type_supported_result {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new is_module_type_supported_result();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.bool();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: bool;

    constructor(value: bool = false) {
      this.value = value;
    }
  }

  export class get_modules_result {
    static encode(message: get_modules_result, writer: Writer): void {
      const unique_name_value = message.value;
      if (unique_name_value.length !== 0) {
        for (let i = 0; i < unique_name_value.length; ++i) {
          writer.uint32(10);
          writer.bytes(unique_name_value[i]);
        }
      }
    }

    static decode(reader: Reader, length: i32): get_modules_result {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new get_modules_result();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value.push(reader.bytes());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Array<Uint8Array>;

    constructor(value: Array<Uint8Array> = []) {
      this.value = value;
    }
  }

  export class is_valid_signature_args {
    static encode(message: is_valid_signature_args, writer: Writer): void {
      const unique_name_sender = message.sender;
      if (unique_name_sender !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_sender);
      }

      const unique_name_signature = message.signature;
      if (unique_name_signature !== null) {
        writer.uint32(18);
        writer.bytes(unique_name_signature);
      }

      const unique_name_tx_id = message.tx_id;
      if (unique_name_tx_id !== null) {
        writer.uint32(26);
        writer.bytes(unique_name_tx_id);
      }
    }

    static decode(reader: Reader, length: i32): is_valid_signature_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new is_valid_signature_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.sender = reader.bytes();
            break;

          case 2:
            message.signature = reader.bytes();
            break;

          case 3:
            message.tx_id = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    sender: Uint8Array | null;
    signature: Uint8Array | null;
    tx_id: Uint8Array | null;

    constructor(
      sender: Uint8Array | null = null,
      signature: Uint8Array | null = null,
      tx_id: Uint8Array | null = null
    ) {
      this.sender = sender;
      this.signature = signature;
      this.tx_id = tx_id;
    }
  }

  @unmanaged
  export class is_valid_signature_result {
    static encode(message: is_valid_signature_result, writer: Writer): void {
      if (message.value != false) {
        writer.uint32(8);
        writer.bool(message.value);
      }
    }

    static decode(reader: Reader, length: i32): is_valid_signature_result {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new is_valid_signature_result();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.bool();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: bool;

    constructor(value: bool = false) {
      this.value = value;
    }
  }

  export class is_valid_operation_args {
    static encode(message: is_valid_operation_args, writer: Writer): void {
      const unique_name_operation = message.operation;
      if (unique_name_operation !== null) {
        writer.uint32(10);
        writer.fork();
        operation.encode(unique_name_operation, writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): is_valid_operation_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new is_valid_operation_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.operation = operation.decode(reader, reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    operation: operation | null;

    constructor(operation: operation | null = null) {
      this.operation = operation;
    }
  }

  @unmanaged
  export class is_valid_operation_result {
    static encode(message: is_valid_operation_result, writer: Writer): void {
      if (message.value != false) {
        writer.uint32(8);
        writer.bool(message.value);
      }
    }

    static decode(reader: Reader, length: i32): is_valid_operation_result {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new is_valid_operation_result();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.bool();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: bool;

    constructor(value: bool = false) {
      this.value = value;
    }
  }

  export class init_account_args {
    static encode(message: init_account_args, writer: Writer): void {
      const unique_name_data = message.data;
      if (unique_name_data !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_data);
      }
    }

    static decode(reader: Reader, length: i32): init_account_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new init_account_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.data = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    data: Uint8Array | null;

    constructor(data: Uint8Array | null = null) {
      this.data = data;
    }
  }

  export class selector {
    static encode(message: selector, writer: Writer): void {
      if (message.entry_point != 0) {
        writer.uint32(8);
        writer.uint32(message.entry_point);
      }

      const unique_name_contract_id = message.contract_id;
      if (unique_name_contract_id !== null) {
        writer.uint32(18);
        writer.bytes(unique_name_contract_id);
      }
    }

    static decode(reader: Reader, length: i32): selector {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new selector();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.entry_point = reader.uint32();
            break;

          case 2:
            message.contract_id = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    entry_point: u32;
    contract_id: Uint8Array | null;

    constructor(entry_point: u32 = 0, contract_id: Uint8Array | null = null) {
      this.entry_point = entry_point;
      this.contract_id = contract_id;
    }
  }

  export class module_validation {
    static encode(message: module_validation, writer: Writer): void {
      const unique_name_value = message.value;
      if (unique_name_value !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_value);
      }
    }

    static decode(reader: Reader, length: i32): module_validation {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new module_validation();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Uint8Array | null;

    constructor(value: Uint8Array | null = null) {
      this.value = value;
    }
  }

  export class modules_hooks {
    static encode(message: modules_hooks, writer: Writer): void {
      const unique_name_value = message.value;
      if (unique_name_value.length !== 0) {
        for (let i = 0; i < unique_name_value.length; ++i) {
          writer.uint32(10);
          writer.bytes(unique_name_value[i]);
        }
      }
    }

    static decode(reader: Reader, length: i32): modules_hooks {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new modules_hooks();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value.push(reader.bytes());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Array<Uint8Array>;

    constructor(value: Array<Uint8Array> = []) {
      this.value = value;
    }
  }

  export class modules_execution {
    static encode(message: modules_execution, writer: Writer): void {
      const unique_name_value = message.value;
      if (unique_name_value.length !== 0) {
        for (let i = 0; i < unique_name_value.length; ++i) {
          writer.uint32(10);
          writer.bytes(unique_name_value[i]);
        }
      }
    }

    static decode(reader: Reader, length: i32): modules_execution {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new modules_execution();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value.push(reader.bytes());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Array<Uint8Array>;

    constructor(value: Array<Uint8Array> = []) {
      this.value = value;
    }
  }

  export class modules_sign {
    static encode(message: modules_sign, writer: Writer): void {
      const unique_name_value = message.value;
      if (unique_name_value.length !== 0) {
        for (let i = 0; i < unique_name_value.length; ++i) {
          writer.uint32(10);
          writer.bytes(unique_name_value[i]);
        }
      }
    }

    static decode(reader: Reader, length: i32): modules_sign {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new modules_sign();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value.push(reader.bytes());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Array<Uint8Array>;

    constructor(value: Array<Uint8Array> = []) {
      this.value = value;
    }
  }
}
