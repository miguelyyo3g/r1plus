export interface FormField {
  id: string;
  label: string;
  type: 'number' | 'text' | 'select';
  unit?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface SupplierTechnicalSheet {
  id: string;
  supplierId: string;
  supplierName: string;
  title: string;
  description: string;
  category: 'ventanas' | 'cierres' | 'puertas' | 'general';
  fields: FormField[];
}

export const SUPPLIER_TEMPLATES: SupplierTechnicalSheet[] = [
  {
    id: 'sheet-ventana-pvc',
    supplierId: 'prov-ventanas',
    supplierName: 'Válvulas & Ventanas del Norte S.L.',
    title: 'Ficha Técnica: Ventana / Balconera',
    description: 'Medidas de luz y especificación de perfilería y vidrio.',
    category: 'ventanas',
    fields: [
      { id: 'ancho', label: 'Ancho total', type: 'number', unit: 'mm', placeholder: '1200', required: true },
      { id: 'alto', label: 'Alto total', type: 'number', unit: 'mm', placeholder: '1400', required: true },
      { 
        id: 'sistema', 
        label: 'Sistema de Apertura', 
        type: 'select', 
        options: ['Oscilobatiente 1 Hoja', 'Oscilobatiente 2 Hojas', 'Corredera 2 Hojas', 'Fijo'],
        required: true 
      },
      { 
        id: 'color', 
        label: 'Color / Acabado', 
        type: 'select', 
        options: ['Blanco Estándar', 'Gris Antracita RAL 7016', 'Roble Dorado', 'Negro'],
        required: true 
      },
      { 
        id: 'vidrio', 
        label: 'Vidrio', 
        type: 'select', 
        options: ['Doble 4/16/4 Climalit', 'Bajo Emisivo + Control Solar', 'Acústico 6/14/4'],
        required: true 
      },
      { 
        id: 'persiana', 
        label: 'Cajón de Persiana', 
        type: 'select', 
        options: ['Sin persiana', 'Cajón Cinta', 'Cajón Motorizado Somfy', 'Cajón con Mosquitera'] 
      },
      { id: 'notas', label: 'Observaciones de obra', type: 'text', placeholder: 'Tapajuntas, remates, etc.' }
    ]
  },
  {
    id: 'sheet-cierre-enrollable',
    supplierId: 'prov-cierres',
    supplierName: 'Cierres & Cerramientos Industriales S.L.',
    title: 'Ficha Técnica: Cierre Enrollable',
    description: 'Medidas de luz y configuración de lamas y motorización.',
    category: 'cierres',
    fields: [
      { id: 'ancho_luz', label: 'Ancho luz libre', type: 'number', unit: 'mm', placeholder: '3500', required: true },
      { id: 'alto_luz', label: 'Alto luz libre', type: 'number', unit: 'mm', placeholder: '2800', required: true },
      { 
        id: 'tipo_lama', 
        label: 'Tipo de Lama', 
        type: 'select', 
        options: ['Ciega galvanizada', 'Microperforada', 'Troquelada con metacrilato', 'Tubular de aros'],
        required: true 
      },
      { 
        id: 'motor', 
        label: 'Accionamiento / Motor', 
        type: 'select', 
        options: ['Motor centro de eje con electrofreno', 'Motor tubular rápido', 'Manual con compensación'],
        required: true 
      },
      { 
        id: 'seguridad', 
        label: 'Mandos y Seguridad', 
        type: 'select', 
        options: ['Pulsador interior + Llave exterior', 'Mandos a distancia (2 uds) + Receptor', 'Fotocélula de seguridad'] 
      },
      { id: 'acabado', label: 'Acabado pintura', type: 'select', options: ['Galvanizado natural', 'Lacado RAL al horno', 'Inox'] }
    ]
  }
];

export function getTemplatesForSupplier(supplierId: string): SupplierTechnicalSheet[] {
  return SUPPLIER_TEMPLATES.filter(t => t.supplierId === supplierId);
}