import { View, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Highlighter as HighlightIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikeIcon,
  Code as CodeIcon,
  List as ListIcon,
  Quote as QuoteIcon,
  Eye as EyeIcon,
  Pencil as PencilIcon,
} from 'lucide-react-native';
import { FormatAction } from '../lib/richText';
import { useSettings } from '../context/SettingsContext';

interface TiptapToolbarProps {
  onFormat: (action: FormatAction) => void;
  isPreview?: boolean;
  onTogglePreview?: () => void;
  accent?: string;
  className?: string;
}

export function TiptapToolbar({
  onFormat,
  isPreview = false,
  onTogglePreview,
  accent,
  className = '',
}: TiptapToolbarProps): React.JSX.Element {
  const { settings } = useSettings();
  const isDark = settings.darkMode;
  const activeAccent = accent || settings.generalThemeColor || '#7A967A';

  const handleAction = (action: FormatAction): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onFormat(action);
  };

  const handlePreviewToggle = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onTogglePreview?.();
  };

  const bgStyle = {
    backgroundColor: isDark ? 'rgba(28, 28, 32, 0.85)' : 'rgba(245, 245, 240, 0.90)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
  };

  const itemBtnBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const itemBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const iconColor = isDark ? '#E5E5EA' : '#3A3A3C';

  return (
    <View
      className={`rounded-2xl border p-1.5 ${className}`}
      style={bgStyle}
      role="toolbar"
      aria-label="Text formatting toolbar"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', gap: 6, paddingHorizontal: 2 }}
      >
        {/* Bold */}
        <Pressable
          onPress={() => handleAction('bold')}
          disabled={isPreview}
          className="w-8 h-8 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: itemBtnBg,
            borderColor: itemBorder,
            opacity: isPreview ? 0.4 : 1,
          }}
          aria-label="Bold text"
          role="button"
        >
          <BoldIcon size={15} color={iconColor} strokeWidth={2.4} />
        </Pressable>

        {/* Italic */}
        <Pressable
          onPress={() => handleAction('italic')}
          disabled={isPreview}
          className="w-8 h-8 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: itemBtnBg,
            borderColor: itemBorder,
            opacity: isPreview ? 0.4 : 1,
          }}
          aria-label="Italic text"
          role="button"
        >
          <ItalicIcon size={15} color={iconColor} strokeWidth={2.2} />
        </Pressable>

        {/* Highlight */}
        <Pressable
          onPress={() => handleAction('highlight')}
          disabled={isPreview}
          className="w-8 h-8 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: isDark ? 'rgba(235, 185, 30, 0.22)' : 'rgba(255, 226, 80, 0.45)',
            borderColor: isDark ? 'rgba(235, 185, 30, 0.45)' : 'rgba(235, 185, 30, 0.65)',
            opacity: isPreview ? 0.4 : 1,
          }}
          aria-label="Highlight text"
          role="button"
        >
          <HighlightIcon
            size={15}
            color={isDark ? '#FCD34D' : '#B45309'}
            strokeWidth={2.2}
          />
        </Pressable>

        {/* Underline */}
        <Pressable
          onPress={() => handleAction('underline')}
          disabled={isPreview}
          className="w-8 h-8 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: itemBtnBg,
            borderColor: itemBorder,
            opacity: isPreview ? 0.4 : 1,
          }}
          aria-label="Underline text"
          role="button"
        >
          <UnderlineIcon size={15} color={iconColor} strokeWidth={2.2} />
        </Pressable>

        {/* Strikethrough */}
        <Pressable
          onPress={() => handleAction('strikethrough')}
          disabled={isPreview}
          className="w-8 h-8 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: itemBtnBg,
            borderColor: itemBorder,
            opacity: isPreview ? 0.4 : 1,
          }}
          aria-label="Strikethrough text"
          role="button"
        >
          <StrikeIcon size={15} color={iconColor} strokeWidth={2.2} />
        </Pressable>

        {/* Inline Code */}
        <Pressable
          onPress={() => handleAction('code')}
          disabled={isPreview}
          className="w-8 h-8 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: itemBtnBg,
            borderColor: itemBorder,
            opacity: isPreview ? 0.4 : 1,
          }}
          aria-label="Inline code"
          role="button"
        >
          <CodeIcon size={15} color={iconColor} strokeWidth={2.2} />
        </Pressable>

        {/* Bullet List */}
        <Pressable
          onPress={() => handleAction('bullet')}
          disabled={isPreview}
          className="w-8 h-8 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: itemBtnBg,
            borderColor: itemBorder,
            opacity: isPreview ? 0.4 : 1,
          }}
          aria-label="Bullet list"
          role="button"
        >
          <ListIcon size={15} color={iconColor} strokeWidth={2.2} />
        </Pressable>

        {/* Quote */}
        <Pressable
          onPress={() => handleAction('quote')}
          disabled={isPreview}
          className="w-8 h-8 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: itemBtnBg,
            borderColor: itemBorder,
            opacity: isPreview ? 0.4 : 1,
          }}
          aria-label="Quote"
          role="button"
        >
          <QuoteIcon size={14} color={iconColor} strokeWidth={2.2} />
        </Pressable>

        {/* Live Preview / Edit Switcher */}
        {Boolean(onTogglePreview) && (
          <Pressable
            onPress={handlePreviewToggle}
            className="flex-row items-center gap-1.5 px-3 py-1 rounded-xl border ml-1"
            style={{
              backgroundColor: isPreview
                ? isDark
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(0, 0, 0, 0.10)'
                : itemBtnBg,
              borderColor: isPreview ? activeAccent : itemBorder,
            }}
            aria-label={isPreview ? 'Switch to text editing' : 'Switch to live rich preview'}
            role="button"
          >
            {isPreview ? (
              <>
                <PencilIcon size={12} color={activeAccent} strokeWidth={2.2} />
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: activeAccent }}
                >
                  Edit
                </Text>
              </>
            ) : (
              <>
                <EyeIcon size={12} color={iconColor} strokeWidth={2.2} />
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: iconColor }}
                >
                  Preview
                </Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
