import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface OSINTReport {
  entityName: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  lastKnownLocation?: string;
  associatedAlias?: string[];
  findings: string[];
  bio?: {
    jobTitle?: string;
    physicalAddress?: string;
    phoneNumbers?: string[];
    emails?: string[];
    lastSeenNetwork?: string;
    lastSeenCamera?: string;
  };
  socialLinks?: { platform: string; url: string; lastActivity: string; }[];
  technicalBreakdown: {
    ipAddress?: string;
    ipTraffic?: string;
    encryptionMtd?: string;
    dataLeakagePoints?: string[];
  };
}

export async function generateOSINTReport(query: string): Promise<OSINTReport> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const systemInstruction = `
    You are ShadowScan v2.0, an elite OSINT (Open Source Intelligence) Intelligence Engine.
    Language used by User: ${process.env.APP_LANG || 'French'}.
    Generate a high-fidelity, technical intelligence dossier in JSON format.
    
    CRITICAL:
    - Act as a professional intelligence tool. 
    - Use technical terminology: EXIF metadata, DNS propagation, BGP hijacking, WHOIS records, SHA-256 hashes, SQL injections, Social Engineering vectors.
    - Translation: Ensure all text in the JSON is in the target language (${process.env.APP_LANG || 'French'}).
    - Data quality: Provide specific-sounding fake/simulated data if real data is unavailable, to ensure a complete report.
    
    JSON Schema:
    {
      "entityName": "string",
      "threatLevel": "LOW | MEDIUM | HIGH | CRITICAL",
      "status": "string",
      "lastKnownLocation": "string",
      "associatedAlias": ["string"],
      "findings": ["string"],
      "bio": {
        "jobTitle": "string",
        "physicalAddress": "string",
        "phoneNumbers": ["string"],
        "emails": ["string"],
        "lastSeenNetwork": "string (timestamp/context)",
        "lastSeenCamera": "string (timestamp/context)"
      },
      "socialLinks": [
        { "platform": "string", "url": "string", "lastActivity": "string" }
      ],
      "technicalBreakdown": {
        "ipAddress": "string (v4 or v6)",
        "ipTraffic": "string",
        "encryptionMtd": "string",
        "dataLeakagePoints": ["string"]
      }
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform scan on: ${query}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const report: OSINTReport = JSON.parse(result.text || '{}');
    return report;
  } catch (error) {
    console.error("OSINT Scan Failed:", error);
    throw error;
  }
}
