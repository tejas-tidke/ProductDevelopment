const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function createQuote(payload: any) {
  const response = await fetch(`${API_BASE}/api/quotes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create quote");
  }

  return await response.json();
}