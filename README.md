### **Introduzione**

Veive è un protocollo che implementa account smart modulari, ispirato allo standard ERC-7579 e ottimizzato per la blockchain Koinos. Gli account smart modulari rappresentano un'evoluzione significativa rispetto agli account tradizionali, combinando la flessibilità dei moduli aggiuntivi con la sicurezza e l'efficienza della blockchain. Lo standard ERC-7579 è stato sviluppato per promuovere la modularità e l'interoperabilità, consentendo la personalizzazione e l'estensibilità degli account tramite l'aggiunta di moduli specifici per diverse funzionalità.

**Vantaggi dello Standard ERC-7579**

1. **Modularità**: Lo standard permette agli sviluppatori di aggiungere o rimuovere funzionalità in modo dinamico tramite moduli. Ciò consente di adattare gli account a nuove esigenze senza dover modificare il codice di base, migliorando l'aggiornabilità e la gestione del rischio.

2. **Interoperabilità**: ERC-7579 favorisce la creazione di un ecosistema unificato in cui i moduli possono interagire tra loro e con diversi tipi di account, facilitando l'integrazione di nuove funzionalità e migliorando l'esperienza dell'utente.

3. **Sicurezza**: La separazione delle funzioni in moduli distinti consente una gestione più granulare delle autorizzazioni e delle verifiche, aumentando la sicurezza dell'account.

**Carenze e Vantaggi di Koinos**

Koinos è una blockchain emergente nota per la sua struttura modulare e l'assenza di commissioni di transazione (zero-fee). Questo approccio riduce le barriere di accesso per gli utenti e facilita l'adozione di massa. Tuttavia, la mancanza di uno standard per la gestione di account smart avanzati limita la capacità di Koinos di supportare applicazioni complesse che richiedono controlli di accesso sofisticati e flessibilità operativa.

Veive colma questa lacuna introducendo una struttura modulare ispirata a ERC-7579, che consente la creazione di account personalizzabili con funzionalità avanzate. Integrando lo standard con le peculiarità di Koinos, Veive permette di sfruttare al massimo i vantaggi della blockchain, come l'assenza di commissioni e la modularità, offrendo al contempo una soluzione scalabile e sicura per la gestione degli account. 

Questa combinazione di flessibilità, sicurezza e zero-fee fa di Veive una soluzione unica per la gestione degli account su Koinos, ideale per sviluppatori e utenti alla ricerca di un sistema versatile e potente per la gestione delle criptovalute e delle operazioni blockchain.

### **Tipologie di Moduli**

Veive si basa su una struttura modulare che permette di estendere le funzionalità degli account smart su Koinos. I moduli sono suddivisi in quattro categorie principali, ciascuna con un ruolo specifico nell'ecosistema:

1. **Moduli di Validazione (mod-validation-as)**
   - **Descrizione**: Questi moduli verificano l'autenticità e l'autorizzazione delle operazioni. Sono fondamentali per garantire che le operazioni eseguite siano conformi alle regole stabilite dall'utente o dal sistema.
   - **Funzionamento**: I moduli di validazione controllano le operazioni in base a criteri specifici, come la validità della firma o la conformità a determinate politiche di sicurezza. Ad esempio, un modulo può verificare che una transazione sia firmata correttamente e che l'importo trasferito non superi un certo limite.

2. **Moduli di Esecuzione (mod-execution-as)**
   - **Descrizione**: Questi moduli sono responsabili dell'esecuzione delle operazioni richieste. Possono eseguire una vasta gamma di azioni, dal trasferimento di token alla chiamata di smart contract specifici.
   - **Funzionamento**: Una volta che un'operazione è stata validata, i moduli di esecuzione portano a termine l'azione richiesta. Questo può includere l'invio di token, l'interazione con altri contratti intelligenti o l'esecuzione di logiche specifiche per l'applicazione.

3. **Moduli di Firma (mod-sign-as)**
   - **Descrizione**: Forniscono metodi alternativi di firma, separati dalla logica di validazione. Questo permette di utilizzare diversi metodi di firma, come ECDSA, WebAuthn, o altri meccanismi di autenticazione.
   - **Funzionamento**: I moduli di firma vengono invocati per convalidare le firme delle operazioni. A differenza dei moduli di validazione, che si concentrano sull'autorizzazione delle operazioni, i moduli di firma si occupano del metodo di autenticazione utilizzato per firmare le transazioni.

4. **Moduli Hooks (mod-hooks-as)**
   - **Descrizione**: Questi moduli eseguono azioni pre e post operazione, offrendo una maggiore flessibilità nell'implementazione di controlli e logiche aggiuntive.
   - **Funzionamento**: I moduli hooks possono essere utilizzati per eseguire controlli preliminari, come verifiche aggiuntive di sicurezza, o azioni post-operazione, come la registrazione di eventi o l'aggiornamento di stati interni.

### **Interfaccia della Classe Account**

La classe `Account` fornisce un'interfaccia completa per gestire i moduli e le operazioni. Ecco un riepilogo dei metodi principali:

- **install_module**: Questo metodo consente di installare un modulo in uno specifico scope. Lo scope rappresenta il contesto in cui il modulo sarà attivo, come specifici entry_point o contract_id. Se non specificato, vengono utilizzati gli scope di default definiti dal modulo stesso.

- **uninstall_module**: Rimuove un modulo dal sistema, eliminando tutte le sue associazioni agli scope.

- **execute**: Esegue un'operazione dopo aver effettuato i controlli preliminari (pre-checks) e post-operazione (post-checks) utilizzando i moduli hooks registrati. Questo metodo è utilizzato quando l'operazione è avviata da un utente non identificato come un modulo esecutore.

- **execute_executor**: Simile a `execute`, ma specifico per i moduli esecutori registrati. Questo metodo garantisce che solo i moduli esecutori possano avviare l'operazione, eseguendo controlli di sicurezza specifici.

- **execute_user**: Permette l'esecuzione di un'operazione direttamente dall'utente, bypassando i controlli dei moduli esecutori. È utilizzato principalmente per operazioni dirette e non critiche.

- **is_valid_signature**: Verifica la validità di una firma, utilizzando il modulo di firma attivo. Questo metodo è cruciale per garantire l'autenticità delle transazioni e per prevenire frodi.

- **is_valid_operation**: Verifica la validità di un'operazione, assicurando che tutti i moduli di validazione attivi confermino la conformità dell'operazione alle regole predefinite.

- **authorize**: Un metodo critico che viene chiamato per verificare l'autorizzazione di un'operazione, specialmente quando si tratta di operazioni "external". Questo metodo garantisce che tutte le operazioni, anche quelle interne tra contratti, siano validate correttamente, prevenendo potenziali abusi o operazioni non autorizzate.


### Differenze rispetto allo Standard ERC-7579

Il protocollo Veive presenta alcune differenze chiave rispetto allo standard ERC-7579, adattandosi alle specificità della blockchain Koinos e introducendo miglioramenti significativi in termini di sicurezza e flessibilità.

#### Operation
A differenza dello standard ERC-7579, che non specifica dettagliatamente il concetto di "operation", Veive pone un'enfasi particolare su questo concetto. Un'operazione (operation) in Veive è definita come una singola azione che fa parte di una transazione e viene identificata da:

- **contract_id**: L'identificativo del contratto smart su cui l'operazione è eseguita.
- **entry_point**: Il metodo specifico del contratto che viene invocato.
- **args**: Gli argomenti o parametri passati al metodo.

Questo approccio permette un controllo più granulare e preciso delle operazioni. Ad esempio, se un contratto viene chiamato per eseguire un trasferimento di token (koinContract.transfer({amount: 100})), ogni dettaglio dell'operazione viene esaminato per garantire che sia conforme alle regole predefinite.

#### EntryPoint
Nello standard ERC-7579 esiste un concetto centralizzato chiamato "EntryPoint" da cui passano tutte le operazioni. In Koinos, questo non è presente; le operazioni possono essere inviate direttamente agli smart account senza un punto di controllo centralizzato. Questo offre maggiore flessibilità e rapidità nelle interazioni con gli smart contract, ma richiede un sistema di controllo delle operazioni più robusto per garantire la sicurezza.

#### Controllo delle Operazioni e Metodo `authorize`
Veive estende il controllo delle operazioni includendo non solo le operazioni iniziali inviate dagli utenti (user_op) ma anche le operazioni "external" generate internamente dai contratti. Questo significa che ogni chiamata, anche interna, viene validata. Ad esempio, se un contratto tenta di manipolare un trasferimento di token all'interno di un'operazione più grande, questa manipolazione viene rilevata e bloccata se non autorizzata.

Il metodo `authorize` è cruciale in questo contesto. Viene chiamato automaticamente per ogni operazione che richiede una validazione, garantendo che tutte le operazioni siano verificate da moduli di validazione adeguati. Questo metodo assicura che anche le operazioni "external" siano soggette a controllo, prevenendo abusi o esecuzioni non autorizzate.

#### Contestualizzazione e Selezione dei Moduli
In Veive, i moduli vengono selezionati e attivati in base a uno "scope" (contesto) specifico, che determina quando e come un modulo deve essere utilizzato. Questo sistema di scope è più flessibile rispetto allo standard ERC-7579, che non fornisce linee guida specifiche per la selezione dei moduli. Gli scope in Veive sono definiti a tre livelli di specificità:

- **entry_point + contract_id**: Moduli specifici per un metodo di un contratto particolare.
- **entry_point**: Moduli attivi per un metodo specifico, indipendentemente dal contratto.
- **any**: Moduli applicabili a qualsiasi operazione.

La gestione degli scope differisce tra i tipi di moduli:
- **Validatori**: Viene cercato un unico modulo valido, seguendo l'ordine di specificità dal più specifico (entry_point + contract_id) al più generico (any).
- **Executor e Hooks**: Tutti i moduli pertinenti sono eseguiti se presenti negli scope, garantendo un'esecuzione completa delle operazioni.
- **Moduli Sign**: Esiste un solo scope di default, permettendo l'installazione di un solo modulo di firma alla volta. Questo approccio garantisce che solo un metodo di firma sia attivo per l'account in un dato momento, semplificando la gestione delle chiavi e dei metodi di autenticazione.

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
