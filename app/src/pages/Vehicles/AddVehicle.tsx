import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useVehicles } from '../../hooks/useVehicles';
import { ROUTES } from '../../constants/routes';
import { vehicleService } from '../../services/vehicle.service';
import toast from 'react-hot-toast';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'boolean';
    options?: string[];
    required: boolean;
    placeholder?: string;
    category?: string;
}

interface AddVehicleProps {
    isEdit?: boolean;
}

export default function AddVehicle({ isEdit = false }: AddVehicleProps) {
    const navigate = useNavigate();
    const { id } = useParams();
    const { saving, createVehicle, updateVehicle } = useVehicles();
    const [fields, setFields] = useState<FormField[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [files, setFiles] = useState<(File & { preview: string })[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoadingConfig(true);
                const [config, brandsList] = await Promise.all([
                    vehicleService.getFormConfig(),
                    vehicleService.getBrands()
                ]);

                if (config && config.fields) {
                    const formFields = config.fields.filter((f: any) => f.isActive);
                    // Dynamically inject Car ID field if it doesn't exist
                    if (!formFields.some((f: any) => f.name === 'car_code')) {
                        formFields.unshift({
                            name: 'car_code',
                            label: 'Car ID (e.g. car01)',
                            type: 'text',
                            required: true,
                            category: 'basic',
                            placeholder: 'Auto-generated or custom code'
                        });
                    }
                    
                    setFields(formFields);
                    
                    // Initialize form data with defaults
                    const initial: Record<string, any> = {};
                    formFields.forEach((f: any) => {
                        initial[f.name] = f.defaultValue || (f.type === 'number' ? 0 : '');
                    });
                     // Generate a random default ID if creating new
                    initial['car_code'] = `car${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`;
                    setFormData(initial);
                }
                setBrands(brandsList || []);

                // If edit mode, fetch vehicle data
                if (isEdit && id) {
                    const vehicle = await vehicleService.getById(id);
                    if (vehicle) {
                        const attrs = vehicle.attributes || {};
                        // Ensure legacy vehicles without an ID get an auto-generated one
                        if (!attrs.car_code) {
                            attrs.car_code = `car${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`;
                        }
                        setFormData(attrs);
                        // If vehicle has a brand, load its models too
                        if (attrs.brand) {
                            const selectedBrand = brandsList.find((b: any) => b.name === attrs.brand);
                            if (selectedBrand) {
                                const modelsList = await vehicleService.getModels(selectedBrand._id);
                                setModels(modelsList || []);
                            }
                        }
                    }
                }
            } catch (err) {
                toast.error('Failed to load form configuration');
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, [isEdit, id]);

    const onDrop = (acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }))]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, 
        accept: { 'image/*': [] },
        maxFiles: 10
    });

    const removeFile = (name: string) => {
        setFiles(files.filter(f => f.name !== name));
    };

    const [loadingModels, setLoadingModels] = useState(false);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? Number(value) 
                  : (e.target as any).type === 'checkbox' ? (e.target as any).checked 
                  : value;

        setFormData(prev => ({ ...prev, [name]: val }));

        // Handle Hierarchical Brand -> Model fetch
        if (name === 'brand') {
            setFormData(prev => ({ ...prev, model: '' })); // Clear previous selection
            setModels([]); // Reset list
            
            if (val) {
                setLoadingModels(true);
                try {
                    // Find brand ID from name
                    const selectedBrand = brands.find(b => b.name === val);
                    if (selectedBrand) {
                        const modelsList = await vehicleService.getModels(selectedBrand._id);
                        setModels(modelsList || []);
                    }
                } catch (err) {
                    console.error('Failed to fetch models for brand', err);
                    toast.error('Could not load models for this brand');
                } finally {
                    setLoadingModels(false);
                }
            }
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        const currentYear = new Date().getFullYear();

        fields.forEach(field => {
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

            // 2. Create or Update vehicle
            let success = false;
            const payload = {
                ...formData,
                images: imageUrls.length > 0 ? imageUrls : (isEdit ? undefined : []),
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
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading dynamic form...</p>
            </div>
        );
    }

    const categories = ['basic', 'technical', 'pricing', 'other'];

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-3 hover:bg-indigo-50 rounded-2xl transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-500 group-hover:text-indigo-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Add Vehicle</h1>
                        <p className="text-gray-500 text-sm">Fill in the dynamically configured details</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                    Live Config Version: 1.0.2
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8">
                    {categories.map(category => {
                        const catFields = fields.filter(f => f.category === category);
                        if (catFields.length === 0) return null;

                        return (
                            <section key={category} className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden group hover:border-indigo-200 transition-all duration-300">
                                <div className="p-6 sm:p-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                                        {category.charAt(0).toUpperCase() + category.slice(1)} Details
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {catFields.map(field => (
                                            <div key={field.name} className={cn("space-y-2", field.type === 'text' && "sm:col-span-1")}>
                                                <label className={cn("text-sm font-bold ml-1 transition-colors", errors[field.name] ? "text-red-500" : "text-gray-700")}>
                                                    {field.label} {field.required && <span className="text-indigo-500">*</span>}
                                                </label>
                                                
                                                 {field.type === 'select' ? (
                                                    <div className="relative">
                                                        <select
                                                            name={field.name}
                                                            value={formData[field.name] || ''}
                                                            onChange={handleChange}
                                                            required={field.required}
                                                            className={cn(
                                                                "w-full px-4 py-3 rounded-2xl border bg-gray-50/50 focus:bg-white focus:ring-4 transition-all outline-none",
                                                                errors[field.name] 
                                                                    ? "border-red-300 ring-4 ring-red-50 focus:ring-red-100 focus:border-red-500" 
                                                                    : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-500"
                                                            )}
                                                        >
                                                            <option value="">Select {field.label}</option>
                                                            {field.name === 'brand' ? (
                                                                brands.map(b => (
                                                                    <option key={b._id} value={b.name}>{b.name}</option>
                                                                ))
                                                            ) : field.name === 'model' ? (
                                                                loadingModels ? (
                                                                    <option disabled>Loading models...</option>
                                                                ) : (
                                                                    models.map(m => (
                                                                        <option key={m._id} value={m.name}>{m.name}</option>
                                                                    ))
                                                                )
                                                            ) : (
                                                                field.options?.map(opt => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))
                                                            )}
                                                        </select>
                                                        {errors[field.name] && (
                                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1 mt-1 block">
                                                                {errors[field.name]}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : field.type === 'boolean' ? (
                                                    <div className={cn(
                                                        "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                                                        errors[field.name] ? "bg-red-50 border-red-200" : "bg-gray-50/50 border-gray-100"
                                                    )}>
                                                        <input
                                                            type="checkbox"
                                                            name={field.name}
                                                            checked={!!formData[field.name]}
                                                            onChange={handleChange}
                                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-600">Yes, it is {field.label.toLowerCase()}</span>
                                                    </div>
                                                ) : (
                                                    <div className="relative group/input">
                                                        {field.name === 'price' && (
                                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                                <IndianRupee className={cn("w-4 h-4", errors[field.name] ? "text-red-400" : "text-gray-400")} />
                                                            </div>
                                                        )}
                                                        <input
                                                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                            name={field.name}
                                                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                                            value={formData[field.name] || ''}
                                                            onChange={handleChange}
                                                            required={field.required}
                                                            className={cn(
                                                                "w-full px-4 py-3 rounded-2xl border bg-gray-50/50 focus:bg-white focus:ring-4 transition-all outline-none",
                                                                field.name === 'price' && "pl-10",
                                                                "placeholder:text-gray-400",
                                                                errors[field.name] 
                                                                    ? "border-red-300 ring-4 ring-red-50 focus:ring-red-100 focus:border-red-500" 
                                                                    : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-500"
                                                            )}
                                                        />
                                                        {errors[field.name] && (
                                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1 mt-1 block">
                                                                {errors[field.name]}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Sidebar: Media & Actions */}
                <div className="space-y-8">
                    {/* Media Section */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <Upload className="w-5 h-5 text-indigo-600" />
                            Gallery
                        </h3>
                        
                        <div {...getRootProps()} className={cn(
                            "group cursor-pointer p-6 border-2 border-dashed rounded-3xl transition-all duration-300",
                            isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50"
                        )}>
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold text-gray-700">Add Photos</p>
                                <p className="text-xs text-gray-400 mt-1">Up to 10 images</p>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                {files.map((file) => (
                                    <div key={file.name} className="relative group rounded-2xl overflow-hidden aspect-square ring-1 ring-gray-100">
                                        <img src={file.preview} className="w-full h-full object-cover" alt="" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-600 transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-200/50">
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Pro Tips
                        </h4>
                        <ul className="text-sm text-indigo-50 space-y-3 opacity-90">
                            <li>• Use high-quality car photos</li>
                            <li>• Ensure your price is competitive</li>
                            <li>• Double check the registration number</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-4 sticky bottom-8 p-1 bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-white/50">
                        <button
                            type="submit"
                            disabled={saving || isSubmitting}
                            className="group relative flex items-center justify-center gap-3 w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200/50 disabled:opacity-50 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 italic" />
                            {(saving || isSubmitting) ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-6 h-6" />
                                    <span>Publish to Digital Showroom</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-full py-4 bg-white text-gray-500 rounded-[2rem] font-bold hover:bg-gray-50 hover:text-gray-900 transition-all border border-gray-100"
                        >
                            Discard & Return to Inventory
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
