export class DocumentUtils {
  static getNextDocSuffix(existingDocs: string[]): number {
    if (!existingDocs.length) return 1;

    const numbers = existingDocs
      .map((name) => {
        const match = name.match(/-(\d+)\./);
        return match ? parseInt(match[1]) : null;
      })
      .filter((n) => n !== null)
      .sort((a, b) => a - b);

    // Find first missing number
    let expected = 1;
    for (const n of numbers) {
      if (n !== expected) break;
      expected++;
    }
    return expected;
  }
}
