import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ProcessImageOptions {
  quality?: number;
}

export async function preprocessImage(uri: string, fileName: string = 'image.jpg', options: ProcessImageOptions = {}): Promise<string> {
  const quality = options.quality ?? 0.8;

  const isHeic = uri.toLowerCase().includes('.heic') || uri.toLowerCase().includes('.heif') || 
                 fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif') ||
                 uri.startsWith('data:image/heic') || uri.startsWith('data:image/heif');

  // Use web-specific library for browser compatibility (heic2any)
  if (Platform.OS === 'web') {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (blob.type === 'image/heic' || blob.type === 'image/heif' || isHeic) {
        const heic2anyModule = await import('heic2any');
        // Handle different module resolution formats (CommonJS vs ES modules)
        const heic2anyFn: any = heic2anyModule.default || heic2anyModule;
        
        const convertedBlob: Blob | Blob[] = await heic2anyFn({
          blob,
          toType: 'image/jpeg',
          quality: quality,
        });

        const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        const newFileName = fileName.replace(/\.heic|\.heif/i, '.jpg');
        
        const finalFile = new File([finalBlob], newFileName, { type: 'image/jpeg' });
        
        const convertedUri = URL.createObjectURL(finalFile);
        return convertedUri;
      }
      
      return uri;
    } catch (error) {
      console.warn('Web image preprocessing failed. Returning original URI.', error);
      throw new Error('Failed to process image format. Ensure it is a valid HEIC/HEIF file or try a different format.');
    }
  } else {
    // Native (iOS/Android): natively supports reading HEIC, so we can use expo-image-manipulator to force convert to JPEG
    if (isHeic) {
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [], // No resizing, just format conversion
          { format: ImageManipulator.SaveFormat.JPEG, compress: quality }
        );
        return manipulated.uri;
      } catch (error) {
        console.warn('Native image preprocessing failed. Returning original URI.', error);
        throw new Error('Failed to process HEIC image natively.');
      }
    }
    return uri;
  }
}
