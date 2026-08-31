import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { CardBorder } from '../types';
import { SPECTRUM_STOPS } from '../constants/borders';

interface CardEdgeArtProps {
  /** Only `rainbow` and `vine` draw anything; anything else renders null. */
  border: CardBorder;
  /** Card corner radius, so the stroke follows the same curve as the fill. */
  radius: number;
  /** The note's colour, used for the vine. */
  accent: string;
}

/** Stroke width of the spectrum frame. */
const STROKE = 2;

/**
 * One leaf, drawn as a pointed oval on a stem.
 *
 * Expressed in a 0-24 local box and positioned by the caller's transform, so
 * the same path serves every corner at every rotation without redrawing it.
 */
const LEAF_PATH = 'M12 2 C18 7 18 15 12 21 C6 15 6 7 12 2 Z';
/** Centre vein, which is what stops the leaf reading as a plain teardrop. */
const VEIN_PATH = 'M12 4 L12 19';

interface SprigProps {
  accent: string;
  /** Corner placement, in px from the card's own origin. */
  x: number;
  y: number;
  rotation: number;
}

function Sprig({ accent, x, y, rotation }: SprigProps): React.ReactElement {
  return (
    <>
      <Path
        d="M0 0 C10 2 16 8 20 18"
        stroke={accent}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
        transform={`translate(${x}, ${y}) rotate(${rotation})`}
      />
      <Path
        d={LEAF_PATH}
        fill={accent}
        opacity={0.55}
        transform={`translate(${x}, ${y}) rotate(${rotation}) translate(2, -4) scale(0.55) rotate(-35)`}
      />
      <Path
        d={VEIN_PATH}
        stroke={accent}
        strokeWidth={1.4}
        opacity={0.35}
        transform={`translate(${x}, ${y}) rotate(${rotation}) translate(2, -4) scale(0.55) rotate(-35)`}
      />
      <Path
        d={LEAF_PATH}
        fill={accent}
        opacity={0.4}
        transform={`translate(${x}, ${y}) rotate(${rotation}) translate(14, 6) scale(0.45) rotate(25)`}
      />
    </>
  );
}

/**
 * Card edge treatments that have to be painted rather than set as a border.
 *
 * A gradient stroke and a botanical sprig are not expressible as a border
 * colour, so they are drawn on top of the card in SVG. The layer never takes
 * touches, so the card underneath keeps its full press and swipe behaviour.
 *
 * The card's size is read from layout rather than assumed: cards grow with
 * their text and with the density setting, and a stroke drawn at a guessed size
 * would sit inside or outside the actual edge.
 */
export function CardEdgeArt({ border, radius, accent }: CardEdgeArtProps): React.ReactElement | null {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setSize(prev => (prev?.width === width && prev?.height === height ? prev : { width, height }));
  };

  if (border !== 'rainbow' && border !== 'vine') return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {size !== null && size.width > 0 && (
        <Svg width={size.width} height={size.height}>
          {border === 'rainbow' && (
            <>
              <Defs>
                <LinearGradient id="cardSpectrum" x1="0" y1="0" x2="1" y2="1">
                  {SPECTRUM_STOPS.map((color, index) => (
                    <Stop
                      key={color}
                      offset={index / (SPECTRUM_STOPS.length - 1)}
                      stopColor={color}
                      stopOpacity={1}
                    />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect
                x={STROKE / 2}
                y={STROKE / 2}
                width={Math.max(0, size.width - STROKE)}
                height={Math.max(0, size.height - STROKE)}
                rx={Number.isFinite(radius) ? Math.max(0, radius - STROKE / 2) : 0}
                stroke="url(#cardSpectrum)"
                strokeWidth={STROKE}
                fill="none"
              />
            </>
          )}
          {border === 'vine' && (
            <>
              <Sprig accent={accent} x={6} y={10} rotation={-20} />
              <Sprig accent={accent} x={size.width - 6} y={size.height - 10} rotation={160} />
            </>
          )}
        </Svg>
      )}
    </View>
  );
}
