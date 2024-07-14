# Veive SCA Account

The Veive SCA Account project provides a modular smart account implementation for the Koinos blockchain, inspired by the ERC-7579 standard. This modular approach allows for flexible, pluggable functionality through different types of modules that can be installed to extend the capabilities of the smart account.

## Differences with the ERC-7579 Standard

While implementing the standard, there are differences due to Koinos being different from EVM blockchains.

- **No EntryPoint**: In the ERC-7579 standard, all requests are routed through a single contract called EntryPoint, which performs all operation checks by engaging validators. In Koinos, the user's account is called directly to execute operations. As a result, validators are engaged immediately within the execution methods.
- **Separate Sign Module**: In our standard, we prefer to separate signature validation modules from operation validation modules because their processing differs. All operation validators must validate the operation, whereas for signature validators, a single positive validation is sufficient to proceed with the operation.
- **Authorize**: Due to the previous points, Koinos provides an automatic mechanism that calls the "authorize" method of the account to verify all operations launched internally.
- **Method Input/Output**: Generally, the input/output parameters of the methods are closely tied to the internal workings of the blockchain, so they have been modified from the general standard to fit the characteristics of Koinos.

## Overview

### Modular Smart Accounts

A modular smart account is designed to be extensible through the use of modules. These modules add specific functionalities to the smart account, making it more flexible and adaptable to various use cases. The Veive SCA Account supports the installation of different types of modules:

1. **Validation Modules**: These modules validate operations to ensure they meet specific criteria before execution.
2. **Signature Modules**: These modules validate signatures to ensure the authenticity of transactions.
3. **Hooks Modules**: These modules perform tasks such as pre-checks and post-checks, enabling custom logic to be executed before and after the main operation.
4. **Execution Modules**: These modules handle the execution of specific operations.

### Example Modules

- **Validation Allowance**: Ensures the authenticity of an operation preauthorized by the user, guaranteeing that the approved action is what actually occurs. These modules help in verifying that the user’s pre-approval matches the intended transaction.
- **Signature Controls**: Beyond the classic ECDSA, modules can include WebAuthn, multisignature schemes, and other advanced cryptographic methods to validate signatures.
- **Additional Checks**: Modules like "daily or weekly spending limit" can enforce spending caps over specific time frames, adding a layer of financial control and security.
- **Piggybank**: Automatically saves a percentage of the user's spending into a wallet savings account, encouraging savings.
- **Account Recovery**: Implements various account recovery methods, offering flexibility and enhanced security in case of account compromise or loss of access.
- **Custom Authentication**: Modules for integrating different authentication mechanisms, such as biometric authentication, 2FA, or custom OAuth providers.
- **Delegated Spending**: Allows users to delegate spending authority to specific addresses within predefined limits, useful for businesses or family accounts.

### How It Works

The smart account manages modules through a structured process:
- **Installation and Uninstallation**: Modules can be installed and uninstalled to dynamically modify the account's behavior.
- **Execution Flow**: When an operation is executed, the smart account invokes validation modules first, followed by hooks (pre-checks), then the execution modules, and finally the hooks (post-checks).

## Installation

To install the package, use npm or yarn:

```bash
npm install @veive/account
```

## Usage

### Importing the Package

First, import the necessary components from the package:

```typescript
import { Account } from '@veive/account';
```

### Example Usage

Here is an example of how to use the `Account` module to install a module and execute an operation:

```typescript
const { operation: install_module } = await accountContract["install_module"]({
        contract_id: modSign.address
    }, { onlyOperation: true });

const tx = new Transaction({
    signer: accountSign,
    provider
});

const { operation: exec } = await accountContract["execute_user"]({
    operation: {
        contract_id: install_module.call_contract.contract_id,
        entry_point: install_module.call_contract.entry_point,
        args: install_module.call_contract.args
    }
}, { onlyOperation: true });

await tx.pushOperation(exec);
const receipt = await tx.send();
await tx.wait();
```

### Interface and Methods

The `Account` class provides several methods for managing modules and executing operations. Below is a brief overview of the key methods:

#### `install_module`
Installs a module to the smart account. This method allows adding new functionalities to the account by installing different types of modules (Validation, Signature, Hooks, Execution).

#### `uninstall_module`
Uninstalls a module from the smart account. This method removes the installed module, thereby removing its functionality from the account.

#### `execute`
Executes an operation by invoking the necessary validation modules, pre-check hooks, execution modules, and post-check hooks. 
- **Requirements**: The caller must not be the smart account itself, and it must not be a registered execution module.

#### `execute_executor`
Executes an operation from a registered executor module. This method checks that the caller is a registered execution module before proceeding with the operation.
- **Requirements**: The caller must be a registered execution module.

#### `execute_user`
Executes a user operation directly by calling the specified contract and entry point with the provided arguments. This method is used for operations that do not require module validation.
- **Requirements**: The caller must be empty (indicating it is not a contract call).

#### `is_valid_signature`
Validates a signature by invoking the installed signature validation modules. This method checks the authenticity of the transaction based on the provided signature.

#### `is_valid_operation`
Validates an operation by invoking the installed operation validation modules. This method ensures that the operation meets specific criteria defined by the installed validation modules before execution.

#### `is_module_installed`
Checks if a module of a specific type is installed in the smart account. Returns a boolean indicating whether the module is installed.

#### `is_module_type_supported`
Checks if a module type is supported by the smart account. Returns a boolean indicating whether the module type is supported.

#### `get_modules`
Retrieves a list of all installed modules. This method returns a list of contract IDs for the installed modules.

#### `authorize`
This method does not belong to the standard but is closely related to Koinos. The method is called internally by Koinos whenever a `checkAuthority` call is made to verify the authenticity of the operation. The method engages validators to validate the operation. Read the section on differences with the standard for more details.

## Scripts

### Build

To compile the package, run:

```bash
yarn build
```

### Test

To run the tests, run:

```bash
yarn jest
```

### Dist

To create a distribution, run:

```bash
yarn dist
```

### Deploy

To deploy the package, run:

```bash
yarn deploy
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/veiveprotocol).

## License

This project is licensed under the MIT License. See the LICENSE file for details.