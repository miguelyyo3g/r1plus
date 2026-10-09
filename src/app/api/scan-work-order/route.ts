
import { NextResponse } from 'next/server';

// Le damos 60 segundos a Vercel para procesar (las cuentas gratuitas de Vercel cortan a los 10-15s, 
// pero si usas el modelo PRO con tu clave de pago, responderá en 3-5 segundos)
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      throw new Error("No se ha recibido ninguna imagen desde el móvil.");
    }

    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Falta la clave GEMINI_API_KEY en las variables de entorno de Vercel.");
    }

    // AL TENER FACTURACIÓN, USAMOS EL MODELO PREMIUM DIRECTAMENTE (Sin fallbacks ni esperas)
    // Usamos el modelo que te recomendó la API: gemini-3.8-flash (o gemini-3.8-pro si prefieres más razonamiento)
    const modelName = 'gemini-3.8-flash';

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { 
                text: `Eres un asistente experto que extrae datos de partes de trabajo o presupuestos escritos a mano en fotos. 
                Extrae el nombre del cliente o empresa, dirección completa, teléfono, referencia de obra y la tabla de artículos (cantidad, concepto y precio).
                Si algún dato no aparece, déjalo vacío o pon 0.
                
                IMPORTANTE: Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta. NO escribas ni una sola palabra más, ni etiquetas markdown:
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

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de Google API:", data);
      throw new Error(`Google API: ${data.error?.message || response.statusText}`);
    }

    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
        throw new Error("La IA no devolvió resultados válidos o bloqueó la imagen.");
    }
    
    // Limpiamos el texto que devuelve la IA
    let textResponse = data.candidates[0].content.parts[0].text;
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedJson = JSON.parse(textResponse);

    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error("Error OCR IA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}