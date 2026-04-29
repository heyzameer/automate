import React, { useState, useEffect } from 'react';
import { 
    Database, 
    Layout, 
    List, 
    Plus, 
    Trash2, 
    Save, 
    Settings2, 
    Loader2, 
    ChevronRight,
    CheckCircle2,
    XCircle,
    Info,
    AlertCircle,
    Check,
    X,
    Grid3X3,
    Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vehicleService } from '../../services/vehicle.service';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

type TabType = 'form' | 'brands' | 'dropdowns';

export default function InventoryConfig() {
    const [activeTab, setActiveTab] = useState<TabType>('form');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form Data
    const [formConfig, setFormConfig] = useState<any>(null);
    const [brands, setBrands] = useState<any[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);
    const [models, setModels] = useState<any[]>([]);
    const [dropdowns, setDropdowns] = useState<Record<string, string[]>>({});
    
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // UI States
    const [newBrandName, setNewBrandName] = useState('');
    const [newBrandCategory, setNewBrandCategory] = useState<'regular' | 'luxury'>('regular');
    const [newModelName, setNewModelName] = useState('');
    const [editingDropdown, setEditingDropdown] = useState<string | null>(null);
    const [dropdownValueInput, setDropdownValueInput] = useState('');
    
    // Add Field States
    const [showAddField, setShowAddField] = useState(false);
    const [newFieldData, setNewFieldData] = useState({
        label: '',
        name: '',
        type: 'text',
        category: 'basic',
        required: false
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [config, brandsList] = await Promise.all([
                vehicleService.getFormConfig(),
                vehicleService.getBrands()
            ]);
            setFormConfig(config);
            setBrands(brandsList || []);
            
            // Fetch dropdowns for all select fields dynamically
            const selectFields = config.fields
                .filter((f: any) => f.type === 'select' && f.name !== 'brand')
                .map((f: any) => f.name);
            
            // Add any common fields that might not be in config yet
            const allDropdowns = Array.from(new Set([...selectFields, 'fuel_type', 'transmission', 'ownership', 'body_type']));

            const dropdownData: Record<string, string[]> = {};
            for (const field of allDropdowns) {
                try {
                    const options = await vehicleService.getDropdownOptions(field);
                    dropdownData[field] = options || [];
                } catch (e) {
                    dropdownData[field] = [];
                }
            }
            setDropdowns(dropdownData);

        } catch (error) {
            toast.error("Failed to load configuration data");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleField = async (fieldName: string, key: 'isActive' | 'required', value: boolean) => {
        try {
            const updated = await vehicleService.updateFormField(fieldName, { [key]: value });
            setFormConfig(updated);
            toast.success(`Field ${key === 'isActive' ? 'visibility' : 'requirement'} updated`);
        } catch (error) {
            toast.error("Failed to update field");
        }
    };

    const handleAddField = async () => {
        if (!newFieldData.label || !newFieldData.name) {
            toast.error("Label and Name are required");
            return;
        }
        try {
            const payload = {
                ...newFieldData,
                order: formConfig?.fields?.length || 0,
                isActive: true
            };
            const updated = await vehicleService.addFormField(payload);
            setFormConfig(updated);
            
            // Add to dropdowns list if it's a select field
            if (payload.type === 'select' && payload.name !== 'brand') {
                setDropdowns(prev => ({ ...prev, [payload.name]: [] }));
            }
            
            setShowAddField(false);
            setNewFieldData({ label: '', name: '', type: 'text', category: 'basic', required: false });
            toast.success("Field added to global configuration");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add field");
        }
    };

    const handleDeleteField = async (fieldName: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Field',
            message: `Are you sure you want to delete ${fieldName}? This affects all showrooms.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await vehicleService.deleteFormField(fieldName);
                    // Re-fetch to get updated state since backend might not return populated form config
                    const config = await vehicleService.getFormConfig();
                    setFormConfig(config);
                    
                    // Remove from dropdowns list if it exists
                    setDropdowns(prev => {
                        const updated = { ...prev };
                        delete updated[fieldName];
                        return updated;
                    });
                    
                    toast.success("Field deleted permanently");
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to delete field");
                }
            }
        });
    };

    const handleAddBrand = async () => {
        if (!newBrandName.trim()) return;
        try {
            const brand = await vehicleService.createBrand(newBrandName, newBrandCategory);
            setBrands([...brands, brand]);
            setNewBrandName('');
            toast.success("Brand added!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add brand");
        }
    };

    const handleDeleteBrand = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove Brand',
            message: "Are you sure? This will not delete existing cars but will remove the brand from the list.",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await vehicleService.deleteBrand(id);
                    setBrands(brands.filter(b => b._id !== id));
                    if (selectedBrand?._id === id) {
                        setSelectedBrand(null);
                        setModels([]);
                    }
                    toast.success("Brand removed");
                } catch (error: any) {
                    toast.error("Failed to delete brand");
                }
            }
        });
    };

    const fetchModels = async (brand: any) => {
        setSelectedBrand(brand);
        try {
            const list = await vehicleService.getModels(brand._id);
            setModels(list || []);
        } catch (error) {
            toast.error("Failed to load models");
        }
    };

    const handleAddModel = async () => {
        if (!newModelName.trim() || !selectedBrand) return;
        try {
            const model = await vehicleService.createModel(newModelName, selectedBrand._id);
            setModels([...models, model]);
            setNewModelName('');
            toast.success("Model added!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add model");
        }
    };

    const handleDeleteModel = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove Model',
            message: "Are you sure you want to delete this model?",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await vehicleService.deleteModel(id);
                    setModels(models.filter(m => m._id !== id));
                    toast.success("Model removed");
                } catch (error: any) {
                    toast.error("Failed to delete model");
                }
            }
        });
    };

    const handleUpdateDropdown = async (field: string) => {
        try {
            await vehicleService.updateDropdown(field, dropdowns[field]);
            setEditingDropdown(null);
            toast.success(`${field.replace('_', ' ')} updated!`);
        } catch (error: any) {
            toast.error("Failed to update dropdown");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing Cloud Config...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-[0.2em] text-xs">
                        <Settings2 size={16} />
                        Administrative
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Inventory Engine</h1>
                    <p className="text-slate-500 font-medium max-w-xl">
                        Control the global dynamic form structure, available brands, models, and predefined dropdown options for all showroom partners.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-2xl flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-sm font-bold text-emerald-700">v{formConfig?.version || '1.0.0'} Active</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-2 bg-slate-100/50 rounded-3xl w-fit border border-slate-200/50">
                {(['form', 'brands', 'dropdowns'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-300 capitalize",
                            activeTab === tab 
                                ? "bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-100" 
                                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                        )}
                    >
                        {tab === 'form' ? 'Form Structure' : tab === 'brands' ? 'Brands & Models' : 'Dropdown Values'}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'form' && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 gap-8"
                    >
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                        <Layout className="text-indigo-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Form Configuration</h3>
                                        <p className="text-sm text-slate-500 font-medium">Fields shown to showrooms when adding cars</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-white rounded-xl border border-slate-100">
                                        Total Fields: {formConfig?.fields?.length || 0}
                                    </div>
                                    <button 
                                        onClick={() => setShowAddField(!showAddField)}
                                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Add Field
                                    </button>
                                </div>
                            </div>

                            {showAddField && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-indigo-50/50 border-b border-indigo-100 p-8"
                                >
                                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-800 mb-6">Create New Field</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Label (UI Name)</label>
                                            <input 
                                                value={newFieldData.label}
                                                onChange={(e) => {
                                                    const label = e.target.value;
                                                    const name = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                                    setNewFieldData({...newFieldData, label, name});
                                                }}
                                                className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none font-bold text-sm"
                                                placeholder="e.g. Mileage"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Internal Name</label>
                                            <input 
                                                value={newFieldData.name}
                                                onChange={(e) => setNewFieldData({...newFieldData, name: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none font-bold text-sm bg-indigo-50/50"
                                                placeholder="e.g. mileage_km"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Field Type</label>
                                            <select 
                                                value={newFieldData.type}
                                                onChange={(e) => setNewFieldData({...newFieldData, type: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none font-bold text-sm bg-white"
                                            >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="select">Dropdown</option>
                                                <option value="boolean">Toggle</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                                            <select 
                                                value={newFieldData.category}
                                                onChange={(e) => setNewFieldData({...newFieldData, category: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none font-bold text-sm bg-white"
                                            >
                                                <option value="basic">Basic Info</option>
                                                <option value="technical">Technical</option>
                                                <option value="pricing">Pricing</option>
                                                <option value="media">Media</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 h-[46px]">
                                            <button 
                                                onClick={() => setNewFieldData({...newFieldData, required: !newFieldData.required})}
                                                className={cn(
                                                    "px-4 rounded-xl text-xs font-bold transition-all flex-1",
                                                    newFieldData.required ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200"
                                                )}
                                            >
                                                {newFieldData.required ? 'Mandatory' : 'Optional'}
                                            </button>
                                            <button 
                                                onClick={handleAddField}
                                                className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex-1"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Field Label & Name</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requirement</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {formConfig?.fields?.map((field: any) => (
                                            <tr key={field.name} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 text-sm">{field.label}</span>
                                                        <code className="text-[10px] text-slate-400 font-mono mt-0.5">{field.name}</code>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                        {field.type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-sm font-medium text-slate-500 capitalize">{field.category || 'Other'}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button 
                                                        onClick={() => handleToggleField(field.name, 'isActive', !field.isActive)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                            field.isActive 
                                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                                                : "bg-rose-50 text-rose-600 border border-rose-100"
                                                        )}
                                                    >
                                                        {field.isActive ? <Check size={14} /> : <X size={14} />}
                                                        {field.isActive ? 'Visible' : 'Hidden'}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button 
                                                        onClick={() => handleToggleField(field.name, 'required', !field.required)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                            field.required 
                                                                ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                                                                : "bg-white text-slate-400 border border-slate-200 hover:border-slate-400"
                                                        )}
                                                    >
                                                        {field.required ? 'Mandatory' : 'Optional'}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button 
                                                        onClick={() => handleDeleteField(field.name)}
                                                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Delete Field"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl shadow-indigo-200">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
                                    <Info size={32} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold">Dynamic Rendering</h4>
                                    <p className="text-indigo-100 text-sm max-w-md">
                                        These changes are reflected instantly across all showroom dashboards. 
                                        Hide fields to simplify the process or make them mandatory to ensure data quality.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'brands' && (
                    <motion.div
                        key="brands"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Brands List */}
                        <div className="lg:col-span-5 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-[700px]">
                            <div className="p-8 border-b border-slate-50 flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                                        <Grid3X3 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Manage Brands</h3>
                                        <p className="text-sm text-slate-500 font-medium">Add or remove car manufacturers</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-2">
                                        <input 
                                            type="text" 
                                            placeholder="Brand Name (e.g. BMW)"
                                            value={newBrandName}
                                            onChange={(e) => setNewBrandName(e.target.value)}
                                            className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setNewBrandCategory('regular')}
                                                className={cn(
                                                    "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                    newBrandCategory === 'regular' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"
                                                )}
                                            >
                                                Regular
                                            </button>
                                            <button 
                                                onClick={() => setNewBrandCategory('luxury')}
                                                className={cn(
                                                    "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                    newBrandCategory === 'luxury' ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white text-slate-400 border-slate-200"
                                                )}
                                            >
                                                Luxury
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAddBrand}
                                        className="bg-indigo-600 text-white p-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex-shrink-0 flex items-center justify-center"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                                {brands.map((brand) => (
                                    <div 
                                        key={brand._id}
                                        onClick={() => fetchModels(brand)}
                                        className={cn(
                                            "group p-5 rounded-[2rem] border transition-all duration-300 cursor-pointer flex items-center justify-between",
                                            selectedBrand?._id === brand._id 
                                                ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-300" 
                                                : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm",
                                                selectedBrand?._id === brand._id ? "bg-white/10" : "bg-slate-50 text-slate-900"
                                            )}>
                                                {brand.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm tracking-tight">{brand.name}</h4>
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest opacity-60",
                                                    brand.category === 'luxury' ? "text-indigo-400" : "text-slate-400"
                                                )}>
                                                    {brand.category || 'Regular'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ChevronRight size={16} className={cn("transition-transform", selectedBrand?._id === brand._id ? "translate-x-1" : "opacity-0 group-hover:opacity-100")} />
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteBrand(brand._id); }}
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Models List */}
                        <div className="lg:col-span-7 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-[700px]">
                            {selectedBrand ? (
                                <>
                                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                                <Car className="text-indigo-600" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">{selectedBrand.name} Models</h3>
                                                <p className="text-sm text-slate-500 font-medium">Add models for this manufacturer</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Model Name (e.g. X5)"
                                                value={newModelName}
                                                onChange={(e) => setNewModelName(e.target.value)}
                                                className="px-5 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm w-48"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddModel()}
                                            />
                                            <button 
                                                onClick={handleAddModel}
                                                className="bg-slate-900 text-white px-6 rounded-2xl hover:bg-slate-800 transition-all font-bold text-sm"
                                            >
                                                Add Model
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8">
                                        {models.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                    <Car size={32} />
                                                </div>
                                                <p className="font-bold text-sm uppercase tracking-widest">No models listed yet</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {models.map((model) => (
                                                    <div 
                                                        key={model._id}
                                                        className="group p-5 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300"
                                                    >
                                                        <span className="font-bold text-slate-700 tracking-tight">{model.name}</span>
                                                        <button 
                                                            onClick={() => handleDeleteModel(model._id)}
                                                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-20 text-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                        <ChevronRight size={40} className="text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Brand</h3>
                                    <p className="text-sm font-medium max-w-xs">Select a manufacturer from the left to view and manage its vehicle models.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'dropdowns' && (
                    <motion.div
                        key="dropdowns"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {Object.entries(dropdowns).map(([field, options]) => (
                            <div key={field} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-[400px]">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 capitalize">{field.replace('_', ' ')}</h3>
                                        <p className="text-xs text-slate-500 font-medium">Standard options for this field</p>
                                    </div>
                                    {editingDropdown === field ? (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleUpdateDropdown(field)}
                                                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                            >
                                                <Save size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setEditingDropdown(null)}
                                                className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setEditingDropdown(field)}
                                            className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 p-6 flex flex-col gap-4">
                                    {editingDropdown === field && (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                placeholder="Add new option..."
                                                value={dropdownValueInput}
                                                onChange={(e) => setDropdownValueInput(e.target.value)}
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm font-bold"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && dropdownValueInput.trim()) {
                                                        const newOptions = [...options, dropdownValueInput.trim()];
                                                        setDropdowns({ ...dropdowns, [field]: newOptions });
                                                        setDropdownValueInput('');
                                                    }
                                                }}
                                            />
                                            <button 
                                                onClick={() => {
                                                    if (dropdownValueInput.trim()) {
                                                        const newOptions = [...options, dropdownValueInput.trim()];
                                                        setDropdowns({ ...dropdowns, [field]: newOptions });
                                                        setDropdownValueInput('');
                                                    }
                                                }}
                                                className="bg-slate-900 text-white px-4 rounded-xl font-bold text-xs"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-wrap gap-2 content-start">
                                        {options.map((opt, idx) => (
                                            <div 
                                                key={idx}
                                                className="group flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-200 transition-all"
                                            >
                                                <span className="text-sm font-bold text-slate-700">{opt}</span>
                                                {editingDropdown === field && (
                                                    <button 
                                                        onClick={() => {
                                                            const newOptions = options.filter((_, i) => i !== idx);
                                                            setDropdowns({ ...dropdowns, [field]: newOptions });
                                                        }}
                                                        className="text-slate-300 hover:text-rose-600 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
