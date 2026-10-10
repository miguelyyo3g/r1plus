"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function CompanyDataForm() {
  const supabase = createClientComponentClient();
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
  });

  // Cargar datos de la empresa
  useEffect(() => {
    async function loadCompanyData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
            });
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCompanyData();
  }, [supabase]);

  // Función exclusiva para subir el Logo a Storage
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
      // Creamos un nombre único para evitar que la caché muestre logos viejos
      const fileName = `logo-${orgId}-${Date.now()}.${fileExt}`;

      // Subimos el archivo al bucket 'logos'
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtenemos la URL pública de la imagen recién subida
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);

      // Actualizamos el estado del formulario con la nueva URL
      setFormData({ ...formData, logo_url: data.publicUrl });
      setMessage("✅ Imagen subida. Dale a 'Guardar Ficha' para aplicar los cambios.");
      
    } catch (error: any) {
      setMessage(`❌ Error subiendo imagen: ${error.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Guardar todos los textos y la URL del logo en la base de datos
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Ficha de la Empresa</h2>
      
      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Selector de Logo Visual */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-shrink-0 w-24 h-24 bg-white border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
            {formData.logo_url ? (
              <img src={formData.logo_url} alt="Logo Empresa" className="w-full h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-sm">Sin logo</span>
            )}
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logotipo de la empresa</label>
            <input
              type="file"
              accept="image/*"
              onChange={uploadLogo}
              disabled={uploadingLogo}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadingLogo && <p className="text-xs text-blue-600 mt-2">Subiendo imagen...</p>}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial / Razón Social</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* CIF / NIF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CIF / NIF</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Central</label>
          <input
            type="tel"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || uploadingLogo}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
        >
          {saving ? "Guardando..." : "Guardar Ficha de Empresa"}
        </button>
      </form>
    </div>
  );
}