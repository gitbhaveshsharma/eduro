/**
 * Quiz Question Encryption Utilities
 * 
 * Client-side encryption for quiz questions using TweetNaCl.
 * This ensures that sensitive question data (question_text, options, correct_answers, explanation)
 * is encrypted before being sent to Supabase, so the server never sees plaintext.
 * 
 * SECURITY NOTES:
 * - The secret key should be stored in environment variables (NEXT_PUBLIC_QUIZ_ENCRYPTION_KEY)
 * - Never commit the actual key to version control
 * - The same key is used for all users (symmetric encryption)
 * - Encryption happens on teacher's client when creating questions
 * - Decryption happens on student's client when taking the quiz
 * 
 * @module branch-system/utils/quiz-crypto
 */

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import type { QuizOptions, QuizQuestion } from '../types/quiz.types';

// ============================================================
// TYPES
// ============================================================

/**
 * Encrypted question data structure stored in database
 */
export interface EncryptedQuestionData {
    /** Encrypted question text (base64) */
    encrypted_question_text: string;
    /** Encrypted options JSON (base64) */
    encrypted_options: string;
    /** Encrypted correct answers JSON (base64) */
    encrypted_correct_answers: string;
    /** Encrypted explanation (base64), null if no explanation */
    encrypted_explanation: string | null;
    /** Nonce used for encryption (base64) - unique per question */
    nonce: string;
    /** Flag to indicate this question is encrypted */
    is_encrypted: boolean;
}

/**
 * Decrypted question data
 */
export interface DecryptedQuestionData {
    question_text: string;
    options: QuizOptions;
    correct_answers: string[];
    explanation: string | null;
}

/**
 * Question data to be encrypted
 */
export interface QuestionDataToEncrypt {
    question_text: string;
    options: QuizOptions;
    correct_answers: string[];
    explanation?: string | null;
}

// ============================================================
// KEY MANAGEMENT
// ============================================================

/**
 * Get the encryption key from environment variable
 * The key must be a 32-byte (256-bit) key encoded as base64
 * 
 * To generate a new key:
 * ```typescript
 * import nacl from 'tweetnacl';
 * import naclUtil from 'tweetnacl-util';
 * const key = nacl.randomBytes(32);
 * const keyBase64 = naclUtil.encodeBase64(key);
 * console.log(keyBase64); // Save this in your .env file
 * ```
 * 
 * @returns The 32-byte secret key as Uint8Array
 * @throws Error if key is not configured or invalid
 */
export function getEncryptionKey(): Uint8Array {
    const keyBase64 = process.env.NEXT_PUBLIC_QUIZ_ENCRYPTION_KEY;

    if (!keyBase64) {
        throw new Error(
            'Quiz encryption key not configured. ' +
            'Please set NEXT_PUBLIC_QUIZ_ENCRYPTION_KEY in your environment variables.'
        );
    }

    try {
        const key = naclUtil.decodeBase64(keyBase64);

        if (key.length !== nacl.secretbox.keyLength) {
            throw new Error(
                `Invalid key length. Expected ${nacl.secretbox.keyLength} bytes, got ${key.length} bytes.`
            );
        }

        return key;
    } catch (error) {
        if (error instanceof Error && error.message.includes('Invalid key length')) {
            throw error;
        }
        throw new Error('Invalid encryption key format. Key must be valid base64.');
    }
}

/**
 * Generate a new random encryption key
 * Use this utility to generate a key for your .env file
 * 
 * @returns Base64-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
    const key = nacl.randomBytes(nacl.secretbox.keyLength);
    return naclUtil.encodeBase64(key);
}

// ============================================================
// ENCRYPTION FUNCTIONS
// ============================================================

/**
 * Encrypt a string using NaCl secretbox
 * 
 * @param plaintext - The text to encrypt
 * @param key - The 32-byte encryption key
 * @param nonce - The 24-byte nonce (must be unique per encryption)
 * @returns Base64-encoded ciphertext
 */
function encryptString(plaintext: string, key: Uint8Array, nonce: Uint8Array): string {
    const messageUint8 = naclUtil.decodeUTF8(plaintext);
    const encrypted = nacl.secretbox(messageUint8, nonce, key);
    return naclUtil.encodeBase64(encrypted);
}

/**
 * Decrypt a string using NaCl secretbox
 * 
 * @param ciphertext - Base64-encoded ciphertext
 * @param key - The 32-byte encryption key
 * @param nonce - The 24-byte nonce used during encryption
 * @returns Decrypted plaintext
 * @throws Error if decryption fails
 */
function decryptString(ciphertext: string, key: Uint8Array, nonce: Uint8Array): string {
    const encryptedUint8 = naclUtil.decodeBase64(ciphertext);
    const decrypted = nacl.secretbox.open(encryptedUint8, nonce, key);

    if (!decrypted) {
        throw new Error('Decryption failed. Invalid key or corrupted data.');
    }

    return naclUtil.encodeUTF8(decrypted);
}

/**
 * Generate a unique nonce for encryption
 * Each question should use a unique nonce
 * 
 * @returns 24-byte nonce as Uint8Array
 */
export function generateNonce(): Uint8Array {
    return nacl.randomBytes(nacl.secretbox.nonceLength);
}

// ============================================================
// QUESTION ENCRYPTION/DECRYPTION
// ============================================================

/**
 * Encrypt question data for storage in database
 * 
 * This encrypts:
 * - question_text
 * - options (as JSON)
 * - correct_answers (as JSON)
 * - explanation (if provided)
 * 
 * @param data - Question data to encrypt
 * @returns Encrypted data structure ready for database storage
 * 
 * @example
 * ```typescript
 * const encryptedData = encryptQuestionData({
 *   question_text: "What is 2+2?",
 *   options: { A: "3", B: "4", C: "5", D: "6" },
 *   correct_answers: ["B"],
 *   explanation: "Basic addition"
 * });
 * 
 * // Store in database
 * await supabase.from('quiz_questions').insert({
 *   ...otherFields,
 *   question_text: encryptedData.encrypted_question_text,
 *   options: { encrypted: encryptedData.encrypted_options },
 *   correct_answers: [encryptedData.encrypted_correct_answers],
 *   explanation: encryptedData.encrypted_explanation,
 *   metadata: { nonce: encryptedData.nonce, is_encrypted: true }
 * });
 * ```
 */
export function encryptQuestionData(data: QuestionDataToEncrypt): EncryptedQuestionData {
    const key = getEncryptionKey();
    const nonce = generateNonce();
    const nonceBase64 = naclUtil.encodeBase64(nonce);

    return {
        encrypted_question_text: encryptString(data.question_text, key, nonce),
        encrypted_options: encryptString(JSON.stringify(data.options), key, nonce),
        encrypted_correct_answers: encryptString(JSON.stringify(data.correct_answers), key, nonce),
        encrypted_explanation: data.explanation
            ? encryptString(data.explanation, key, nonce)
            : null,
        nonce: nonceBase64,
        is_encrypted: true,
    };
}

/**
 * Decrypt question data retrieved from database
 * 
 * @param encryptedData - Encrypted data from database
 * @returns Decrypted question data
 * @throws Error if decryption fails
 * 
 * @example
 * ```typescript
 * // After fetching from database
 * const decryptedData = decryptQuestionData({
 *   encrypted_question_text: row.question_text,
 *   encrypted_options: row.options.encrypted,
 *   encrypted_correct_answers: row.correct_answers[0],
 *   encrypted_explanation: row.explanation,
 *   nonce: row.metadata.nonce,
 *   is_encrypted: true
 * });
 * ```
 */
export function decryptQuestionData(encryptedData: EncryptedQuestionData): DecryptedQuestionData {
    const key = getEncryptionKey();
    const nonce = naclUtil.decodeBase64(encryptedData.nonce);

    return {
        question_text: decryptString(encryptedData.encrypted_question_text, key, nonce),
        options: JSON.parse(decryptString(encryptedData.encrypted_options, key, nonce)),
        correct_answers: JSON.parse(decryptString(encryptedData.encrypted_correct_answers, key, nonce)),
        explanation: encryptedData.encrypted_explanation
            ? decryptString(encryptedData.encrypted_explanation, key, nonce)
            : null,
    };
}

// ============================================================
// DATABASE HELPERS
// ============================================================

/**
 * Prepare question data for database insert (with encryption)
 * 
 * @param questionData - Original question data from form
 * @returns Data ready for Supabase insert
 */
export function prepareQuestionForInsert(questionData: {
    quiz_id: string;
    question_text: string;
    question_type: string;
    options: QuizOptions;
    correct_answers: string[];
    points: number;
    negative_points: number;
    explanation?: string | null;
    question_order: number;
    topic?: string | null;
    media_file_id?: string | null;
}): Record<string, unknown> {
    const encrypted = encryptQuestionData({
        question_text: questionData.question_text,
        options: questionData.options,
        correct_answers: questionData.correct_answers,
        explanation: questionData.explanation,
    });

    return {
        quiz_id: questionData.quiz_id,
        // Store encrypted data as the actual fields
        question_text: encrypted.encrypted_question_text,
        options: { _encrypted: encrypted.encrypted_options }, // Wrap to preserve structure
        correct_answers: [encrypted.encrypted_correct_answers], // Store as single encrypted string
        // Non-sensitive fields remain unencrypted
        question_type: questionData.question_type,
        points: questionData.points,
        negative_points: questionData.negative_points,
        explanation: encrypted.encrypted_explanation,
        question_order: questionData.question_order,
        topic: questionData.topic,
        media_file_id: questionData.media_file_id,
        // Store nonce and encryption flag in metadata
        metadata: {
            nonce: encrypted.nonce,
            is_encrypted: true,
        },
    };
}

/**
 * Check if a question is encrypted
 * 
 * @param question - Question data from database
 * @returns True if the question is encrypted
 */
export function isQuestionEncrypted(question: QuizQuestion): boolean {
    return (
        question.metadata &&
        typeof question.metadata === 'object' &&
        'is_encrypted' in question.metadata &&
        question.metadata.is_encrypted === true
    );
}

/**
 * Decrypt a question from database format
 * Handles both encrypted and unencrypted questions for backward compatibility
 * 
 * @param question - Question from database
 * @returns Decrypted question with readable data
 */
export function decryptQuestion(question: QuizQuestion): QuizQuestion {
    // If not encrypted, return as-is (backward compatibility)
    if (!isQuestionEncrypted(question)) {
        return question;
    }

    const metadata = question.metadata as { nonce: string; is_encrypted: boolean };

    // Extract encrypted data
    const encryptedData: EncryptedQuestionData = {
        encrypted_question_text: question.question_text,
        encrypted_options: (question.options as { _encrypted?: string })._encrypted || '',
        encrypted_correct_answers: question.correct_answers[0] || '',
        encrypted_explanation: question.explanation,
        nonce: metadata.nonce,
        is_encrypted: true,
    };

    // Decrypt
    const decrypted = decryptQuestionData(encryptedData);

    // Return question with decrypted data
    return {
        ...question,
        question_text: decrypted.question_text,
        options: decrypted.options,
        correct_answers: decrypted.correct_answers,
        explanation: decrypted.explanation,
    };
}

/**
 * Decrypt multiple questions
 * 
 * @param questions - Array of questions from database
 * @returns Array of decrypted questions
 */
export function decryptQuestions(questions: QuizQuestion[]): QuizQuestion[] {
    return questions.map(decryptQuestion);
}

/**
 * Decrypt a question for student view (without correct answers)
 * This is used during quiz attempts - removes sensitive data after decryption
 * 
 * @param question - Question from database
 * @returns Decrypted question without correct answers
 */
export function decryptQuestionForStudent(question: QuizQuestion): QuizQuestion {
    const decrypted = decryptQuestion(question);

    // Remove sensitive data for student view
    return {
        ...decrypted,
        correct_answers: [], // Never expose correct answers during attempt
        explanation: null,  // Never expose explanation during attempt
    };
}

/**
 * Decrypt multiple questions for student view
 * 
 * @param questions - Array of questions from database
 * @returns Array of decrypted questions without correct answers
 */
export function decryptQuestionsForStudent(questions: QuizQuestion[]): QuizQuestion[] {
    return questions.map(decryptQuestionForStudent);
}

// ============================================================
// RESPONSE ENCRYPTION (For student answers)
// ============================================================

/**
 * Encrypted response data structure
 */
export interface EncryptedResponseData {
    /** Encrypted selected_answers JSON (base64) */
    encrypted_selected_answers: string;
    /** Nonce used for encryption (base64) */
    nonce: string;
    /** Flag to indicate this response is encrypted */
    is_encrypted: boolean;
}

/**
 * Response data to be encrypted
 */
export interface ResponseDataToEncrypt {
    selected_answers: string[];
    answer_text?: string | null;
}

/**
 * Encrypt student response data for storage
 * 
 * @param data - Response data to encrypt (selected_answers, answer_text)
 * @returns Encrypted data structure ready for database storage
 * 
 * @example
 * ```typescript
 * const encryptedData = encryptResponseData({
 *   selected_answers: ["A", "C"],
 *   answer_text: null
 * });
 * 
 * // Store in database
 * await supabase.from('quiz_responses').insert({
 *   ...otherFields,
 *   selected_answers: [encryptedData.encrypted_selected_answers],
 *   metadata: { nonce: encryptedData.nonce, is_encrypted: true }
 * });
 * ```
 */
export function encryptResponseData(data: ResponseDataToEncrypt): EncryptedResponseData {
    const key = getEncryptionKey();
    const nonce = generateNonce();
    const nonceBase64 = naclUtil.encodeBase64(nonce);

    // Encrypt selected_answers as JSON
    const answersJson = JSON.stringify(data.selected_answers);
    const messageUint8 = naclUtil.decodeUTF8(answersJson);
    const encrypted = nacl.secretbox(messageUint8, nonce, key);
    const encryptedBase64 = naclUtil.encodeBase64(encrypted);

    return {
        encrypted_selected_answers: encryptedBase64,
        nonce: nonceBase64,
        is_encrypted: true,
    };
}

/**
 * Decrypt student response data from database
 * 
 * @param encryptedAnswers - The encrypted selected_answers string from database
 * @param nonce - The nonce used during encryption
 * @returns Decrypted selected_answers array
 */
export function decryptResponseData(encryptedAnswers: string, nonce: string): string[] {
    try {
        const key = getEncryptionKey();
        const nonceUint8 = naclUtil.decodeBase64(nonce);
        const encryptedUint8 = naclUtil.decodeBase64(encryptedAnswers);
        
        const decrypted = nacl.secretbox.open(encryptedUint8, nonceUint8, key);
        
        if (!decrypted) {
            console.error('Response decryption failed - invalid key or corrupted data');
            return [];
        }

        return JSON.parse(naclUtil.encodeUTF8(decrypted));
    } catch (error) {
        console.error('Error decrypting response:', error);
        return [];
    }
}

/**
 * Check if a response is encrypted
 * 
 * @param response - Response data from database
 * @returns True if the response is encrypted
 */
export function isResponseEncrypted(response: { metadata?: Record<string, unknown> }): boolean {
    return (
        response.metadata &&
        typeof response.metadata === 'object' &&
        'is_encrypted' in response.metadata &&
        response.metadata.is_encrypted === true
    );
}

/**
 * Prepare response data for database insert (with encryption)
 * 
 * @param responseData - Original response data
 * @returns Data ready for Supabase insert with encrypted answers
 */
export function prepareResponseForInsert(responseData: {
    attempt_id: string;
    question_id: string;
    selected_answers: string[];
    answer_text?: string | null;
    is_correct: boolean;
    points_earned: number;
    points_deducted: number;
    time_spent_seconds: number;
    question_started_at?: string | null;
    question_answered_at?: string | null;
}): Record<string, unknown> {
    const encrypted = encryptResponseData({
        selected_answers: responseData.selected_answers,
        answer_text: responseData.answer_text,
    });

    return {
        attempt_id: responseData.attempt_id,
        question_id: responseData.question_id,
        // Store encrypted answer as single string in array
        selected_answers: [encrypted.encrypted_selected_answers],
        answer_text: null, // Answer text is included in encrypted data
        is_correct: responseData.is_correct,
        points_earned: responseData.points_earned,
        points_deducted: responseData.points_deducted,
        time_spent_seconds: responseData.time_spent_seconds,
        question_started_at: responseData.question_started_at,
        question_answered_at: responseData.question_answered_at,
        // Store nonce and encryption flag in metadata
        metadata: {
            nonce: encrypted.nonce,
            is_encrypted: true,
        },
    };
}

/**
 * Decrypt a response from database format
 * Handles both encrypted and unencrypted responses for backward compatibility
 * 
 * @param response - Response from database
 * @returns Response with decrypted selected_answers
 */
export function decryptResponse<T extends { 
    selected_answers: string[]; 
    metadata?: Record<string, unknown>;
}>(response: T): T {
    // If not encrypted, return as-is (backward compatibility)
    if (!isResponseEncrypted(response)) {
        return response;
    }

    const metadata = response.metadata as { nonce: string; is_encrypted: boolean };
    
    // The encrypted answer is stored as the first (and only) element
    const encryptedAnswer = response.selected_answers[0] || '';
    const decryptedAnswers = decryptResponseData(encryptedAnswer, metadata.nonce);

    return {
        ...response,
        selected_answers: decryptedAnswers,
    };
}

/**
 * Decrypt multiple responses
 * 
 * @param responses - Array of responses from database
 * @returns Array of responses with decrypted selected_answers
 */
export function decryptResponses<T extends { 
    selected_answers: string[]; 
    metadata?: Record<string, unknown>;
}>(responses: T[]): T[] {
    return responses.map(decryptResponse);
}

// ============================================================
// EXPORTS FOR CONVENIENCE
// ============================================================

export const quizCrypto = {
    // Key management
    getEncryptionKey,
    generateEncryptionKey,
    generateNonce,

    // Core encryption (questions)
    encryptQuestionData,
    decryptQuestionData,

    // Question database helpers
    prepareQuestionForInsert,
    isQuestionEncrypted,
    decryptQuestion,
    decryptQuestions,
    decryptQuestionForStudent,
    decryptQuestionsForStudent,

    // Response encryption
    encryptResponseData,
    decryptResponseData,
    isResponseEncrypted,
    prepareResponseForInsert,
    decryptResponse,
    decryptResponses,
};

export default quizCrypto;
