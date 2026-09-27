/**
 * Secret Redactor Middleware
 * Mask sensitive tokens, API keys, passwords, and private keys from logs and agent responses
 * (Directly addresses Chapter 2.8 & Chapter 3.6 Security requirements)
 */

const SENSITIVE_PATTERNS = [
  // AWS Access Key ID
  { pattern: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, replacement: "[REDACTED_AWS_KEY]" },
  // Bearer tokens & JWTs
  { pattern: /Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, replacement: "Bearer [REDACTED_JWT]" },
  // Generic API Keys (e.g. gsk_..., sk-..., key=...)
  { pattern: /(gsk_[a-zA-Z0-9]{32,}|sk-[a-zA-Z0-9]{32,}|api[_-]?key\s*[:=]\s*['"][^'"]+['"])/gi, replacement: "[REDACTED_API_KEY]" },
  // Passwords in connection strings or JSON
  { pattern: /(password|pwd|secret|auth_token)\s*[:=]\s*['"][^'"]+['"]/gi, replacement: '$1: "[REDACTED_SECRET]"' },
  // Database passwords in URIs
  { pattern: /(postgres|mysql|mongodb|redis):\/\/([^:]+):([^@]+)@/gi, replacement: "$1://$2:[REDACTED_PASS]@" },
  // Private Keys
  { pattern: /-----BEGIN [A-Z ]+ PRIVATE KEY-----[^-]+-----END [A-Z ]+ PRIVATE KEY-----/gs, replacement: "[REDACTED_PRIVATE_KEY]" }
];

export const redactSecrets = (content) => {
  if (!content) return content;
  if (typeof content !== "string") {
    try {
      content = JSON.stringify(content);
    } catch {
      return content;
    }
  }

  let redacted = content;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
};
