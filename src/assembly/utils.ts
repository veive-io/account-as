import { Arrays, Protobuf } from "@koinos/sdk-as";
import { account } from "./proto/account";

export function selector_encode(selector: account.selector): Uint8Array {
    return Protobuf.encode<account.selector>(selector, account.selector.encode);
}

export function selector_decode(selector: Uint8Array): account.selector {
    return Protobuf.decode<account.selector>(selector, account.selector.decode);
}

export class ArrayBytes {

    /**
     * Concatenate two Uint8Arrays.
     * @param bytes1 - The first Uint8Array.
     * @param bytes2 - The second Uint8Array.
     * @returns Uint8Array - The concatenated result.
     */
    static concatenate(bytes1: Uint8Array, bytes2: Uint8Array): Uint8Array {
        const result = new Uint8Array(bytes1.length + bytes2.length);
        result.set(bytes1, 0);
        result.set(bytes2, bytes1.length);
        return result;
    }

    /**
     * Check if an array includes a specific Uint8Array.
     * @param array - The array to search.
     * @param bytes - The Uint8Array to search for.
     * @returns boolean - True if the array includes the bytes, false otherwise.
     */
    static includes(array: Uint8Array[], bytes: Uint8Array): boolean {
        for (let i = 0; i < array.length; i++) {
            if (Arrays.equal(array[i], bytes)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Remove a specific Uint8Array from an array.
     * @param array - The array to modify.
     * @param bytes - The Uint8Array to remove.
     * @returns Uint8Array[] - The modified array.
     */
    static remove(array: Uint8Array[], bytes: Uint8Array): Uint8Array[] {
        const result: Uint8Array[] = [];

        for (let i = 0; i < result.length; i++) {
            const item = result[i];
            if (Arrays.equal(item, bytes) == false) {
                result.push(item);
            }
        }

        return result;
    }

}

