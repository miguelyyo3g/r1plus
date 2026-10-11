// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CompanyDataForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    async function loadCompanyData() {
      try {
        if (typeof window === 'undefined') return;

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profile?.organization_id) {
          setOrgId(profile.organization_id);

          const { data: org } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", profile.organization_id)
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
            }
          }
        }
      } catch (error) {
        console.error("Error cargando datos de empresa:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCompanyData();
  }, []);

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

  const handleRemoveAccount = (index: number) => {
    const updated = [...bankAccounts];
    updated.splice(index, 1);
    setBankAccounts(updated);
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

  if (loading) return <div className="p-4 text-gray-500">Cargando ficha de empresa...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-black text-slate-800 mb-5">🏢 Ficha y Datos de Empresa</h2>
      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-shrink-0 w-24 h-24 bg-white border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
            {formData.logo_url ? (
              <img src={formData.logo_url} alt="Logo Empresa" className="w-full h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-sm">Sin logo</span>
            )}
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logotipo Corporativo (Presupuestos y Facturas)</label>
            <input
              type="file"
              accept="image/*"
              onChange={uploadLogo}
              disabled={uploadingLogo}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {uploadingLogo && <p className="text-xs text-indigo-600 mt-2">Subiendo imagen...</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre Comercial / Razón Social</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">CIF / NIF</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Teléfono Central</label>
              <input
                type="tel"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dirección Fiscal</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Teléfono Bizum (Cobros)</label>
            <input
              type="tel"
              placeholder="+34 600000000"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold"
              value={formData.bizum_phone}
              onChange={(e) => setFormData({ ...formData, bizum_phone: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-800 text-sm">Cuentas Bancarias y IBAN</h3>
            <button
              type="button"
              onClick={handleAddAccount}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
            >
              + Añadir Cuenta
            </button>
          </div>

          {bankAccounts.map((acc, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <input
                type="text"
                placeholder="Banco (Ej. BBVA, Santander)"
                value={acc.bankName}
                onChange={(e) => {
                  const updated = [...bankAccounts];
                  updated[index].bankName = e.target.value;
                  setBankAccounts(updated);
                }}
                className="flex-1 p-2.5 border border-slate-300 rounded-lg text-xs font-bold outline-none"
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
                className="flex-[2] p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveAccount(index)}
                className="px-3 py-2.5 bg-rose-100 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-200 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || uploadingLogo}
          className="w-full bg-indigo-600 text-white font-black py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 cursor-pointer shadow-md text-sm"
        >
          {saving ? "Guardando cambios..." : "Guardar Ficha de Empresa"}
        </button>
      </form>
    </div>
  );
}