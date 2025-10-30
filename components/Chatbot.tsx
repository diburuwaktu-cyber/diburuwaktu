
import React, { useState, useEffect, useRef } from 'react';
// FIX: The `Contents` type does not exist, it should be `Content`.
import { Content } from '@google/genai';
import { ChatMessage, GroundingSource } from '../types';
import { getChatbotResponse } from '../services/geminiService';
import { useGeolocation } from '../hooks/useGeolocation';
import { PaperAirplaneIcon, UserIcon, SparklesIcon, LinkIcon, MapPinIcon } from './icons';

const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    // FIX: The type for history should be `Content[]`.
    const [history, setHistory] = useState<Content[]>([]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    // FIX: The `error` property is nested within the `location` object returned by `useGeolocation`.
    const { location, loading: locationLoading } = useGeolocation();
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    useEffect(() => {
        setMessages([{
            role: 'model',
            content: 'Hello! I am your AI assistant. Ask me anything, including questions that require up-to-date information or local places.'
        }]);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await getChatbotResponse(history, input, location);
            const modelMessageContent = response.text;
            
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            let sources: GroundingSource[] = [];
            if (groundingChunks) {
                sources = groundingChunks.map((chunk: any) => ({
                    uri: chunk.web?.uri || chunk.maps?.uri,
                    title: chunk.web?.title || chunk.maps?.title
                })).filter(source => source.uri);
            }

            const modelMessage: ChatMessage = { role: 'model', content: modelMessageContent, sources };
            setMessages(prev => [...prev, modelMessage]);

            // Update history for next conversation turn
            // FIX: The type for newHistory should be `Content[]`.
            const newHistory: Content[] = [
                ...history,
                { role: 'user', parts: [{ text: input }] },
                { role: 'model', parts: [{ text: modelMessageContent }] }
            ];
            setHistory(newHistory);
        } catch (err) {
            const errorMessage: ChatMessage = { role: 'model', content: err instanceof Error ? `Error: ${err.message}` : 'An unknown error occurred.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    
    const renderMessage = (msg: ChatMessage, index: number) => {
      const isUser = msg.role === 'user';
      return (
        <div key={index} className={`flex gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-6 h-6 text-white" /></div>}
            <div className={`p-4 rounded-2xl max-w-lg ${isUser ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                      <h4 className="text-xs font-semibold text-gray-400">Sources:</h4>
                      {msg.sources.map((source, i) => (
                        <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-300 hover:underline text-sm">
                          <LinkIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{source.title || source.uri}</span>
                        </a>
                      ))}
                  </div>
                )}
            </div>
            {isUser && <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><UserIcon className="w-6 h-6 text-white" /></div>}
        </div>
      )
    };

    return (
        <div className="flex flex-col h-[80vh] max-w-4xl mx-auto bg-gray-800/50 rounded-lg shadow-2xl">
            <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                <h2 className="text-xl font-bold text-purple-300">Chat Assistant</h2>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-700 flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3"/>
                    <span>{locationLoading ? 'Getting location...' : location.latitude ? 'Location enabled' : 'Location disabled'}</span>
                </div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map(renderMessage)}
                {loading && (
                    <div className="flex gap-3 my-4 justify-start">
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-6 h-6 text-white" /></div>
                        <div className="p-4 rounded-2xl bg-gray-700 rounded-bl-none">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
                {location.error && <p className="text-xs text-yellow-400 mb-2">{location.error}</p>}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <button type="submit" disabled={loading || !input} className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold p-3 rounded-full transition-all duration-200">
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;
