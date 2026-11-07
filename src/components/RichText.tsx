import { useMemo } from 'react';
import { Text, TextStyle, StyleProp, View } from 'react-native';
import { parseRichText, RichTextToken } from '../lib/richText';
import { useSettings } from '../context/SettingsContext';
import { useTypeface } from '../hooks/useTypeface';
import { CollectionId } from '../types';

export interface RichTextProps {
  text?: string;
  style?: StyleProp<TextStyle>;
  className?: string;
  numberOfLines?: number;
  collectionId?: CollectionId;
  accent?: string;
  isDark?: boolean;
  baseWeight?: 'regular' | 'medium' | 'semibold';
  italicAll?: boolean;
}

export function RichText({
  text = '',
  style,
  className = '',
  numberOfLines,
  collectionId,
  accent,
  isDark,
  baseWeight = 'regular',
  italicAll = false,
}: RichTextProps): React.JSX.Element {
  const { settings } = useSettings();
  const darkMode = isDark !== undefined ? isDark : settings.darkMode;
  const typeface = useTypeface(collectionId);
  const activeAccent = accent || settings.generalThemeColor || '#7A967A';

  const tokens = useMemo(() => parseRichText(text), [text]);

  if (!text) {
    return <Text style={style} className={className} numberOfLines={numberOfLines} />;
  }

  // Highlight colors: luminous pastel highlight in dark mode, warm honey/accent pastel in light mode
  const highlightBg = darkMode
    ? 'rgba(235, 185, 30, 0.32)'
    : 'rgba(255, 226, 80, 0.72)';
  const highlightTextColor = darkMode ? '#FFF7D6' : '#1F1B05';

  const codeBg = darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
  const codeBorder = darkMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.10)';

  return (
    <Text style={style} className={className} numberOfLines={numberOfLines}>
      {tokens.map((token: RichTextToken, idx: number) => {
        const isBold = Boolean(token.bold);
        const isItalic = Boolean(token.italic) || italicAll;
        const isHighlight = Boolean(token.highlight);
        const isUnderline = Boolean(token.underline);
        const isStrike = Boolean(token.strikethrough);
        const isCode = Boolean(token.code);

        // Determine font family class
        let tokenFontClass = typeface[baseWeight];
        if (isCode) {
          tokenFontClass = 'font-mono';
        } else if (isBold) {
          tokenFontClass = typeface.semibold;
        } else if (baseWeight === 'medium') {
          tokenFontClass = typeface.medium;
        }

        // Determine text decoration
        let textDecorationLine: 'none' | 'underline' | 'line-through' | 'underline line-through' = 'none';
        if (isUnderline && isStrike) {
          textDecorationLine = 'underline line-through';
        } else if (isUnderline) {
          textDecorationLine = 'underline';
        } else if (isStrike) {
          textDecorationLine = 'line-through';
        }

        const tokenStyle: TextStyle = {
          fontStyle: isItalic ? 'italic' : 'normal',
          textDecorationLine,
        };

        if (isBold) {
          tokenStyle.fontWeight = '700';
        }

        if (isHighlight) {
          tokenStyle.backgroundColor = highlightBg;
          tokenStyle.color = highlightTextColor;
        }

        if (isCode) {
          tokenStyle.backgroundColor = codeBg;
          tokenStyle.borderColor = codeBorder;
          tokenStyle.borderWidth = 0.5;
          tokenStyle.borderRadius = 4;
        }

        return (
          <Text
            key={`${idx}-${token.text.slice(0, 8)}`}
            className={tokenFontClass}
            style={tokenStyle}
          >
            {token.text}
          </Text>
        );
      })}
    </Text>
  );
}
