
import React, { useState, useEffect } from 'react';

const Settings: React.FC = () => {
    const [clientId, setClientId] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

    useEffect(() => {
        setClientId(localStorage.getItem('googleClientId') || '');
        setApiKey(localStorage.getItem('googleApiKey') || '');
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('googleClientId', clientId.trim());
        localStorage.setItem('googleApiKey', apiKey.trim());
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
    };

    const isConfigured = clientId && apiKey;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-purple-300">Pengaturan</h2>
                <p className="text-gray-400 mt-2">Konfigurasikan kunci API untuk layanan eksternal.</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-200 border-b border-gray-700 pb-2">Integrasi Google Drive</h3>
                    
                    <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        <span className="text-sm font-medium">{isConfigured ? 'Google Drive telah dikonfigurasi.' : 'Google Drive belum dikonfigurasi.'}</span>
                    </div>
                    
                    <div>
                        <label htmlFor="google-client-id" className="block text-sm font-medium text-gray-300 mb-1">
                            ID Klien OAuth Google
                        </label>
                        <input
                            id="google-client-id"
                            type="text"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="Masukkan ID Klien OAuth Google Anda"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                         <p className="text-xs text-gray-500 mt-1">Diperlukan untuk mengautentikasi dan mengakses file Google Drive Anda.</p>
                    </div>
                    
                    <div>
                        <label htmlFor="google-api-key" className="block text-sm font-medium text-gray-300 mb-1">
                            Kunci API Google Cloud
                        </label>
                        <input
                            id="google-api-key"
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Masukkan Kunci API Google Cloud Anda"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Diperlukan agar Google Picker API berfungsi.</p>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                         {saveStatus === 'success' && <p className="text-green-400 text-sm">Pengaturan berhasil disimpan!</p>}
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200">
                            Simpan Pengaturan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
