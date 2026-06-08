import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    useEffect(() => {
        if (isAuthenticated)
            navigate('/');
    }, [isAuthenticated, navigate]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = [];
        if (!email.trim())
            errs.push('Email is required');
        else if (!isValidEmail(email))
            errs.push('Enter a valid email address');
        if (!password.trim())
            errs.push('Password is required');
        setErrors(errs);
        if (errs.length > 0)
            return;
        try {
            await login(email.trim(), password);
        }
        catch {
            // error shown from store
        }
    };
    if (isLoading && !error) {
        return _jsx(LoadingSpinner, {});
    }
    return (_jsx("div", { className: "max-w-md mx-auto px-6 py-16", children: _jsxs("div", { className: "rounded-xl border border-mando-gold/30 bg-space-bg/90 backdrop-blur-sm p-8 shadow-xl", children: [_jsx("h1", { className: "text-3xl font-bold text-mando-gold mb-8 text-center", children: "Log In" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm text-mando-silver mb-1", children: "Email" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => {
                                        setEmail(e.target.value);
                                        clearError();
                                    }, className: "w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver focus:outline-none focus:border-mando-gold" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm text-mando-silver mb-1", children: "Password" }), _jsx("input", { id: "password", type: "password", value: password, onChange: (e) => {
                                        setPassword(e.target.value);
                                        clearError();
                                    }, className: "w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver focus:outline-none focus:border-mando-gold" })] }), errors.length > 0 && (_jsx("ul", { className: "text-imperial-red text-sm list-disc pl-5", children: errors.map((err) => (_jsx("li", { children: err }, err))) })), error && _jsx("p", { className: "text-imperial-red text-sm", children: error }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? 'Logging in…' : 'Log In' })] }), _jsxs("p", { className: "mt-6 text-sm text-mando-silver text-center", children: ["No account?", ' ', _jsx(Link, { to: "/register", className: "text-mando-gold hover:underline", children: "Register" })] })] }) }));
}
