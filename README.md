### **Introduction**

Veive is a protocol that implements modular smart accounts, inspired by the ERC-7579 standard and optimized for the Koinos blockchain. Modular smart accounts represent a significant evolution compared to traditional accounts, combining the flexibility of additional modules with the security and efficiency of blockchain technology. The ERC-7579 standard was developed to promote modularity and interoperability, enabling customization and extensibility of accounts through the addition of specific modules for various functionalities.

Examples:

- Multi-signature methods such as mnemonic, WebAuthn/passkey, OpenID.
- Pre-authorization of operations similar to the banking system.
- Smart modules like savings accounts or daily spending limits.
- Management of community wallets through multi-signature accounts.
- Wallet recovery via social recovery.

Complete documentation: https://docs.veive.io

### **Account Class Interface**

The `Account` class provides a comprehensive interface for managing modules and operations. Below is a summary of the main methods:

- `install_module`: This method allows the installation of a module in a specific scope. The scope represents the context in which the module will be active, such as specific `entry_point` or `contract_id`. If not specified, the default scopes defined by the module itself are used.

- `uninstall_module`: Removes a module from the system, eliminating all its associations with scopes.

- `execute`: Executes an operation after performing preliminary (pre-checks) and post-operation (post-checks) validations using registered module hooks. This method is used when the operation is initiated by an unidentified user, not a registered executor module.

- `execute_executor`: Similar to `execute`, but specific to registered executor modules. This method ensures that only executor modules can initiate the operation, enforcing specific security checks.

- `execute_user`: Allows an operation to be executed directly by the user, bypassing executor module checks. It is mainly used for direct and non-critical operations.

- `is_valid_signature`: Verifies the validity of a signature using the active signing module. This method is crucial for ensuring the authenticity of transactions and preventing fraud.

- `is_valid_operation`: Verifies the validity of an operation of type `contract_call`, ensuring that all active validation modules confirm the operation’s compliance with predefined rules.

- `get_modules`: Returns the list of installed modules.

- `authorize`: A critical method that is called to verify the authorization of an operation, especially for "external" operations. This method ensures that all operations, even internal ones between contracts, are correctly validated, preventing potential abuses or unauthorized operations.

### **Repository Overview**

The Veive protocol comprises several repositories that together implement a modular smart account system on the Koinos blockchain. Here's an overview of each repository and its role in the Veive ecosystem:

#### **Core Smart Account Repository**

1. **[account-as](https://github.com/veive-io/account-as)**
   
   This repository contains the core smart contract for the Veive account system. Each user deploys this contract to manage operations, validate signatures, and interact with various modules. It serves as the main hub where modules are installed, providing a customizable and secure environment for managing blockchain interactions.

#### **Core Module Repositories**

These repositories, though external dependencies, are integral to the functionality of Veive smart accounts. They provide essential classes, protobuf definitions, and interfaces for developing and interacting with various types of modules.

1. **[mod-validation-as](https://github.com/veive-io/mod-validation-as)**
   
   Framework for creating validation modules that verify operations before execution. Developers extend the `ModValidator` class and use the provided protobuf definitions to build custom validation logic.

2. **[mod-execution-as](https://github.com/veive-io/mod-execution-as)**
   
   Focuses on execution modules responsible for specific operations like token transfers or smart contract interactions. The `ModExecution` class is extended to implement these functionalities.

3. **[mod-sign-as](https://github.com/veive-io/mod-sign-as)**
   
   Provides the foundation for signature modules, defining different methods for signature verification, such as ECDSA or WebAuthn. Developers extend the `ModSign` class to implement custom signature verification mechanisms.

4. **[mod-hooks-as](https://github.com/veive-io/mod-hooks-as)**
   
   For hook modules, which implement pre-checks and post-checks around operations. The `ModHooks` class allows developers to create modules that execute custom logic before or after an operation, such as enforcing spending limits or logging transactions.

### **Core Modules**

Based on the core module repositories, specific modules have been developed to provide various functionalities within the Veive ecosystem:

1. **[mod-allowance](https://github.com/veive-io/mod-allowance)**
   
   Utilizes the allowance mechanism to pre-authorize operations, ensuring that only pre-authorized operations are executed. This module is typically installed in the scope `entry_point=allow` to manage allowances for various operations.

2. **[mod-execution-any-as](https://github.com/veive-io/mod-execution-any-as)**
   
   A generic execution module that handles any operation, commonly installed in the "any" scope. It is versatile and can execute a wide range of operations without specific checks.

3. **[mod-validation-signature-as](https://github.com/veive-io/mod-validation-signature-as)**
   
   Validates signatures using different signature methods, often installed in scopes:
   - `operation_type=contract_call,contract_upload,transaction_application` to enable signature verification on all operations by default.
   - `entry_point=allow` to verify the authenticity of operations before they are allowed.

4. **[mod-validation-multisign-as](https://github.com/veive-io/mod-validation-multisign-as)**
   
   Supports multi-signature validation, ideal for scenarios like social recovery or multi-party wallets. Users can specify a set of "guardians" and a threshold of signatures required to authorize an operation.

5. **[mod-sign-mnemonic-as](https://github.com/veive-io/mod-sign-mnemonic-as)**
   
   Specifically for verifying mnemonics (12 words) signatures. This module ensures that operations are signed with a valid ES256 key, providing a standard method of signature verification.

6. **[mod-sign-webauthn-as](https://github.com/veive-io/mod-sign-webauthn-as)**
   
   Enables signature verification using the WebAuthn standard, supporting the use of passkeys for authentication. It is designed for strong, phishing-resistant authentication scenarios.

7. **[mod-sign-openid-as](https://github.com/veive-io/mod-sign-openid-as)**
   
   Enables signature verification using the OpenID standard, supporting authentication via Google, Microsoft, Auth0, and all OpenID providers.

These modules and repositories collectively create a flexible and secure framework for managing smart accounts on the Koinos blockchain. By leveraging the modularity and adaptability of the system, developers and users can tailor their smart accounts to meet specific security, functionality, and usability needs.

