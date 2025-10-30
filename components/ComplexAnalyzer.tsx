
import React, { useState } from 'react';
import { analyzeWithThinking } from '../services/geminiService';
import { CpuChipIcon } from './icons';

const ComplexAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;
        setLoading(true);
        setError(null);
        setResult('');
        try {
            const analysisResult = await analyzeWithThinking(prompt);
            setResult(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze the prompt.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-purple-300">Complex Analyzer</h2>
                <p className="text-gray-400 mt-2">Powered by Gemini 2.5 Pro with enhanced thinking capabilities for your most complex queries.</p>
            </div>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a complex query, a block of code to analyze, or a difficult problem to solve..."
                    className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none text-lg"
                />
                <button type="submit" disabled={loading || !prompt} className="mt-4 w-full flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg">
                    {loading ? 'Analyzing...' : <><CpuChipIcon className="w-6 h-6" /> Analyze with AI</>}
                </button>
            </form>

            {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}

            {(loading || result) && (
              <div className="bg-gray-800/50 rounded-lg p-6 min-h-[200px]">
                  {loading && (
                      <div className="flex flex-col items-center justify-center text-center">
                          <div className="relative">
                              <CpuChipIcon className="w-16 h-16 text-purple-400" />
                              <div className="absolute inset-0 border-2 border-purple-400 rounded-full animate-ping"></div>
                          </div>
                          <p className="mt-4 text-gray-300 font-semibold">AI is thinking deeply...</p>
                          <p className="text-gray-400 text-sm">This may take a moment for complex requests.</p>
                      </div>
                  )}
                  {result && (
                      <div>
                          <h3 className="text-xl font-bold mb-4 text-purple-300">Analysis Result:</h3>
                          <pre className="bg-gray-900 p-4 rounded-md text-gray-200 whitespace-pre-wrap font-mono text-sm overflow-x-auto">{result}</pre>
                      </div>
                  )}
              </div>
            )}
        </div>
    );
};

export default ComplexAnalyzer;
