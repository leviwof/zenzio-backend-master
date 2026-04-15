export class ResImageUtils {
  static getNextImageSuffix(existingImages: string[]): string {
    const extracted = existingImages
      .map((img) => {
        // If it's a full URL, extract the filename part
        const filename = img.includes('http') ? (img.split('/').pop() ?? img) : img;
        const lastPart = filename.split('-').pop() ?? '';
        const match = lastPart.match(/^(\d+)([A-Z])\.[^.]+$/i);
        return match ? { number: parseInt(match[1]), letter: match[2].toUpperCase() } : null;
      })
      .filter((x): x is { number: number; letter: string } => Boolean(x));

    // If nothing exists → start with 1A
    if (extracted.length === 0) return '1A';

    // Find highest number used
    const maxNumber = Math.max(...extracted.map((x) => x.number));

    // Filter only suffixes with that max number
    const sameGroup = extracted.filter((x) => x.number === maxNumber);

    // Collect used letters
    const usedLetters = sameGroup.map((x) => x.letter);

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    // Find first missing letter
    for (const letter of alphabet) {
      if (!usedLetters.includes(letter)) {
        return `${maxNumber}${letter}`;
      }
    }

    // All letters filled → move to next number group
    return `${maxNumber + 1}A`;
  }
}
