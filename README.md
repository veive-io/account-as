## **Veive Protocol: `account-as` README**

### **Introduction**

Veive is a protocol designed to implement modular smart accounts on the Koinos blockchain, inspired by the ERC-7579 standard. It leverages the flexibility of modular design to offer advanced features such as customizable security, functionality, and user experience. Unlike traditional blockchain accounts, modular smart accounts in Veive can be tailored to specific needs through the addition and configuration of various modules, enhancing both flexibility and security.

### **Types of Modules**

Veive's modular architecture categorizes modules into four main types, each serving a distinct role in enhancing account functionalities:

1. **Validation Modules**: Verify the legitimacy and authorization of operations, ensuring that all actions comply with security policies.

2. **Execution Modules**: Execute specific actions like token transfers or smart contract calls once an operation has been validated.

3. **Signature Modules**: Provide various methods for signing operations, supporting authentication mechanisms like ECDSA and WebAuthn.

4. **Hook Modules**: Execute additional checks or actions before and after the main operation, such as setting spending limits or logging transactions.

### **Account Class Interface**

The `Account` class provides essential methods for managing operations and interacting with installed modules:

- **install_module**: Installs a module within a specific scope, allowing it to perform its designated function.
- **uninstall_module**: Removes a module and its associated functionalities.
- **execute**: Executes a user-initiated operation after pre-checks and post-checks using registered hook modules.
- **execute_executor**: Specifically handles operations initiated by registered executor modules.
- **execute_user**: Facilitates direct execution of operations by the user.
- **is_valid_signature**: Validates the authenticity of signatures using the active signature module.
- **is_valid_operation**: Checks the validity of an operation by consulting all active validation modules.
- **authorize**: Ensures that all operations, including "external" ones, are authorized before execution.

### **Key Differences from ERC-7579**

#### **Operation-Centric Design**

Unlike ERC-7579, which does not focus on the detailed concept of "operation," Veive emphasizes this aspect. An operation in Veive is a single action within a transaction, identified by:

- **contract_id**: The identifier of the smart contract being interacted with.
- **entry_point**: The specific method being invoked.
- **args**: The arguments passed to the method.

This detailed specification allows for precise control and validation of operations.

#### **EntryPoint Concept**

ERC-7579 includes a centralized "EntryPoint" contract for routing all operations, while Koinos allows operations to be sent directly to smart accounts. This decentralization enhances flexibility but requires a robust system for operation validation.

#### **Operation Validation and `authorize` Method**

Veive extends operation validation to include not only initial user operations but also "external" operations generated when a contract calls an external contract. This ensures comprehensive validation of all actions, including those that could manipulate transaction outcomes.

The `authorize` method is a crucial addition, automatically invoked for every operation requiring validation. It checks if the operation is permitted by consulting relevant validation modules, ensuring secure and authorized execution of all actions.

### **Contextualization and Module Selection**

Veive uses a "scope" system to manage when and how modules are activated, providing a more flexible and performance-optimized experience compared to ERC-7579. Scopes are categorized into three levels:

- **entry_point + contract_id**: Modules specific to a particular method of a specific contract.
- **entry_point**: Modules active for a specific method across all contracts.
- **any**: Modules applicable to any operation.

#### **Scope Handling**

- **Validators**: Only one valid module is sought, starting from the most specific scope.
- **Executor and Hooks**: All relevant modules within the scopes are executed.
- **Signature Modules**: Only one module can be active at a time, with a default scope.

### **Repository Overview**

The Veive protocol comprises several repositories that together implement a modular smart account system on the Koinos blockchain. Here's an overview of each repository and its role in the Veive ecosystem:

#### **Core Smart Account Repository**

1. **[account-as](https://github.com/veiveprotocol/account-as)**
   - **Description**: This repository contains the core smart contract for the Veive account system. Each user deploys this contract to manage operations, validate signatures, and interact with various modules. It serves as the main hub where modules are installed, providing a customizable and secure environment for managing blockchain interactions.

#### **Core Module Repositories**

These repositories, though external dependencies, are integral to the functionality of Veive smart accounts. They provide essential classes, protobuf definitions, and interfaces for developing and interacting with various types of modules.

1. **[mod-validation-as](https://github.com/veiveprotocol/mod-validation-as)**
   - **Description**: Framework for creating validation modules that verify operations before execution. Developers extend the `ModValidator` class and use the provided protobuf definitions to build custom validation logic.

2. **[mod-execution-as](https://github.com/veiveprotocol/mod-execution-as)**
   - **Description**: Focuses on execution modules responsible for specific operations like token transfers or smart contract interactions. The `ModExecution` class is extended to implement these functionalities.

3. **[mod-sign-as](https://github.com/veiveprotocol/mod-sign-as)**
   - **Description**: Provides the foundation for signature modules, defining different methods for signature verification, such as ECDSA or WebAuthn. Developers extend the `ModSign` class to implement custom signature verification mechanisms.

4. **[mod-hooks-as](https://github.com/veiveprotocol/mod-hooks-as)**
   - **Description**: For hook modules, which implement pre-checks and post-checks around operations. The `ModHooks` class allows developers to create modules that execute custom logic before or after an operation, such as enforcing spending limits or logging transactions.

### **Specific Veive Modules**

Based on the core module repositories, specific modules have been developed to provide various functionalities within the Veive ecosystem:

1. **[mod-validation-any-as](https://github.com/veiveprotocol/mod-validation-any-as)**
   - **Function**: Utilizes the allowance mechanism to pre-authorize operations, ensuring that only pre-authorized operations are executed. This module is typically installed in the scope "entry_point=allow" to manage allowances for various operations.

2. **[mod-execution-any-as](https://github.com/veiveprotocol/mod-execution-any-as)**
   - **Function**: A generic execution module that handles any operation, commonly installed in the "any" scope. It is versatile and can execute a wide range of operations without specific checks.

3. **[mod-validation-signature-as](https://github.com/veiveprotocol/mod-validation-signature-as)**
   - **Function**: Validates signatures using different signature methods, often installed in the "entry_point=allow" scope to verify the authenticity of operations before they are allowed.

4. **[mod-validation-multisign-as](https://github.com/veiveprotocol/mod-validation-multisign-as)**
   - **Function**: Supports multi-signature validation, ideal for scenarios like social recovery or multi-party wallets. Users can specify a set of "guardians" and a threshold of signatures required to authorize an operation.

5. **[mod-sign-ecdsa-as](https://github.com/veiveprotocol/mod-sign-ecdsa-as)**
   - **Function**: Specifically for verifying ECDSA signatures. This module ensures that operations are signed with a valid ECDSA key, providing a standard method of signature verification.

6. **[mod-sign-webauthn-as](https://github.com/veiveprotocol/mod-sign-webauthn-as)**
   - **Function**: Enables signature verification using the WebAuthn standard, supporting the use of passkeys for authentication. It is designed for strong, phishing-resistant authentication scenarios.

These modules and repositories collectively create a flexible and secure framework for managing smart accounts on the Koinos blockchain. By leveraging the modularity and adaptability of the system, developers and users can tailor their smart accounts to meet specific security, functionality, and usability needs.