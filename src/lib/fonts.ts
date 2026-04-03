// Font CSS variables - using system font fallbacks when Google Fonts unavailable
// In production with network access, these would use next/font/google
// The CSS variables are set via globals.css @font-face declarations

export const fontVariables = [
  "--font-dm-sans",
  "--font-syne",
  "--font-jetbrains",
] as const;

export const fontClassNames = "font-body";
