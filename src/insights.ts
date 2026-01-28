import { Image } from 'react-native';

// Placeholder local insights generator.
// Replace with backend/ML inference for real analysis.
export async function generateInsightsFromImage(uri: string) {
  // Lightweight heuristic: read image dimensions (metadata) as a stand-in.
  const size = await getImageSize(uri);
  const title = 'Simplified Health Insights';
  const summary =
    'We analyzed your image to highlight key areas and simplified common medical terms into everyday language.';
  const recommendations = [
    'Consult a physician for a professional diagnosis.',
    'Keep previous reports handy for comparison.',
    'Note any symptoms and duration to assist doctors.',
  ];

  const laymanTerms = [
    { term: 'Opacity', plain: 'Cloudy area' },
    { term: 'Lesion', plain: 'Abnormal spot' },
    { term: 'Effusion', plain: 'Fluid build-up' },
    { term: 'Fracture', plain: 'Bone crack/break' },
    { term: 'Calcification', plain: 'Mineral deposits' },
  ];

  return {
    title,
    summary:
      summary + ` (Image approx. ${size.width}×${size.height}. Explanations are simplified for clarity.)`,
    recommendations,
    laymanTerms,
  };
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (w, h) => resolve({ width: w, height: h }),
      () => resolve({ width: 0, height: 0 })
    );
  });
}
