import React from 'react';
import { View } from 'react-native';

export const Spacer: React.FC<{ size?: number; horizontal?: boolean }> = ({ size = 12, horizontal = false }) => (
  <View style={horizontal ? { width: size } : { height: size }} />
);
