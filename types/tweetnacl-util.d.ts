/**
 * Type declarations for tweetnacl-util
 * 
 * This module provides utility functions for encoding/decoding
 * used with the tweetnacl library.
 */
declare module 'tweetnacl-util' {
    /**
     * Encode a Uint8Array to a base64 string
     */
    export function encodeBase64(input: Uint8Array): string;

    /**
     * Decode a base64 string to Uint8Array
     */
    export function decodeBase64(input: string): Uint8Array;

    /**
     * Encode a Uint8Array to a UTF-8 string
     */
    export function encodeUTF8(input: Uint8Array): string;

    /**
     * Decode a UTF-8 string to Uint8Array
     */
    export function decodeUTF8(input: string): Uint8Array;
}
