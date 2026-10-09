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

    // EL MODELO CORRECTO Y ACTUALIZADO
    const modelName = 'gemini-3.8-flash';
    const maxRetries = 4;
    let data = null;
    let lastError = "";

    // Bucle de paciencia: si hay alta demanda, el servidor reintenta solo
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Usamos la versión estable v1 de Google
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`, {
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
          
          // Si el error es de clave mal puesta o que el modelo no existe, rompemos el bucle
          if (response.status === 400 || response.status === 403 || response.status === 404) {
            throw new Error(`Error de API: ${errMsg}`);
          }
          
          // Si es un error de ALTA DEMANDA (429), esperamos 3 segundos y volvemos a intentarlo
          console.log(`Intento ${i + 1} saturado por Google. Reintentando en 3 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue; 
        }

        // Si llegamos aquí, ¡éxito! Rompemos el bucle
        data = resData;
        break;

      } catch (e: any) {
        lastError = e.message;
        if (e.message.includes("Error de API")) throw e;
        // Esperamos 3 segundos en caso de micro-caídas de red
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Si después de 4 intentos no hay respuesta, avisamos
    if (!data || !data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
        throw new Error(`Los servidores de Google tienen una alta demanda extrema ahora mismo. El sistema reintentó ${maxRetries} veces sin éxito. Por favor, espere 1 minuto e inténtelo de nuevo.`);
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