import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useGetUserQuery, useUpdateUserMutation, useUploadPhotoMutation } from '../store/services/api';
import Page from '../components/Page';
import { useNavigate } from 'react-router-dom';
const INTEREST_OPTIONS = [
    'Coffee', 'Wine', 'Travel', 'Hiking', 'Fitness', 'Music', 'Art', 'Reading',
    'Cooking', 'Dancing', 'Sports', 'Gaming', 'Photography', 'Movies', 'Theater',
    'Tech', 'Fashion', 'Yoga', 'Dogs', 'Cats', 'Concerts', 'Beaches', 'Mountains'
];
export default function DatingProfile() {
    const navigate = useNavigate();
    const user = useSelector((s) => s.auth.user);
    const { data: fullUser, isLoading } = useGetUserQuery(user?.id || '', { skip: !user });
    const [updateUser] = useUpdateUserMutation();
    const [uploadPhoto] = useUploadPhotoMutation();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        bio: '',
        age: 25,
        photos: [],
        interests: [],
        location: { city: '', lat: 0, lng: 0 },
        preferences: {
            ageRange: [22, 35],
            distance: 25,
            interests: []
        },
        privacy: {
            hideFromBetting: false,
            consentBetAnalysis: false
        }
    });
    // Load user data when available
    useEffect(() => {
        if (fullUser) {
            setFormData({
                bio: fullUser.bio || '',
                age: fullUser.age || 25,
                photos: fullUser.photos || [],
                interests: fullUser.preferences?.interests || [],
                location: fullUser.location || { city: '', lat: 0, lng: 0 },
                preferences: {
                    ageRange: fullUser.preferences?.ageRange || [22, 35],
                    distance: fullUser.preferences?.distance || 25,
                    interests: fullUser.preferences?.interests || []
                },
                privacy: {
                    hideFromBetting: fullUser.privacy?.hideFromBetting || false,
                    consentBetAnalysis: fullUser.privacy?.consentBetAnalysis || false
                }
            });
        }
    }, [fullUser]);
    const handlePhotoUpload = async (file) => {
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('photo', file);
            const result = await uploadPhoto(formDataUpload).unwrap();
            setFormData(prev => ({
                ...prev,
                photos: [...prev.photos, result.url]
            }));
        }
        catch (error) {
            setError('Failed to upload photo. Please try again.');
        }
    };
    const removePhoto = (index) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };
    const toggleInterest = (interest) => {
        setFormData(prev => {
            const isSelected = prev.interests.includes(interest);
            const newInterests = isSelected
                ? prev.interests.filter(i => i !== interest)
                : prev.interests.length < 10
                    ? [...prev.interests, interest]
                    : prev.interests;
            return {
                ...prev,
                interests: newInterests,
                preferences: {
                    ...prev.preferences,
                    interests: newInterests
                }
            };
        });
    };
    const handleSave = async () => {
        if (!user)
            return;
        setLoading(true);
        setError('');
        try {
            await updateUser({
                id: user.id,
                bio: formData.bio,
                age: formData.age,
                photos: formData.photos,
                location: formData.location,
                preferences: formData.preferences,
                'privacy.hideFromBetting': formData.privacy.hideFromBetting,
                'privacy.consentBetAnalysis': formData.privacy.consentBetAnalysis
            }).unwrap();
            setSuccessMessage('Profile updated successfully!');
            setEditing(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (error) {
            setError('Failed to update profile. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    if (!user) {
        return (_jsx(Page, { title: "Dating Profile", children: _jsxs("div", { className: "glass rounded-2xl p-6 text-center", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Please log in" }), _jsx("button", { onClick: () => navigate('/login'), className: "px-4 py-2 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors", children: "Log In" })] }) }));
    }
    if (isLoading) {
        return (_jsx(Page, { title: "Dating Profile", children: _jsxs("div", { className: "glass rounded-2xl p-6 text-center", children: [_jsx("div", { className: "w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-white/70", children: "Loading your profile..." })] }) }));
    }
    return (_jsx(Page, { title: "Dating Profile", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "glass rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white", children: [user.username, "'s Dating Profile"] }), _jsx("p", { className: "text-white/70", children: "Customize your dating profile and preferences" })] }), _jsx("div", { className: "flex gap-3", children: editing ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => {
                                                    setEditing(false);
                                                    setError('');
                                                    // Reset form data
                                                    if (fullUser) {
                                                        setFormData({
                                                            bio: fullUser.bio || '',
                                                            age: fullUser.age || 25,
                                                            photos: fullUser.photos || [],
                                                            interests: fullUser.preferences?.interests || [],
                                                            location: fullUser.location || { city: '', lat: 0, lng: 0 },
                                                            preferences: {
                                                                ageRange: fullUser.preferences?.ageRange || [22, 35],
                                                                distance: fullUser.preferences?.distance || 25,
                                                                interests: fullUser.preferences?.interests || []
                                                            },
                                                            privacy: {
                                                                hideFromBetting: fullUser.privacy?.hideFromBetting || false,
                                                                consentBetAnalysis: fullUser.privacy?.consentBetAnalysis || false
                                                            }
                                                        });
                                                    }
                                                }, className: "px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white", disabled: loading, children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: loading, className: "px-4 py-2 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors text-white disabled:opacity-50", children: loading ? 'Saving...' : 'Save Changes' })] })) : (_jsx("button", { onClick: () => setEditing(true), className: "px-4 py-2 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors text-white", children: "Edit Profile" })) })] }), successMessage && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mt-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400", children: successMessage })), error && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400", children: error }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "glass rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white mb-4", children: "Basic Information" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/90 mb-2", children: "Age" }), editing ? (_jsx("input", { type: "number", value: formData.age, onChange: (e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 18 })), className: "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none", min: "18", max: "100" })) : (_jsxs("p", { className: "text-white text-lg", children: [formData.age, " years old"] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/90 mb-2", children: "Location" }), editing ? (_jsx("input", { type: "text", value: formData.location.city, onChange: (e) => setFormData(prev => ({
                                                        ...prev,
                                                        location: { ...prev.location, city: e.target.value }
                                                    })), placeholder: "City, State", className: "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none placeholder-white/50" })) : (_jsx("p", { className: "text-white text-lg", children: formData.location.city || 'Not specified' }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/90 mb-2", children: "Bio" }), editing ? (_jsx("textarea", { value: formData.bio, onChange: (e) => setFormData(prev => ({ ...prev, bio: e.target.value })), placeholder: "Tell people about yourself...", rows: 4, maxLength: 500, className: "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none placeholder-white/50 resize-none" })) : (_jsx("p", { className: "text-white", children: formData.bio || 'No bio added yet' })), editing && (_jsxs("div", { className: "text-right text-white/60 text-sm mt-1", children: [formData.bio.length, "/500"] }))] })] })] }), _jsxs("div", { className: "glass rounded-2xl p-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-white mb-4", children: ["Photos (", formData.photos.length, "/6)"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [formData.photos.map((photo, index) => (_jsxs("div", { className: "relative aspect-square", children: [_jsx("img", { src: photo, alt: `Photo ${index + 1}`, className: "w-full h-full object-cover rounded-lg" }), editing && (_jsx("button", { onClick: () => removePhoto(index), className: "absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600", children: "\u00D7" })), index === 0 && (_jsx("div", { className: "absolute bottom-2 left-2 bg-brand-pink text-white text-xs px-2 py-1 rounded", children: "Main" }))] }, index))), editing && formData.photos.length < 6 && (_jsxs("label", { className: "aspect-square border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-pink/50 transition-colors", children: [_jsx("svg", { className: "w-8 h-8 text-white/60 mb-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }), _jsx("span", { className: "text-white/60 text-sm", children: "Add Photo" }), _jsx("input", { type: "file", accept: "image/*", className: "hidden", "aria-label": "Upload photo", onChange: (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file)
                                                            handlePhotoUpload(file);
                                                    } })] }))] })] })] }), _jsxs("div", { className: "glass rounded-2xl p-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-white mb-4", children: ["Interests (", formData.interests.length, "/10)"] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3", children: INTEREST_OPTIONS.map(interest => (_jsx("button", { onClick: () => editing && toggleInterest(interest), disabled: !editing || (!formData.interests.includes(interest) && formData.interests.length >= 10), className: `px-3 py-2 rounded-lg text-sm transition-colors ${formData.interests.includes(interest)
                                    ? 'bg-brand-pink text-white'
                                    : editing
                                        ? 'bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                                        : 'bg-white/10 text-white/80'}`, children: interest }, interest))) })] }), _jsxs("div", { className: "glass rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white mb-4", children: "Dating Preferences" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-white/90 mb-2", children: ["Age Range: ", formData.preferences.ageRange[0], " - ", formData.preferences.ageRange[1]] }), editing ? (_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs text-white/60", children: "Min Age" }), _jsx("input", { type: "range", min: "18", max: "100", value: formData.preferences.ageRange[0], onChange: (e) => setFormData(prev => ({
                                                                ...prev,
                                                                preferences: {
                                                                    ...prev.preferences,
                                                                    ageRange: [parseInt(e.target.value), prev.preferences.ageRange[1]]
                                                                }
                                                            })), className: "w-full", "aria-label": "Minimum age preference" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs text-white/60", children: "Max Age" }), _jsx("input", { type: "range", min: "18", max: "100", value: formData.preferences.ageRange[1], onChange: (e) => setFormData(prev => ({
                                                                ...prev,
                                                                preferences: {
                                                                    ...prev.preferences,
                                                                    ageRange: [prev.preferences.ageRange[0], parseInt(e.target.value)]
                                                                }
                                                            })), className: "w-full", "aria-label": "Maximum age preference" })] })] })) : (_jsxs("p", { className: "text-white", children: [formData.preferences.ageRange[0], " - ", formData.preferences.ageRange[1], " years old"] }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-white/90 mb-2", children: ["Maximum Distance: ", formData.preferences.distance, " miles"] }), editing ? (_jsx("input", { type: "range", min: "1", max: "100", value: formData.preferences.distance, onChange: (e) => setFormData(prev => ({
                                                ...prev,
                                                preferences: {
                                                    ...prev.preferences,
                                                    distance: parseInt(e.target.value)
                                                }
                                            })), className: "w-full", "aria-label": "Maximum distance preference" })) : (_jsxs("p", { className: "text-white", children: [formData.preferences.distance, " miles"] }))] })] })] }), _jsxs("div", { className: "glass rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white mb-4", children: "Privacy Settings" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium text-white mb-1", children: "Betting Analysis Consent" }), _jsx("p", { className: "text-white/60 text-sm", children: "Allow us to analyze your dating patterns to improve betting odds and provide personalized insights." })] }), editing ? (_jsxs("label", { className: "relative inline-flex items-center cursor-pointer ml-4", children: [_jsx("input", { type: "checkbox", checked: formData.privacy.consentBetAnalysis, onChange: (e) => setFormData(prev => ({
                                                        ...prev,
                                                        privacy: {
                                                            ...prev.privacy,
                                                            consentBetAnalysis: e.target.checked
                                                        }
                                                    })), className: "sr-only peer", "aria-label": "Consent to betting analysis" }), _jsx("div", { className: "w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink" })] })) : (_jsx("span", { className: `px-3 py-1 rounded-full text-sm ${formData.privacy.consentBetAnalysis ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`, children: formData.privacy.consentBetAnalysis ? 'Enabled' : 'Disabled' }))] }), _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium text-white mb-1", children: "Hide from Betting" }), _jsx("p", { className: "text-white/60 text-sm", children: "Prevent others from creating betting markets about your dates and relationships." })] }), editing ? (_jsxs("label", { className: "relative inline-flex items-center cursor-pointer ml-4", children: [_jsx("input", { type: "checkbox", checked: formData.privacy.hideFromBetting, onChange: (e) => setFormData(prev => ({
                                                        ...prev,
                                                        privacy: {
                                                            ...prev.privacy,
                                                            hideFromBetting: e.target.checked
                                                        }
                                                    })), className: "sr-only peer", "aria-label": "Hide from betting markets" }), _jsx("div", { className: "w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink" })] })) : (_jsx("span", { className: `px-3 py-1 rounded-full text-sm ${formData.privacy.hideFromBetting ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`, children: formData.privacy.hideFromBetting ? 'Hidden' : 'Visible' }))] })] })] })] }) }));
}
