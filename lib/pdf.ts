import pdfParse from 'pdf-parse';

/**
 * Extract text for each page in order.
 */
export async function extractPdfPages(buffer: Buffer): Promise<string[]> {
  const pages: string[] = [];

  await pdfParse(buffer, {
    pagerender: async (pageData: any) => {
      const textContent = await pageData.getTextContent();
      const text = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pages.push(text);
      return text + '\f';
    },
  });

  return pages;
}

