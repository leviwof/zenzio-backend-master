export class ResImageUtils {
  static getNextImageSuffix(existingImages: string[]): string {
    // Extract letters used → A, B, C...
    const usedLetters = existingImages
      .map((img) => {
        // img example: MNU-xxx-1A.jpg → get last part "1A.jpg"
        const lastPart = img.split('-').pop() ?? '';
        const match = lastPart.match(/1([A-Z])/i); // catch 1A, 1B, 1C...
        return match ? match[1].toUpperCase() : null;
      })
      .filter((x): x is string => Boolean(x));

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    // Find the first missing alphabet letter
    for (const letter of alphabet) {
      if (!usedLetters.includes(letter)) {
        return `1${letter}`;
      }
    }

    // If no gaps → go next sequentially
    const last = usedLetters[usedLetters.length - 1];
    const next = String.fromCharCode(last.charCodeAt(0) + 1);
    return `1${next}`;
  }
}
