/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      /**
       * Every selectable face, registered as a named family.
       *
       * These are named rather than written as arbitrary values at the call
       * site: Tailwind reads a bare `font-[Inter_400Regular]` as a font *weight*
       * and rewrites the underscore to a space, so that form silently compiled
       * to `font-weight: Inter 400Regular` and no custom face ever applied.
       * A named family emits `font-family` and keeps the underscore, which is
       * what the loaded font is actually registered as.
       */
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        outfit: ["Outfit_400Regular"],
        "outfit-medium": ["Outfit_500Medium"],
        "outfit-semibold": ["Outfit_600SemiBold"],
        lora: ["Lora_400Regular"],
        "lora-medium": ["Lora_500Medium"],
        "lora-semibold": ["Lora_600SemiBold"],
        mono: ["JetBrainsMono_400Regular"],
        "mono-medium": ["JetBrainsMono_500Medium"],
        "mono-semibold": ["JetBrainsMono_600SemiBold"],
        caveat: ["Caveat_400Regular"],
        "caveat-medium": ["Caveat_500Medium"],
        "caveat-semibold": ["Caveat_600SemiBold"],
        jakarta: ["PlusJakartaSans_400Regular"],
        "jakarta-medium": ["PlusJakartaSans_500Medium"],
        "jakarta-semibold": ["PlusJakartaSans_600SemiBold"],
        grotesk: ["SpaceGrotesk_400Regular"],
        "grotesk-medium": ["SpaceGrotesk_500Medium"],
        "grotesk-semibold": ["SpaceGrotesk_600SemiBold"],
      },
    },
  },
  plugins: [],
}
