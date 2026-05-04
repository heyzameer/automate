import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Upload,
    X,
    Info,
    IndianRupee,
    Save,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    RotateCw,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn, handleUpgradePlan } from '../../lib/utils';
import { useVehicles } from '../../hooks/useVehicles';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { vehicleService } from '../../services/vehicle.service';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store';
import { store } from '../../store';
import {
    fetchFormConfig,
    fetchBrands,
    fetchModels,
    clearModels,
    selectFormFields,
    selectBrands,
    selectModels,
    selectFormReady,
    selectModelsLoading,
} from '../../store/slices/vehicleFormSlice';
import { selectTenant } from '../../store/slices/tenantSlice';
import { LayoutGrid, AlertTriangle, ArrowUpCircle } from 'lucide-react';

interface AddVehicleProps {
    isEdit?: boolean;
}

export default function AddVehicle({ isEdit = false }: AddVehicleProps) {
    const navigate = useNavigate();
    const { id } = useParams();
    const { saving, createVehicle, updateVehicle } = useVehicles(false);
    const { getStoredUser } = useAuth();
    const user = getStoredUser();
    const dispatch = useAppDispatch();
    const skipNextCodeCheck = useRef(false);

    // ── Redux state (cached, no duplicate fetches) ────────────────────────
    const reduxFields = useAppSelector(selectFormFields);
    const brands = useAppSelector(selectBrands);
    const models = useAppSelector(selectModels);
    const formReady = useAppSelector(selectFormReady);
    const loadingModels = useAppSelector(selectModelsLoading);

    // ── Local state ──────────────────────────────────────────────────────
    // enrichedFields = Redux fields + injected fields (car_code, financials, etc.)
    const [enrichedFields, setEnrichedFields] = useState<any[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [files, setFiles] = useState<(File & { preview: string })[]>([]);
    const [spinFiles, setSpinFiles] = useState<(File & { preview: string })[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [existingSpinImages, setExistingSpinImages] = useState<string[]>([]);
    const [removedImages, setRemovedImages] = useState<string[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({ service_history: [] });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Plan Governance ──────────────────────────────────────────────────
    const tenant = useAppSelector(selectTenant);
    const { vehicles } = useVehicles(false);
    const isLimitReached = !!(!isEdit && tenant && tenant.limits?.maxCars !== undefined && (vehicles?.length || 0) >= tenant.limits.maxCars);

    // ── Helper: inject extra fields on top of raw server fields ──────────
    const buildEnrichedFields = (rawFields: any[]): any[] => {
        const result = [...rawFields];

        // 1. Car ID field
        if (!result.some((f) => f.name === 'car_code')) {
            result.unshift({
                name: 'car_code',
                label: 'Car ID (e.g. car01)',
                type: 'text',
                required: true,
                category: 'basic',
                placeholder: 'Auto-generated or custom code',
            });
        }

        // 2. Financial & compliance fields
        const financialFields = [
            { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, category: 'pricing', placeholder: 'Price paid to buy this car' },
            { name: 'refurbishmentCost', label: 'Refurbishment Cost', type: 'number', required: false, category: 'pricing', placeholder: 'Money spent on repairs/cleaning' },
            { name: 'otherExpenses', label: 'Other Expenses', type: 'number', required: false, category: 'pricing', placeholder: 'Taxes, transport, etc.' },
            { name: 'rcNumber', label: 'RC Number', type: 'text', required: false, category: 'other', placeholder: 'Registration Number' },
            { name: 'rcExpiry', label: 'RC Expiry Date', type: 'date', required: false, category: 'other' },
            { name: 'insuranceExpiry', label: 'Insurance Expiry Date', type: 'date', required: false, category: 'other' },
        ];
        // 3. Technical & other fields required for showroom mapping
        const additionalFields = [
            { name: 'body_type', label: 'Body Type', type: 'select', required: false, category: 'technical', options: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Van', 'Truck', 'Bike'] },
            { name: 'hp', label: 'Horse Power (HP)', type: 'number', required: false, category: 'technical', placeholder: 'e.g. 150' },
            { name: 'engine_displacement', label: 'Engine Capacity (CC)', type: 'number', required: false, category: 'technical', placeholder: 'e.g. 1498' },
            { name: 'location', label: 'Showroom Location', type: 'text', required: false, category: 'basic', placeholder: 'e.g. South Delhi Showroom' },
            { name: 'spare_keys', label: 'Spare Keys', type: 'number', required: false, category: 'other', placeholder: 'Number of spare keys' },
            { name: 'insurance_status', label: 'Insurance Status', type: 'select', required: false, category: 'other', options: ['Valid', 'Expired', 'Not Available'] },
            { name: 'plate_number', label: 'License Plate (Public)', type: 'text', required: false, category: 'other', placeholder: 'e.g. MH01AB1234' },
        ];

        financialFields.forEach((ff) => {
            if (!result.some((f) => f.name === ff.name)) result.push(ff);
        });

        additionalFields.forEach((af) => {
            if (!result.some((f) => f.name === af.name)) result.push(af);
        });

        return result;
    };

    useEffect(() => {
        const init = async () => {
            setLoadingConfig(true);

            // Dispatch guarded thunks — won't hit server if already cached
            const [configResult] = await Promise.all([
                dispatch(fetchFormConfig()),
                dispatch(fetchBrands()),
            ]);

            // Get next car code only for new vehicles (always fresh)
            let nextCode = '';
            if (!isEdit) {
                try { nextCode = await vehicleService.getNextCode(); } catch { /* noop */ }
            }

            // Read fields from the live store state after dispatches settle.
            // We can't use the `reduxFields` closure — it captured the value
            // from the render before this effect ran (empty on first mount).
            const currentFields = store.getState().vehicleForm.fields;
            const rawFields = fetchFormConfig.fulfilled.match(configResult)
                ? (configResult.payload?.fields?.filter((f: any) => f.isActive) ?? [])
                : currentFields; // cache hit — thunk was skipped, fields already in store

            const allFields = buildEnrichedFields(rawFields);
            setEnrichedFields(allFields);

            // Build initial form values
            const initial: Record<string, any> = { service_history: [] };
            allFields.forEach((f: any) => {
                initial[f.name] = f.defaultValue ?? (f.type === 'number' ? 0 : '');
            });
            if (!isEdit) {
                initial['car_code'] = nextCode;
                // Flag so the debounce effect doesn't immediately re-check
                // the just-fetched code (it's already guaranteed unique)
                skipNextCodeCheck.current = true;
            }
            setFormData(initial);

            // Edit mode: fetch vehicle and pre-populate form
            if (isEdit && id) {
                try {
                    const vehicle = await vehicleService.getById(id);
                    if (vehicle) {
                        const attrs: Record<string, any> = {
                            ...(vehicle.attributes || {}),
                            purchasePrice: vehicle.purchasePrice,
                            refurbishmentCost: vehicle.refurbishmentCost,
                            otherExpenses: vehicle.otherExpenses,
                            rcNumber: vehicle.rcNumber,
                            insuranceExpiry: vehicle.insuranceExpiry
                                ? new Date(vehicle.insuranceExpiry).toISOString().split('T')[0]
                                : '',
                            status: vehicle.status,
                            service_history: vehicle.service_history || [],
                        };
                        setFormData(attrs);

                        // Pre-load models for the saved brand — read current brands
                        // from store (not the stale closure)
                        if (attrs.brand) {
                            const currentBrands = store.getState().vehicleForm.brands;
                            const selectedBrand = currentBrands.find((b: any) => b.name === attrs.brand);
                            if (selectedBrand) dispatch(fetchModels(selectedBrand._id));
                        }

                        if (vehicle.images?.length) setExistingImages(vehicle.images);
                        if (vehicle.spin_images?.length) setExistingSpinImages(vehicle.spin_images);
                    }
                } catch { toast.error('Failed to load vehicle details'); }
            }

            setLoadingConfig(false);
        };

        init();
    }, [isEdit, id]);

    const onDrop = (acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }))]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, 
        accept: { 'image/*': [] },
        multiple: true,
        maxFiles: 15
    });

    const { getRootProps: getSpinRootProps, getInputProps: getSpinInputProps, isDragActive: isSpinDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            setSpinFiles(prev => [...prev, ...acceptedFiles.map(file => Object.assign(file, {
                preview: URL.createObjectURL(file)
            }))]);
        },
        accept: { 'image/*': [] },
        multiple: true,
        maxFiles: 50 // Increased for smoother 360 spin
    });

    const removeFile = (name: string, isSpin = false) => {
        if (isSpin) {
            setSpinFiles(spinFiles.filter(f => f.name !== name));
        } else {
            setFiles(files.filter(f => f.name !== name));
        }
    };

    const removeExistingImage = (url: string, isSpin = false) => {
        if (isSpin) {
            setExistingSpinImages(existingSpinImages.filter(u => u !== url));
        } else {
            setExistingImages(existingImages.filter(u => u !== url));
        }
        setRemovedImages(prev => [...prev, url]);
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? Number(value) 
                  : (e.target as any).type === 'checkbox' ? (e.target as any).checked 
                  : value;

        setFormData(prev => ({ ...prev, [name]: val }));

        // Handle Hierarchical Brand -> Model fetch via Redux (cache-aware)
        if (name === 'brand') {
            setFormData(prev => ({ ...prev, model: '' }));
            if (val) {
                const selectedBrand = brands.find(b => b.name === val);
                if (selectedBrand) {
                    dispatch(fetchModels(selectedBrand._id));
                }
            }
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const [codeError, setCodeError] = useState<string | null>(null);

    // Debounced Car Code Uniqueness Check
    useEffect(() => {
        const checkUnique = async () => {
            const code = formData['car_code'];
            if (!code || isEdit) return;

            // Skip the very first check when code was just auto-populated by init()
            if (skipNextCodeCheck.current) {
                skipNextCodeCheck.current = false;
                return;
            }

            try {
                setIsCheckingCode(true);
                const isAvailable = await vehicleService.checkCarCode(code);
                if (!isAvailable) {
                    setCodeError(`ID "${code}" is already in use`);
                } else {
                    setCodeError(null);
                }
            } catch (err) {
                console.error('Code check failed', err);
            } finally {
                setIsCheckingCode(false);
            }
        };

        const timer = setTimeout(checkUnique, 600);
        return () => clearTimeout(timer);
    }, [formData.car_code, isEdit]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        // 0. Image Validation (Required)
        if (!isEdit && files.length === 0) {
            toast.error('At least one vehicle image is required');
            newErrors['images'] = 'Image required';
            return false;
        }
        
        if (isEdit && files.length === 0 && existingImages.length === 0) {
            toast.error('At least one vehicle image is required');
            newErrors['images'] = 'Image required';
            return false;
        }

        const currentYear = new Date().getFullYear();

        // Include Car ID uniqueness error
        if (codeError) {
            newErrors['car_code'] = codeError;
        }

        enrichedFields.forEach(field => {
            const value = formData[field.name];
            
            if (field.required) {
                if (value === undefined || value === null || value === '' || (field.type === 'number' && isNaN(Number(value)))) {
                    newErrors[field.name] = `${field.label} is required`;
                }
            }

            // Specific Domain Validation
            if (value) {
                if (field.name.includes('year')) {
                    const year = Number(value);
                    if (year < 1900 || year > currentYear) {
                        newErrors[field.name] = `Year must be 1900-${currentYear}`;
                    }
                }
                
                if (field.name === 'exterior_color' || field.name === 'color') {
                    if (/\d/.test(String(value))) {
                        newErrors[field.name] = `Color cannot contain numbers`;
                    } else if (String(value).length > 30) {
                        newErrors[field.name] = `Color name too long`;
                    }
                }

                if (field.name === 'registration_year') {
                    const manuYearField = formData['manufacturing_year'] || formData['year_of_manufacture'];
                    if (manuYearField && Number(value) < Number(manuYearField)) {
                        newErrors[field.name] = `Cannot be before Manu. Year`;
                    }
                }
            }
        });

        setErrors(newErrors);
        
        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fill in all required fields correctly');
            // Scroll to first error
            const firstErrorField = Object.keys(newErrors)[0];
            const element = document.getElementsByName(firstErrorField)[0];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        try {
            setIsSubmitting(true);
            let imageUrls: string[] = [];
            let spinUrls: string[] = [];
            
            // 1. Upload images to Cloudinary if any
            if (files.length > 0) {
                const toastId = toast.loading('Uploading images...');
                try {
                    imageUrls = await vehicleService.uploadImages(files);
                    toast.success('Images uploaded!', { id: toastId });
                } catch (err) {
                    toast.error('Image upload failed', { id: toastId });
                    setIsSubmitting(false);
                    return;
                }
            }

            // 1b. Upload spin images
            if (spinFiles.length > 0) {
                const toastId = toast.loading('Uploading 360 images...');
                try {
                    spinUrls = await vehicleService.uploadImages(spinFiles);
                    toast.success('360 images uploaded!', { id: toastId });
                } catch (err) {
                    toast.error('360 upload failed', { id: toastId });
                    setIsSubmitting(false);
                    return;
                }
            }

            // 2. Create or Update vehicle
            let success = false;
            const payload = {
                ...formData,
                images: imageUrls.length > 0 ? imageUrls : (isEdit ? undefined : []),
                spin_images: spinUrls.length > 0 ? spinUrls : (isEdit ? undefined : []),
                removedImages: isEdit ? removedImages : undefined,
            };

            if (isEdit && id) {
                success = await updateVehicle(id, payload as any);
            } else {
                success = await createVehicle(payload as any);
            }
            
            if (success) navigate(ROUTES.VEHICLES.BASE);
        } catch (err: any) {
            console.error('Submission failed', err);
            toast.error(err.message || 'An unexpected error occurred during submission');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingConfig) {
        return (
            <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-400 font-semibold text-sm animate-pulse">Loading form configuration...</p>
            </div>
        );
    }

    const categories = ['basic', 'technical', 'pricing', 'other'];

    return (
        <div className="w-full">

            {/* ── Sticky Header ─────────────────────────────────────────── */}
            <header className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl shadow-sm z-20 mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-indigo-50 rounded-xl transition-all group">
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
                        <p className="text-xs text-slate-400">Fill in all sections then publish</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-slate-500 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                        Discard
                    </button>
                    <button
                        form="vehicle-form"
                        type="submit"
                        disabled={saving || isSubmitting || isLimitReached}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-black text-sm hover:from-indigo-700 hover:to-indigo-800 active:scale-95 transition-all shadow-lg shadow-indigo-200/60 disabled:opacity-60 disabled:from-slate-400 disabled:to-slate-500"
                    >
                        {(saving || isSubmitting) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEdit ? 'Save Changes' : 'Publish to Showroom'}
                    </button>
                </div>
            </header>

            {/* ── Form Content ────────────────────────────────── */}
            <div className="py-6">
                <div className="max-w-3xl mx-auto px-6">
                    {/* Limit Reached Warning */}
                    {isLimitReached && (
                        <div className="bg-rose-50 border border-rose-100 p-10 rounded-[2.5rem] flex flex-col items-center text-center gap-4 mb-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="w-20 h-20 bg-rose-100 rounded-[2rem] flex items-center justify-center text-rose-600 mb-2 shadow-inner">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Limit Reached</h3>
                            <p className="text-slate-500 text-sm font-medium max-w-md leading-relaxed">
                                Your current <span className="font-black text-rose-600 uppercase">{(tenant?.plan || 'Custom').replace('_', ' ')}</span> plan allows up to <span className="font-black text-slate-900">{tenant?.limits?.maxCars} vehicles</span> in the showroom. 
                                Please upgrade your plan or remove existing listings to add more.
                            </p>
                            <div className="flex gap-3 mt-4">
                                <button 
                                    onClick={() => handleUpgradePlan(user, tenant)}
                                    className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 transform hover:-translate-y-1 active:scale-95"
                                >
                                    Upgrade My Plan
                                </button>
                                <button 
                                    onClick={() => navigate(ROUTES.VEHICLES.BASE)}
                                    className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Manage Inventory
                                </button>
                            </div>
                        </div>
                    )}

                    {!isLimitReached && (
                        <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-5">

                        {/* Dynamic category sections */}
                        {categories.map(cat => {
                            const catFields = enrichedFields.filter(f => f.category === cat);
                            if (!catFields.length) return null;
                            return (
                                <section
                                    key={cat}
                                    id={cat}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-4"
                                >
                                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/60">
                                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{cat} Details</h3>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {catFields.map(field => (
                                            <div key={field.name} className="space-y-1.5">
                                                <label className={cn('text-[11px] font-black uppercase tracking-wider', errors[field.name] ? 'text-rose-500' : 'text-slate-400')}>
                                                    {field.label}{field.required && <span className="text-indigo-500 ml-0.5">*</span>}
                                                </label>
                                                {field.type === 'select' ? (
                                                    <div>
                                                        <select
                                                            name={field.name}
                                                            value={formData[field.name] || ''}
                                                            onChange={handleChange}
                                                            className={cn('w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-slate-50 focus:bg-white', errors[field.name] ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100')}
                                                        >
                                                            <option value="">Select {field.label}</option>
                                                            {field.name === 'brand'
                                                                ? brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)
                                                                : field.name === 'model'
                                                                    ? (loadingModels ? <option disabled>Loading...</option> : models.map(m => <option key={m._id} value={m.name}>{m.name}</option>))
                                                                    : field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)
                                                            }
                                                        </select>
                                                        {errors[field.name] && <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-wide">{errors[field.name]}</p>}
                                                    </div>
                                                ) : field.type === 'boolean' ? (
                                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer hover:border-indigo-200 transition-all select-none">
                                                        <input type="checkbox" name={field.name} checked={!!formData[field.name]} onChange={handleChange} className="w-4 h-4 rounded accent-indigo-600" />
                                                        <span className="text-sm text-slate-600 font-medium">Yes</span>
                                                    </label>
                                                ) : (
                                                    <div className="relative">
                                                        {field.name === 'price' && <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
                                                        <input
                                                            type={
                                                                field.name.toLowerCase().includes('color') ? 'text'
                                                                : field.type === 'number' ? 'number'
                                                                : field.type === 'date' ? 'date'
                                                                : 'text'
                                                            }
                                                            name={field.name}
                                                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                                            value={formData[field.name] || ''}
                                                            onChange={handleChange}
                                                            className={cn(
                                                                'w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-300',
                                                                field.name === 'price' && 'pl-9',
                                                                field.name === 'car_code' && 'pr-9',
                                                                (errors[field.name] || (field.name === 'car_code' && codeError))
                                                                    ? 'border-rose-300 focus:border-rose-500'
                                                                    : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                                                            )}
                                                        />
                                                        {field.name === 'car_code' && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                {isCheckingCode ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                                                    : formData.car_code && !codeError ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                    : null}
                                                            </div>
                                                        )}
                                                        {(errors[field.name] || (field.name === 'car_code' && codeError)) && (
                                                            <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-wide">{errors[field.name] || codeError}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}

                        {/* Service History */}
                        <section
                            id="history"
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm scroll-mt-4"
                        >
                            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/60 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Service &amp; Repair History</h3>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, service_history: [...(prev.service_history || []), { date: new Date().toISOString().split('T')[0], type: '', cost: 0, notes: '' }] }))}
                                    className="text-[11px] font-black text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all uppercase tracking-widest"
                                >
                                    + Add Record
                                </button>
                            </div>
                            <div className="p-6 space-y-3">
                                {(!formData.service_history?.length) ? (
                                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No records yet</p>
                                    </div>
                                ) : (formData.service_history || []).map((r: any, i: number) => (
                                    <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group/item relative">
                                        {[
                                            { label: 'Date', type: 'date', key: 'date', placeholder: '' },
                                            { label: 'Type', type: 'text', key: 'type', placeholder: 'e.g. Oil Change' },
                                            { label: 'Cost ₹', type: 'number', key: 'cost', placeholder: '0' },
                                            { label: 'Notes', type: 'text', key: 'notes', placeholder: 'Optional' },
                                        ].map(({ label, type, key, placeholder }) => (
                                            <div key={key}>
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
                                                <input
                                                    type={type}
                                                    value={r[key]}
                                                    placeholder={placeholder}
                                                    onChange={e => {
                                                        const h = [...formData.service_history];
                                                        h[i] = { ...h[i], [key]: type === 'number' ? Number(e.target.value) : e.target.value };
                                                        setFormData(p => ({ ...p, service_history: h }));
                                                    }}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white transition-all"
                                                />
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, service_history: p.service_history.filter((_: any, idx: number) => idx !== i) }))}
                                            className="absolute top-3 right-3 p-1.5 text-rose-400 opacity-0 group-hover/item:opacity-100 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Gallery */}
                        <section
                            id="media"
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm scroll-mt-4"
                        >
                            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/60">
                                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                    <Upload className="w-3.5 h-3.5 text-indigo-500" /> Gallery
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div
                                    {...getRootProps()}
                                    className={cn('cursor-pointer p-8 border-2 border-dashed rounded-xl transition-all flex flex-col items-center gap-2', isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80')}
                                >
                                    <input {...getInputProps()} />
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                        <Upload className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">Drop photos here or click to browse</p>
                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-xs text-slate-400 font-medium">Up to 10 images · JPG, PNG, WebP</p>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-100">
                                            <Info size={10} className="text-amber-600" />
                                            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">Limit: 10MB per file · Automatic optimization enabled</span>
                                        </div>
                                    </div>
                                </div>
                                {(files.length > 0 || existingImages.length > 0) && (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                        {existingImages.map((url, i) => (
                                            <div key={`e-${i}`} className="relative group aspect-square rounded-xl overflow-hidden ring-1 ring-slate-100">
                                                <img src={url} className="w-full h-full object-cover" alt="" />
                                                <button type="button" onClick={e => { e.stopPropagation(); removeExistingImage(url); }} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        {files.map(f => (
                                            <div key={f.name} className="relative group aspect-square rounded-xl overflow-hidden ring-1 ring-slate-100">
                                                <img src={f.preview} className="w-full h-full object-cover" alt="" />
                                                <button type="button" onClick={e => { e.stopPropagation(); removeFile(f.name); }} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 360° Spin */}
                        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-8">
                            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/60">
                                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                    <RotateCw className="w-3.5 h-3.5 text-indigo-500" /> 360° Spin View
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div
                                    {...getSpinRootProps()}
                                    className={cn('cursor-pointer p-8 border-2 border-dashed rounded-xl transition-all flex flex-col items-center gap-2', isSpinDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80')}
                                >
                                    <input {...getSpinInputProps()} />
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                        <RotateCw className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">Add 360° image sequence</p>
                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-xs text-slate-400 font-medium">Select 24–36 sequential photos for smooth spin</p>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-100">
                                            <Info size={10} className="text-amber-600" />
                                            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">Max 10MB/frame · Frames are optimized for web</span>
                                        </div>
                                    </div>
                                </div>
                                {(spinFiles.length > 0 || existingSpinImages.length > 0) && (
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {existingSpinImages.length > 0 && (
                                            <div className="flex-1 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-xs font-bold text-slate-600">{existingSpinImages.length} existing frames</span>
                                                <button type="button" onClick={() => existingSpinImages.forEach(u => removeExistingImage(u, true))} className="text-xs font-bold text-rose-400 hover:text-rose-600">Remove all</button>
                                            </div>
                                        )}
                                        {spinFiles.length > 0 && (
                                            <div className="flex-1 flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                                <span className="text-xs font-bold text-indigo-600">{spinFiles.length} new frames ready</span>
                                                <button type="button" onClick={() => setSpinFiles([])} className="text-xs font-bold text-indigo-400 hover:text-indigo-600">Clear</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
