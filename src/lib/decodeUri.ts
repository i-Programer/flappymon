// /lib/utils/decodeUri.ts
export function decodeBase64JsonFromDataUri(uri: string): any {
    try {
      if (!uri.startsWith("data:application/json;base64,")) return {};
      const base64 = uri.split(",")[1];
      const json = Buffer.from(base64, "base64").toString("utf-8");
      return JSON.parse(json);
    } catch (e) {
      return {};
    }
  }
  