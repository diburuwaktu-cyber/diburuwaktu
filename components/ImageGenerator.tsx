
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { SparklesIcon, PhotoIcon } from './icons';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;
        setLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const imageBase64 = await generateImage(prompt);
            setGeneratedImage(imageBase64);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate image.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center text-purple-300">Image Generator</h2>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to create..."
                    className="flex-grow p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <button type="submit" disabled={loading || !prompt} className="flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition-all duration-200">
                    {loading ? 'Generating...' : <><SparklesIcon className="w-5 h-5" /> Generate</>}
                </button>
            </form>

            {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}
            
            <div className="bg-gray-800/50 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
                {loading && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                        <p className="mt-4 text-gray-400">AI is creating your masterpiece...</p>
                    </div>
                )}
                {generatedImage && !loading && (
                    <img src={generatedImage} alt="Generated" className="max-h-[70vh] rounded-lg shadow-2xl" />
                )}
                {!generatedImage && !loading && (
                    <div className="text-center text-gray-500">
                        <PhotoIcon className="w-24 h-24 mx-auto"/>
                        <p className="mt-4">Your generated image will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageGenerator;
