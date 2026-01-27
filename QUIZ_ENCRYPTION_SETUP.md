# Quiz Question Encryption Setup

This document explains how to set up client-side encryption for quiz questions to prevent students from cheating by viewing network requests.

## Overview

Quiz questions are now encrypted using **TweetNaCl** (symmetric encryption) before being stored in Supabase. This ensures:

1. **Database Security**: Supabase only stores encrypted data, never plaintext questions
2. **Network Security**: Students cannot view correct answers by inspecting network tab during quizzes
3. **Teacher Access**: Teachers can still see all question data when managing quizzes

## How It Works

### Encryption Flow (Teacher Creating Questions)

1. Teacher enters question data in the UI
2. Before sending to Supabase, `prepareQuestionForInsert()` encrypts:
   - `question_text` → encrypted base64 string
   - `options` → encrypted as `{ _encrypted: "base64_string" }`
   - `correct_answers` → encrypted as `["base64_string"]`
   - `explanation` → encrypted base64 string (or null)
3. A unique nonce is generated and stored in `metadata.nonce`
4. `metadata.is_encrypted = true` is set

### Decryption Flow (Student Taking Quiz)

1. Student starts quiz attempt
2. `decryptQuestionsForStudent()` decrypts questions
3. **Sensitive data is removed**:
   - `correct_answers` → removed (empty array)
   - `explanation` → removed (null)
4. Student sees question text and options only
5. Network tab shows encrypted data

### Decryption Flow (Teacher Viewing)

1. Teacher views quiz questions
2. `decryptQuestions()` decrypts all data
3. Teacher sees full data including correct answers

## Setup Instructions

### 1. Generate Encryption Key

Run this command to generate a new encryption key:

```bash
node -e "console.log(require('tweetnacl').randomBytes(32).reduce((s,b)=>s+b.toString(16).padStart(2,'0'),''))"
```

Or in your browser console (dev tools):

```javascript
import nacl from "tweetnacl";
console.log(
  Array.from(nacl.randomBytes(32))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""),
);
```

### 2. Add to Environment Variables

Add this to your `.env` file:

```env
NEXT_PUBLIC_QUIZ_ENCRYPTION_KEY=your_64_character_hex_key_here
```

**Note**: Use `NEXT_PUBLIC_` prefix because encryption/decryption happens client-side.

### 3. Deploy Environment Variable

For Netlify/Vercel, add the same environment variable in your hosting dashboard.

## Data Format in Database

After encryption, question data looks like this in Supabase:

```json
{
  "id": "uuid",
  "quiz_id": "uuid",
  "question_text": "aGVsbG8gd29ybGQ...",
  "options": {
    "_encrypted": "ZW5jcnlwdGVkIG9wdGlvbnM..."
  },
  "correct_answers": ["ZW5jcnlwdGVkIGFuc3dlcnM..."],
  "explanation": "ZW5jcnlwdGVkIGV4cGxhbmF0aW9u...",
  "metadata": {
    "nonce": "dW5pcXVlIG5vbmNl...",
    "is_encrypted": true
  }
}
```

## Backward Compatibility

The system handles non-encrypted questions gracefully:

- `isQuestionEncrypted()` checks if a question is encrypted
- If not encrypted, question data is returned as-is
- New questions are always encrypted
- Old questions will work until manually re-saved (which will encrypt them)

## Security Considerations

1. **Key Storage**: The encryption key is stored in `NEXT_PUBLIC_*` which is visible in client bundles. This is acceptable because:
   - The goal is to prevent casual cheating via network inspection
   - Students would need to extract and use the key programmatically
   - This is defense-in-depth, not absolute security

2. **Key Rotation**: If you need to rotate the key:
   - Keep old key for decryption
   - Use new key for encryption
   - Gradually re-encrypt old questions

3. **Same Key for All**: All users use the same key (symmetric encryption). For stronger security, consider asymmetric encryption with per-user keys.

## Files Modified

- `lib/branch-system/utils/quiz-crypto.ts` - Encryption utilities
- `lib/branch-system/services/quiz.service.ts` - Service methods updated
- `types/tweetnacl-util.d.ts` - TypeScript declarations

## API Reference

### Functions

| Function                       | Purpose                           | When to Use                 |
| ------------------------------ | --------------------------------- | --------------------------- |
| `prepareQuestionForInsert()`   | Encrypt question for DB insert    | Creating/updating questions |
| `decryptQuestion()`            | Decrypt single question (full)    | Teacher viewing question    |
| `decryptQuestions()`           | Decrypt multiple questions (full) | Teacher viewing quiz        |
| `decryptQuestionsForStudent()` | Decrypt without correct_answers   | Student taking quiz         |
| `isQuestionEncrypted()`        | Check if question is encrypted    | Conditional decryption      |
| `generateEncryptionKey()`      | Generate new 32-byte key          | Initial setup               |

## Testing

1. Create a new quiz question
2. Check Supabase - data should be encrypted
3. Start a quiz attempt as student
4. Check network tab - response should have encrypted data
5. UI should show decrypted question text and options
6. Correct answers should NOT be visible in network response
