import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Text,
  Platform,
} from 'react-native';

interface RotatingCharacterBadgeProps {
  characterName: string;
  avatarSource?: ImageSourcePropType;
  rarity?: 'legendary' | 'rare' | 'common' | 'black';
  size?: number;
  onImageLoadComplete?: () => void;
  power?: number; // Character power/XP value
}


const AndroidBadge: React.FC<RotatingCharacterBadgeProps> = ({
  characterName,
  avatarSource,
  rarity = 'common',
  size = 80,
  onImageLoadComplete,
  power,
}) => {
  let borderColor = '#FF6B6B';
  let glowBg = 'rgba(255, 107, 107, 0.30)';

  if (rarity === 'legendary') {
    borderColor = '#FFD700';
    glowBg = 'rgba(255, 215, 0, 0.30)';
  } else if (rarity === 'rare') {
    borderColor = '#9B59B6';
    glowBg = 'rgba(155, 89, 182, 0.30)';
  } else if (rarity === 'black') {
    borderColor = '#AAAAAA';
    glowBg = 'rgba(80, 80, 80, 0.40)';
  }

  const outerSize = size + 24;
  const innerSize = size;
  const imageSize = size * 0.92;
  const fallbackLetter = characterName
    ? characterName.trim().charAt(0).toUpperCase()
    : '?';

  // CRITICAL: Oversized canvas (significantly larger than badge) with transparent background
  // This forces Android's bitmap snapshot to capture the full area, preventing clipping
  const androidWrapperSize = outerSize + 120;
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false);

  return (
    <View
      collapsable={false}
      style={{
        width: androidWrapperSize,
        height: androidWrapperSize,
        padding: 18,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          backgroundColor: glowBg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            borderWidth: 3.5,
            borderColor,
            backgroundColor: '#121219',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {avatarSource && !imageLoadFailed ? (
            <Image
              source={avatarSource}
              style={{
                width: Math.round(imageSize),
                height: Math.round(imageSize),
                borderRadius: Math.round(imageSize / 2),
                backgroundColor: '#121219',
              }}
              resizeMode="cover"
              onError={() => {
                setImageLoadFailed(true);
              }}
            />
          ) : (
            <Text
              style={{
                fontSize: innerSize * 0.46,
                color: borderColor,
                fontWeight: '900',
                textAlign: 'center',
              }}
            >
              {fallbackLetter}
            </Text>
          )}

          {/* Rarity dot */}
          <View
            style={{
              position: 'absolute',
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: borderColor,
              top: 6,
              right: 6,
              borderWidth: 1.5,
              borderColor: '#ffffffaa',
            }}
          />

          {/* Power/CP display */}
          {power !== undefined && (
            <View
              style={{
                position: 'absolute',
                bottom: 4,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: innerSize * 0.22,
                  color: borderColor,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                CP {power}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// ─── iOS badge ──────────────────────────────────────────────────────────────
// CRITICAL PATTERN (matches UserLocationModel which works on iOS markers):
//   • Use StyleSheet.create — not inline style objects
//   • Place Image/Text with position:'absolute' — NOT as flex flow children
//   • No overflow:'hidden' or shadow* on any view inside an iOS Marker
const IOSBadge: React.FC<RotatingCharacterBadgeProps> = ({
  characterName,
  avatarSource,
  rarity = 'common',
  size = 80,
  onImageLoadComplete,
}) => {
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setImageLoadFailed(false);
  }, [avatarSource]);

  let borderColor = '#FF6B6B';
  let glowBg = 'rgba(255, 107, 107, 0.30)';
  if (rarity === 'legendary')  { borderColor = '#FFD700'; glowBg = 'rgba(255, 215, 0, 0.30)'; }
  else if (rarity === 'rare')  { borderColor = '#9B59B6'; glowBg = 'rgba(155, 89, 182, 0.30)'; }
  else if (rarity === 'black') { borderColor = '#AAAAAA'; glowBg = 'rgba(80, 80, 80, 0.40)'; }

  const outerSize = size + 24;
  const innerSize = size;
  const imgSize   = innerSize - 12;
  const wrapSize  = outerSize + 40;

  const fallbackLetter = characterName
    ? characterName.trim().charAt(0).toUpperCase()
    : '?';

  // All sizes computed upfront so StyleSheet objects stay stable
  const wrapStyle   = { width: wrapSize,  height: wrapSize };
  const glowStyle   = {
    position: 'absolute' as const,
    width:  outerSize, height: outerSize,
    borderRadius: outerSize / 2,
    backgroundColor: glowBg,
    top:  (wrapSize - outerSize) / 2,
    left: (wrapSize - outerSize) / 2,
  };
  const ringStyle   = {
    position: 'absolute' as const,
    width:  innerSize, height: innerSize,
    borderRadius: innerSize / 2,
    borderWidth: 3,
    borderColor,
    backgroundColor: '#121219',
    top:  (wrapSize - innerSize) / 2,
    left: (wrapSize - innerSize) / 2,
  };
  const imgStyle    = {
    position: 'absolute' as const,
    width:  imgSize, height: imgSize,
    borderRadius: imgSize / 2,
    top:  (wrapSize - imgSize) / 2,
    left: (wrapSize - imgSize) / 2,
  };
  const textStyle   = {
    position: 'absolute' as const,
    width:  imgSize, height: imgSize,
    borderRadius: imgSize / 2,
    top:  (wrapSize - imgSize) / 2,
    left: (wrapSize - imgSize) / 2,
    fontSize: imgSize * 0.44,
    color: borderColor,
    fontWeight: '900' as const,
    textAlign: 'center' as const,
    lineHeight: imgSize,
  };
  const dotStyle    = {
    position: 'absolute' as const,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: borderColor,
    top:  (wrapSize - innerSize) / 2 + 5,
    right: (wrapSize - innerSize) / 2 + 5,
  };

  return (
    <View collapsable={false} style={wrapStyle}>
      {/* Glow ring */}
      <View style={glowStyle} />
      {/* Border ring */}
      <View style={ringStyle} />
      {/* Avatar image — absolute, like UserLocationModel's arrow */}
      {avatarSource && !imageLoadFailed ? (
        <Image
          key={`ios-badge-${characterName}`}
          source={avatarSource}
          style={imgStyle}
          resizeMode="cover"
          onLoad={onImageLoadComplete}
          onError={() => { setImageLoadFailed(true); onImageLoadComplete?.(); }}
        />
      ) : (
        <Text style={textStyle}>{fallbackLetter}</Text>
      )}
      {/* Rarity dot */}
      <View style={dotStyle} />
    </View>
  );
};

// ─── Exported component – picks platform-specific implementation ────────────
export const RotatingCharacterBadge: React.FC<RotatingCharacterBadgeProps> = (props) => {
  if (Platform.OS === 'android') {
    return <AndroidBadge {...props} />;
  }
  return <IOSBadge {...props} />;
};

const styles = StyleSheet.create({
  // Styles retained for AndroidBadge if needed
});
