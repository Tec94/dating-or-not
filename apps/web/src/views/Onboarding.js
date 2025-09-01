import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useUpdateUserMutation, useUploadPhotoMutation } from '../store/services/api';
const INTEREST_OPTIONS = [
    'Coffee', 'Wine', 'Travel', 'Hiking', 'Fitness', 'Music', 'Art', 'Reading',
    'Cooking', 'Dancing', 'Sports', 'Gaming', 'Photography', 'Movies', 'Theater',
    'Tech', 'Fashion', 'Yoga', 'Dogs', 'Cats', 'Concerts', 'Beaches', 'Mountains'
];
const STEP_TITLES = [
    'Basic Information',
    'About You',
    'Your Photos',
    'Your Interests',
    'Dating Preferences',
    'Privacy Settings'
];
export default function Onboarding() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);
    const [currentStep, setCurrentStep] = useState(0);
    const [updateUser] = useUpdateUserMutation();
    const [uploadPhoto] = useUploadPhotoMutation();
    const [data, setData] = useState({
        age: 25,
        gender: 'male',
        location: { lat: 0, lng: 0, city: '' },
        bio: '',
        photos: [],
        interests: [],
        ageRange: [22, 35],
        maxDistance: 25,
        lookingFor: 'both',
        consentBetAnalysis: false,
        hideFromBetting: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    // Redirect if user is not logged in
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);
    const updateData = (updates) => {
        setData(prev => ({ ...prev, ...updates }));
        // Clear related errors
        setErrors(prev => {
            const newErrors = { ...prev };
            Object.keys(updates).forEach(key => delete newErrors[key]);
            return newErrors;
        });
    };
    const validateStep = (step) => {
        const newErrors = {};
        switch (step) {
            case 0: // Basic Info
                if (data.age < 18 || data.age > 100)
                    newErrors.age = 'Age must be between 18 and 100';
                if (!data.gender)
                    newErrors.gender = 'Please select your gender';
                if (!data.location.city)
                    newErrors.location = 'Please set your location';
                break;
            case 1: // About You
                if (data.bio.length < 20)
                    newErrors.bio = 'Bio must be at least 20 characters';
                if (data.bio.length > 500)
                    newErrors.bio = 'Bio must be less than 500 characters';
                break;
            case 2: // Photos
                if (data.photos.length < 2)
                    newErrors.photos = 'Please upload at least 2 photos';
                if (data.photos.length > 6)
                    newErrors.photos = 'Maximum 6 photos allowed';
                break;
            case 3: // Interests
                if (data.interests.length < 3)
                    newErrors.interests = 'Please select at least 3 interests';
                if (data.interests.length > 10)
                    newErrors.interests = 'Maximum 10 interests allowed';
                break;
            case 4: // Preferences
                if (data.ageRange[0] < 18)
                    newErrors.ageRange = 'Minimum age must be 18+';
                if (data.ageRange[1] > 100)
                    newErrors.ageRange = 'Maximum age must be under 100';
                if (data.ageRange[0] >= data.ageRange[1])
                    newErrors.ageRange = 'Invalid age range';
                if (data.maxDistance < 1 || data.maxDistance > 100)
                    newErrors.maxDistance = 'Distance must be 1-100 miles';
                break;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEP_TITLES.length - 1));
        }
    };
    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };
    const handlePhotoUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('photo', file);
            const result = await uploadPhoto(formData).unwrap();
            updateData({ photos: [...data.photos, result.url] });
        }
        catch (error) {
            setErrors({ photos: 'Failed to upload photo. Please try again.' });
        }
    };
    const removePhoto = (index) => {
        updateData({ photos: data.photos.filter((_, i) => i !== index) });
    };
    const toggleInterest = (interest) => {
        const isSelected = data.interests.includes(interest);
        if (isSelected) {
            updateData({ interests: data.interests.filter(i => i !== interest) });
        }
        else if (data.interests.length < 10) {
            updateData({ interests: [...data.interests, interest] });
        }
    };
    const finishOnboarding = async () => {
        if (!validateStep(currentStep))
            return;
        setLoading(true);
        try {
            await updateUser({
                id: user.id,
                age: data.age,
                gender: data.gender,
                location: data.location,
                bio: data.bio,
                photos: data.photos,
                preferences: {
                    ageRange: data.ageRange,
                    distance: data.maxDistance,
                    interests: data.interests
                },
                'privacy.consentBetAnalysis': data.consentBetAnalysis,
                'privacy.hideFromBetting': data.hideFromBetting
            }).unwrap();
            // Navigate to main app
            navigate('/dating');
        }
        catch (error) {
            setErrors({ general: 'Failed to save profile. Please try again.' });
        }
        finally {
            setLoading(false);
        }
    };
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Basic Information
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/90 mb-2", children: "Age" }), _jsx("input", { type: "number", value: data.age, onChange: (e) => updateData({ age: parseInt(e.target.value) || 18 }), className: "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none", min: "18", max: "100" }), errors.age && _jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.age })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/90 mb-2", children: "Gender" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: ['male', 'female', 'non-binary', 'other'].map(gender => (_jsx("button", { onClick: () => updateData({ gender }), className: `px-4 py-3 rounded-lg border transition-colors ${data.gender === gender
                                            ? 'bg-brand-pink border-brand-pink text-white'
                                            : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`, children: gender.charAt(0).toUpperCase() + gender.slice(1) }, gender))) }), errors.gender && _jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.gender })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/90 mb-2", children: "Location" }), _jsx("input", { type: "text", value: data.location.city, onChange: (e) => updateData({ location: { ...data.location, city: e.target.value } }), placeholder: "City, State", className: "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none placeholder-white/50" }), errors.location && _jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.location })] })] }));
            case 1: // About You
                return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-white/90 mb-2", children: ["Tell us about yourself", _jsxs("span", { className: "text-white/60 ml-2", children: ["(", data.bio.length, "/500)"] })] }), _jsx("textarea", { value: data.bio, onChange: (e) => updateData({ bio: e.target.value }), placeholder: "Write something interesting about yourself that others would want to know...", rows: 6, maxLength: 500, className: "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none placeholder-white/50 resize-none" }), errors.bio && _jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.bio })] }) }));
            case 2: // Photos
                return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-white/90 mb-2", children: ["Your Photos (", data.photos.length, "/6)"] }), _jsx("p", { className: "text-white/60 text-sm mb-4", children: "Add 2-6 photos that show your personality. Your first photo will be your main profile picture." }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: [data.photos.map((photo, index) => (_jsxs("div", { className: "relative aspect-square", children: [_jsx("img", { src: photo, alt: `Photo ${index + 1}`, className: "w-full h-full object-cover rounded-lg" }), _jsx("button", { onClick: () => removePhoto(index), className: "absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600", children: "\u00D7" }), index === 0 && (_jsx("div", { className: "absolute bottom-2 left-2 bg-brand-pink text-white text-xs px-2 py-1 rounded", children: "Main" }))] }, index))), data.photos.length < 6 && (_jsxs("label", { className: "aspect-square border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-pink/50 transition-colors", children: [_jsx("svg", { className: "w-8 h-8 text-white/60 mb-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }), _jsx("span", { className: "text-white/60 text-sm", children: "Add Photo" }), _jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file)
                                                        handlePhotoUpload(file);
                                                } })] }))] }), errors.photos && _jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.photos })] }) }));
            case 3: // Interests
                return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-white/90 mb-2", children: ["Your Interests (", data.interests.length, "/10)"] }), _jsx("p", { className: "text-white/60 text-sm mb-4", children: "Select 3-10 interests to help us find compatible matches." }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: INTEREST_OPTIONS.map(interest => (_jsx("button", { onClick: () => toggleInterest(interest), disabled: !data.interests.includes(interest) && data.interests.length >= 10, className: `px-4 py-2 rounded-lg border transition-colors text-sm ${data.interests.includes(interest)
                                        ? 'bg-brand-pink border-brand-pink text-white'
                                        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'}`, children: interest }, interest))) }), errors.interests && _jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.interests })] }) }));
            case 4: // Dating Preferences
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-white/90 mb-2", children: ["Age Range: ", data.ageRange[0], " - ", data.ageRange[1]] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs text-white/60", children: "Min Age" }), _jsx("input", { type: "range", min: "18", max: "100", value: data.ageRange[0], onChange: (e) => updateData({ ageRange: [parseInt(e.target.value), data.ageRange[1]] }), className: "w-full", "aria-label": "Minimum age preference" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs text-white/60", children: "Max Age" }), _jsx("input", { type: "range", min: "18", max: "100", value: data.ageRange[1], onChange: (e) => updateData({ ageRange: [data.ageRange[0], parseInt(e.target.value)] }), className: "w-full", "aria-label": "Maximum age preference" })] })] }), errors.ageRange && _jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.ageRange })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-white/90 mb-2", children: ["Maximum Distance: ", data.maxDistance, " miles"] }), _jsx("input", { type: "range", min: "1", max: "100", value: data.maxDistance, onChange: (e) => updateData({ maxDistance: parseInt(e.target.value) }), className: "w-full", "aria-label": "Maximum distance preference" }), errors.maxDistance && _jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.maxDistance })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/90 mb-2", children: "Looking For" }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: ['casual', 'serious', 'both'].map(type => (_jsx("button", { onClick: () => updateData({ lookingFor: type }), className: `px-4 py-3 rounded-lg border transition-colors ${data.lookingFor === type
                                            ? 'bg-brand-pink border-brand-pink text-white'
                                            : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`, children: type.charAt(0).toUpperCase() + type.slice(1) }, type))) })] })] }));
            case 5: // Privacy Settings
                return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-white/5 rounded-lg p-4 border border-white/10", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium text-white mb-1", children: "Betting Analysis Consent" }), _jsx("p", { className: "text-white/60 text-sm", children: "Allow us to analyze your dating patterns to improve betting odds and provide personalized insights." })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer ml-4", children: [_jsx("input", { type: "checkbox", checked: data.consentBetAnalysis, onChange: (e) => updateData({ consentBetAnalysis: e.target.checked }), className: "sr-only peer", "aria-label": "Consent to betting analysis" }), _jsx("div", { className: "w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink" })] })] }) }), _jsx("div", { className: "bg-white/5 rounded-lg p-4 border border-white/10", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium text-white mb-1", children: "Hide from Betting" }), _jsx("p", { className: "text-white/60 text-sm", children: "Prevent others from creating betting markets about your dates and relationships." })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer ml-4", children: [_jsx("input", { type: "checkbox", checked: data.hideFromBetting, onChange: (e) => updateData({ hideFromBetting: e.target.checked }), className: "sr-only peer", "aria-label": "Hide from betting markets" }), _jsx("div", { className: "w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink" })] })] }) })] }) }));
            default:
                return null;
        }
    };
    if (!user) {
        return _jsx("div", { children: "Redirecting..." });
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-brand-dark to-black", children: _jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Complete Your Profile" }), _jsxs("span", { className: "text-white/60 text-sm", children: [currentStep + 1, " of ", STEP_TITLES.length] })] }), _jsx("div", { className: "w-full bg-white/20 rounded-full h-2", children: _jsx("div", { className: "bg-brand-pink h-2 rounded-full transition-all duration-300", style: { width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` } }) })] }), _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { duration: 0.3 }, className: "glass rounded-2xl p-6 mb-8", children: [_jsx("h2", { className: "text-xl font-semibold text-white mb-6", children: STEP_TITLES[currentStep] }), renderStepContent(), errors.general && (_jsx("div", { className: "mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm", children: errors.general }))] }, currentStep), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("button", { onClick: prevStep, disabled: currentStep === 0, className: "px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed", children: "Previous" }), currentStep === STEP_TITLES.length - 1 ? (_jsx("button", { onClick: finishOnboarding, disabled: loading, className: "px-8 py-3 rounded-lg bg-brand-pink text-white hover:bg-brand-pink/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? 'Saving...' : 'Complete Profile' })) : (_jsx("button", { onClick: nextStep, className: "px-6 py-3 rounded-lg bg-brand-pink text-white hover:bg-brand-pink/90 transition-colors font-medium", children: "Next" }))] })] }) }));
}
