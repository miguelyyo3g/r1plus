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

    // LISTA DE MODELOS (PLAN A, PLAN B y PLAN C)
    const modelsToTry = [
      'gemini-1.5-flash',     // El principal (rápido pero a veces se satura)
      'gemini-1.5-flash-8b',  // El ligero (súper rápido y con menos colas)
      'gemini-1.5-pro'        // El potente (más lento pero más listo)
    ];

    let data = null;
    let lastError = "";

    // Bucle inteligente: si un modelo falla por alta demanda, prueba el siguiente al instante
    for (const modelName of modelsToTry) {
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
          
          // Si el error es de clave inválida, no seguimos probando. Si es saturación, continuamos.
          if (response.status === 400 || response.status === 403) {
            throw new Error(`Error de clave API: ${errMsg}`);
          }
          console.log(`El modelo ${modelName} falló. Probando el siguiente...`);
          continue; 
        }

        // Si llegamos aquí, el modelo funcionó bien
        data = resData;
        break;

      } catch (e: any) {
        lastError = e.message;
        if (e.message.includes("Error de clave API")) throw e;
      }
    }

    // Si después de probar los 3 modelos no tenemos respuesta, lanzamos error
    if (!data || !data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
        throw new Error(`Los 3 servidores de IA están saturados ahora mismo. Último error: ${lastError}`);
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