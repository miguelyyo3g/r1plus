'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PaperAirplaneIcon, 
  TagIcon, 
  PaperClipIcon, 
  CheckCircleIcon,
  XMarkIcon,
  CurrencyEuroIcon,
  TruckIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ShoppingBagIcon,
  CheckIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  Bars3Icon,
  FolderIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  ShareIcon,
  EyeIcon,
  LockClosedIcon,
  TrashIcon,
  PlusIcon,
  CalculatorIcon,
  SparklesIcon,
  PrinterIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PencilSquareIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  MapPinIcon,
  CreditCardIcon,
  PhoneIcon,
  ClockIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ArrowLeftIcon,
  TableCellsIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

function ReadReceipt({ status }: { status?: 'sent' | 'delivered' | 'read' }) {
  if (!status) return null;
  if (status === 'sent') return <span title="Enviado" className="inline-flex ml-1.5 text-slate-400"><CheckIcon className="h-3.5 w-3.5" /></span>;
  if (status === 'delivered') return <span title="Entregado" className="inline-flex ml-1.5 -space-x-1.5 text-slate-400"><CheckIcon className="h-3.5 w-3.5" /><CheckIcon className="h-3.5 w-3.5" /></span>;
  return <span title="Leído" className="inline-flex ml-1.5 -space-x-1.5 text-sky-500 font-bold"><CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" /><CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" /></span>;
}

export interface EndClient {
  id: string;
  empresa: string;
  cif: string;
  nombre: string;
  dni: string;
  cargo: string;
  residencia: 'España' | 'Comunitaria' | 'Extracomunitaria';
  email: string;
  email2?: string;
  telefono1: string;
  telefono2?: string;
  direccion: string;
  poblacion: string;
  codigoPostal: string;
  direccionEntrega?: string;
  tipoFactura: 'Ordinaria (21%)' | 'Reducida (10%)' | 'Inversión Sujeto Pasivo' | 'Exenta';
  numeroCuenta: string;
  assignedCommercial: string;
  createdBy: string;
  createdAt: string;
}

export interface QuoteLineItem {
  id: string;
  concept: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteEvent {
  id: string;
  type: 'creation' | 'edit' | 'whatsapp' | 'email' | 'print';
  description: string;
  userName: string;
  timestamp: string;
}

export interface EndClientQuote {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientVat: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'accepted' | 'invoiced';
  invoiceNumber?: string;
  items: QuoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalWithTax: number;
  events: QuoteEvent[];
}

export interface CorporatePdfCatalog {
  id: string;
  title: string;
  version: string;
  size: string;
  pages: number;
  updatedAt: string;
  assignedTo: string;
}

export interface OfficialProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  specPdfName: string;
  assignedTo: string;
}

export interface StoredDocument {
  id: string;
  name: string;
  size: string;
  source: 'catalogo' | 'recibido_chat' | 'compartido_externo';
  date: string;
}

export interface AttachedFile {
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface QuickRequestData {
  sku: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected';
  pricePerUnit?: number;
  deliveryDays?: number;
  orderReference?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'sales_rep';
  type: 'text' | 'quote_request' | 'file' | 'product_card';
  body?: string;
  quickRequest?: QuickRequestData;
  file?: AttachedFile;
  product?: OfficialProduct;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface ClientConversation {
  id: string;
  clientName: string;
  companyName: string;
  logoUrl?: string;
  email: string;
  lastMessage: string;
  time: string;
  pendingQuotes: number;
  unreadCount: number;
}

interface B2BChatRoomProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: 'sales_rep' | 'buyer' | 'supplier_owner' | 'client_employee';
    company: string;
    companyType: 'supplier' | 'client';
  };
  onLogout: () => void;
}

export default function B2BChatRoom({ currentUser, onLogout }: B2BChatRoomProps) {
  const currentRole = currentUser.role;
  
  const [bottomNav, setBottomNav] = useState<'chats' | 'clients' | 'calendar' | 'documents' | 'profile'>('chats');
  const [activeBuyerTab, setActiveBuyerTab] = useState<'supplier_chat' | 'client_invoicing' | 'client_directory'>('supplier_chat');
  const [managerDocTab, setManagerDocTab] = useState<'custom_catalog' | 'pdf_catalogs'>('custom_catalog');

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelImportRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<AttachedFile | null>(null);

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCatalogDrawerOpen, setIsCatalogDrawerOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'products' | 'pdfs'>('products');
  const [catalogSearch, setCatalogSearch] = useState('');

  const [teamMembers, setTeamMembers] = useState([
    { id: 'tm-1', name: currentUser.name, email: currentUser.email, role: currentUser.role, status: 'Activo' },
    { id: 'tm-2', name: 'Pablo Herrero', email: 'pablo.herrero@empresa.com', role: currentRole === 'supplier_owner' ? 'sales_rep' : 'client_employee', status: 'Activo' }
  ]);
  const [linkEmailInput, setLinkEmailInput] = useState('');
  const [linkRoleInput, setLinkRoleInput] = useState<string>(currentRole === 'supplier_owner' ? 'sales_rep' : 'client_employee');

  const pushNavStep = (stepName: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ step: stepName }, '', '');
    }
  };

  const availableCommercials = [
    'Todos los comerciales',
    'Marta Rodríguez',
    'Pablo Herrero',
    'Lucía Santos',
    'David Ortiz',
    'Carlos Gómez'
  ];

  const [endClients, setEndClients] = useState<EndClient[]>([
    {
      id: 'cli-generic',
      empresa: 'Cliente Genérico / Mostrador',
      cif: 'VTA-MOSTRADOR',
      nombre: 'Cliente Contado',
      dni: '00000000T',
      cargo: 'Particular / Venta Directa',
      residencia: 'España',
      email: 'mostrador@tienda.com',
      telefono1: '600000000',
      direccion: 'Venta en mostrador / Obra menor',
      poblacion: 'Madrid',
      codigoPostal: '28001',
      tipoFactura: 'Ordinaria (21%)',
      numeroCuenta: '',
      assignedCommercial: 'Carlos Gómez',
      createdBy: 'Sistema',
      createdAt: '01/01/2026'
    }
  ]);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState<Partial<EndClient>>({
    empresa: '', cif: '', nombre: '', dni: '', cargo: '', residencia: 'España', email: '', email2: '', telefono1: '', telefono2: '', direccion: '', poblacion: '', codigoPostal: '', direccionEntrega: '', tipoFactura: 'Ordinaria (21%)', numeroCuenta: '', assignedCommercial: currentUser.name
  });

  const [conversations, setConversations] = useState<ClientConversation[]>([
    {
      id: 'conv-1',
      clientName: 'Carlos Gómez',
      companyName: 'Instalaciones Gómez S.L.',
      logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=150&auto=format&fit=crop&q=80',
      email: 'carlos.gomez@instalacionesgomez.es',
      lastMessage: 'Petición rápida de cotización: 120 uds de Válvula Inox 2" AISI 316.',
      time: '10:30',
      pendingQuotes: 1,
      unreadCount: 1
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      chatId: 'conv-1',
      senderId: 'user-buyer-1',
      senderName: 'Carlos Gómez',
      senderRole: 'buyer',
      type: 'quote_request',
      quickRequest: {
        sku: 'VALV-INOX-DN50',
        quantity: 120,
        notes: '¿Tenéis entrega antes del viernes?',
        status: 'quoted',
        pricePerUnit: 42.50,
        deliveryDays: 2
      },
      createdAt: '10:30',
      status: 'read'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');

  const [corporatePdfs, setCorporatePdfs] = useState<CorporatePdfCatalog[]>([
    {
      id: 'pdf-1',
      title: 'Catálogo General Valvulería y Accesorios 2026',
      version: 'Tarifa Oficial v2.4',
      size: '14.8 MB',
      pages: 184,
      updatedAt: '15 Feb 2026',
      assignedTo: 'Todos los comerciales'
    }
  ]);

  const [officialProducts, setOfficialProducts] = useState<OfficialProduct[]>([
    {
      id: 'p-1',
      sku: 'VALV-INOX-DN50',
      name: 'Válvula de Bola Inoxidable 2" AISI 316 Paso Total',
      category: 'Valvulería Industrial',
      price: 48.50,
      stock: 450,
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
      specPdfName: 'Ficha_Tecnica_VALV-INOX-DN50.pdf',
      assignedTo: 'Todos los comerciales'
    }
  ]);

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({ sku: '', name: '', category: 'Valvulería Industrial', price: '', stock: '', assignedTo: 'Todos los comerciales' });

  const [isAddPdfModalOpen, setIsAddPdfModalOpen] = useState(false);
  const [newPdfTitle, setNewPdfTitle] = useState('');
  const [newPdfVersion, setNewPdfVersion] = useState('');
  const [newPdfAssignedTo, setNewPdfAssignedTo] = useState('Todos los comerciales');

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [activeQuoteForEmail, setActiveQuoteForEmail] = useState<EndClientQuote | null>(null);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  const [myClientQuotes, setMyClientQuotes] = useState<EndClientQuote[]>([]);
  const [viewingQuote, setViewingQuote] = useState<EndClientQuote | null>(null);

  const [isSelectClientModalOpen, setIsSelectClientModalOpen] = useState(false);
  const [isQuoteEditorOpen, setIsQuoteEditorOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [activeSelectedClient, setActiveSelectedClient] = useState<EndClient | null>(null);
  const [quoteTaxRate, setQuoteTaxRate] = useState(21);
  const [editorLines, setEditorLines] = useState<QuoteLineItem[]>([
    { id: 'ed-1', concept: 'Partida o material inicial', quantity: 1, unitPrice: 50.00, total: 50.00 }
  ]);

  // CARGA AUTOMÁTICA EN TIEMPO REAL DESDE SUPABASE
  useEffect(() => {
    async function loadDataFromSupabase() {
      try {
        const { data: clientsData, error: clientErr } = await supabase
          .from('end_clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (!clientErr && clientsData && clientsData.length > 0) {
          const formattedClients: EndClient[] = clientsData.map((c: any) => ({
            id: c.id,
            empresa: c.empresa,
            cif: c.cif,
            nombre: c.nombre,
            dni: c.dni || '',
            cargo: c.cargo || '',
            residencia: c.residencia || 'España',
            email: c.email,
            email2: c.email2 || '',
            telefono1: c.telefono1,
            telefono2: c.telefono2 || '',
            direccion: c.direccion || '',
            poblacion: c.poblacion || '',
            codigoPostal: c.codigo_postal || '',
            direccionEntrega: c.direccion_entrega || '',
            tipoFactura: c.tipo_factura || 'Ordinaria (21%)',
            numeroCuenta: c.numero_cuenta || '',
            assignedCommercial: c.assigned_commercial || currentUser.name,
            createdBy: c.created_by || currentUser.name,
            createdAt: new Date(c.created_at).toLocaleDateString('es-ES')
          }));
          setEndClients(formattedClients);
        }

        const { data: quotesData, error: quoteErr } = await supabase
          .from('end_client_quotes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!quoteErr && quotesData && quotesData.length > 0) {
          const formattedQuotes: EndClientQuote[] = quotesData.map((q: any) => ({
            id: q.id,
            number: q.number,
            clientId: q.client_id,
            clientName: q.client_name,
            clientVat: q.client_vat || '',
            clientEmail: q.client_email || '',
            clientPhone: q.client_phone || '',
            clientAddress: q.client_address || '',
            date: q.date,
            dueDate: q.due_date || '30 días',
            status: q.status || 'draft',
            items: q.items || [],
            subtotal: Number(q.subtotal),
            taxRate: Number(q.tax_rate),
            taxAmount: Number(q.tax_amount),
            totalWithTax: Number(q.total_with_tax),
            events: q.events || []
          }));
          setMyClientQuotes(formattedQuotes);
        }
      } catch (err) {
        console.warn('Conectando en modo local mientras responde Supabase...', err);
      }
    }

    loadDataFromSupabase();
  }, [currentUser.name]);

  // HISTORIAL NATIVO ANDROID (Evita cierre accidental de app)
  useEffect(() => {
    const handlePopState = () => {
      if (viewingQuote) setViewingQuote(null);
      else if (isEmailModalOpen) setIsEmailModalOpen(false);
      else if (isAddProductModalOpen) setIsAddProductModalOpen(false);
      else if (isAddPdfModalOpen) setIsAddPdfModalOpen(false);
      else if (isQuoteEditorOpen) setIsQuoteEditorOpen(false);
      else if (isSelectClientModalOpen) setIsSelectClientModalOpen(false);
      else if (isClientModalOpen) setIsClientModalOpen(false);
      else if (isNewChatModalOpen) setIsNewChatModalOpen(false);
      else if (isCatalogDrawerOpen) setIsCatalogDrawerOpen(false);
      else if (activeChatId) setActiveChatId(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewingQuote, isEmailModalOpen, isAddProductModalOpen, isAddPdfModalOpen, isQuoteEditorOpen, isSelectClientModalOpen, isClientModalOpen, isNewChatModalOpen, isCatalogDrawerOpen, activeChatId]);

  const handleOpenChat = (convId: string) => {
    pushNavStep(`chat-${convId}`);
    setActiveChatId(convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
  };

  const handleCreateNewChatWithClient = (client: EndClient) => {
    const existing = conversations.find(c => c.email.toLowerCase() === client.email.toLowerCase());
    if (existing) {
      handleOpenChat(existing.id);
    } else {
      const newConv: ClientConversation = {
        id: `conv-${Date.now()}`,
        clientName: client.nombre,
        companyName: client.empresa,
        email: client.email,
        lastMessage: 'Conversación iniciada.',
        time: 'Ahora',
        pendingQuotes: 0,
        unreadCount: 0
      };
      setConversations([newConv, ...conversations]);
      handleOpenChat(newConv.id);
    }
    setIsNewChatModalOpen(false);
  };

  const currentChatConversation = conversations.find(c => c.id === activeChatId);
  const currentChatMessages = messages.filter(m => !activeChatId || m.chatId === activeChatId || !m.chatId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !pendingFile) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      chatId: activeChatId || 'conv-1',
      senderId: currentUser.id || 'user-buyer-1',
      senderName: currentUser.name,
      senderRole: (currentRole === 'supplier_owner' || currentRole === 'sales_rep') ? 'sales_rep' : 'buyer',
      type: pendingFile ? 'file' : 'text',
      body: inputMessage || (pendingFile ? `Archivo: ${pendingFile.name}` : ''),
      file: pendingFile || undefined,
      createdAt: timeString,
      status: 'delivered'
    };

    setMessages(prev => [...prev, newMsg]);
    if (activeChatId) {
      setConversations(prev => prev.map(c => c.id === activeChatId ? { ...c, lastMessage: newMsg.body || 'Archivo', time: timeString } : c));
    }
    setInputMessage('');
    setPendingFile(null);
  };

  const handleAddLine = () => {
    setEditorLines(prev => [...prev, { id: `l-${Date.now()}`, concept: 'Nueva partida / material', quantity: 1, unitPrice: 35.00, total: 35.00 }]);
  };

  const handleUpdateLine = (id: string, field: 'concept' | 'quantity' | 'unitPrice', value: any) => {
    setEditorLines(prev =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
          const price = field === 'unitPrice' ? parseFloat(value) || 0 : item.unitPrice;
          updated.total = Number((qty * price).toFixed(2));
          return updated;
        }
        return item;
      })
    );
  };

  const handleDeleteLine = (id: string) => {
    if (editorLines.length === 1) return;
    setEditorLines(prev => prev.filter(l => l.id !== id));
  };

  const calculatedSubtotal = editorLines.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const calculatedTaxAmount = Number((calculatedSubtotal * (quoteTaxRate / 100)).toFixed(2));
  const calculatedTotalWithTax = Number((calculatedSubtotal + calculatedTaxAmount).toFixed(2));

  // PASO 1: SELECCIÓN PREVIA DE CLIENTE
  const handleStartQuoteFlow = (presetLines?: QuoteLineItem[]) => {
    pushNavStep('select-client');
    setEditingQuoteId(null);
    if (presetLines && presetLines.length > 0) {
      setEditorLines(presetLines);
    } else {
      setEditorLines([
        { id: `l-${Date.now()}`, concept: 'Partida o material acordado', quantity: 1, unitPrice: 50.00, total: 50.00 }
      ]);
    }
    setIsSelectClientModalOpen(true);
  };

  const handleSelectClientForQuote = (client: EndClient) => {
    pushNavStep('quote-editor');
    setActiveSelectedClient(client);
    setIsSelectClientModalOpen(false);
    setQuoteTaxRate(client.tipoFactura === 'Reducida (10%)' ? 10 : client.tipoFactura === 'Exenta' ? 0 : 21);
    setIsQuoteEditorOpen(true);
  };

  const handleOpenEditQuote = (quote: EndClientQuote) => {
    pushNavStep('quote-editor-edit');
    setEditingQuoteId(quote.id);
    const client = endClients.find(c => c.id === quote.clientId) || {
      id: quote.clientId,
      empresa: quote.clientName,
      cif: quote.clientVat,
      email: quote.clientEmail,
      telefono1: quote.clientPhone,
      direccion: quote.clientAddress,
      poblacion: '',
      codigoPostal: '',
      nombre: quote.clientName,
      dni: '',
      cargo: '',
      residencia: 'España',
      tipoFactura: 'Ordinaria (21%)',
      numeroCuenta: '',
      assignedCommercial: currentUser.name,
      createdBy: currentUser.name,
      createdAt: quote.date
    };
    setActiveSelectedClient(client);
    setQuoteTaxRate(quote.taxRate);
    setEditorLines(quote.items.map(it => ({ ...it })));
    setIsQuoteEditorOpen(true);
  };

  // PASO 2: GUARDAR EN SUPABASE CON TRAZABILIDAD
  const handleSaveQuoteToDatabase = (actionAfter?: 'whatsapp' | 'email' | 'print') => {
    if (!activeSelectedClient) return null;
    const now = new Date();
    const timestampFormatted = `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let savedQuote: EndClientQuote;

    if (editingQuoteId) {
      const existing = myClientQuotes.find(q => q.id === editingQuoteId);
      const newEvent: QuoteEvent = {
        id: `ev-${Date.now()}`,
        type: 'edit',
        description: `Presupuesto modificado (${editorLines.length} partidas)`,
        userName: currentUser.name,
        timestamp: timestampFormatted
      };

      savedQuote = {
        ...existing!,
        clientId: activeSelectedClient.id,
        clientName: activeSelectedClient.empresa,
        clientVat: activeSelectedClient.cif,
        clientEmail: activeSelectedClient.email,
        clientPhone: activeSelectedClient.telefono1,
        clientAddress: `${activeSelectedClient.direccion}, ${activeSelectedClient.poblacion}`,
        items: editorLines,
        subtotal: calculatedSubtotal,
        taxRate: quoteTaxRate,
        taxAmount: calculatedTaxAmount,
        totalWithTax: calculatedTotalWithTax,
        events: [newEvent, ...(existing?.events || [])]
      };

      setMyClientQuotes(prev => prev.map(q => q.id === editingQuoteId ? savedQuote : q));
      setNotificationBanner(`✓ Presupuesto ${savedQuote.number} modificado y guardado.`);
    } else {
      const quoteNum = `PRES-2026-00${myClientQuotes.length + 1}`;
      const creationEvent: QuoteEvent = {
        id: `ev-${Date.now()}`,
        type: 'creation',
        description: `Presupuesto creado por ${currentUser.name}`,
        userName: currentUser.name,
        timestamp: timestampFormatted
      };

      savedQuote = {
        id: `q-${Date.now()}`,
        number: quoteNum,
        clientId: activeSelectedClient.id,
        clientName: activeSelectedClient.empresa,
        clientVat: activeSelectedClient.cif,
        clientEmail: activeSelectedClient.email,
        clientPhone: activeSelectedClient.telefono1,
        clientAddress: `${activeSelectedClient.direccion}, ${activeSelectedClient.poblacion}`,
        date: now.toLocaleDateString('es-ES'),
        dueDate: '30 días',
        status: 'draft',
        items: editorLines,
        subtotal: calculatedSubtotal,
        taxRate: quoteTaxRate,
        taxAmount: calculatedTaxAmount,
        totalWithTax: calculatedTotalWithTax,
        events: [creationEvent]
      };

      setMyClientQuotes(prev => [savedQuote, ...prev]);
      setNotificationBanner(`✓ Presupuesto ${quoteNum} guardado en la nube.`);
    }

    supabase.from('end_client_quotes').upsert({
      id: savedQuote.id,
      number: savedQuote.number,
      client_id: savedQuote.clientId,
      client_name: savedQuote.clientName,
      client_vat: savedQuote.clientVat,
      client_email: savedQuote.clientEmail,
      client_phone: savedQuote.clientPhone,
      client_address: savedQuote.clientAddress,
      date: savedQuote.date,
      due_date: savedQuote.dueDate,
      status: savedQuote.status,
      items: savedQuote.items,
      subtotal: savedQuote.subtotal,
      tax_rate: savedQuote.taxRate,
      tax_amount: savedQuote.taxAmount,
      total_with_tax: savedQuote.totalWithTax,
      events: savedQuote.events
    }).then(({ error }) => {
      if (error) console.error('Error guardando en Supabase:', error);
    });

    if (!actionAfter) {
      setIsQuoteEditorOpen(false);
    }
    setTimeout(() => setNotificationBanner(null), 3500);
    return savedQuote;
  };

  // PASO 3: ACCIONES RÁPIDAS
  const handleSendWhatsApp = (quoteParam?: EndClientQuote) => {
    const q = quoteParam || handleSaveQuoteToDatabase('whatsapp');
    if (!q) return;

    let phoneClean = q.clientPhone.replace(/\D/g, '');
    if (phoneClean.length === 9) {
      phoneClean = `34${phoneClean}`;
    }

    const messageText = `Hola ${q.clientName}, le adjunto el *Presupuesto Oficial ${q.number}* de ${currentUser.company} por un total de *${q.totalWithTax.toFixed(2)} €* (IVA incl.).`;
    
    const now = new Date();
    const event: QuoteEvent = {
      id: `ev-${Date.now()}`,
      type: 'whatsapp',
      description: `Enviado por WhatsApp al teléfono ${q.clientPhone}`,
      userName: currentUser.name,
      timestamp: `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    const updatedEvents = [event, ...q.events];
    setMyClientQuotes(prev => prev.map(item => item.id === q.id ? { ...item, events: updatedEvents } : item));
    supabase.from('end_client_quotes').update({ events: updatedEvents }).eq('id', q.id);

    if (typeof window !== 'undefined') {
      window.open(`https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(messageText)}`, '_blank');
    }
    setIsQuoteEditorOpen(false);
  };

  const handleOpenEmailModal = (quoteParam?: EndClientQuote) => {
    const q = quoteParam || handleSaveQuoteToDatabase('email');
    if (!q) return;
    pushNavStep('email-modal');
    setActiveQuoteForEmail(q);
    setEmailTo(q.clientEmail || '');
    setEmailSubject(`Presupuesto Oficial ${q.number} - ${currentUser.company}`);
    setEmailBody(`Estimado/a ${q.clientName},\n\nLe remitimos el presupuesto oficial ${q.number} por importe de ${q.totalWithTax.toFixed(2)} € (IVA incluido).\n\nQuedamos a su entera disposición para cualquier consulta.\n\nAtentamente,\n${currentUser.name}\n${currentUser.company}`);
    setIsEmailModalOpen(true);
    setIsQuoteEditorOpen(false);
  };

  const handleConfirmSendEmail = () => {
    if (!activeQuoteForEmail) return;
    const now = new Date();
    const event: QuoteEvent = {
      id: `ev-${Date.now()}`,
      type: 'email',
      description: `Enviado por email a ${emailTo}`,
      userName: currentUser.name,
      timestamp: `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    const updatedEvents = [event, ...activeQuoteForEmail.events];
    setMyClientQuotes(prev => prev.map(item => item.id === activeQuoteForEmail.id ? { ...item, events: updatedEvents } : item));
    supabase.from('end_client_quotes').update({ events: updatedEvents }).eq('id', activeQuoteForEmail.id);

    setIsEmailModalOpen(false);
    setNotificationBanner(`✓ Presupuesto enviado a ${emailTo} y registrado en el historial.`);
    setTimeout(() => setNotificationBanner(null), 3500);
  };

  const handlePrintQuote = (quoteParam?: EndClientQuote) => {
    const q = quoteParam || handleSaveQuoteToDatabase('print');
    if (!q) return;
    pushNavStep('print-view');
    const now = new Date();
    const event: QuoteEvent = {
      id: `ev-${Date.now()}`,
      type: 'print',
      description: `Generado PDF / Impresión oficial A4`,
      userName: currentUser.name,
      timestamp: `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    const updatedEvents = [event, ...q.events];
    setMyClientQuotes(prev => prev.map(item => item.id === q.id ? { ...item, events: updatedEvents } : item));
    supabase.from('end_client_quotes').update({ events: updatedEvents }).eq('id', q.id);

    setViewingQuote(q);
    setIsQuoteEditorOpen(false);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.empresa || !clientForm.email || !clientForm.telefono1) {
      alert('Por favor complete los campos obligatorios: Empresa, Email y Teléfono 1');
      return;
    }

    const created: EndClient = {
      id: clientForm.id || `cli-${Date.now()}`,
      empresa: clientForm.empresa || '',
      cif: clientForm.cif || 'Pendiente',
      nombre: clientForm.nombre || clientForm.empresa || '',
      dni: clientForm.dni || '',
      cargo: clientForm.cargo || 'Responsable',
      residencia: clientForm.residencia || 'España',
      email: clientForm.email || '',
      email2: clientForm.email2 || '',
      telefono1: clientForm.telefono1 || '',
      telefono2: clientForm.telefono2 || '',
      direccion: clientForm.direccion || '',
      poblacion: clientForm.poblacion || '',
      codigoPostal: clientForm.codigoPostal || '',
      direccionEntrega: clientForm.direccionEntrega || clientForm.direccion || '',
      tipoFactura: clientForm.tipoFactura || 'Ordinaria (21%)',
      numeroCuenta: clientForm.numeroCuenta || '',
      assignedCommercial: clientForm.assignedCommercial || currentUser.name,
      createdBy: clientForm.createdBy || currentUser.name,
      createdAt: clientForm.createdAt || new Date().toLocaleDateString('es-ES')
    };

    supabase.from('end_clients').upsert({
      id: created.id,
      empresa: created.empresa,
      cif: created.cif,
      nombre: created.nombre,
      dni: created.dni,
      cargo: created.cargo,
      residencia: created.residencia,
      email: created.email,
      email2: created.email2,
      telefono1: created.telefono1,
      telefono2: created.telefono2,
      direccion: created.direccion,
      poblacion: created.poblacion,
      codigo_postal: created.codigoPostal,
      direccion_entrega: created.direccionEntrega,
      tipo_factura: created.tipoFactura,
      numero_cuenta: created.numeroCuenta,
      assigned_commercial: created.assignedCommercial,
      created_by: created.createdBy
    }).then(({ error }) => {
      if (error) console.error('Error guardando cliente en Supabase:', error);
    });

    setEndClients(prev => {
      const exists = prev.some(c => c.id === created.id);
      if (exists) return prev.map(c => c.id === created.id ? created : c);
      return [created, ...prev];
    });

    setIsClientModalOpen(false);
    setNotificationBanner(`✓ Cliente ${created.empresa} registrado en la nube.`);
    setTimeout(() => setNotificationBanner(null), 3500);

    if (isSelectClientModalOpen) {
      handleSelectClientForQuote(created);
    }
  };

  const handleOpenEditClient = (client: EndClient) => {
    pushNavStep('edit-client');
    setClientForm({ ...client });
    setIsClientModalOpen(true);
  };

  const handleSaveSingleProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.sku || !newProductForm.name || !newProductForm.price) return;

    const created: OfficialProduct = {
      id: `p-${Date.now()}`,
      sku: newProductForm.sku.toUpperCase(),
      name: newProductForm.name,
      category: newProductForm.category,
      price: parseFloat(newProductForm.price) || 0,
      stock: parseInt(newProductForm.stock) || 0,
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
      specPdfName: 'FT_Generica.pdf',
      assignedTo: newProductForm.assignedTo
    };

    setOfficialProducts([created, ...officialProducts]);
    setIsAddProductModalOpen(false);
    setNewProductForm({ sku: '', name: '', category: 'Valvulería Industrial', price: '', stock: '', assignedTo: 'Todos los comerciales' });
    setNotificationBanner(`✓ Artículo ${created.sku} añadido y asignado a: ${created.assignedTo}`);
    setTimeout(() => setNotificationBanner(null), 3500);
  };

  const handleSimulateExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const importedMock: OfficialProduct[] = [
      {
        id: `p-${Date.now()}-1`,
        sku: 'CODO-INOX-90-DN50',
        name: 'Codo Inox 90º Soldar AISI 316 DN50',
        category: 'Accesorios Inox',
        price: 18.20,
        stock: 320,
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
        specPdfName: 'FT_Codo_Inox.pdf',
        assignedTo: 'Todos los comerciales'
      }
    ];

    setOfficialProducts(prev => [...importedMock, ...prev]);
    setNotificationBanner(`✓ Archivo Excel "${file.name}" procesado: +${importedMock.length} productos asignados`);
    setTimeout(() => setNotificationBanner(null), 4000);
    if (excelImportRef.current) excelImportRef.current.value = '';
  };

  const handleSavePdfCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPdfTitle) return;

    const newPdf: CorporatePdfCatalog = {
      id: `pdf-${Date.now()}`,
      title: newPdfTitle,
      version: newPdfVersion || 'Tarifa Oficial',
      size: '3.6 MB',
      pages: 12,
      updatedAt: 'Hoy',
      assignedTo: newPdfAssignedTo
    };

    setCorporatePdfs([newPdf, ...corporatePdfs]);
    setIsAddPdfModalOpen(false);
    setNewPdfTitle('');
    setNewPdfVersion('');
    setNotificationBanner(`✓ Documento PDF guardado y disponible para: ${newPdf.assignedTo}`);
    setTimeout(() => setNotificationBanner(null), 3500);
  };

  const handleUpdateProductAssignment = (productId: string, assignedTo: string) => {
    setOfficialProducts(prev => prev.map(p => p.id === productId ? { ...p, assignedTo } : p));
    setNotificationBanner(`✓ Asignación actualizada a: ${assignedTo}`);
    setTimeout(() => setNotificationBanner(null), 2500);
  };

  const handleUpdatePdfAssignment = (pdfId: string, assignedTo: string) => {
    setCorporatePdfs(prev => prev.map(pdf => pdf.id === pdfId ? { ...pdf, assignedTo } : pdf));
    setNotificationBanner(`✓ Documento PDF asignado a: ${assignedTo}`);
    setTimeout(() => setNotificationBanner(null), 2500);
  };

  const handleLinkExistingAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = linkEmailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    const newMember = {
      id: `tm-${Date.now()}`,
      name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
      email: cleanEmail,
      role: linkRoleInput,
      status: 'Vinculado'
    };

    setTeamMembers(prev => [...prev, newMember]);
    setLinkEmailInput('');
    setNotificationBanner(`✓ Cuenta ${cleanEmail} vinculada correctamente como equipo.`);
    setTimeout(() => setNotificationBanner(null), 3500);
  };

  const displayedClients = (currentRole === 'sales_rep' || currentRole === 'client_employee')
    ? endClients.filter(c => c.assignedCommercial.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]) || c.createdBy.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]))
    : endClients;

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'supplier_owner': return { label: 'Proveedor (Gerencia)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'sales_rep': return { label: 'Comercial Proveedor', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'buyer': return { label: 'Cliente (Instalador)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'client_employee': return { label: 'Técnico / Comercial Cliente', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      default: return { label: 'Usuario', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge();

  const handleShareProductToChat = (prod: OfficialProduct) => {
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      chatId: activeChatId || 'conv-1',
      senderId: currentUser.id || 'user-rep-2',
      senderName: currentUser.name,
      senderRole: 'sales_rep',
      type: 'product_card',
      body: `Ficha de producto oficial del catálogo:`,
      product: prod,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered'
    };

    setMessages(prev => [...prev, newMsg]);
    setIsCatalogDrawerOpen(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden select-none">
      
      {notificationBanner && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-in fade-in">
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* CABECERA SUPERIOR LIMPIA */}
      <header className="bg-white border-b border-slate-200 px-4 pt-3 pb-2 flex flex-col gap-2 shrink-0 shadow-xs z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {(currentRole === 'sales_rep' || currentRole === 'supplier_owner') && (
              <button 
                type="button"
                onClick={() => setIsSidebarOpenMobile(true)} 
                className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Abrir menú"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-indigo-600">
                r1<span className="text-slate-900">plus</span>
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-md ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onLogout} 
              className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
              title="Cerrar sesión"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* FILA 2: ACCIONES DEPENDIENDO DEL ROL */}
        <div className="flex items-center gap-2 pt-0.5">
          {currentRole === 'sales_rep' && (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => { pushNavStep('catalog'); setIsCatalogDrawerOpen(true); }}
                className="flex-1 py-1.5 px-3 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpenIcon className="h-4 w-4" />
                <span>Catálogos y Artículos</span>
              </button>
              <button
                type="button"
                onClick={() => { pushNavStep('email-modal'); setIsEmailModalOpen(true); }}
                className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
              >
                <EnvelopeIcon className="h-4 w-4 text-indigo-600" />
                <span>Email</span>
              </button>
            </div>
          )}

          {currentRole === 'buyer' && (
            <div className="grid grid-cols-3 gap-1.5 w-full">
              <button
                type="button"
                onClick={() => { setActiveBuyerTab('supplier_chat'); setBottomNav('chats'); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                  bottomNav === 'chats' && activeBuyerTab === 'supplier_chat' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs' : 'bg-slate-50 text-slate-600'
                }`}
              >
                💬 Mensajes
              </button>
              <button
                type="button"
                onClick={() => { setActiveBuyerTab('client_invoicing'); setBottomNav('chats'); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center truncate ${
                  bottomNav === 'chats' && activeBuyerTab === 'client_invoicing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs' : 'bg-slate-50 text-slate-600'
                }`}
              >
                📄 Presupuestos ({myClientQuotes.length})
              </button>
              <button
                type="button"
                onClick={() => { setActiveBuyerTab('client_directory'); setBottomNav('chats'); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center truncate ${
                  bottomNav === 'chats' && activeBuyerTab === 'client_directory' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs' : 'bg-slate-50 text-slate-600'
                }`}
              >
                👥 Clientes ({endClients.length})
              </button>
            </div>
          )}

          {currentRole === 'client_employee' && (
            <div className="w-full bg-slate-50 py-1 px-3 rounded-lg text-xs text-slate-500 font-medium text-center border border-slate-200">
              🛠️ Subcuenta Operativa vinculada a <strong>{currentUser.company}</strong>
            </div>
          )}
        </div>
      </header>

      {/* ÁREA CENTRAL */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LATERAL PROVEEDOR */}
        {(currentRole === 'sales_rep' || currentRole === 'supplier_owner') && (
          <>
            {isSidebarOpenMobile && (
              <div onClick={() => setIsSidebarOpenMobile(false)} className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" />
            )}

            <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 lg:w-80 border-r border-slate-200 bg-white flex flex-col transition-transform duration-200 ease-in-out ${
              isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Cartera B2B</span>
                  <h3 className="text-sm font-semibold text-slate-900">Mis Clientes ({conversations.length})</h3>
                </div>
                <button onClick={() => setIsSidebarOpenMobile(false)} className="md:hidden p-1 text-slate-400">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-slate-100 max-h-52 overflow-y-auto divide-y divide-slate-100">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => { handleOpenChat(conv.id); setIsSidebarOpenMobile(false); }}
                    className={`w-full p-3 text-left transition hover:bg-slate-50 flex items-start space-x-3 cursor-pointer ${
                      activeChatId === conv.id ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {conv.clientName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{conv.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{conv.companyName}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </>
        )}

        {/* CONTENEDOR PRINCIPAL */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white overflow-hidden">
          
          {/* VISTA 1: MENSAJERÍA */}
          {bottomNav === 'chats' && (currentRole !== 'buyer' || activeBuyerTab === 'supplier_chat') && (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
              {!activeChatId ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Conversaciones con Clientes</h3>
                      <p className="text-[11px] text-slate-500">Chats abiertos y consultas activas</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { pushNavStep('new-chat-modal'); setIsNewChatModalOpen(true); }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>+ Nuevo Chat</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => handleOpenChat(conv.id)}
                        className="w-full p-3.5 text-left hover:bg-slate-50/80 transition flex items-start gap-3 cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {conv.logoUrl ? (
                            <img src={conv.logoUrl} alt={conv.companyName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-black text-indigo-700 text-sm">
                              {conv.companyName.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{conv.clientName}</h4>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">{conv.time}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-indigo-600 truncate">{conv.companyName}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {conv.lastMessage}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveChatId(null)}
                        className="p-1.5 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <ArrowLeftIcon className="h-5 w-5" />
                      </button>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {currentChatConversation?.clientName || 'Chat con Cliente'}
                        </h4>
                        <p className="text-[10px] text-indigo-600 truncate">
                          {currentChatConversation?.companyName || 'Empresa'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {currentChatMessages.map((msg) => (
                      <div key={msg.id} className="flex flex-col items-start">
                        <div className="text-[11px] text-slate-400 mb-1">{msg.senderName} • {msg.createdAt}</div>
                        
                        {msg.type === 'quote_request' && msg.quickRequest && (
                          <div className="w-full max-w-sm rounded-xl border border-indigo-200 bg-white p-3.5 shadow-xs mb-2">
                            <span className="text-xs font-bold text-indigo-700 block">Cotización Formal</span>
                            <p className="text-xs text-slate-700 mt-1">Ref: {msg.quickRequest.sku} · {msg.quickRequest.quantity} uds</p>
                            <div className="mt-2 bg-emerald-50 text-emerald-800 p-2 rounded-lg font-bold text-xs">
                              Precio: {msg.quickRequest.pricePerUnit} €/ud · Entrega: {msg.quickRequest.deliveryDays} días
                            </div>
                            
                            {currentRole === 'buyer' && (
                              <button
                                type="button"
                                onClick={() => handleStartQuoteFlow([
                                  {
                                    id: `l-${Date.now()}`,
                                    concept: `${msg.quickRequest?.sku} (Con margen comercial)`,
                                    quantity: msg.quickRequest?.quantity || 1,
                                    unitPrice: Number(((msg.quickRequest?.pricePerUnit || 40) * 1.3).toFixed(2)),
                                    total: Number(((msg.quickRequest?.quantity || 1) * (msg.quickRequest?.pricePerUnit || 40) * 1.3).toFixed(2))
                                  }
                                ])}
                                className="mt-2.5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                + Convertir en Presupuesto Cliente
                              </button>
                            )}
                          </div>
                        )}

                        {msg.type === 'text' && (
                          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white text-slate-800 border border-slate-200">
                            {msg.body}
                          </div>
                        )}
                      </div>
                    ))}
                  </main>

                  <footer className="border-t border-slate-200 bg-white p-3 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                      />
                      <button type="submit" className="p-2 bg-indigo-600 text-white rounded-lg">
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </button>
                    </form>
                  </footer>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTOS DE GERENCIA */}
          {bottomNav === 'documents' && currentRole === 'supplier_owner' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Catálogos & Fichas Oficiales</h3>
                    <p className="text-xs text-slate-500">Gestiona tu catálogo personalizado y asigna material a tus comerciales.</p>
                  </div>

                  <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setManagerDocTab('custom_catalog')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        managerDocTab === 'custom_catalog' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      📦 Artículos ({officialProducts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setManagerDocTab('pdf_catalogs')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        managerDocTab === 'pdf_catalogs' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      📄 Fichas PDF ({corporatePdfs.length})
                    </button>
                  </div>
                </div>

                {managerDocTab === 'custom_catalog' && (
                  <div className="space-y-3.5">
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Añadir Artículos al Catálogo</h4>
                        <p className="text-xs text-slate-600 mt-0.5">Sube producto a producto o importa masivamente tu lista en Excel / CSV.</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => excelImportRef.current?.click()}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <TableCellsIcon className="h-4 w-4" />
                          <span>Importar Excel / CSV</span>
                        </button>
                        <input
                          type="file"
                          ref={excelImportRef}
                          onChange={handleSimulateExcelImport}
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => { pushNavStep('add-product'); setIsAddProductModalOpen(true); }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>+ Nuevo Producto</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {officialProducts.map((prod) => (
                        <div key={prod.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <img src={prod.imageUrl} alt={prod.name} className="h-14 w-14 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">{prod.sku}</span>
                              <h4 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h4>
                              <p className="text-[11px] text-slate-500">{prod.category} · Stock: <strong>{prod.stock} uds</strong></p>
                              <span className="text-xs font-black text-slate-900 mt-0.5 block">{prod.price.toFixed(2)} €/ud</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500 font-semibold">Visible para:</span>
                            <select
                              value={prod.assignedTo}
                              onChange={(e) => handleUpdateProductAssignment(prod.id, e.target.value)}
                              className="text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-200 rounded-lg p-1"
                            >
                              {availableCommercials.map((comm) => (
                                <option key={comm} value={comm}>{comm}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {managerDocTab === 'pdf_catalogs' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between pb-1">
                      <p className="text-xs text-slate-500">Documentos oficiales que tus comerciales podrán adjuntar en chats y presupuestos.</p>
                      <button
                        type="button"
                        onClick={() => { pushNavStep('add-pdf'); setIsAddPdfModalOpen(true); }}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>+ Subir Catálogo PDF</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {corporatePdfs.map((pdf) => (
                        <div key={pdf.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                              <DocumentTextIcon className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{pdf.title}</h4>
                              <p className="text-[11px] text-indigo-600 font-semibold">{pdf.version}</p>
                              <span className="text-[10px] text-slate-400">{pdf.size} · {pdf.pages} páginas</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500 font-semibold">Disponible para:</span>
                            <select
                              value={pdf.assignedTo}
                              onChange={(e) => handleUpdatePdfAssignment(pdf.id, e.target.value)}
                              className="text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-200 rounded-lg p-1"
                            >
                              {availableCommercials.map((comm) => (
                                <option key={comm} value={comm}>{comm}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* VISTA 2 (ALTERNA): DOCUMENTOS GENERALES */}
          {bottomNav === 'documents' && currentRole !== 'supplier_owner' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              <div className="max-w-2xl mx-auto space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Documentos y Fichas Oficiales</h3>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Ficha_Tecnica_VALV-INOX-DN50.pdf</h4>
                      <p className="text-[10px] text-slate-400">1.4 MB • Homologación UNE-EN 13241</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => alert('Descargando Ficha Técnica')}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 3: HISTORIAL DE PRESUPUESTOS */}
          {bottomNav === 'chats' && currentRole === 'buyer' && activeBuyerTab === 'client_invoicing' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Tus Presupuestos Emitidos</h3>
                    <p className="text-xs text-slate-500">Gestión de partidas, WhatsApp, Email y Trazabilidad</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartQuoteFlow()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>+ Nuevo Presupuesto</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {myClientQuotes.map((q) => (
                    <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-indigo-700 font-mono">{q.number}</span>
                            <span className="text-xs text-slate-400">({q.items.length} partidas)</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                              {q.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 mt-1">{q.clientName}</p>
                          <p className="text-[11px] text-slate-400">{q.date} • {q.clientAddress} • Tel: {q.clientPhone}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Total con IVA:</span>
                          <span className="text-sm font-black text-slate-900">{q.totalWithTax.toFixed(2)} €</span>
                        </div>
                      </div>

                      {/* TRAZABILIDAD */}
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <ClockIcon className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Trazabilidad de Eventos ({q.events?.length || 0})</span>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {q.events?.map(ev => (
                            <div key={ev.id} className="text-[10px] flex items-center justify-between text-slate-600 border-b border-slate-200/40 pb-0.5 last:border-none">
                              <span className="truncate"><strong>[{ev.userName}]</strong>: {ev.description}</span>
                              <span className="text-slate-400 shrink-0 ml-2 font-mono">{ev.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BOTONERA */}
                      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100">
                        <button type="button" onClick={() => handlePrintQuote(q)} className="py-1.5 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer">
                          <EyeIcon className="h-4 w-4" />
                          <span>Ver A4</span>
                        </button>
                        <button type="button" onClick={() => handleOpenEditQuote(q)} className="py-1.5 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer">
                          <PencilSquareIcon className="h-4 w-4" />
                          <span>Modificar</span>
                        </button>
                        <button type="button" onClick={() => handleSendWhatsApp(q)} className="py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer">
                          <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
                          <span>WhatsApp</span>
                        </button>
                        <button type="button" onClick={() => handleOpenEmailModal(q)} className="py-1.5 px-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>Email</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VISTA 4: DIRECTORIO DE CLIENTES */}
          {(bottomNav === 'clients' || (bottomNav === 'chats' && currentRole === 'buyer' && activeBuyerTab === 'client_directory')) && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Directorio de Clientes</h3>
                    <p className="text-xs text-slate-500">Mostrando {displayedClients.length} cliente(s)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { 
                      pushNavStep('new-client');
                      setClientForm({ 
                        empresa: '', cif: '', nombre: '', dni: '', cargo: '', residencia: 'España', 
                        email: '', email2: '', telefono1: '', telefono2: '', direccion: '', 
                        poblacion: '', codigoPostal: '', direccionEntrega: '', tipoFactura: 'Ordinaria (21%)', 
                        numeroCuenta: '', assignedCommercial: currentUser.name 
                      }); 
                      setIsClientModalOpen(true); 
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>+ Alta Cliente</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedClients.map((cli) => (
                    <div key={cli.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{cli.empresa}</h4>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">{cli.cif}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5"><strong>Contacto:</strong> {cli.nombre} · {cli.telefono1}</p>
                          <p className="text-[11px] text-indigo-600">{cli.email}</p>
                        </div>
                        <button type="button" onClick={() => handleOpenEditClient(cli)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold">
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="text-slate-700">📞 {cli.telefono1} {cli.telefono2 ? `· ${cli.telefono2}` : ''}</div>
                        <div className="text-slate-500 truncate text-[11px]">📍 {cli.direccion}, {cli.poblacion} ({cli.codigoPostal})</div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[10px]">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                          {cli.tipoFactura}
                        </span>
                        <div className="text-slate-400 text-right">
                          <span>Comercial: <strong className="text-indigo-600">{cli.assignedCommercial}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VISTA 5: CALENDARIO */}
          {bottomNav === 'calendar' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              <div className="max-w-2xl mx-auto space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Calendario de Entregas y Montajes</h3>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-center min-w-[55px]">
                      <span className="block text-[10px] font-bold uppercase">Sep</span>
                      <span className="text-lg font-black">30</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Entrega de 120 uds Válvula Inox 2"</h4>
                      <p className="text-[11px] text-slate-500">Obra Residencial Mirasierra • Plazo 48h confirmado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 6: PERFIL */}
          {bottomNav === 'profile' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4">
              <div className="max-w-md mx-auto space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Tu Perfil en r1plus</h3>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{currentUser.name}</h4>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                      <p className="text-[11px] font-bold text-indigo-600 mt-0.5">{currentUser.company}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cerrar Sesión Segura
                    </button>
                  </div>
                </div>

                {/* VINCULACIÓN DE CUENTAS */}
                {(currentRole === 'supplier_owner' || currentRole === 'buyer') && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-indigo-600">
                        🔗 Vincular Cuenta Existente
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Añade a un usuario ya registrado en r1plus como comercial de apoyo o departamento técnico de tu empresa.
                      </p>
                    </div>

                    <form onSubmit={handleLinkExistingAccount} className="space-y-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Correo electrónico de la cuenta:</label>
                        <input
                          type="email"
                          required
                          placeholder="usuario@correo.com"
                          value={linkEmailInput}
                          onChange={e => setLinkEmailInput(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Rol en la Organización:</label>
                        <select
                          value={linkRoleInput}
                          onChange={e => setLinkRoleInput(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                        >
                          {currentRole === 'supplier_owner' ? (
                            <>
                              <option value="sales_rep">Comercial de Proveedor</option>
                              <option value="supplier_owner">Codirector / Gerencia</option>
                            </>
                          ) : (
                            <>
                              <option value="client_employee">Técnico / Operativo de Campo</option>
                              <option value="buyer">Administrador / Compras</option>
                            </>
                          )}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                      >
                        Vincular Usuario a la Empresa
                      </button>
                    </form>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Miembros Asociados ({teamMembers.length})
                      </span>
                      {teamMembers.map(member => (
                        <div key={member.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <strong className="text-slate-800 block">{member.name}</strong>
                            <span className="text-[10px] text-slate-500">{member.email}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {member.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* BARRA INFERIOR */}
      <nav className="bg-white border-t border-slate-200 shrink-0 z-30 shadow-lg py-1.5 w-full">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          <button type="button" onClick={() => { pushNavStep('tab-chats'); setBottomNav('chats'); setActiveChatId(null); }} className={`flex flex-col items-center py-1 ${bottomNav === 'chats' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Chats</span>
          </button>
          <button type="button" onClick={() => { pushNavStep('tab-clients'); setBottomNav('clients'); }} className={`flex flex-col items-center py-1 ${bottomNav === 'clients' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <UserGroupIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Clientes</span>
          </button>
          <button type="button" onClick={() => { pushNavStep('tab-documents'); setBottomNav('documents'); }} className={`flex flex-col items-center py-1 ${bottomNav === 'documents' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <DocumentTextIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">{currentRole === 'supplier_owner' ? 'Catálogos' : 'Documentos'}</span>
          </button>
          <button type="button" onClick={() => { pushNavStep('tab-profile'); setBottomNav('profile'); }} className={`flex flex-col items-center py-1 ${bottomNav === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <UserIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Tú</span>
          </button>
        </div>
      </nav>

      {/* MODAL NUEVO CHAT */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-3.5 border-b flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-sm font-bold">Iniciar Nuevo Chat</h3>
              <button type="button" onClick={() => setIsNewChatModalOpen(false)} className="text-slate-400 hover:text-white"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto text-xs">
              <p className="text-slate-500 text-[11px] mb-2">Selecciona un cliente de tu directorio para abrir chat:</p>
              {endClients.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCreateNewChatWithClient(c)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 flex justify-between items-center cursor-pointer"
                >
                  <div>
                    <strong className="text-slate-900 block text-xs">{c.empresa}</strong>
                    <span className="text-[10px] text-slate-500">{c.nombre} · {c.telefono1}</span>
                  </div>
                  <span className="text-indigo-600 font-bold text-[11px]">Abrir Chat →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASO 1: SELECCIÓN DE CLIENTE */}
      {isSelectClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-3.5 border-b flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold">Paso 1: Selecciona el Cliente</h3>
              </div>
              <button type="button" onClick={() => setIsSelectClientModalOpen(false)} className="text-slate-400 hover:text-white"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto text-xs">
              <p className="text-slate-500 text-[11px]">Para emitir un presupuesto, debes vincular primero a qué cliente va dirigido:</p>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Clientes en Directorio:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {endClients.map(c => (
                    <button key={c.id} type="button" onClick={() => handleSelectClientForQuote(c)} className="w-full text-left p-2.5 rounded-xl border hover:border-indigo-500 hover:bg-indigo-50/50 flex justify-between items-center cursor-pointer">
                      <div>
                        <strong className="text-slate-900 block text-xs">{c.empresa}</strong>
                        <span className="text-[10px] text-slate-500">{c.cif} · {c.telefono1}</span>
                      </div>
                      <span className="text-indigo-600 font-bold text-[11px]">Elegir →</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t flex flex-col gap-2">
                <button type="button" onClick={() => handleSelectClientForQuote(endClients[0])} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
                  🛒 Usar Cliente Genérico / Mostrador
                </button>
                <button type="button" onClick={() => { pushNavStep('new-client'); setIsClientModalOpen(true); }} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs">
                  <PlusIcon className="h-4 w-4" />
                  <span>+ Registrar Nuevo Cliente Ahora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASO 2: CONFECCIONAR PRESUPUESTO */}
      {isQuoteEditorOpen && activeSelectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="p-3.5 border-b flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-sm font-bold">{editingQuoteId ? '✏️ Modificar Presupuesto' : '📄 Confeccionar Presupuesto'}</h3>
              <button onClick={() => setIsQuoteEditorOpen(false)} className="text-slate-400 hover:text-white"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="p-3 border-b bg-indigo-50 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Cliente Vinculado:</span>
                <strong className="text-indigo-950 block">{activeSelectedClient.empresa}</strong>
                <span className="text-[10px] text-slate-500">{activeSelectedClient.cif} · {activeSelectedClient.telefono1}</span>
              </div>
              <button type="button" onClick={() => { setIsQuoteEditorOpen(false); setIsSelectClientModalOpen(true); }} className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded-lg font-bold cursor-pointer">
                Cambiar Cliente
              </button>
            </div>
            <div className="px-3.5 py-2 border-b bg-slate-50 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600">Tipo de IVA aplicable:</span>
              <select value={quoteTaxRate} onChange={(e) => setQuoteTaxRate(Number(e.target.value))} className="rounded-lg border p-1 text-xs font-bold bg-white">
                <option value={21}>21% (General)</option>
                <option value={10}>10% (Reformas)</option>
                <option value={0}>0% (Exento)</option>
              </select>
            </div>
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-0">
              {editorLines.map((line, idx) => (
                <div key={line.id} className="bg-slate-50 p-3 rounded-xl border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Partida #{idx + 1}</span>
                    <button type="button" onClick={() => handleDeleteLine(line.id)} className="text-rose-500 font-bold text-[10px] cursor-pointer">Eliminar</button>
                  </div>
                  <input type="text" value={line.concept} onChange={(e) => handleUpdateLine(line.id, 'concept', e.target.value)} className="w-full bg-white p-2 border rounded text-xs" />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Uds/Horas</span>
                      <input type="number" min="1" value={line.quantity} onChange={(e) => handleUpdateLine(line.id, 'quantity', e.target.value)} className="w-full bg-white p-1.5 border rounded text-center font-bold text-xs" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Precio Ud. (€)</span>
                      <input type="number" step="0.01" value={line.unitPrice} onChange={(e) => handleUpdateLine(line.id, 'unitPrice', e.target.value)} className="w-full bg-white p-1.5 border rounded text-right font-bold text-xs" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total (€)</span>
                      <div className="p-1.5 bg-slate-200 rounded font-black text-right text-xs">{line.total.toFixed(2)} €</div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddLine} className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer">
                + Añadir Otra Línea de Partida
              </button>
            </div>
            <div className="p-3.5 border-t bg-white flex flex-col gap-2.5">
              <div className="flex justify-between text-xs">
                <span>Base: <strong>{calculatedSubtotal.toFixed(2)} €</strong></span>
                <span>IVA ({quoteTaxRate}%): <strong>{calculatedTaxAmount.toFixed(2)} €</strong></span>
                <span className="text-sm font-black text-indigo-700">Total: {calculatedTotalWithTax.toFixed(2)} €</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1 border-t">
                <button type="button" onClick={() => handleSaveQuoteToDatabase()} className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer">💾 Guardar</button>
                <button type="button" onClick={() => handleSendWhatsApp()} className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer">💬 WhatsApp</button>
                <button type="button" onClick={() => handleOpenEmailModal()} className="py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer">✉️ Email</button>
                <button type="button" onClick={() => handlePrintQuote()} className="py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer">🖨️ PDF / A4</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EMAIL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 space-y-3 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">📧 Enviar Presupuesto por Email</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="Email destinatario..." className="w-full p-2 border rounded" />
            <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Asunto..." className="w-full p-2 border rounded font-medium" />
            <textarea rows={4} value={emailBody} onChange={e => setEmailBody(e.target.value)} className="w-full p-2 border rounded" />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsEmailModalOpen(false)} className="px-3 py-1.5 text-slate-600 cursor-pointer">Cancelar</button>
              <button onClick={handleConfirmSendEmail} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer shadow-xs">Enviar Presupuesto</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTA CLIENTE */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between bg-slate-900 text-white">
              <h3 className="text-sm font-bold">{clientForm.id ? '✏️ Modificar Ficha de Cliente' : '📝 Alta Completa de Cliente'}</h3>
              <button type="button" onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-white"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSaveClient} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block">1. Identificación y Empresa</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input type="text" required placeholder="Razón Social / Empresa *" value={clientForm.empresa} onChange={e => setClientForm({ ...clientForm, empresa: e.target.value })} className="w-full p-2 bg-white border rounded" />
                  <input type="text" required placeholder="CIF / NIF *" value={clientForm.cif} onChange={e => setClientForm({ ...clientForm, cif: e.target.value.toUpperCase() })} className="w-full p-2 bg-white border rounded uppercase font-mono" />
                  <input type="text" required placeholder="Persona de Contacto *" value={clientForm.nombre} onChange={e => setClientForm({ ...clientForm, nombre: e.target.value })} className="w-full p-2 bg-white border rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="DNI" value={clientForm.dni} onChange={e => setClientForm({ ...clientForm, dni: e.target.value.toUpperCase() })} className="w-full p-2 bg-white border rounded uppercase font-mono" />
                    <input type="text" placeholder="Cargo" value={clientForm.cargo} onChange={e => setClientForm({ ...clientForm, cargo: e.target.value })} className="w-full p-2 bg-white border rounded" />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block">2. Contacto y Comunicaciones</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input type="email" required placeholder="Email Principal *" value={clientForm.email} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} className="w-full p-2 bg-white border rounded" />
                  <input type="email" placeholder="Email Secundario" value={clientForm.email2} onChange={e => setClientForm({ ...clientForm, email2: e.target.value })} className="w-full p-2 bg-white border rounded" />
                  <input type="tel" required placeholder="Teléfono 1 (WhatsApp) *" value={clientForm.telefono1} onChange={e => setClientForm({ ...clientForm, telefono1: e.target.value })} className="w-full p-2 bg-white border rounded font-mono" />
                  <input type="tel" placeholder="Teléfono 2" value={clientForm.telefono2} onChange={e => setClientForm({ ...clientForm, telefono2: e.target.value })} className="w-full p-2 bg-white border rounded font-mono" />
                </div>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block">3. Dirección Fiscal y de Entrega</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input type="text" required placeholder="Dirección Fiscal *" value={clientForm.direccion} onChange={e => setClientForm({ ...clientForm, direccion: e.target.value })} className="w-full p-2 bg-white border rounded sm:col-span-2" />
                  <input type="text" required placeholder="Código Postal *" value={clientForm.codigoPostal} onChange={e => setClientForm({ ...clientForm, codigoPostal: e.target.value })} className="w-full p-2 bg-white border rounded font-mono" />
                  <input type="text" required placeholder="Población *" value={clientForm.poblacion} onChange={e => setClientForm({ ...clientForm, poblacion: e.target.value })} className="w-full p-2 bg-white border rounded" />
                  <input type="text" placeholder="Dirección de Entrega" value={clientForm.direccionEntrega} onChange={e => setClientForm({ ...clientForm, direccionEntrega: e.target.value })} className="w-full p-2 bg-white border rounded sm:col-span-2" />
                </div>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block">4. Facturación e IBAN</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <select value={clientForm.tipoFactura} onChange={e => setClientForm({ ...clientForm, tipoFactura: e.target.value as any })} className="w-full p-2 bg-white border rounded font-semibold">
                    <option value="Ordinaria (21%)">Ordinaria (21%)</option>
                    <option value="Reducida (10%)">Reducida (10%)</option>
                    <option value="Inversión Sujeto Pasivo">Inversión Sujeto Pasivo</option>
                    <option value="Exenta">Exenta</option>
                  </select>
                  <select value={clientForm.residencia} onChange={e => setClientForm({ ...clientForm, residencia: e.target.value as any })} className="w-full p-2 bg-white border rounded font-semibold">
                    <option value="España">España</option>
                    <option value="Comunitaria">Unión Europea (VIES)</option>
                    <option value="Extracomunitaria">Extracomunitaria</option>
                  </select>
                  <input type="text" placeholder="IBAN Bancario" value={clientForm.numeroCuenta} onChange={e => setClientForm({ ...clientForm, numeroCuenta: e.target.value.toUpperCase() })} className="w-full p-2 bg-white border rounded font-mono uppercase" />
                </div>
              </div>

              <div className="space-y-2.5 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
                <span className="font-bold text-indigo-900 block">5. Asignación Comercial</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select value={clientForm.assignedCommercial} onChange={e => setClientForm({ ...clientForm, assignedCommercial: e.target.value })} className="w-full p-2 bg-white border rounded font-bold text-indigo-700">
                    {availableCommercials.map(comm => <option key={comm} value={comm}>{comm}</option>)}
                  </select>
                  <input type="text" readOnly value={clientForm.createdBy || currentUser.name} className="w-full p-2 bg-slate-100 border rounded font-semibold text-slate-600" />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer">Guardar Ficha de Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISOR A4 */}
      {viewingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-bold font-mono">{viewingQuote.number}</span>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold cursor-pointer">Imprimir / PDF</button>
                <button onClick={() => setViewingQuote(null)} className="text-slate-400 hover:text-white cursor-pointer"><XMarkIcon className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
              <div className="flex justify-between border-b pb-3">
                <div>
                  <h2 className="text-sm font-black text-indigo-700">{currentUser.company}</h2>
                  <p className="text-[11px] text-slate-500">CIF: B-82910293</p>
                </div>
                <div className="text-right">
                  <strong>PRESUPUESTO</strong>
                  <p className="font-mono text-indigo-600 font-bold">{viewingQuote.number}</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <strong>Cliente:</strong> {viewingQuote.clientName} ({viewingQuote.clientVat})
                <p className="text-slate-600">{viewingQuote.clientAddress}</p>
              </div>
              <div className="space-y-2">
                {viewingQuote.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between border-b pb-2">
                    <div>
                      <strong>{it.concept}</strong>
                      <span className="block text-[10px] text-slate-400">{it.quantity} uds x {it.unitPrice.toFixed(2)} €</span>
                    </div>
                    <span className="font-bold">{it.total.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t text-right space-y-1">
                <div>Base: <strong>{viewingQuote.subtotal.toFixed(2)} €</strong></div>
                <div>IVA ({viewingQuote.taxRate}%): <strong>{viewingQuote.taxAmount.toFixed(2)} €</strong></div>
                <div className="text-sm font-black text-indigo-700">Total: {viewingQuote.totalWithTax.toFixed(2)} €</div>
              </div>
              <div className="mt-4 pt-3 border-t bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-500 space-y-1">
                <span className="font-bold uppercase text-slate-700 block">Trazabilidad de Eventos:</span>
                {viewingQuote.events?.map(ev => (
                  <div key={ev.id} className="flex justify-between">
                    <span>• {ev.description} ({ev.userName})</span>
                    <span className="font-mono text-slate-400">{ev.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PRODUCTO */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 text-xs space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold">Añadir Producto</h3>
              <button onClick={() => setIsAddProductModalOpen(false)} className="text-slate-400 cursor-pointer"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSaveSingleProduct} className="space-y-2.5">
              <input type="text" required placeholder="SKU *" value={newProductForm.sku} onChange={e => setNewProductForm({ ...newProductForm, sku: e.target.value })} className="w-full p-2 border rounded font-mono" />
              <input type="text" required placeholder="Nombre *" value={newProductForm.name} onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })} className="w-full p-2 border rounded" />
              <input type="number" step="0.01" required placeholder="Precio *" value={newProductForm.price} onChange={e => setNewProductForm({ ...newProductForm, price: e.target.value })} className="w-full p-2 border rounded font-bold" />
              <select value={newProductForm.assignedTo} onChange={e => setNewProductForm({ ...newProductForm, assignedTo: e.target.value })} className="w-full p-2 border rounded font-bold text-indigo-700 bg-white">
                {availableCommercials.map(comm => <option key={comm} value={comm}>{comm}</option>)}
              </select>
              <div className="pt-2 flex justify-end gap-2 border-t">
                <button type="button" onClick={() => setIsAddProductModalOpen(false)} className="px-3 py-1 bg-slate-100 rounded cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-1 bg-indigo-600 text-white font-bold rounded cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUBIR PDF */}
      {isAddPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 text-xs space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold">Subir Catálogo PDF</h3>
              <button onClick={() => setIsAddPdfModalOpen(false)} className="text-slate-400 cursor-pointer"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSavePdfCatalog} className="space-y-2.5">
              <input type="text" required placeholder="Título del PDF *" value={newPdfTitle} onChange={e => setNewPdfTitle(e.target.value)} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Versión (ej: v2.0)" value={newPdfVersion} onChange={e => setNewPdfVersion(e.target.value)} className="w-full p-2 border rounded" />
              <select value={newPdfAssignedTo} onChange={e => setNewPdfAssignedTo(e.target.value)} className="w-full p-2 border rounded font-bold text-indigo-700 bg-white">
                {availableCommercials.map(comm => <option key={comm} value={comm}>{comm}</option>)}
              </select>
              <div className="pt-2 flex justify-end gap-2 border-t">
                <button type="button" onClick={() => setIsAddPdfModalOpen(false)} className="px-3 py-1 bg-slate-100 rounded cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-1 bg-indigo-600 text-white font-bold rounded cursor-pointer">Subir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATÁLOGO DRAWER */}
      {isCatalogDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold">Catálogo Oficial</h3>
              <button onClick={() => setIsCatalogDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {officialProducts.map(prod => (
                <div key={prod.id} className="border rounded-xl p-3 bg-white flex justify-between items-center shadow-2xs">
                  <div>
                    <h4 className="text-xs font-bold">{prod.name}</h4>
                    <p className="text-[10px] text-slate-400">Ref: {prod.sku} · {prod.price.toFixed(2)} €</p>
                  </div>
                  <button type="button" onClick={() => handleShareProductToChat(prod)} className="p-1.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold cursor-pointer">
                    Compartir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}