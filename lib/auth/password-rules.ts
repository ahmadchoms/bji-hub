const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password123",
  "admin123",
  "qwertyui",
  "qwerty123",
  "indonesia",
  "kopi1234",
  "rahasia123",
  "bijihub123",
  "semangat123",
  "bismillah",
]);

export function validatePasswordStrength(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password || password.length < 8) {
    return {
      valid: false,
      error: "Kata sandi minimal 8 karakter",
    };
  }

  const normalized = password.toLowerCase().trim();
  if (COMMON_PASSWORDS.has(normalized)) {
    return {
      valid: false,
      error:
        "Kata sandi terlalu umum atau mudah ditebak. Gunakan kombinasi kata yang lebih unik.",
    };
  }

  return { valid: true };
}
