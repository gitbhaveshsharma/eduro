/**
 * Type declarations for tweetnacl
 * 
 * TweetNaCl is a cryptographic library implementing NaCl (Networking and Cryptography library).
 */

declare module 'tweetnacl' {
    // SecretBox - Symmetric encryption
    export const secretbox: {
        (msg: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        open(box: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array | null;
        readonly keyLength: number;
        readonly nonceLength: number;
        readonly overheadLength: number;
    };

    // Box - Asymmetric encryption
    export const box: {
        (msg: Uint8Array, nonce: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
        open(msg: Uint8Array, nonce: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array | null;
        before(publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
        after(msg: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        open_after(box: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array | null;
        keyPair(): {
            publicKey: Uint8Array;
            secretKey: Uint8Array;
        };
        keyPair_fromSecretKey(secretKey: Uint8Array): {
            publicKey: Uint8Array;
            secretKey: Uint8Array;
        };
        readonly publicKeyLength: number;
        readonly secretKeyLength: number;
        readonly sharedKeyLength: number;
        readonly nonceLength: number;
        readonly overheadLength: number;
    };

    // Sign - Digital signatures
    export const sign: {
        (msg: Uint8Array, secretKey: Uint8Array): Uint8Array;
        open(signedMsg: Uint8Array, publicKey: Uint8Array): Uint8Array | null;
        detached(msg: Uint8Array, secretKey: Uint8Array): Uint8Array;
        detached_verify(msg: Uint8Array, sig: Uint8Array, publicKey: Uint8Array): boolean;
        keyPair(): {
            publicKey: Uint8Array;
            secretKey: Uint8Array;
        };
        keyPair_fromSecretKey(secretKey: Uint8Array): {
            publicKey: Uint8Array;
            secretKey: Uint8Array;
        };
        keyPair_fromSeed(seed: Uint8Array): {
            publicKey: Uint8Array;
            secretKey: Uint8Array;
        };
        readonly publicKeyLength: number;
        readonly secretKeyLength: number;
        readonly seedLength: number;
        readonly signatureLength: number;
    };

    // Hash
    export function hash(msg: Uint8Array): Uint8Array;
    export namespace hash {
        const hashLength: number;
    }

    // Scalar multiplication
    export const scalarMult: {
        (n: Uint8Array, p: Uint8Array): Uint8Array;
        base(n: Uint8Array): Uint8Array;
        readonly scalarLength: number;
        readonly groupElementLength: number;
    };

    // Random bytes
    export function randomBytes(n: number): Uint8Array;

    // HMAC-SHA-512
    export function verify(x: Uint8Array, y: Uint8Array): boolean;

    // Low-level operations
    export const lowlevel: {
        crypto_secretbox: (c: Uint8Array, m: Uint8Array, d: number, n: Uint8Array, k: Uint8Array) => number;
        crypto_secretbox_open: (m: Uint8Array, c: Uint8Array, d: number, n: Uint8Array, k: Uint8Array) => number;
        crypto_box: (c: Uint8Array, m: Uint8Array, d: number, n: Uint8Array, y: Uint8Array, x: Uint8Array) => number;
        crypto_box_open: (m: Uint8Array, c: Uint8Array, d: number, n: Uint8Array, y: Uint8Array, x: Uint8Array) => number;
        crypto_box_keypair: (y: Uint8Array, x: Uint8Array) => number;
        crypto_box_beforenm: (k: Uint8Array, y: Uint8Array, x: Uint8Array) => number;
        crypto_box_afternm: (c: Uint8Array, m: Uint8Array, d: number, n: Uint8Array, k: Uint8Array) => number;
        crypto_box_open_afternm: (m: Uint8Array, c: Uint8Array, d: number, n: Uint8Array, k: Uint8Array) => number;
        crypto_hash: (out: Uint8Array, m: Uint8Array, n: number) => number;
        crypto_hashblocks_hl: (hh: Int32Array, hl: Int32Array, m: Uint8Array, n: number) => number;
        crypto_sign: (sm: Uint8Array, m: Uint8Array, n: number, sk: Uint8Array) => number;
        crypto_sign_open: (m: Uint8Array, sm: Uint8Array, n: number, pk: Uint8Array) => number;
        crypto_sign_keypair: (pk: Uint8Array, sk: Uint8Array, seeded?: boolean) => void;
        crypto_scalarmult: (q: Uint8Array, n: Uint8Array, p: Uint8Array) => number;
        crypto_scalarmult_base: (q: Uint8Array, n: Uint8Array) => number;
    };

    // Set pseudo-random number generator
    export function setPRNG(prng: (x: Uint8Array, n: number) => void): void;
}
