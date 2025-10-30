import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as xlsx from 'xlsx';
import { DownloadIcon, PhotoIcon, GoogleDriveIcon } from './icons';

// Declare Google APIs available from script tags
declare const google: any;
declare const gapi: any;

interface ImageEditorProps {
    onImageCountChange: (count: number) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ onImageCountChange }) => {
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [captions, setCaptions] = useState<string[]>([]);
    const [preloadedCaptions, setPreloadedCaptions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const spreadsheetInputRef = useRef<HTMLInputElement>(null);

    // State for Google Drive Integration
    const [isGapiReady, setIsGapiReady] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [gdriveAccessToken, setGdriveAccessToken] = useState<string | null>(null);
    const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);

    // --- Event listener for header button ---
    useEffect(() => {
        const triggerUpload = () => {
            spreadsheetInputRef.current?.click();
        };
        window.addEventListener('triggerSpreadsheetUpload', triggerUpload);

        return () => {
            window.removeEventListener('triggerSpreadsheetUpload', triggerUpload);
        };
    }, []);

    // --- Google Drive Integration ---
    useEffect(() => {
        const GOOGLE_CLIENT_ID = localStorage.getItem('googleClientId'); 
        const API_KEY = localStorage.getItem('googleApiKey');
        const isConfigured = !!GOOGLE_CLIENT_ID && !!API_KEY;
        setIsGoogleConfigured(isConfigured);

        const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

        // Load GAPI for picker
        gapi.load('client:picker', () => {
            setIsGapiReady(true);
        });

        // Load GIS for auth if configured
        if (isConfigured) {
            const client = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: (tokenResponse: any) => {
                    if (tokenResponse.access_token) {
                        setGdriveAccessToken(tokenResponse.access_token);
                        createPicker(tokenResponse.access_token);
                    } else {
                        setError("Gagal mendapatkan token akses Google.");
                    }
                },
            });
            setTokenClient(client);
        }
    }, []);

    const handleAuthClick = () => {
        if (!isGapiReady || !tokenClient) {
            setError("Layanan Google belum siap atau tidak dikonfigurasi. Silakan periksa tab Pengaturan.");
            return;
        }
    
        if (gdriveAccessToken) {
            createPicker(gdriveAccessToken);
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    };

    const createPicker = (accessToken: string) => {
        const API_KEY = localStorage.getItem('googleApiKey');
        if (!API_KEY) {
            setError("Kunci API Google tidak ditemukan di Pengaturan.");
            return;
        }
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes("image/png,image/jpeg,image/jpg,image/webp");
        const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(accessToken)
            .addView(view)
            .setDeveloperKey(API_KEY)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    };

    const pickerCallback = async (data: any) => {
        if (data.action === google.picker.Action.PICKED) {
            setLoading('drive');
            setError(null);
            
            const filePromises = data.docs.map(async (doc: any) => {
                const res = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, {
                    headers: { 'Authorization': `Bearer ${gdriveAccessToken}` }
                });

                if (res.status === 401) {
                    setGdriveAccessToken(null);
                    throw new Error("Sesi Google Anda telah berakhir. Silakan klik tombol lagi untuk masuk kembali.");
                }

                if (!res.ok) {
                    throw new Error(`Gagal mengambil file ${doc.name}`);
                }
                const blob = await res.blob();
                return new File([blob], doc.name, { type: doc.mimeType });
            });

            try {
                const files = await Promise.all(filePromises);
                handleFilesSelected(files);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error mengambil file dari Google Drive.");
                setLoading(null);
            }
        }
    };
    
    // --- Core File Handling ---
    const handleFilesSelected = (files: File[]) => {
        if(files.length === 0) {
            setLoading(null);
            return;
        }
        setImageFiles(files);
        setSelectedIndex(0);
        setError(null);

        const newCaptions = Array(files.length).fill('').map((_, i) => preloadedCaptions[i] || '');
        setCaptions(newCaptions);
        setPreloadedCaptions([]); // Reset preloaded captions after applying them

        onImageCountChange(files.length);

        const previewPromises = files.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(previewPromises)
            .then(previews => {
                setImagePreviews(previews);
                setLoading(null);
            })
            .catch(() => {
                setError("Tidak dapat membuat pratinjau untuk beberapa gambar.");
                setLoading(null);
            });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFilesSelected(Array.from(files));
        }
    };

    // --- Spreadsheet Caption Handling ---
    const handleSpreadsheetFile = (file: File) => {
        setLoading('spreadsheet');
        setError(null);
        setInfoMessage(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) throw new Error("Gagal membaca file.");
                const workbook = xlsx.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: (string | number)[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
                const parsedCaptions = json.map(row => String(row[0] || '')).filter(caption => caption.trim() !== '');

                if (parsedCaptions.length === 0) {
                    throw new Error("Spreadsheet tampaknya kosong atau kolom pertama tidak berisi teks.");
                }
                
                if (imageFiles.length > 0) {
                    setCaptions(prevCaptions => {
                        const newCaptions = [...prevCaptions];
                        const limit = Math.min(prevCaptions.length, parsedCaptions.length);
                        for (let i = 0; i < limit; i++) {
                            newCaptions[i] = parsedCaptions[i];
                        }
                        return newCaptions;
                    });
                    setInfoMessage(`${Math.min(captions.length, parsedCaptions.length)} teks diperbarui dari file.`);
                } else {
                    setPreloadedCaptions(parsedCaptions);
                    setInfoMessage(`${parsedCaptions.length} teks dimuat. Teks akan diterapkan saat Anda mengunggah gambar.`);
                }
                setTimeout(() => setInfoMessage(null), 5000);

            } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal mem-parsing file spreadsheet. Pastikan formatnya benar (.xlsx, .xls, .csv).");
            } finally {
                setLoading(null);
            }
        };
        reader.onerror = () => {
            setError("Gagal membaca file spreadsheet.");
            setLoading(null);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSpreadsheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleSpreadsheetFile(file);
            if (e.target) e.target.value = '';
        }
    };

    const handleIndividualCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newCaptions = [...captions];
        newCaptions[selectedIndex] = e.target.value;
        setCaptions(newCaptions);
    };

    const applyCaptionToAll = () => {
        const currentCaption = captions[selectedIndex];
        setCaptions(new Array(captions.length).fill(currentCaption));
    };

    // --- Canvas & Download ---
    const drawImageWithCaption = (img: HTMLImageElement, text: string): string => {
        if (!canvasRef.current) return '';
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (text) {
            const padding = img.width * 0.05;
            const usableWidth = canvas.width - (padding * 2);
            const textYPosition = canvas.height / 4;
            let fontSize = Math.max(30, Math.floor(img.width / 15));
            
            const wrapText = (context: CanvasRenderingContext2D, textToWrap: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
                const words = textToWrap.split(' ');
                let line = '';
                const lines = [];
                context.font = `bold ${fontSize}px "Poppins", sans-serif`;

                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = context.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        lines.push(line);
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line);
                
                const totalTextHeight = (lines.length * lineHeight);
                const startY = y - (totalTextHeight / 2) + (lineHeight / 2);
                
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.strokeStyle = 'black';
                context.lineWidth = 20;
                context.lineJoin = 'round';
                context.shadowColor = 'black';
                context.shadowBlur = 10;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
                
                lines.forEach((l, i) => {
                    context.strokeText(l.trim(), x, startY + (i * lineHeight));
                });

                context.shadowColor = 'transparent';
                context.shadowBlur = 0;
                context.fillStyle = 'white';
                lines.forEach((l, i) => {
                    context.fillText(l.trim(), x, startY + (i * lineHeight));
                });
            };
            
            wrapText(ctx, text, canvas.width / 2, textYPosition, usableWidth, fontSize * 1.1);
        }

        return canvas.toDataURL('image/png');
    };

    const handleDownloadAll = useCallback(async () => {
        if (imagePreviews.length === 0) return;
        setLoading('download');
        setError(null);
        
        for (let i = 0; i < imagePreviews.length; i++) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = reject;
                    img.src = imagePreviews[i];
                });
                
                const dataUrl = drawImageWithCaption(img, captions[i]);
                const link = document.createElement('a');
                link.download = `tiktok-slide-${i + 1}-${imageFiles[i].name.split('.')[0]}.png`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (err) {
                 setError(`Gagal memproses dan mengunduh gambar ${i + 1}. Silakan coba lagi.`);
                 break;
            }
        }
        setLoading(null);
    }, [imagePreviews, imageFiles, captions]);

    const triggerFileSelect = () => fileInputRef.current?.click();

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-purple-300">Editor Foto Slide TikTok</h2>
            
            <div className="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 border-gray-600">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" multiple />
                <input ref={spreadsheetInputRef} type="file" accept=".xlsx, .xls, .csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleSpreadsheetChange} className="hidden" />

                {imagePreviews.length > 0 && imagePreviews[selectedIndex] ? (
                    <img src={imagePreviews[selectedIndex]} alt={`Preview ${selectedIndex + 1}`} className="max-h-[50vh] mx-auto rounded-lg shadow-2xl"/>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <h3 className="text-xl font-semibold text-gray-300 mb-6">Pilih gambar Anda</h3>
                        <div className="flex flex-col sm:flex-row flex-wrap items-start justify-center gap-4">
                            <button 
                                onClick={triggerFileSelect} 
                                className="inline-flex items-center gap-3 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                            >
                                <PhotoIcon className="w-6 h-6"/>
                                Unggah dari Komputer
                            </button>
                             <div className="flex flex-col items-center">
                                <button 
                                    onClick={handleAuthClick} 
                                    disabled={!isGapiReady || !tokenClient || loading === 'drive' || !isGoogleConfigured} 
                                    className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                                >
                                    <GoogleDriveIcon className="w-6 h-6"/>
                                    {loading === 'drive' ? 'Memuat...' : 'Pilih dari Google Drive'}
                                </button>
                                {!isGoogleConfigured && <p className="text-xs text-yellow-400 mt-2">Konfigurasi di tab Pengaturan.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {imagePreviews.length > 1 && (
                <div className="bg-gray-800 p-2 rounded-lg">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {imagePreviews.map((preview, index) => (
                            <img 
                                key={index} 
                                src={preview} 
                                alt={`Thumbnail ${index + 1}`} 
                                onClick={() => setSelectedIndex(index)}
                                className={`h-24 w-auto rounded-md cursor-pointer border-4 transition-all flex-shrink-0 ${selectedIndex === index ? 'border-purple-500' : 'border-transparent hover:border-gray-500'}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {imagePreviews.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                    <label htmlFor="caption-input" className="text-xl font-semibold">Teks untuk Foto #{selectedIndex + 1}</label>
                    <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md">
                        <strong>Tips:</strong> Anda dapat mengunggah file Excel atau CSV untuk mengisi teks secara otomatis. Teks dari baris pertama akan masuk ke foto pertama, baris kedua ke foto kedua, dan seterusnya.
                    </p>
                    <textarea 
                        id="caption-input"
                        value={captions[selectedIndex] || ''} 
                        onChange={handleIndividualCaptionChange} 
                        placeholder="Masukkan teks di sini..." 
                        className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <div className="text-right">
                        <button 
                            onClick={applyCaptionToAll}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 text-sm"
                        >
                            Terapkan ke Semua
                        </button>
                    </div>
                </div>
            )}
            
            <div className="space-y-2">
                {infoMessage && <p className="text-green-300 text-center bg-green-900/50 p-3 rounded-md">{infoMessage}</p>}
                {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}
            </div>
            
            {imagePreviews.length > 0 && (
                <div className="text-center">
                    <button onClick={handleDownloadAll} disabled={loading === 'download'} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 text-lg">
                        {loading === 'download' ? 'Mengunduh...' : <> <DownloadIcon className="w-6 h-6"/> Unduh Semua ({imageFiles.length}) Foto </>}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Browser Anda mungkin meminta izin untuk mengunduh banyak file.</p>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};

export default ImageEditor;