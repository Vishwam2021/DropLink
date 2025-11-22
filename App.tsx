import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShareData, TabMode } from './types';
import { createShare, getShare } from './services/shareService';
import { MAX_FILE_SIZE_BYTES, MAX_TEXT_LENGTH, ERROR_MESSAGES, CODE_LENGTH, EXPIRY_OPTIONS } from './constants';
import Button from './components/Button';
import { 
  UploadCloudIcon, 
  FileIcon, 
  XIcon, 
  CheckIcon, 
  CopyIcon, 
  DownloadIcon, 
  SendIcon,
  RefreshCwIcon
} from './components/Icons';

const App: React.FC = () => {
  const [mode, setMode] = useState<TabMode>('send');
  
  // -- SEND STATE --
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [expiryHours, setExpiryHours] = useState<number>(EXPIRY_OPTIONS[2].value); // Default 24 hours
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [createdShare, setCreatedShare] = useState<{code: string, expiresAt: Date} | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  
  // -- RECEIVE STATE --
  const [inputCode, setInputCode] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);
  const [retrievedShare, setRetrievedShare] = useState<ShareData | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- SEND LOGIC ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setSendError(ERROR_MESSAGES.FILE_TOO_LARGE);
        return;
      }
      setFile(selectedFile);
      setSendError(null);
    }
  };

  const handleCreateShare = async () => {
    if (!text.trim() && !file) {
      setSendError(ERROR_MESSAGES.NO_CONTENT);
      return;
    }
    
    setIsSending(true);
    setSendError(null);

    try {
      const response = await createShare(text, file, expiryHours);
      setCreatedShare(response);
    } catch (err: any) {
      if (err.message === 'CONFIG_ERROR') {
         setSendError("Setup Required: Add Appwrite details to constants.ts");
      } else {
         setSendError(ERROR_MESSAGES.NETWORK_ERROR);
      }
    } finally {
      setIsSending(false);
    }
  };

  const resetSendForm = () => {
    setText('');
    setFile(null);
    setCreatedShare(null);
    setSendError(null);
    setHasCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyCodeToClipboard = () => {
    if (createdShare) {
      navigator.clipboard.writeText(createdShare.code);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  // --- RECEIVE LOGIC ---

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setInputCode(val);
    setRetrieveError(null);
  };

  const handleRetrieveShare = async () => {
    if (inputCode.length !== CODE_LENGTH) {
      setRetrieveError(ERROR_MESSAGES.INVALID_CODE);
      return;
    }

    setIsRetrieving(true);
    setRetrieveError(null);
    setRetrievedShare(null);

    try {
      const data = await getShare(inputCode);
      setRetrievedShare(data);
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') setRetrieveError(ERROR_MESSAGES.NOT_FOUND);
      else if (err.message === 'EXPIRED') setRetrieveError(ERROR_MESSAGES.EXPIRED);
      else if (err.message === 'CONFIG_ERROR') setRetrieveError("Setup Required: Check constants.ts");
      else setRetrieveError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsRetrieving(false);
    }
  };

  const resetReceiveForm = () => {
    setInputCode('');
    setRetrievedShare(null);
    setRetrieveError(null);
  };

  // Format Helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 flex items-center justify-center gap-2">
           <span className="text-primary-600"><SendIcon className="w-8 h-8"/></span>
           DropLink
        </h1>
        <p className="text-slate-500 text-lg">Securely share text and files in seconds.</p>
      </header>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setMode('send')}
            className={`flex-1 py-4 text-center font-medium transition-colors duration-200 ${
              mode === 'send' 
                ? 'text-primary-600 bg-primary-50/50 border-b-2 border-primary-500' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Send
          </button>
          <button
            onClick={() => setMode('receive')}
            className={`flex-1 py-4 text-center font-medium transition-colors duration-200 ${
              mode === 'receive' 
                ? 'text-primary-600 bg-primary-50/50 border-b-2 border-primary-500' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Receive
          </button>
        </div>

        <div className="p-6">
          {/* ---------------- SEND VIEW ---------------- */}
          {mode === 'send' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {!createdShare ? (
                <>
                  {/* Text Input */}
                  <div className="space-y-2">
                    <label htmlFor="share-text" className="block text-sm font-semibold text-slate-700">
                      Message (Optional)
                    </label>
                    <textarea
                      id="share-text"
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                      rows={3}
                      placeholder="Type something to share..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={MAX_TEXT_LENGTH}
                    />
                  </div>

                  {/* File Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      File (Optional)
                    </label>
                    
                    {!file ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative cursor-pointer flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-primary-50 hover:border-primary-400 transition-all duration-200"
                      >
                         <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloudIcon className="w-8 h-8 text-slate-400 group-hover:text-primary-500 mb-2 transition-colors" />
                            <p className="text-sm text-slate-500 group-hover:text-primary-600 font-medium">Click to upload a file</p>
                            <p className="text-xs text-slate-400 mt-1">Max 50MB</p>
                        </div>
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-100 rounded-lg">
                        <div className="flex items-center overflow-hidden">
                          <div className="p-2 bg-white rounded-md shadow-sm mr-3">
                             <FileIcon className="w-5 h-5 text-primary-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="p-1 hover:bg-primary-100 rounded-full text-slate-500 hover:text-red-500 transition-colors"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expiry Selector */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Expires In
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {EXPIRY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setExpiryHours(option.value)}
                          className={`py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                            expiryHours === option.value
                              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error Message */}
                  {sendError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2">
                       <span className="mt-0.5 block h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                       {sendError}
                    </div>
                  )}

                  <Button 
                    fullWidth 
                    onClick={handleCreateShare} 
                    isLoading={isSending}
                    disabled={!text && !file}
                  >
                    Create Secure Link
                  </Button>
                </>
              ) : (
                /* Success View */
                <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Ready to Share!</h3>
                    <p className="text-slate-500 text-sm">Share this code with the recipient.</p>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-6 relative group">
                    <div className="text-4xl font-mono font-bold text-white tracking-widest">
                      {createdShare.code}
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      Expires at {createdShare.expiresAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    fullWidth 
                    onClick={copyCodeToClipboard}
                    className={hasCopied ? 'bg-green-50 border-green-200 text-green-700' : ''}
                  >
                    {hasCopied ? (
                      <>
                        <CheckIcon className="w-4 h-4 mr-2" /> Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-4 h-4 mr-2" /> Copy Code
                      </>
                    )}
                  </Button>

                  <button 
                    onClick={resetSendForm}
                    className="text-sm text-slate-500 hover:text-slate-800 underline decoration-slate-300 hover:decoration-slate-800 underline-offset-4 transition-all"
                  >
                    Send another file
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---------------- RECEIVE VIEW ---------------- */}
          {mode === 'receive' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {!retrievedShare ? (
                <>
                   <div className="text-center mb-6">
                      <p className="text-slate-600">Enter the 6-character code shared with you.</p>
                   </div>

                   <div className="relative">
                      <input
                        type="text"
                        value={inputCode}
                        onChange={handleCodeInput}
                        placeholder="A1B2C3"
                        className="w-full text-center text-3xl font-mono font-bold tracking-widest uppercase p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder-slate-300"
                        maxLength={6}
                      />
                   </div>

                   {retrieveError && (
                    <div className="text-center text-red-500 text-sm font-medium animate-pulse">
                      {retrieveError}
                    </div>
                   )}

                   <Button 
                     fullWidth 
                     onClick={handleRetrieveShare} 
                     isLoading={isRetrieving}
                     disabled={inputCode.length !== 6}
                   >
                     Retrieve Files
                   </Button>
                </>
              ) : (
                /* Result View */
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-lg text-slate-800">Received Content</h3>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {retrievedShare.code}
                    </span>
                  </div>

                  {/* Text Content */}
                  {retrievedShare.text && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-sm text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[10px]">Message</p>
                      <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {retrievedShare.text}
                      </p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(retrievedShare.text || '')}
                        className="mt-3 text-xs flex items-center text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <CopyIcon className="w-3 h-3 mr-1" /> Copy text
                      </button>
                    </div>
                  )}

                  {/* File Content */}
                  {retrievedShare.file && (
                     <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-400 font-semibold mb-3 uppercase tracking-wider text-[10px]">Attachment</p>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary-100 p-3 rounded-lg">
                            <FileIcon className="w-6 h-6 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{retrievedShare.file.name}</p>
                            <p className="text-xs text-slate-500">{formatBytes(retrievedShare.file.size)}</p>
                          </div>
                          <a 
                            href={retrievedShare.file.downloadUrl} 
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors shadow-sm shadow-primary-500/30"
                            title="Download"
                          >
                            <DownloadIcon className="w-5 h-5" />
                          </a>
                        </div>
                     </div>
                  )}

                  <Button variant="secondary" fullWidth onClick={resetReceiveForm} className="mt-4">
                    <RefreshCwIcon className="w-4 h-4 mr-2" /> Retrieve Another
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Files are automatically deleted after expiry.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;