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

Veive extends operation validation to include not only initial user operations but also "external" operations generated internally by contracts. This ensures comprehensive validation of all actions, including those that could manipulate transaction outcomes.

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

Veive's ecosystem includes several repositories:

- **[account-as](https://github.com/veiveprotocol/account-as)**: Core repository for the Veive account system.
- **[mod-validation-as](https://github.com/veiveprotocol/mod-validation-as)**: Framework for creating validation modules.
- **[mod-execution-as](https://github.com/veiveprotocol/mod-execution-as)**: Focuses on execution modules.
- **[mod-sign-as](https://github.com/veiveprotocol/mod-sign-as)**: Provides the foundation for signature modules.
- **[mod-hooks-as](https://github.com/veiveprotocol/mod-hooks-as)**: For implementing pre and post-operation checks.

### **Specific Veive Modules**

1. **[mod-validation-any-as](https://github.com/veiveprotocol/mod-validation-any-as)**: Uses the allowance mechanism to pre-authorize operations, ensuring only pre-authorized operations are executed.
2. **[mod-execution-any-as](https://github.com/veiveprotocol/mod-execution-any-as)**: A generic execution module for handling a wide range of operations.
3. **[mod-validation-signature-as](https://github.com/veiveprotocol/mod-validation-signature-as)**: Validates the authenticity of operations' signatures.
4. **[mod-validation-multisign-as](https://github.com/veiveprotocol/mod-validation-multisign-as)**: Supports multi-signature validation for scenarios like social recovery or multi-party wallets.
5. **[mod-sign-ecdsa-as](https://github.com/veiveprotocol/mod-sign-ecdsa-as)**: Verifies operations signed with ECDSA.
6. **[mod-sign-webauthn-as](https://github.com/veiveprotocol/mod-sign-webauthn-as)**: Supports signature verification using the WebAuthn standard.

This README provides a summary of the Veive protocol's modular smart account system on the Koinos blockchain. For detailed documentation, refer to the specific module repositories and the [Veive GitHub](https://github.com/veiveprotocol).
