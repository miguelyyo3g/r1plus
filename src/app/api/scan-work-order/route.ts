import { NextResponse } from 'next/server';

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

    const modelName = 'gemini-1.5-flash';
    const maxRetries = 3;
    let data = null;
    let lastError = "";

    // Bucle de reintentos sobre el MISMO modelo oficial
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
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

        const resData = await response.json();

        if (!response.ok) {
          const errMsg = resData.error?.message || response.statusText;
          lastError = errMsg;
          
          // Si es un error de clave API o permisos, cortamos de raíz (no tiene sentido reintentar)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`Error de API: ${errMsg}`);
          }
          
          // Si es error por alta demanda (429) o error interno de Google (500), esperamos 2 segundos y reintentamos
          console.log(`Intento ${i + 1} saturado. Reintentando en 2 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue; 
        }

        // Si llegamos aquí, el modelo funcionó bien
        data = resData;
        break;

      } catch (e: any) {
        lastError = e.message;
        if (e.message.includes("Error de API")) throw e;
        // Esperar antes de reintentar si hay un fallo de red
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!data || !data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
        throw new Error(`Servidor de Google ocupado tras ${maxRetries} intentos. Inténtalo de nuevo en unos minutos. (Aviso: ${lastError})`);
    }
    
    let textResponse = data.candidates[0].content.parts[0].text;
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedJson = JSON.parse(textResponse);

    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error("Error OCR IA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}