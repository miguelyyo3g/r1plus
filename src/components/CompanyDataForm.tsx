// @ts-nocheck
/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function CompanyDataForm() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [orgId, setOrgId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    tax_id: "",
    address: "",
    phone: "",
    logo_url: "",
    bizum_phone: "",
  });

  const [bankAccounts, setBankAccounts] = useState<Array<{ bankName: string; iban: string }>>([]);
  // ESTADO PARA EL BOTÓN DE BORRADO DE DOBLE CHECK
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    loadCompanyData();
  }, []);

  async function loadCompanyData() {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (!user) {
        setErrorMsg("No hay sesión activa.");
        return;
      }

      // 1. Buscamos el perfil del usuario
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id, plan, role, name")
        .eq("id", user.id)
        .single();

      let currentOrgId = profile?.organization_id;

      // 2. AUTO-CREACIÓN de empresa
      if (!currentOrgId && (profile?.plan === 'empresa' || profile?.plan === 'empresa_pro' || profile?.role === 'admin' || profile?.role === 'gerente' || profile?.role === 'supplier_owner')) {
         const { data: newOrg } = await supabase
           .from("organizations")
           .insert([{ name: `Empresa de ${profile.name || 'Usuario'}` }])
           .select("id")
           .single();

         if (newOrg?.id) {
           currentOrgId = newOrg.id;
           await supabase.from("profiles").update({ organization_id: currentOrgId }).eq("id", user.id);
         }
      }

      // 3. Cargamos los datos
      if (currentOrgId) {
        setOrgId(currentOrgId);
        const { data: org } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", currentOrgId)
          .single();

        if (org) {
          setFormData({
            name: org.name || "",
            tax_id: org.tax_id || "",
            address: org.address || "",
            phone: org.phone || "",
            logo_url: org.logo_url || "",
            bizum_phone: org.bizum_phone || "",
          });
          
          if (org.bank_accounts && Array.isArray(org.bank_accounts)) {
            setBankAccounts(org.bank_accounts);
          } else if (typeof org.bank_accounts === 'string') {
            try { setBankAccounts(JSON.parse(org.bank_accounts)); } catch(e) {}
          }
        }
      } else {
         setErrorMsg("Tu cuenta actual es de tipo Comercial (Free). Solo los gerentes pueden editar los datos de facturación de la agencia.");
      }
    } catch (error: any) {
      console.error("Error cargando datos de empresa:", error);
      setErrorMsg("No se pudieron cargar los datos de la empresa. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true);
      setMessage("");

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Debes seleccionar una imagen.");
      }

      if (!orgId) {
        throw new Error("No se encontró la empresa para asociar el logo.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${orgId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);

      setFormData({ ...formData, logo_url: data.publicUrl });
      setMessage("✅ Imagen subida. Dale a 'Guardar Ficha' para aplicar los cambios.");
      
    } catch (error: any) {
      setMessage(`❌ Error subiendo imagen: ${error.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddAccount = () => {
    setBankAccounts([...bankAccounts, { bankName: "", iban: "" }]);
  };

  // NUEVA LÓGICA DE BORRADO EN DOS PASOS
  const handleRemoveAccountClick = (index: number) => {
    if (deletingIndex === index) {
      // Si ya estaba en modo borrar, procedemos a borrar
      const updated = [...bankAccounts];
      updated.splice(index, 1);
      setBankAccounts(updated);
      setDeletingIndex(null);
    } else {
      // Primer clic: mostramos confirmación
      setDeletingIndex(index);
      // Tras 3 segundos, volvemos al estado normal
      setTimeout(() => {
        setDeletingIndex(current => current === index ? null : current);
      }, 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (!orgId) return;

    const { error } = await supabase
      .from("organizations")
      .update({
        name: formData.name,
        tax_id: formData.tax_id,
        address: formData.address,
        phone: formData.phone,
        logo_url: formData.logo_url,
        bizum_phone: formData.bizum_phone,
        bank_accounts: bankAccounts,
      })
      .eq("id", orgId);

    if (error) {
      setMessage("❌ Error al guardar los cambios en la base de datos.");
    } else {
      setMessage("✅ Ficha de empresa actualizada con éxito.");
    }
    setSaving(false);
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-slate-500 font-bold text-sm">Cargando datos de facturación...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <div className="text-4xl mb-2">🔒</div>
        <h3 className="font-black text-rose-800 mb-1">Acceso Restringido</h3>
        <p className="text-sm text-rose-600 font-medium">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* LOGO */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex-shrink-0 w-24 h-24 bg-white border border-slate-300 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
            {formData.logo_url ? (
              <img src={formData.logo_url} alt="Logo Empresa" className="w-full h-full object-contain" />
            ) : (
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center px-2">Sin Logo</span>
            )}
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-widest">Logotipo Corporativo</label>
            <input
              type="file"
              accept="image/*"
              onChange={uploadLogo}
              disabled={uploadingLogo}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer transition"
            />
            {uploadingLogo && <p className="text-xs text-indigo-600 mt-2 font-bold animate-pulse">Subiendo imagen...</p>}
          </div>
        </div>

        {/* DATOS FISCALES */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre Comercial / Razón Social</label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CIF / NIF</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-800"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teléfono Central</label>
              <input
                type="tel"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-800"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dirección Fiscal</label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teléfono Bizum (Cobros)</label>
            <input
              type="tel"
              placeholder="+34 600000000"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-800"
              value={formData.bizum_phone}
              onChange={(e) => setFormData({ ...formData, bizum_phone: e.target.value })}
            />
          </div>
        </div>

        {/* CUENTAS BANCARIAS */}
        <div className="space-y-3 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="font-black text-slate-800 text-sm">Cuentas Bancarias e IBAN</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Para transferencias de clientes</p>
            </div>
            <button
              type="button"
              onClick={handleAddAccount}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black hover:bg-indigo-100 transition cursor-pointer shadow-sm"
            >
              + Añadir Cuenta
            </button>
          </div>

          {bankAccounts.length === 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs font-bold text-slate-400">
              No tienes ninguna cuenta bancaria configurada.
            </div>
          )}

          {bankAccounts.map((acc, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 relative group">
              <input
                type="text"
                placeholder="Banco (Ej. BBVA, Santander)"
                value={acc.bankName}
                onChange={(e) => {
                  const updated = [...bankAccounts];
                  updated[index].bankName = e.target.value;
                  setBankAccounts(updated);
                }}
                className="flex-1 p-3 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 text-slate-800"
              />
              <input
                type="text"
                placeholder="IBAN (ESXX XXXX...)"
                value={acc.iban}
                onChange={(e) => {
                  const updated = [...bankAccounts];
                  updated[index].iban = e.target.value;
                  setBankAccounts(updated);
                }}
                className="flex-[2] p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold outline-none focus:border-indigo-500 text-slate-800 uppercase"
              />
              <button
                type="button"
                onClick={() => handleRemoveAccountClick(index)}
                title="Eliminar cuenta"
                className={`py-3 rounded-lg text-sm font-black transition cursor-pointer whitespace-nowrap ${
                  deletingIndex === index 
                    ? 'px-4 bg-rose-600 text-white shadow-md animate-pulse' 
                    : 'px-4 bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                {deletingIndex === index ? '¿Seguro?' : '✕'}
              </button>
            </div>
          ))}
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold ${message.includes('❌') ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || uploadingLogo}
          className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:bg-slate-300 cursor-pointer shadow-lg text-sm mt-4"
        >
          {saving ? "Guardando cambios de empresa..." : "Guardar Ficha de Empresa"}
        </button>
      </form>
    </div>
  );
}