import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) throw new Error("No se ha recibido ninguna imagen desde el móvil.");

    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Falta la clave GEMINI_API_KEY en las variables de entorno de Vercel.");

    const modelName = 'gemini-3.8-flash';
    const maxRetries = 4;
    let data = null;
    let lastError = "";

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { 
                  text: `Eres un asistente experto que extrae datos de partes de trabajo o presupuestos escritos a mano en fotos. 
                  Extrae el nombre del cliente o empresa, persona de contacto (client_contact), cuenta bancaria IBAN (client_bank), dirección, teléfono, referencia de obra y la tabla de artículos (cantidad, concepto y precio).
                  Si algún dato no aparece, déjalo vacío o pon 0.
                  IMPORTANTE: Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta. NO escribas ni una sola palabra más, ni etiquetas markdown:
                  {"client_name": "", "client_contact": "", "client_bank": "", "client_address": "", "client_phone": "", "work_order_ref": "", "items": [{"description": "", "quantity": 1, "price": 0}]}` 
                },
                { inline_data: { mime_type: mimeType, data: base64Data } }
              ]
            }]
          })
        });

        const resData = await response.json();
        if (!response.ok) {
          const errMsg = resData.error?.message || response.statusText;
          lastError = errMsg;
          if (response.status === 400 || response.status === 403 || response.status === 404) throw new Error(`Error de API: ${errMsg}`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue; 
        }
        data = resData;
        break;
      } catch (e: any) {
        lastError = e.message;
        if (e.message.includes("Error de API")) throw e;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    if (!data || !data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
        throw new Error(`Servidores muy ocupados. Inténtelo de nuevo. Error: ${lastError}`);
    }
    
    let textResponse = data.candidates[0].content.parts[0].text;
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return NextResponse.json(JSON.parse(textResponse));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}