// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface DocumentsViewProps {
  user: any;
}

export default function DocumentsView({ user }: DocumentsViewProps) {
  const [docTab, setDocTab] = useState<'presupuestos' | 'facturas' | 'ordenes' | 'clientes'>('presupuestos');
  
  const [budgets, setBudgets] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [allAttachments, setAllAttachments] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [crmSearchQuery, setCrmSearchQuery] = useState('');

  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showCatalogItemModal, setShowCatalogItemModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  const [activeWorkOrder, setActiveWorkOrder] = useState<any | null>(null);
  const [woExpenses, setWoExpenses] = useState<any[]>([]);
  const [woAttachments, setWoAttachments] = useState<any[]>([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | ''>('');
  const [woTab, setWoTab] = useState<'info' | 'gastos' | 'archivos'>('info');

  // PRESUPUESTOS Y DATOS DEL CLIENTE
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null); // NUEVO: Para saber si creamos o editamos
  const [bCode, setBCode] = useState('');
  const [bWorkOrderRef, setBWorkOrderRef] = useState('');
  const [bValidUntil, setBValidUntil] = useState('');
  
  // Control inteligente del cliente
  const [bClientId, setBClientId] = useState<string | null>(null);
  const [bClient, setBClient] = useState('');
  const [bCif, setBCif] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bContact, setBContact] = useState('');
  const [bBankAccount, setBBankAccount] = useState(''); // NUEVO: Cuenta bancaria
  const [bItems, setBItems] = useState<Array<{ desc: string; qty: number; price: number }>>([{ desc: '', qty: 1, price: 0 }]);

  const [showAdvancedClientFields, setShowAdvancedClientFields] = useState(false); // NUEVO: Plegar/desplegar datos del cliente
  const [isScanning, setIsScanning] = useState(false);

  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatPrice, setNewCatPrice] = useState<number>(0);

  const [showCrmModal, setShowCrmModal] = useState(false);
  const [crmTab, setCrmTab] = useState<'datos' | 'historial'>('datos');
  const [crmForm, setCrmForm] = useState({
    id: null, name: '', phone: '', email: '', cif: '', address: '', street: '', street_number: '', postal_code: '', population: '', city: '', country: 'España', company: '', company_cif: '', company_address: '', company_phone: '', admin_contact: '', admin_email: '', bank_account: ''
  });

  const [sharingDocument, setSharingDocument] = useState<any | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState({ show: false, budget: null as any, percentage: 100 });
  const [restInvoiceModal, setRestInvoiceModal] = useState({ show: false, budget: null as any, items: [] as any[], alreadyInvoicedSubtotal: 0, activeItemIndex: null as number | null });
  const [paymentModal, setPaymentModal] = useState({ show: false, invoice: null as any, method: 'Transferencia Bancaria' });

  const [storageUsedMB, setStorageUsedMB] = useState<number>(0);

  const docPressTimer = useRef<any>(null);
  const isDocLongPress = useRef(false);

  const isManager = user.role === 'admin' || user.role === 'supplier_owner' || user.role === 'gerente';

  const generateNextBudgetCode = (budgetList = budgets) => {
    const currentYear = new Date().getFullYear();
    const prefix = `PRE-${currentYear}`;
    const yearBudgets = budgetList.filter(b => b.code && b.code.startsWith(prefix));
    let nextNum = 1;
    if (yearBudgets.length > 0) {
      const numbers = yearBudgets.map(b => {
        const numPart = b.code.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        return isNaN(parsed) ? 0 : parsed;
      });
      nextNum = Math.max(...numbers) + 1;
    }
    return `${prefix}${String(nextNum).padStart(2, '0')}`;
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);

      let bQ = supabase.from('budgets').select('*').order('created_at', { ascending: false });
      let cQ = supabase.from('clients').select('*').order('name', { ascending: true });
      let iQ = supabase.from('items_catalog').select('*').order('description', { ascending: true });
      let oQ = supabase.from('work_orders').select('*').order('created_at', { ascending: false });
      let expQ = supabase.from('work_expenses').select('*');
      let attQ = supabase.from('attachments').select('*');

      if (!isManager) {
        bQ = bQ.eq('user_id', user.id);
        cQ = cQ.eq('user_id', user.id);
        iQ = iQ.eq('user_id', user.id);
        oQ = oQ.eq('user_id', user.id);
      }

      const [resBudgets, resClients, resCatalog, resOrders, resExp, resAtt] = await Promise.all([bQ, cQ, iQ, oQ, expQ, attQ]);
      if (resClients.data) setCrmClients(resClients.data);
      if (resBudgets.data) {
        setBudgets(resBudgets.data);
        setBCode(generateNextBudgetCode(resBudgets.data));
      }
      if (resCatalog.data) setCatalogItems(resCatalog.data);
      if (resOrders.data) setWorkOrders(resOrders.data);
      if (resExp.data) setAllExpenses(resExp.data);
      if (resAtt.data) setAllAttachments(resAtt.data);

      await calculateStorageSize();
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally { 
      setIsLoading(false); 
    }
  };

  const calculateStorageSize = async () => {
    try {
      let totalBytes = 0;
      const getFolderBytes = async (prefix = '') => {
        const { data: list, error } = await supabase.storage.from('chat_attachments').list(prefix, { limit: 100 });
        if (error || !list) return;
        for (const item of list) {
          if (!item.id) {
            const subPrefix = prefix ? `${prefix}/${item.name}` : item.name;
            await getFolderBytes(subPrefix);
          } else {
            totalBytes += item.metadata?.size || 0;
          }
        }
      };
      await getFolderBytes('');
      setStorageUsedMB(Number((totalBytes / (1024 * 1024)).toFixed(2)));
    } catch (e) {
      console.warn('Error calculando storage:', e);
    }
  };

  const resetBudgetForm = () => {
    setEditingBudgetId(null);
    setBCode(generateNextBudgetCode(budgets));
    setBClientId(null);
    setBClient('');
    setBCif('');
    setBAddress('');
    setBEmail('');
    setBPhone('');
    setBContact('');
    setBBankAccount('');
    setBWorkOrderRef('');
    setBValidUntil('');
    setBItems([{ desc: '', qty: 1, price: 0 }]);
    setShowAdvancedClientFields(false); // Colapsar por defecto
  };

  // NUEVO: Permite abrir el modal con los datos de un presupuesto ya guardado
  const handleOpenAddBudget = (budgetToEdit: any = null) => {
    if (budgetToEdit && budgetToEdit.id) {
      setEditingBudgetId(budgetToEdit.id);
      setBCode(budgetToEdit.code);
      setBWorkOrderRef(budgetToEdit.work_order_ref || '');
      setBValidUntil(budgetToEdit.valid_until || '');
      setBClient(budgetToEdit.client || '');
      setBCif(budgetToEdit.client_cif || '');
      setBAddress(budgetToEdit.address || '');
      
      // Buscar cliente en CRM para rellenar los datos extra
      const foundClient = crmClients.find(c => c.name === budgetToEdit.client || (c.company && `${c.name} (${c.company})` === budgetToEdit.client) || c.cif === budgetToEdit.client_cif);
      setBClientId(foundClient ? foundClient.id : null);
      setBEmail(foundClient?.email || foundClient?.admin_email || '');
      setBPhone(foundClient?.phone || foundClient?.company_phone || '');
      setBContact(foundClient?.admin_contact || '');
      setBBankAccount(foundClient?.bank_account || '');
      
      setBItems(budgetToEdit.items && budgetToEdit.items.length > 0 ? budgetToEdit.items : [{ desc: '', qty: 1, price: 0 }]);
      setShowAdvancedClientFields(false); // Colapsado por defecto para vista rápida
    } else {
      resetBudgetForm();
    }
    setShowAddBudgetModal(true);
  };

  const handleScanWorkOrder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onerror = () => {
          alert('❌ El navegador no puede procesar esta foto. Si es un archivo HEIC, usa la cámara en su lugar.');
          setIsScanning(false);
          e.target.value = '';
        };

        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1000;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 35000);

            const response = await fetch('/api/scan-work-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: compressedBase64 }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Error ${response.status}`);
            }

            const data = await response.json();

            // Mapeo inteligente con el CRM después del escaneo
            let foundClient = null;
            if (data.client_name) {
              foundClient = crmClients.find(c => 
                c.name?.toLowerCase().includes(data.client_name.toLowerCase()) || 
                (c.company && c.company.toLowerCase().includes(data.client_name.toLowerCase())) ||
                (data.client_phone && c.phone && c.phone.includes(data.client_phone))
              );
            }

            if (foundClient) {
              setBClientId(foundClient.id);
              setBClient(foundClient.company ? `${foundClient.name} (${foundClient.company})` : foundClient.name);
              setBCif(foundClient.cif || foundClient.company_cif || data.client_cif || '');
              setBAddress(foundClient.address || data.client_address || '');
              setBPhone(foundClient.phone || foundClient.company_phone || data.client_phone || '');
              setBEmail(foundClient.email || foundClient.admin_email || '');
              setBContact(foundClient.admin_contact || data.client_contact || '');
              setBBankAccount(foundClient.bank_account || data.client_bank || '');
            } else {
              setBClientId(null);
              if (data.client_name) setBClient(data.client_name);
              if (data.client_address) setBAddress(data.client_address);
              if (data.client_phone) setBPhone(data.client_phone);
              if (data.client_contact) setBContact(data.client_contact);
              if (data.client_bank) setBBankAccount(data.client_bank);
            }

            if (data.work_order_ref) setBWorkOrderRef(data.work_order_ref);
            
            if (data.items && data.items.length > 0) {
              const parsedItems = data.items.map((i: any) => ({
                desc: i.description || '',
                qty: Number(i.quantity) || 1,
                price: Number(i.price) || 0
              }));
              setBItems(parsedItems);
            }

            // Desplegar datos si la IA extrajo algo extra para que el usuario lo vea
            if (data.client_address || data.client_bank || data.client_contact) {
              setShowAdvancedClientFields(true);
            }

            alert('✅ ¡Datos extraídos por IA! Por favor revisa y ajusta la información.');
          } catch (err: any) {
            if (err.name === 'AbortError') {
              alert('❌ Tiempo agotado. La IA tardó demasiado en responder.');
            } else {
              alert('❌ La IA detectó un error: ' + err.message);
            }
          } finally {
            setIsScanning(false);
            e.target.value = '';
          }
        };
      };
    } catch (err: any) {
      alert('❌ Error al cargar la foto: ' + err.message);
      setIsScanning(false);
      e.target.value = '';
    }
  };

  const handleClientInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; 
    setBClient(val);
    setBClientId(null);
    
    if (val.trim().length > 0) {
      setFilteredSuggestions(crmClients.filter(c => 
        (c.name && c.name.toLowerCase().includes(val.toLowerCase())) || 
        (c.company && c.company.toLowerCase().includes(val.toLowerCase())) ||
        (c.phone && c.phone.includes(val))
      ));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (cli: any) => {
    setBClientId(cli.id);
    setBClient(cli.company ? `${cli.name} (${cli.company})` : cli.name); 
    setBCif(cli.cif || cli.company_cif || ''); 
    setBAddress(cli.address || ''); 
    setBEmail(cli.email || cli.admin_email || ''); 
    setBPhone(cli.phone || cli.company_phone || '');
    setBContact(cli.admin_contact || '');
    setBBankAccount(cli.bank_account || '');
    setShowSuggestions(false);
  };

  const getFilteredCatalog = (desc: string) => desc.trim() ? catalogItems.filter(c => c.description.toLowerCase().includes(desc.toLowerCase())) : [];
  const handleAddItemRow = () => setBItems(prev => [...prev, { desc: '', qty: 1, price: 0 }]);
  const calculatedSubtotal = bItems.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);
  const calculatedTotal = calculatedSubtotal * 1.21;

  // =========================================================================
  // GUARDAR PRESUPUESTO + ACTUALIZAR FICHA CRM
  // =========================================================================
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalClientId = bClientId;

      // 1. Guardado en el CRM
      if (!bClientId && bClient.trim() !== '') {
        const newClientPayload = {
          name: bClient, cif: bCif, address: bAddress, email: bEmail, phone: bPhone, admin_contact: bContact, bank_account: bBankAccount, user_id: user.id
        };
        const { data: newCli } = await supabase.from('clients').insert([newClientPayload]).select();
        if (newCli) {
          finalClientId = newCli[0].id;
          setCrmClients(prev => [...prev, newCli[0]]);
        }
      } else if (bClientId) {
        const original = crmClients.find(c => c.id === bClientId);
        if (original) {
          const originalName = original.company ? `${original.name} (${original.company})` : original.name;
          const originalCif = original.cif || original.company_cif || '';
          const originalAddress = original.address || '';
          const originalEmail = original.email || original.admin_email || '';
          const originalPhone = original.phone || original.company_phone || '';
          const originalContact = original.admin_contact || '';
          const originalBank = original.bank_account || '';

          if (bClient !== originalName || bCif !== originalCif || bAddress !== originalAddress || bEmail !== originalEmail || bPhone !== originalPhone || bContact !== originalContact || bBankAccount !== originalBank) {
            const wantToUpdate = window.confirm('Has modificado los datos de este cliente en el formulario.\n\n¿Quieres guardar estos cambios permanentemente en su ficha del CRM?');
            
            if (wantToUpdate) {
              const updatePayload = {
                name: bClient.includes('(') ? bClient.split(' (')[0].trim() : bClient,
                cif: bCif,
                address: bAddress,
                email: bEmail,
                phone: bPhone,
                admin_contact: bContact,
                bank_account: bBankAccount
              };
              const { data: updatedCli } = await supabase.from('clients').update(updatePayload).eq('id', bClientId).select();
              if (updatedCli) {
                setCrmClients(prev => prev.map(c => c.id === bClientId ? updatedCli[0] : c));
              }
            }
          }
        }
      }

      // 2. Guardado del Presupuesto (Insertar o Actualizar)
      const budgetPayload = {
        code: bCode, work_order_ref: bWorkOrderRef, client: bClient, client_cif: bCif, address: bAddress, valid_until: bValidUntil,
        subtotal: calculatedSubtotal, vat: calculatedSubtotal * 0.21, total: calculatedTotal, pdf_name: `${bCode}.pdf`, items: bItems, 
        user_id: user.id, status: editingBudgetId ? budgets.find(b=>b.id===editingBudgetId)?.status || 'pendiente' : 'pendiente', type: 'presupuesto'
      };

      if (editingBudgetId) {
        const { data, error } = await supabase.from('budgets').update(budgetPayload).eq('id', editingBudgetId).select();
        if (error) throw error;
        if (data) {
          setBudgets(prev => prev.map(b => b.id === editingBudgetId ? data[0] : b));
          setShowAddBudgetModal(false);
          resetBudgetForm();
        }
      } else {
        const { data, error } = await supabase.from('budgets').insert([budgetPayload]).select();
        if (error) throw error;
        if (data) {
          setBudgets(prev => [data[0], ...prev]);
          setShowAddBudgetModal(false);
          resetBudgetForm();
        }
      }
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  const handleAcceptBudget = async (budget: any) => {
    if (!confirm(`¿Aceptar presupuesto de ${budget.client}?`)) return;
    try {
      await supabase.from('budgets').update({ status: 'aceptado' }).eq('id', budget.id);
      const { data: woData } = await supabase.from('work_orders').insert([{ 
        budget_id: budget.id, 
        client_name: budget.client, 
        work_order_ref: budget.work_order_ref || `Obra-${budget.code}`,
        status: 'en_curso', 
        user_id: user.id 
      }]).select();
      
      setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, status: 'aceptado' } : b));
      if (woData) setWorkOrders(prev => [woData[0], ...prev]);
      alert('¡Presupuesto Aceptado! Orden generada con referencia: ' + (budget.work_order_ref || budget.code));
      setDocTab('ordenes');
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  const handleRejectBudget = async (id: string) => {
    try {
      await supabase.from('budgets').update({ status: 'rechazado' }).eq('id', id);
      setBudgets(prev => prev.map(b => b.id === id ? { ...b, status: 'rechazado' } : b));
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  const handleSaveCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await supabase.from('items_catalog').insert([{ description: newCatDesc, price: newCatPrice, user_id: user.id }]).select();
      if (data) { setCatalogItems(prev => [...prev, data[0]]); setShowCatalogItemModal(false); setNewCatDesc(''); setNewCatPrice(0); }
    } catch (err: any) {}
  };

  const handleGeneratePdfAction = async (docData: any, method: 'whatsapp' | 'email' | 'download') => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const isFactura = docData.type === 'factura';

      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); 
      doc.text(isFactura ? 'FACTURA' : 'PRESUPUESTO', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Código: ${docData.code}`, 14, 28);
      if (docData.work_order_ref) doc.text(`Ref. Obra: ${docData.work_order_ref}`, 14, 34);
      doc.text(`Fecha: ${new Date(docData.created_at).toLocaleDateString()}`, 14, docData.work_order_ref ? 40 : 34);

      if (isFactura && docData.status === 'cobrada') {
        doc.setTextColor(16, 185, 129);
        doc.text(`ESTADO: COBRADA (${docData.payment_method})`, 14, 46);
      } else if (isFactura) {
        doc.setTextColor(245, 158, 11);
        doc.text(`ESTADO: PENDIENTE DE PAGO`, 14, 46);
      }

      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Datos del Cliente:', 120, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(docData.client || 'Cliente', 120, 28);
      if(docData.client_cif) doc.text(`CIF/NIF: ${docData.client_cif}`, 120, 34);
      if(docData.address) {
        const addressLines = doc.splitTextToSize(docData.address, 70);
        doc.text(addressLines, 120, 40);
      }

      const itemsList = docData.items || [];
      const tableData = itemsList.map((item: any) => [
        item.desc, item.qty, `${Number(item.price).toFixed(2)} €`, `${(Number(item.qty) * Number(item.price)).toFixed(2)} €`
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Subtotal: ${Number(docData.subtotal).toFixed(2)} €`, 130, finalY);
      doc.text(`IVA (21%): ${Number(docData.vat).toFixed(2)} €`, 130, finalY + 6);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`TOTAL: ${Number(docData.total).toFixed(2)} €`, 130, finalY + 14);

      if (method === 'download') {
        doc.save(`${docData.code}.pdf`);
      } else {
        const pdfBlob = doc.output('blob');
        const cleanClientName = (docData.client || 'Sin_Cliente').replace(/[^a-zA-Z0-9]/g, '_');
        const projectId = docData.parent_id || docData.id;
        const fileName = `clientes_crm/${cleanClientName}/proyecto_${projectId}/${docData.code}.pdf`;
        
        const { error: uploadError } = await supabase.storage.from('chat_attachments').upload(fileName, pdfBlob, { 
          contentType: 'application/pdf',
          upsert: true
        });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('chat_attachments').getPublicUrl(fileName);
        const pdfUrl = publicUrlData.publicUrl;

        const docName = isFactura ? 'la factura' : 'el presupuesto';
        const message = `Hola! Aquí tienes ${docName} ${docData.code}.\n\nPuedes descargarlo en PDF oficial desde este enlace seguro:\n${pdfUrl}\n\nUn saludo.`;

        const clientData = crmClients.find(c => docData.client.includes(c.name));
        
        if (method === 'whatsapp') {
          let phone = clientData?.phone || clientData?.company_phone || '';
          phone = phone.replace(/\D/g, ''); 
          const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
          window.open(waUrl, '_blank');
        } else if (method === 'email') {
          const email = clientData?.email || clientData?.admin_email || '';
          window.location.href = `mailto:${email}?subject=${isFactura ? 'Factura' : 'Presupuesto'} ${docData.code}&body=${encodeURIComponent(message)}`;
        }
      }
      calculateStorageSize();
    } catch (err: any) {
      alert('Error generando PDF: ' + err.message);
    } finally {
      setIsGeneratingPdf(false);
      setSharingDocument(null);
    }
  };

  const filteredBudgets = budgets.filter(b => docTab === 'presupuestos' ? b.type !== 'factura' && b.code.startsWith('PRE') : b.type === 'factura' || b.code.startsWith('FAC'));
  const filteredCrmList = crmClients.filter(c => {
    if (!crmSearchQuery.trim()) return true;
    const q = crmSearchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q)) || (c.company && c.company.toLowerCase().includes(q)) ||
      (c.cif && c.cif.toLowerCase().includes(q)) || (c.city && c.city.toLowerCase().includes(q)) || (c.population && c.population.toLowerCase().includes(q))
    );
  });

  const stats = {
    presupuestado: budgets.filter(b => b.type === 'presupuesto').reduce((acc, b) => acc + Number(b.total || 0), 0),
    aceptado: budgets.filter(b => b.type === 'presupuesto' && (b.status === 'aceptado' || b.status === 'parcialmente_facturado' || b.status === 'facturado')).reduce((acc, b) => acc + Number(b.total || 0), 0),
    facturado: budgets.filter(b => b.type === 'factura').reduce((acc, b) => acc + Number(b.total || 0), 0),
    pendiente: budgets.filter(b => b.type === 'factura' && b.status !== 'cobrada').reduce((acc, b) => acc + Number(b.total || 0), 0),
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm h-full flex flex-col overflow-hidden relative">
      
      {isGeneratingPdf && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center rounded-2xl">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
          <p className="font-bold text-slate-800 text-sm">Procesando PDF oficial...</p>
        </div>
      )}

      {/* CABECERA CON BOTONES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div><h2 className="text-xl font-black text-slate-800">📁 Panel FSM & CRM</h2></div>
        <div className="flex flex-wrap gap-2">
          {docTab === 'clientes' ? (
            <button onClick={openNewCrmModal} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition">+ Alta Cliente</button>
          ) : (
            <>
              <button onClick={() => setShowStatsModal(true)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold shadow-md hover:bg-slate-900 transition">📊 Estadísticas</button>
              <button onClick={() => setShowCatalogItemModal(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border hover:bg-slate-200 transition">+ Partida</button>
              <button onClick={() => handleOpenAddBudget(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition">+ Presupuesto</button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar shrink-0">
        <button onClick={() => setDocTab('presupuestos')} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${docTab === 'presupuestos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Presupuestos</button>
        <button onClick={() => setDocTab('facturas')} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${docTab === 'facturas' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>Facturas</button>
        <button onClick={() => setDocTab('ordenes')} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${docTab === 'ordenes' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>🛠️ Órdenes</button>
        <button onClick={() => setDocTab('clientes')} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ml-auto border ${docTab === 'clientes' ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-700 hover:bg-slate-100 border-slate-300'}`}>👥 CRM Clientes</button>
      </div>

      {docTab === 'clientes' && (
        <div className="shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, teléfono, empresa, CIF, ciudad..."
              value={crmSearchQuery}
              onChange={e => setCrmSearchQuery(e.target.value)}
              className="w-full p-2.5 pl-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-sm transition"
            />
            {crmSearchQuery && (
              <button onClick={() => setCrmSearchQuery('')} className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        {isLoading ? <div className="text-center py-6 text-slate-400 text-sm font-medium">Sincronizando...</div> : docTab === 'clientes' ? (
          filteredCrmList.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">
              {crmSearchQuery ? 'No se encontraron clientes para esta búsqueda.' : 'No hay clientes en el CRM.'}
            </div>
          ) : (
            filteredCrmList.map(client => (
              <div 
                key={client.id} 
                onClick={() => openEditCrmModal(client)}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-400 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-800 text-sm truncate">{client.name}</h4>
                    <p className="text-xs font-medium text-slate-500 truncate">
                      {client.company || 'Particular'} · {client.phone} {client.city ? `· ${client.city}` : ''}
                    </p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); openEditCrmModal(client); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition w-full sm:w-auto">Abrir Ficha</button>
              </div>
            ))
          )
        ) : docTab === 'ordenes' ? (
          workOrders.filter(wo => wo.status === 'en_curso').length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-300">No hay órdenes de obra en ejecución.</div>
          ) : (
            workOrders.filter(wo => wo.status === 'en_curso').map(order => (
              <div 
                key={order.id} 
                onClick={() => openWorkOrderPanel(order)}
                className="p-4 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:shadow-md transition rounded-xl flex items-center justify-between gap-4 shadow-sm cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🏗️</span>
                    <span className="font-black text-slate-800 text-sm truncate">{order.client_name}</span>
                  </div>
                  <div className="text-xs text-indigo-700 font-bold truncate">
                    Ref. Obra: <span className="font-mono text-slate-800">{order.work_order_ref || 'Sin referencia'}</span>
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                    En Ejecución
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); openWorkOrderPanel(order); }} 
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-md transition shrink-0"
                >
                  Abrir Obra
                </button>
              </div>
            ))
          )
        ) : (
          filteredBudgets.map(b => (
            <div 
              key={b.id} 
              onMouseDown={() => handleDocPressStart(b)}
              onMouseUp={handleDocPressEnd}
              onMouseLeave={handleDocPressEnd}
              onTouchStart={() => handleDocPressStart(b)}
              onTouchEnd={handleDocPressEnd}
              onTouchMove={handleDocPressEnd}
              onClick={() => {
                // Hacer click abre el modo edición si es presupuesto pendiente
                if (b.type === 'presupuesto' && (!b.status || b.status === 'pendiente')) {
                  handleOpenAddBudget(b);
                }
              }}
              className={`p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 relative overflow-hidden transition select-none ${b.type === 'presupuesto' && (!b.status || b.status === 'pendiente') ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md' : ''} ${b.status === 'cobrada' ? 'border-emerald-300 bg-emerald-50/20' : ''}`}
            >
              {b.status === 'aceptado' && <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>}
              {b.status === 'rechazado' && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>}
              {b.status === 'cobrada' && <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>}
              {(b.status === 'pendiente' || !b.status) && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>}
              {b.status === 'pendiente_cobro' && <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>}
              {b.status === 'parcialmente_facturado' && <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500"></div>}
              
              <div className="flex justify-between items-center pl-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{docTab === 'presupuestos' ? '📄' : '🧾'}</span>
                  <div>
                    <div className="font-black text-slate-800 text-sm">{b.code}</div>
                    {b.work_order_ref && (
                      <div className="text-[11px] font-bold text-indigo-600">Ref: {b.work_order_ref}</div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{b.client}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-indigo-600 text-base">{Number(b.total).toFixed(2)} €</span>
                  {b.status === 'cobrada' && <div className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">Pagada: {b.payment_method}</div>}
                  {b.status === 'pendiente_cobro' && <div className="text-[9px] font-bold text-orange-500 uppercase mt-0.5">Pendiente Cobro</div>}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 pl-2">
                <button onClick={(e) => { e.stopPropagation(); setSharingDocument(b); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 transition text-white rounded-lg text-[11px] font-bold shadow-md mr-auto">📤 Enviar PDF</button>
                {docTab === 'presupuestos' && (b.status === 'pendiente' || !b.status) && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenAddBudget(b); }} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 transition text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-200">✏️ Editar</button>
                    <button onClick={(e) => { e.stopPropagation(); handleRejectBudget(b.id); }} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 transition text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200">Rechazar</button>
                    <button onClick={(e) => { e.stopPropagation(); handleAcceptBudget(b); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-lg text-[11px] font-bold shadow-md">Aceptar Obra</button>
                  </>
                )}
                {docTab === 'presupuestos' && b.status === 'aceptado' && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setDocTab('ordenes'); }} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 transition text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200">🛠️ Ver Obra</button>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenInvoiceModal(b); }} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg text-[11px] font-bold shadow-md">🧾 Facturar</button>
                  </>
                )}
                {docTab === 'presupuestos' && b.status === 'parcialmente_facturado' && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenRestInvoiceModal(b); }} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 transition text-white rounded-lg text-[11px] font-bold shadow-md">🧾 Facturar Resto</button>
                  </>
                )}
                {docTab === 'facturas' && (
                  <>
                    {b.status !== 'cobrada' && (
                      <button onClick={(e) => { e.stopPropagation(); handleOpenPaymentModal(b); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-lg text-[11px] font-bold shadow-sm">💶 Cobrar</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleRevertToBudget(b); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition text-slate-700 rounded-lg text-[11px] font-bold border border-slate-300">🔄 Volver a Presup.</button>
                    <button onClick={(e) => { e.stopPropagation(); handleGeneratePdfAction(b, 'download'); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition text-slate-700 rounded-lg text-[11px] font-bold shadow-sm">⬇️ PDF</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CREADOR/EDITOR DE PRESUPUESTO */}
      {showAddBudgetModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto animate-in zoom-in-95">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 shrink-0 gap-3">
              <h3 className="font-black text-lg text-slate-800">
                {editingBudgetId ? '✏️ Editar Presupuesto' : '📄 Creador de Presupuesto'}
              </h3>
              <div className="flex items-center gap-2">
                {isScanning ? (
                  <span className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-black shadow-sm">
                    ⏳ Analizando Imagen...
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <label className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-black cursor-pointer hover:bg-emerald-100 transition flex items-center gap-1 shadow-sm" title="Hacer foto nueva">
                      📸 Cámara
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanWorkOrder} />
                    </label>
                    <label className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-black cursor-pointer hover:bg-indigo-100 transition flex items-center gap-1 shadow-sm" title="Elegir de la galería">
                      🖼️ Galería
                      <input type="file" accept="image/*" className="hidden" onChange={handleScanWorkOrder} />
                    </label>
                  </div>
                )}
                <button type="button" onClick={() => setShowAddBudgetModal(false)} className="w-8 h-8 ml-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition">✕</button>
              </div>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
              
              {/* DATOS DEL CLIENTE INTEGRALES Y COLAPSABLES */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                  <h4 className="font-black text-indigo-700 text-xs uppercase tracking-widest">Datos del Cliente</h4>
                  <div className="flex items-center gap-2">
                    {bClientId ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">✅ Vinculado a CRM</span>
                    ) : (
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">🆕 Nuevo Cliente</span>
                    )}
                    <button type="button" onClick={() => setShowAdvancedClientFields(!showAdvancedClientFields)} className="text-[9px] bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold hover:bg-slate-300 transition">
                      {showAdvancedClientFields ? 'Colapsar ▲' : '✏️ Editar Datos Completos ▼'}
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block font-bold text-slate-600 mb-1 text-[10px] uppercase">Nombre o Empresa *</label>
                  <input 
                    type="text" required 
                    placeholder="Escribe para buscar un cliente existente o escanea un parte..." 
                    value={bClient} 
                    onChange={handleClientInput} 
                    onFocus={() => bClient.trim() && setShowSuggestions(true)} 
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 font-bold outline-none transition" 
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-[60px] z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredSuggestions.map(cli => (
                        <div key={cli.id} onMouseDown={() => handleSelectSuggestion(cli)} className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 font-bold transition flex justify-between items-center">
                          <span>{cli.company ? `${cli.name} (${cli.company})` : cli.name}</span>
                          <span className="text-slate-400 font-normal">{cli.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* VISTA RÁPIDA (Resumen si está colapsado y hay datos) */}
                {!showAdvancedClientFields && (bCif || bPhone || bAddress || bEmail || bBankAccount) && (
                  <div className="text-[10px] text-slate-500 font-medium bg-white p-2.5 rounded border border-slate-200">
                    {bCif && <span className="mr-3"><strong>CIF:</strong> {bCif}</span>}
                    {bPhone && <span className="mr-3"><strong>Tel:</strong> {bPhone}</span>}
                    {bEmail && <span className="mr-3"><strong>Email:</strong> {bEmail}</span>}
                    {bContact && <span className="mr-3"><strong>Contacto:</strong> {bContact}</span>}
                    {bBankAccount && <span className="mr-3"><strong>IBAN:</strong> {bBankAccount}</span>}
                    {bAddress && <div className="mt-1 truncate"><strong>Dir:</strong> {bAddress}</div>}
                  </div>
                )}

                {/* CAMPOS AVANZADOS (Desplegables) */}
                {showAdvancedClientFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 text-[10px] uppercase">CIF / NIF</label>
                      <input type="text" value={bCif} onChange={e => setBCif(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none transition font-mono" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 text-[10px] uppercase">Teléfono</label>
                      <input type="tel" value={bPhone} onChange={e => setBPhone(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none transition font-mono" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1 text-[10px] uppercase">Correo Electrónico</label>
                      <input type="email" value={bEmail} onChange={e => setBEmail(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none transition" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 text-[10px] uppercase">Persona de Contacto</label>
                      <input type="text" placeholder="Ej. Juan, Marta..." value={bContact} onChange={e => setBContact(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none transition" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 text-[10px] uppercase">Cuenta Bancaria (IBAN)</label>
                      <input type="text" placeholder="ESXX XXXX XXXX..." value={bBankAccount} onChange={e => setBBankAccount(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none transition font-mono" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1 text-[10px] uppercase">Dirección Completa</label>
                      <input type="text" value={bAddress} onChange={e => setBAddress(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none transition" />
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN DEL PROYECTO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[10px] uppercase">Código Presupuesto</label>
                  <input type="text" readOnly value={bCode} className="w-full p-2.5 border border-slate-300 bg-slate-100 rounded-lg font-bold font-mono text-slate-700 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-indigo-700 mb-1 text-[10px] uppercase">Referencia de Obra *</label>
                  <input type="text" required placeholder="Ej. Reforma Cocina" value={bWorkOrderRef} onChange={e => setBWorkOrderRef(e.target.value)} className="w-full p-2.5 border-2 border-indigo-200 bg-indigo-50/30 rounded-lg font-bold focus:border-indigo-600 focus:outline-none transition" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[10px] uppercase">Validez hasta</label>
                  <input type="date" value={bValidUntil} onChange={e => setBValidUntil(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:border-indigo-500 focus:outline-none transition" />
                </div>
              </div>

              {/* PARTIDAS DEL PRESUPUESTO */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-800">Partidas y Materiales</h4>
                  <button type="button" onClick={handleAddItemRow} className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold hover:bg-indigo-100 transition">+ Línea</button>
                </div>
                {bItems.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 relative bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <input type="text" value={item.desc} onChange={e => { const u = [...bItems]; u[index].desc = e.target.value; setBItems(u); }} onFocus={() => setActiveItemIndex(index)} onBlur={() => setTimeout(() => setActiveItemIndex(null), 200)} className="flex-1 p-2 border border-slate-300 rounded-md focus:border-indigo-500 focus:outline-none transition" placeholder="Descripción..." />
                    {activeItemIndex === index && getFilteredCatalog(item.desc).length > 0 && (
                      <div className="absolute top-10 z-50 w-full bg-white border border-slate-200 shadow-xl max-h-40 overflow-y-auto rounded-lg">
                        {getFilteredCatalog(item.desc).map(cat => <div key={cat.id} onMouseDown={() => { const u = [...bItems]; u[index].desc = cat.description; u[index].price = cat.price; setBItems(u); setActiveItemIndex(null); }} className="p-3 hover:bg-indigo-50 cursor-pointer font-medium border-b border-slate-100 transition">{cat.description} <span className="font-black text-indigo-600 ml-2">({cat.price}€)</span></div>)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="w-16"><input type="number" value={item.qty} onChange={e => { const u = [...bItems]; u[index].qty = Number(e.target.value); setBItems(u); }} className="w-full p-2 border border-slate-300 rounded-md text-center font-bold focus:border-indigo-500 focus:outline-none transition" placeholder="Cant." /></div>
                      <div className="w-20 relative"><input type="number" step="0.01" value={item.price} onChange={e => { const u = [...bItems]; u[index].price = Number(e.target.value); setBItems(u); }} className="w-full p-2 border border-slate-300 rounded-md text-right font-bold pr-5 focus:border-indigo-500 focus:outline-none transition" placeholder="Precio" /><span className="absolute right-1.5 top-2 text-slate-400 font-bold">€</span></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800 text-white p-3 rounded-lg flex items-center justify-between mt-2 shadow-md">
                <span className="font-bold uppercase tracking-wider text-slate-300">Total IVA Inc.</span><span className="font-black text-lg">{calculatedTotal.toFixed(2)} €</span>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg shadow-md transition cursor-pointer mt-2 text-sm">
                {editingBudgetId ? 'Actualizar Presupuesto' : 'Guardar y PDF'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ESTADÍSTICAS */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-black text-lg">📊 Estadísticas Globales</h3>
              <button onClick={() => setShowStatsModal(false)} className="w-8 h-8 bg-slate-800 rounded-full font-bold hover:bg-slate-700 flex items-center justify-center">✕</button>
            </div>
            <div className="p-5 space-y-4 bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Presupuestado</span>
                  <span className="font-black text-lg text-slate-800">{stats.presupuestado.toFixed(2)} €</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Aceptado</span>
                  <span className="font-black text-lg text-emerald-800">{stats.aceptado.toFixed(2)} €</span>
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Total Facturado</span>
                <span className="font-black text-2xl text-indigo-800">{stats.facturado.toFixed(2)} €</span>
              </div>
              <div className="bg-rose-50 p-4 rounded-xl shadow-sm border border-rose-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 bottom-0 w-2 bg-rose-500"></div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Pendiente de Cobro</span>
                <span className="font-black text-3xl text-rose-700">{stats.pendiente.toFixed(2)} €</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">💾 Espacio en Disco Utilizado</span>
                  <span className="text-indigo-600">{storageUsedMB} MB / 500 MB</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (storageUsedMB / 500) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center font-medium">Plan Base Activo. Ampliable a 10 GB / 50 GB.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL MANDO DE OBRA */}
      {activeWorkOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 p-0 sm:p-4 transition-all backdrop-blur-sm">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 text-white shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-md">Gestión de Obra</span>
                  <h3 className="text-xl font-black mt-2 leading-tight">{activeWorkOrder.client_name}</h3>
                  <p className="text-xs text-indigo-300 font-bold mt-0.5">
                    Referencia de Obra: <span className="text-white font-mono">{activeWorkOrder.work_order_ref || 'Sin Ref'}</span>
                  </p>
                </div>
                <button onClick={() => setActiveWorkOrder(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-white cursor-pointer text-lg">✕</button>
              </div>
              <div className="flex gap-4 mt-4 border-b border-slate-700 overflow-x-auto no-scrollbar">
                <button onClick={() => setWoTab('info')} className={`pb-2 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${woTab === 'info' ? 'border-b-2 border-indigo-400 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Resumen</button>
                <button onClick={() => setWoTab('gastos')} className={`pb-2 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${woTab === 'gastos' ? 'border-b-2 border-indigo-400 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Gastos & Tickets</button>
                <button onClick={() => setWoTab('archivos')} className={`pb-2 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${woTab === 'archivos' ? 'border-b-2 border-indigo-400 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Archivos & Planos</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              {woTab === 'info' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-bold">Estado Actual</span>
                      <div className={`font-black text-lg uppercase mt-0.5 ${activeWorkOrder.status === 'finalizada' ? 'text-emerald-600' : 'text-amber-600'}`}>{activeWorkOrder.status.replace('_', ' ')}</div>
                    </div>
                    {activeWorkOrder.status === 'en_curso' ? (
                      <button onClick={() => handleFinishWorkOrder(activeWorkOrder.id)} className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-lg text-sm font-bold shadow-md cursor-pointer">Finalizar Obra</button>
                    ) : (
                      <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold border border-slate-200 flex items-center justify-center">Obra Cerrada</span>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500 uppercase font-bold">Total Gastos Anotados</span>
                    <div className="font-black text-rose-600 text-2xl mt-1">{woExpenses.reduce((acc, e) => acc + Number(e.amount), 0).toFixed(2)} €</div>
                  </div>
                </div>
              )}
              {woTab === 'gastos' && (
                <div className="space-y-4">
                  {activeWorkOrder.status === 'en_curso' && (
                    <form onSubmit={handleAddExpense} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Añadir Nuevo Gasto</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input type="text" required placeholder="Concepto (Ej. Materiales, Mano de obra)" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} className="flex-1 p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 font-medium" />
                        <input type="number" step="0.01" required placeholder="150.00" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value ? Number(e.target.value) : '')} className="w-full sm:w-28 p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-center focus:outline-none focus:border-indigo-500" />
                        <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-md text-sm w-full sm:w-auto">Añadir</button>
                      </div>
                    </form>
                  )}
                  <div className="space-y-2">
                    {woExpenses.length === 0 ? <p className="text-sm text-slate-500 text-center py-6 font-medium">No hay gastos registrados en esta orden.</p> :
                      woExpenses.map(exp => (
                        <div key={exp.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 text-sm shadow-sm">
                          <span className="font-bold text-slate-800">{exp.description}</span><span className="font-black text-rose-600 text-base">-{Number(exp.amount).toFixed(2)} €</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
              {woTab === 'archivos' && (
                <div className="space-y-4">
                  {activeWorkOrder.status === 'en_curso' && (
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-indigo-900">Adjuntar Planos o Tickets</h4>
                        <p className="text-xs text-indigo-700 mt-0.5">Sube imágenes o PDFs para trazabilidad.</p>
                      </div>
                      <label className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md cursor-pointer hover:bg-indigo-700 transition w-full sm:w-auto text-center">
                        + Subir Archivo
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUploadPhoto} />
                      </label>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {woAttachments.length === 0 ? <div className="col-span-2 sm:col-span-3 text-sm text-slate-500 text-center py-6 font-medium">No hay archivos adjuntos.</div> :
                      woAttachments.map(att => (
                        <div key={att.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative group">
                          {att.type === 'foto' || att.file_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={att.file_url} alt={att.file_name} className="w-full h-32 object-cover" />
                          ) : (
                            <div className="w-full h-32 bg-slate-100 flex flex-col items-center justify-center p-2 text-center">
                              <span className="text-3xl mb-2">📄</span>
                              <span className="text-[10px] font-bold text-slate-500 truncate w-full">{att.file_name}</span>
                            </div>
                          )}
                          <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="block text-center py-2 bg-slate-50 text-[10px] font-bold text-indigo-600 hover:bg-slate-100 border-t border-slate-200 transition">Ver / Descargar</a>
                          {activeWorkOrder.status === 'en_curso' && (
                            <button onClick={() => handleDeleteAttachment(att.id)} className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 transition text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md">✕</button>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRAR FACTURA */}
      {paymentModal.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-black text-xl text-slate-800 border-b border-slate-100 pb-3">💶 Registrar Cobro</h3>
            <p className="text-sm text-slate-600 font-medium">¿Cómo te ha pagado el cliente la factura <strong>{paymentModal.invoice?.code}</strong>?</p>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition font-bold ${paymentModal.method === 'Transferencia Bancaria' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                <input type="radio" name="payment" value="Transferencia Bancaria" checked={paymentModal.method === 'Transferencia Bancaria'} onChange={e => setPaymentModal({...paymentModal, method: e.target.value})} className="accent-indigo-600 w-4 h-4" />
                🏦 Transferencia Bancaria
              </label>
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition font-bold ${paymentModal.method === 'Bizum' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                <input type="radio" name="payment" value="Bizum" checked={paymentModal.method === 'Bizum'} onChange={e => setPaymentModal({...paymentModal, method: e.target.value})} className="accent-indigo-600 w-4 h-4" />
                📱 Bizum
              </label>
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition font-bold ${paymentModal.method === 'Efectivo' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                <input type="radio" name="payment" value="Efectivo" checked={paymentModal.method === 'Efectivo'} onChange={e => setPaymentModal({...paymentModal, method: e.target.value})} className="accent-indigo-600 w-4 h-4" />
                💵 Efectivo Metálico
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setPaymentModal({ show: false, invoice: null, method: 'Transferencia Bancaria' })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm">Cancelar</button>
              <button onClick={handleConfirmPayment} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-sm shadow-md">Confirmar Pago</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FACTURAR PORCENTAJE (ANTICIPOS) */}
      {invoiceModal.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-black text-xl text-slate-800 border-b border-slate-100 pb-3">🧾 Generar Factura</h3>
            <p className="text-sm text-slate-600 font-medium">¿Qué porcentaje del presupuesto quieres facturar ahora?</p>
            <div className="text-center py-4">
              <span className="text-5xl font-black text-indigo-600">{invoiceModal.percentage}%</span>
              <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold">
                Total a facturar: <span className="text-slate-800">{(Number(invoiceModal.budget?.total) * (invoiceModal.percentage / 100)).toFixed(2)} €</span>
              </p>
            </div>
            <input type="range" min="1" max="100" value={invoiceModal.percentage} onChange={e => setInvoiceModal({...invoiceModal, percentage: Number(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            <div className="flex justify-between px-1">
              <span className="text-xs font-bold text-slate-400">1% (Anticipo)</span>
              <span className="text-xs font-bold text-slate-400">100% (Total)</span>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setInvoiceModal({ show: false, budget: null, percentage: 100 })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm">Cancelar</button>
              <button onClick={handleConfirmInvoice} className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-sm shadow-md">Crear Factura</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FACTURAR RESTO */}
      {restInvoiceModal.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-black text-lg text-slate-800">🧾 Facturar Resto de Obra</h3>
                <p className="text-xs text-rose-500 font-bold mt-1">Anticipo ya facturado: -{restInvoiceModal.alreadyInvoicedSubtotal.toFixed(2)} €</p>
              </div>
              <button onClick={() => setRestInvoiceModal({ show: false, budget: null, items: [], alreadyInvoicedSubtotal: 0, activeItemIndex: null })} className="text-slate-400 hover:text-slate-600 font-bold text-xl transition">✕</button>
            </div>
            <form onSubmit={handleConfirmRestInvoice} className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-800">Ajustar Partidas Finales (Añadir o quitar extras)</h4>
                  <button type="button" onClick={() => setRestInvoiceModal(prev => ({...prev, items: [...prev.items, { desc: '', qty: 1, price: 0 }]}))} className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold hover:bg-indigo-100 transition">+ Añadir Extra</button>
                </div>
                {restInvoiceModal.items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 relative bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <input type="text" value={item.desc} onChange={e => { const u = [...restInvoiceModal.items]; u[index].desc = e.target.value; setRestInvoiceModal(p => ({...p, items: u})); }} onFocus={() => setRestInvoiceModal(p => ({...p, activeItemIndex: index}))} onBlur={() => setTimeout(() => setRestInvoiceModal(p => ({...p, activeItemIndex: null})), 200)} className="flex-1 p-2 border border-slate-300 rounded-md focus:border-indigo-500 focus:outline-none transition" placeholder="Descripción..." />
                    {restInvoiceModal.activeItemIndex === index && getFilteredCatalog(item.desc).length > 0 && (
                      <div className="absolute top-10 z-50 w-full bg-white border border-slate-200 shadow-xl max-h-40 overflow-y-auto rounded-lg">
                        {getFilteredCatalog(item.desc).map(cat => <div key={cat.id} onClick={() => { const u = [...restInvoiceModal.items]; u[index].desc = cat.description; u[index].price = cat.price; setRestInvoiceModal(p => ({...p, items: u, activeItemIndex: null})); }} className="p-3 hover:bg-indigo-50 cursor-pointer font-medium border-b border-slate-100 transition">{cat.description} <span className="font-black text-indigo-600 ml-2">({cat.price}€)</span></div>)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="w-16"><input type="number" value={item.qty} onChange={e => { const u = [...restInvoiceModal.items]; u[index].qty = Number(e.target.value); setRestInvoiceModal(p => ({...p, items: u})); }} className="w-full p-2 border border-slate-300 rounded-md text-center font-bold focus:border-indigo-500 focus:outline-none transition" /></div>
                      <div className="w-20 relative"><input type="number" step="0.01" value={item.price} onChange={e => { const u = [...restInvoiceModal.items]; u[index].price = Number(e.target.value); setRestInvoiceModal(p => ({...p, items: u})); }} className="w-full p-2 border border-slate-300 rounded-md text-right font-bold pr-5 focus:border-indigo-500 focus:outline-none transition" /><span className="absolute right-1.5 top-2 text-slate-400 font-bold">€</span></div>
                      <button type="button" onClick={() => { const u = [...restInvoiceModal.items]; u.splice(index, 1); setRestInvoiceModal(p => ({...p, items: u})); }} className="w-8 flex items-center justify-center bg-rose-100 text-rose-600 rounded-md hover:bg-rose-200 transition font-bold">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800 text-white p-3 rounded-lg flex items-center justify-between mt-2 shadow-md">
                <span className="font-bold uppercase tracking-wider text-slate-300">Total a Facturar Ahora (IVA Inc.)</span>
                <span className="font-black text-xl text-emerald-400">{calculatedFinalTotalRest.toFixed(2)} €</span>
              </div>
              <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg shadow-md transition cursor-pointer mt-2 text-sm">Generar Factura Final y Cerrar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENVIAR PDF */}
      {sharingDocument && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl flex flex-col mx-auto animate-in slide-in-from-bottom-5">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-800">Enviar Documento</h3>
              <button onClick={() => setSharingDocument(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 text-center mb-2 font-medium">Se va a generar el PDF oficial de <strong>{sharingDocument.code}</strong>. ¿Cómo quieres enviarlo?</p>
              <button onClick={() => handleGeneratePdfAction(sharingDocument, 'whatsapp')} className="w-full flex items-center justify-center gap-3 py-4 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl font-bold text-lg shadow-md transition">
                <span className="text-2xl">💬</span> Enviar por WhatsApp
              </button>
              <button onClick={() => handleGeneratePdfAction(sharingDocument, 'email')} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-lg shadow-md transition">
                <span className="text-2xl">📧</span> Enviar por Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRM ALTA/EDICIÓN */}
      {showCrmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-0 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 sm:p-5 flex justify-between items-center shrink-0">
              <h3 className="font-black text-white text-lg flex items-center gap-2">👤 {crmForm.id ? `Ficha: ${crmForm.name}` : 'Alta de Nuevo Cliente'}</h3>
              <button onClick={() => setShowCrmModal(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold">✕</button>
            </div>
            {crmForm.id && (
              <div className="flex bg-slate-800 px-4 pt-2 border-b border-slate-700 shrink-0 overflow-x-auto no-scrollbar">
                <button onClick={() => setCrmTab('datos')} className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${crmTab === 'datos' ? 'border-b-2 border-indigo-400 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Datos Generales</button>
                <button onClick={() => setCrmTab('historial')} className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${crmTab === 'historial' ? 'border-b-2 border-indigo-400 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Trazabilidad & Proyectos</button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              {crmTab === 'datos' && (
                <form id="crmFormId" onSubmit={handleSaveCrmClient} className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="font-black text-indigo-700 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">1. Datos Personales y Localización</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="sm:col-span-2 lg:col-span-2"><label className="block font-bold text-slate-600 mb-1">Nombre Completo *</label><input required type="text" value={crmForm.name} onChange={e => setCrmForm({...crmForm, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 font-bold focus:border-indigo-500 focus:outline-none bg-slate-50" /></div>
                      <div><label className="block font-bold text-slate-600 mb-1">DNI / NIE</label><input type="text" value={crmForm.cif} onChange={e => setCrmForm({...crmForm, cif: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:border-indigo-500 focus:outline-none" /></div>
                      <div><label className="block font-bold text-slate-600 mb-1">Teléfono Personal</label><input type="tel" value={crmForm.phone} onChange={e => setCrmForm({...crmForm, phone: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:border-indigo-500 focus:outline-none" /></div>
                      <div className="sm:col-span-2 lg:col-span-4"><label className="block font-bold text-slate-600 mb-1">Correo Electrónico</label><input type="email" value={crmForm.email} onChange={e => setCrmForm({...crmForm, email: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                      <div className="sm:col-span-2 lg:col-span-3"><label className="block font-bold text-slate-600 mb-1">Calle / Avenida / Plaza</label><input type="text" value={crmForm.street} onChange={e => setCrmForm({...crmForm, street: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                      <div><label className="block font-bold text-slate-600 mb-1">Número / Piso</label><input type="text" value={crmForm.street_number} onChange={e => setCrmForm({...crmForm, street_number: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                      <div><label className="block font-bold text-slate-600 mb-1">Código Postal</label><input type="text" value={crmForm.postal_code} onChange={e => setCrmForm({...crmForm, postal_code: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:border-indigo-500 focus:outline-none" /></div>
                      <div className="sm:col-span-2 lg:col-span-1"><label className="block font-bold text-slate-600 mb-1">Población / Localidad</label><input type="text" value={crmForm.population} onChange={e => setCrmForm({...crmForm, population: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                      <div className="sm:col-span-2 lg:col-span-1"><label className="block font-bold text-slate-600 mb-1">Ciudad / Provincia</label><input type="text" value={crmForm.city} onChange={e => setCrmForm({...crmForm, city: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                      <div className="sm:col-span-2 lg:col-span-1"><label className="block font-bold text-slate-600 mb-1">País</label><input type="text" value={crmForm.country} onChange={e => setCrmForm({...crmForm, country: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="font-black text-slate-700 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">2. Datos de Facturación / Empresa</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div className="sm:col-span-2"><label className="block font-bold text-slate-600 mb-1">Nombre de la Empresa</label><input type="text" value={crmForm.company} onChange={e => setCrmForm({...crmForm, company: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                      <div><label className="block font-bold text-slate-600 mb-1">NIF Empresa</label><input type="text" value={crmForm.company_cif} onChange={e => setCrmForm({...crmForm, company_cif: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:border-indigo-500 focus:outline-none" /></div>
                      <div className="sm:col-span-2 lg:col-span-3"><label className="block font-bold text-slate-600 mb-1">Dirección de la Empresa</label><input type="text" value={crmForm.company_address} onChange={e => setCrmForm({...crmForm, company_address: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                      <div><label className="block font-bold text-slate-600 mb-1">Teléfono Empresa</label><input type="tel" value={crmForm.company_phone} onChange={e => setCrmForm({...crmForm, company_phone: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:border-indigo-500 focus:outline-none" /></div>
                      <div><label className="block font-bold text-slate-600 mb-1">Contacto Administración</label><input type="text" placeholder="Ej. Marta" value={crmForm.admin_contact} onChange={e => setCrmForm({...crmForm, admin_contact: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                      <div><label className="block font-bold text-slate-600 mb-1">Correo Administración</label><input type="email" value={crmForm.admin_email} onChange={e => setCrmForm({...crmForm, admin_email: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none" /></div>
                      <div className="sm:col-span-3"><label className="block font-bold text-slate-600 mb-1">Cuenta Bancaria (IBAN)</label><input type="text" placeholder="ESXX XXXX XXXX..." value={crmForm.bank_account} onChange={e => setCrmForm({...crmForm, bank_account: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:border-indigo-500 focus:outline-none" /></div>
                    </div>
                  </div>
                </form>
              )}
              {crmTab === 'historial' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Presup.</span>
                      <span className="font-black text-sm text-slate-800">{activeClientTotalPresupuestado.toFixed(2)} €</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-indigo-500 block">Total Facturado</span>
                      <span className="font-black text-sm text-indigo-700">{activeClientTotalFacturado.toFixed(2)} €</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-rose-500 block">Pendiente Pago</span>
                      <span className="font-black text-sm text-rose-600">{activeClientTotalPendiente.toFixed(2)} €</span>
                    </div>
                  </div>

                  {activeClientBudgets.filter(b => b.type === 'presupuesto').length === 0 ? (
                    <div className="text-center py-10 text-slate-500 font-bold bg-white rounded-xl border border-dashed border-slate-300">
                      No hay proyectos ni presupuestos registrados para este cliente.
                    </div>
                  ) : (
                    activeClientBudgets.filter(b => b.type === 'presupuesto').map(proj => {
                      const relatedInvoices = activeClientBudgets.filter(f => f.type === 'factura' && f.parent_id === proj.id);
                      const relatedOrder = workOrders.find(wo => wo.budget_id === proj.id);
                      const relatedExpenses = relatedOrder ? allExpenses.filter(e => e.work_order_id === relatedOrder.id) : [];
                      const relatedFiles = relatedOrder ? allAttachments.filter(a => a.work_order_id === relatedOrder.id) : [];

                      return (
                        <div key={proj.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                            <div>
                              <span className="text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Proyecto</span>
                              <h4 className="font-black text-slate-800 text-sm mt-1">{proj.code}</h4>
                              {proj.work_order_ref && (
                                <p className="text-xs font-bold text-indigo-600">Ref: {proj.work_order_ref}</p>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">{proj.created_at?.split('T')[0]}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-slate-800 text-sm">{Number(proj.total).toFixed(2)} €</span>
                              <div className="text-[10px] font-bold uppercase text-indigo-600">{proj.status}</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => handleGeneratePdfAction(proj, 'download')} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-100">⬇ Ver Presupuesto</button>
                            <button onClick={() => handleDeleteDocument(proj)} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold rounded hover:bg-rose-100">🗑 Eliminar Proyecto</button>
                          </div>

                          {relatedOrder && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-black text-slate-700">🏗️ Obra: {relatedOrder.work_order_ref || relatedOrder.status}</span>
                                <span className="text-[10px] font-bold text-rose-600">Gastos: -{relatedExpenses.reduce((acc, e) => acc + Number(e.amount), 0).toFixed(2)} €</span>
                              </div>

                              {relatedFiles.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                  {relatedFiles.map(file => (
                                    <div key={file.id} className="bg-white p-2 rounded border border-slate-200 text-[10px] flex flex-col justify-between group">
                                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 truncate hover:underline block mb-1">
                                        📄 {file.file_name}
                                      </a>
                                      <button onClick={() => handleDeleteAttachment(file.id)} className="text-rose-500 hover:text-rose-700 font-bold text-[9px] text-right mt-1">🗑 Eliminar</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {relatedInvoices.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Facturas Generadas</span>
                              {relatedInvoices.map(inv => (
                                <div key={inv.id} className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-xs">
                                  <div>
                                    <span className="font-black text-indigo-900">{inv.code}</span>
                                    <span className="text-[10px] text-slate-500 ml-2">({inv.status === 'cobrada' ? 'Cobrada' : 'Pendiente'})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-800">{Number(inv.total).toFixed(2)} €</span>
                                    <button onClick={() => handleGeneratePdfAction(inv, 'download')} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[9px] font-bold rounded">⬇ PDF</button>
                                    <button onClick={() => handleDeleteDocument(inv)} className="text-rose-500 hover:text-rose-700 font-bold text-xs">✕</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {crmTab === 'datos' && (
              <div className="p-4 bg-white border-t border-slate-200 flex gap-3 shrink-0">
                <button type="button" onClick={() => setShowCrmModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 transition text-slate-700 rounded-lg font-bold text-sm">Cancelar</button>
                <button type="submit" form="crmFormId" className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg font-black text-sm shadow-md">Guardar Ficha</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CREAR PARTIDA DE CATÁLOGO */}
      {showCatalogItemModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-black text-base text-slate-800 border-b border-slate-100 pb-2">📦 Nueva Partida Catálogo</h3>
            <form onSubmit={handleSaveCatalogItem} className="space-y-3 text-xs">
              <div><label className="block font-bold text-slate-600 mb-1">Descripción</label><input type="text" required placeholder="Ej. Instalación..." value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 font-bold focus:border-indigo-500 focus:outline-none transition" /></div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Precio Base</label>
                <div className="relative"><input type="number" step="0.01" required placeholder="0.00" value={newCatPrice} onChange={e => setNewCatPrice(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-slate-300 font-black text-indigo-600 focus:border-indigo-500 focus:outline-none transition" /><span className="absolute right-3 top-2.5 font-black text-slate-400">€</span></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCatalogItemModal(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 transition rounded-lg font-bold text-slate-700">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg font-bold shadow-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}