import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // Separar la imagen Base64 para que la IA la entienda
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Falta la clave GEMINI_API_KEY en .env.local");
    }

    // Llamada directa y nativa a la IA de Google (No necesitas instalar nada)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { 
                text: `Eres un asistente que extrae datos de partes de trabajo o presupuestos escritos a mano en fotos. 
                Extrae el nombre del cliente, dirección, teléfono, referencia de obra y la tabla de artículos (cantidad, concepto y precio).
                Si algún dato no aparece, déjalo vacío o pon 0.
                
                IMPORTANTE: Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta. NO escribas ni una sola palabra más, ni etiquetas markdown (nada de \`\`\`json):
                {"client_name": "", "client_address": "", "client_phone": "", "work_order_ref": "", "items": [{"description": "", "quantity": 1, "price": 0}]}` 
              },
              { 
                inline_data: { mime_type: mimeType, data: base64Data } 
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("La IA rechazó la conexión. Comprueba tu API Key.");
    }

    const data = await response.json();
    
    // Extraer y limpiar el texto que nos devuelve la IA para que sea un JSON perfecto
    let textResponse = data.candidates[0].content.parts[0].text;
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedJson = JSON.parse(textResponse);

    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error("Error OCR IA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}