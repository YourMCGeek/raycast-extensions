import { environment } from "@raycast/api";
import fs from "fs-extra";
import path from "path";
import { PDFDocument } from "pdf-lib";

export interface PDFMetadata {
  title: string; //  Title
  composer?: string[]; // Author
  genres?: string[]; // Subject
  tags?: string[]; // Keywords
  rating?: 0 | 1 | 2 | 3 | 4 | 5; // Keywords
  difficulty?: 0 | 1 | 2 | 3; // Keywords
  duration?: number; // In Seconds, Keywords
  keySignature?: KeySignature; // Keywords
}

export interface KeySignature {
  keysf: -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // Number of flats or sharps, negative is flats, positive is sharps, Keywords
  keymi: 0 | 1; // 0 = minor, 1 = major, Keywords.
  fullKeyword?: string;
}

export interface PDFFile {
  path: string;
  name: string;
  lastModified: Date;
  metadata: PDFMetadata;
}

export async function extractPDFMetadata(filePath: string): Promise<Partial<PDFMetadata>> {
  try {
    const fileBuffer = await fs.readFile(filePath);

    const pdfDoc = await PDFDocument.load(fileBuffer, {
      updateMetadata: false,
    });

    const title = pdfDoc.getTitle();
    const composer = pdfDoc.getAuthor();
    const genres = pdfDoc.getSubject();
    const keywords = pdfDoc.getKeywords();

    const metadata: Partial<PDFMetadata> = {
      title: title || path.basename(filePath),
    };

    if (composer) {
      metadata.composer = [composer];
    }

    if (genres) {
      metadata.genres = [genres];
    }

    if (keywords) {
      const parsedKeywords = parseKeywords(keywords);
      metadata.tags = parsedKeywords.tags;
      if (parsedKeywords.rating !== undefined) {
        metadata.rating = parsedKeywords.rating.value;
      }
      if (parsedKeywords.difficulty !== undefined) {
        metadata.difficulty = parsedKeywords.difficulty.value;
      }
      if (parsedKeywords.duration !== undefined) {
        metadata.duration = parsedKeywords.duration.value;
      }
      if (parsedKeywords.keySignature !== undefined) {
        metadata.keySignature = parsedKeywords.keySignature;
      }
    }

    return metadata;
  } catch (error) {
    console.error("Error extracting PDF metadata:", error);
    return {};
  }
}

function parseKeywords(keywords: string): {
  tags: string[];
  rating?: { value: 0 | 1 | 2 | 3 | 4 | 5; fullKeyword: string };
  difficulty?: { value: 0 | 1 | 2 | 3; fullKeyword: string };
  duration?: { value: number; fullKeyword: string };
  keySignature?: KeySignature;
} {
  const result = {
    tags: [] as string[],
    rating: undefined as { value: 0 | 1 | 2 | 3 | 4 | 5; fullKeyword: string } | undefined,
    difficulty: undefined as { value: 0 | 1 | 2 | 3; fullKeyword: string } | undefined,
    duration: undefined as { value: number; fullKeyword: string } | undefined,
    keySignature: undefined as KeySignature | undefined,
  };

  const keywordArray = keywords.split(",").map((k) => k.trim());

  let keysfFound:
    | { value: -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; fullKeyword: string }
    | undefined;
  let keymiFound: { value: 0 | 1; fullKeyword: string } | undefined;

  const patterns = [
    {
      regex: /^(rating):(\d)$/,
      handler: (match: RegExpExecArray) => {
        const value = parseInt(match[2]);
        if (value >= 0 && value <= 5) {
          result.rating = {
            value: value as 0 | 1 | 2 | 3 | 4 | 5,
            fullKeyword: match[0],
          };
        }
      },
    },
    {
      regex: /^(difficulty):(\d)$/,
      handler: (match: RegExpExecArray) => {
        const value = parseInt(match[2]);
        if (value >= 0 && value <= 3) {
          result.difficulty = {
            value: value as 0 | 1 | 2 | 3,
            fullKeyword: match[0],
          };
        }
      },
    },
    {
      regex: /^(duration):(\d+)$/,
      handler: (match: RegExpExecArray) => {
        const value = parseInt(match[2]);
        if (!isNaN(value)) {
          result.duration = {
            value: parseInt(match[2]),
            fullKeyword: match[0],
          };
        }
      },
    },
    {
      regex: /^(keysf):(-?\d+)$/,
      handler: (match: RegExpExecArray) => {
        const value = parseInt(match[2]);
        if (value >= -7 && value <= 7) {
          keysfFound = {
            value: value as -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
            fullKeyword: match[0],
          };
        }
      },
    },
    {
      regex: /^(keymi):(0|1)$/,
      handler: (match: RegExpExecArray) => {
        const value = parseInt(match[2]) as 0 | 1;
        keymiFound = {
          value,
          fullKeyword: match[0],
        };
      },
    },
  ];

  keywordArray.forEach((keyword) => {
    let matched = false;

    for (const pattern of patterns) {
      const match = pattern.regex.exec(keyword);
      if (match) {
        pattern.handler(match);
        matched = true;
        break;
      }
    }

    // If no pattern matches, add to tags
    if (!matched) {
      result.tags.push(keyword);
    }

    // If both keysf and keymi are found, add to keySignature
    if (keysfFound && keymiFound) {
      result.keySignature = {
        keysf: keysfFound.value,
        keymi: keymiFound.value,
        fullKeyword: `${keysfFound.fullKeyword},${keymiFound.fullKeyword}`,
      };
    }
  });

  return result;
}

export async function formatKeySignature(keySignature?: KeySignature): Promise<string> {
  if (!keySignature) {
    return "";
  }

  const keyMap: { [key: string]: string } = {
    "-7_0": "C♭ major",
    "-6_0": "G♭ major",
    "-5_0": "D♭ major",
    "-4_0": "A♭ major",
    "-3_0": "E♭ major",
    "-2_0": "B♭ major",
    "-1_0": "F major",
    "0_0": "C major",
    "1_0": "G major",
    "2_0": "D major",
    "3_0": "A major",
    "4_0": "E major",
    "5_0": "B major",
    "6_0": "F♯ major",
    "7_0": "C♯ major",
    "-7_1": "A♭ minor",
    "-6_1": "E♭ minor",
    "-5_1": "B♭ minor",
    "-4_1": "F minor",
    "-3_1": "C minor",
    "-2_1": "G minor",
    "-1_1": "D minor",
    "0_1": "A minor",
    "1_1": "E minor",
    "2_1": "B minor",
    "3_1": "F♯ minor",
    "4_1": "C♯ minor",
    "5_1": "G♯ minor",
    "6_1": "D♯ minor",
    "7_1": "A♯ minor",
  };

  const key = `${keySignature.keysf}_${keySignature.keymi}`;
  return Promise.resolve(keyMap[key]);
}

export async function updatePDFMetadata(
  filePath: string,
  metadata: Partial<PDFMetadata>
): Promise<PDFFile> {
  try {

    const fileBuffer = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(fileBuffer);

    if (metadata.title) {
      pdfDoc.setTitle(metadata.title);
    }

    // Composer (Author)
    if (metadata.composer && metadata.composer.length > 0) {
      pdfDoc.setAuthor(metadata.composer.join(","));
    }

    // Genres (Subject)
    if (metadata.genres && metadata.genres.length > 0) {
      pdfDoc.setSubject(metadata.genres.join(","));
    }

    const keywords: string[] = [];

    if (metadata.rating !== undefined) {
      keywords.push(`rating:${metadata.rating}`);
    }

    if (metadata.difficulty !== undefined) {
      keywords.push(`difficulty:${metadata.difficulty}`);
    }

    if (metadata.duration !== undefined) {
      keywords.push(`duration:${metadata.duration}`);
    }

    if (metadata.keySignature) {
      keywords.push(`keysf:${metadata.keySignature.keysf}`);
      keywords.push(`keymi:${metadata.keySignature.keymi}`);
    }

    if (keywords.length > 0) {
      pdfDoc.setKeywords(keywords);
    }

    const updatedBuffer = await pdfDoc.save();

    const backupDir = path.join(environment.supportPath, "backups");
    await fs.ensureDir(backupDir);
    const backupPath = path.join(backupDir, `${path.basename(filePath)}.backup`);
    await fs.copy(filePath, backupPath);
    
    
  }
}