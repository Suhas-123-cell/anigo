import React from 'react';
import { View, Text } from 'react-native';

export const MapView = ({ children, style }: any) => (
  <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }]}>
    <Text style={{ color: 'white' }}>Map is not supported on web.</Text>
    {children}
  </View>
);

export const Marker = () => null;
export const PROVIDER_GOOGLE = 'google';
export default MapView;
