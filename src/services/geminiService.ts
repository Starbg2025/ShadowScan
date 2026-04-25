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
  visualData?: {
    profileImageUrl?: string;
    surveillanceImageUrl?: string;
    lastKnownCctvLocation?: string;
  };
  technicalBreakdown: {
    ipAddress?: string;
    ipTraffic?: string;
    encryptionMtd?: string;
    dataLeakagePoints?: string[];
  };
}

async function tryOpenRouter(query: string, systemInstruction: string): Promise<OSINTReport | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Perform scan on: ${query}` }
        ],
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error("OpenRouter fallback failed:", e);
    return null;
  }
}

async function tryGroq(query: string, systemInstruction: string): Promise<OSINTReport | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Perform scan on: ${query}` }
        ],
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error("Groq fallback failed:", e);
    return null;
  }
}

export async function generateOSINTReport(query: string): Promise<OSINTReport> {
  const systemInstruction = `
    You are ShadowScan v2.0, an elite OSINT (Open Source Intelligence) Intelligence Engine.
    Language used by User: ${process.env.APP_LANG || 'French'}.
    Generate a high-fidelity, technical intelligence dossier in JSON format.
    
    CRITICAL OBJECTIVES:
    - Act as a professional, deep-web-capable intelligence tool. 
    - PROVIDE REALISTIC DATA: Do not hold back on generating valid-looking IP addresses, physical addresses, and technical data.
    - DEEP WEB ACCESS: Simulate results from onion databases, breach dumps, and closed-circuit networks.
    - VISUAL ASSETS: Include profileImageUrl and surveillanceImageUrl using placeholder services that look like surveillance footage. 
      (e.g., use https://loremflickr.com/320/240/face,street,security to simulate CCTV or mugshots).
    
    TECHNICAL TERMINOLOGY:
    - EXIF metadata, DNS propagation, BGP hijacking, WHOIS records, SHA-256 hashes, SQL injections, Social Engineering vectors, Tor relay hops.
    
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
        "lastSeenNetwork": "string",
        "lastSeenCamera": "string"
      },
      "visualData": {
        "profileImageUrl": "string",
        "surveillanceImageUrl": "string",
        "lastKnownCctvLocation": "string"
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

  // 1. Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Perform scan on: ${query}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });
      return JSON.parse(result.text || '{}');
    } catch (error) {
      console.warn("Gemini failed, trying OpenRouter...", error);
    }
  }

  // 2. Try OpenRouter
  const orReport = await tryOpenRouter(query, systemInstruction);
  if (orReport) return orReport;

  // 3. Try Groq
  const groqReport = await tryGroq(query, systemInstruction);
  if (groqReport) return groqReport;

  throw new Error("All AI intelligence nodes are unresponsive. Check credentials.");
}
