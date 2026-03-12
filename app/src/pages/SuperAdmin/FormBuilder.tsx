import React, { useState, useEffect } from 'react';
import { Layout, Plus, Trash2, GripVertical, Settings2, Loader2, Save } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const FormBuilder = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const { data } = await api.get('/super/tenants');
                setTenants(data.data);
                if (data.data.length > 0) {
                    setSelectedTenant(data.data[0]);
                }
            } catch (error) {
                toast.error("Failed to fetch showrooms");
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, []);

    useEffect(() => {
        if (selectedTenant) {
            fetchFields(selectedTenant._id);
        }
    }, [selectedTenant]);

    const fetchFields = async (tenantId) => {
        try {
            const { data } = await api.get(`/super/tenants/${tenantId}/form-fields`);
            setFields(data.data || []);
        } catch (error) {
            console.error("Failed to fetch fields", error);
            setFields([]);
        }
    };

    const addField = () => {
        const newField = {
            id: Date.now(),
            name: `field_${fields.length + 1}`,
            label: 'New Field',
            type: 'text',
            required: false,
            placeholder: 'Enter something...'
        };
        setFields([...fields, newField]);
    };

    const removeField = (id) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const handleSave = async () => {
        if (!selectedTenant) return;
        setSaving(true);
        try {
            await api.post(`/super/tenants/${selectedTenant._id}/form-fields`, { fields });
            toast.success("Form structure saved!");
        } catch (error) {
            toast.error("Failed to save form structure");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dynamic Form Builder</h1>
                    <p className="text-slate-500 font-medium mt-1">Configure lead generation fields for your partners.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Structure
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: Tenant Selection */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Showrooms</h3>
                    <div className="space-y-2">
                        {tenants.map((t) => (
                            <button
                                key={t._id}
                                onClick={() => setSelectedTenant(t)}
                                className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all border ${selectedTenant?._id === t._id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main: Builder UI */}
                <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 min-h-[500px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <Layout className="text-slate-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedTenant?.name} Form</h3>
                                <p className="text-xs font-medium text-slate-400">Total Fields: {fields.length}</p>
                            </div>
                        </div>
                        <button 
                            onClick={addField}
                            className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Field
                        </button>
                    </div>

                    <div className="space-y-4">
                        {fields.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                <p className="text-slate-400 font-medium">No fields defined yet. Click "Add Field" to start.</p>
                            </div>
                        ) : fields.map((field, index) => (
                            <div key={field.id || index} className="group p-6 bg-slate-50/50 border border-slate-100 rounded-3xl flex items-center gap-6 hover:bg-white hover:border-indigo-200 transition-all duration-300">
                                <GripVertical className="text-slate-300 cursor-move" size={20} />
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                    <input 
                                        type="text" 
                                        placeholder="Label (e.g. Phone Number)"
                                        value={field.label}
                                        onChange={(e) => {
                                            const newFields = [...fields];
                                            newFields[index].label = e.target.value;
                                            setFields(newFields);
                                        }}
                                        className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <select 
                                        value={field.type}
                                        onChange={(e) => {
                                            const newFields = [...fields];
                                            newFields[index].type = e.target.value;
                                            setFields(newFields);
                                        }}
                                        className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Long Text</option>
                                        <option value="number">Number</option>
                                        <option value="email">Email</option>
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Required</label>
                                        <input 
                                            type="checkbox" 
                                            checked={field.required}
                                            onChange={(e) => {
                                                const newFields = [...fields];
                                                newFields[index].required = e.target.checked;
                                                setFields(newFields);
                                            }}
                                            className="w-4 h-4 rounded-lg bg-white border-slate-200"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                        <Settings2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => removeField(field.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormBuilder;
