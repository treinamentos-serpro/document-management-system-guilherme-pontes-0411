import { useCallback, useEffect, useRef, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { getOrCreateUserId, listDocuments, uploadDocument } from './services/api.js';
import './App.css';

export default function App() {
  const [userId] = useState(getOrCreateUserId);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);

  const loadDocuments = useCallback(async () => {
    const currentRequestVersion = ++requestVersion.current;
    setIsLoading(true);
    setError('');

    try {
      const result = await listDocuments(userId);
      if (currentRequestVersion === requestVersion.current) {
        setDocuments(result);
      }
    } catch (loadError) {
      if (currentRequestVersion === requestVersion.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar os documentos.'
        );
      }
    } finally {
      if (currentRequestVersion === requestVersion.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    void loadDocuments();
    return () => {
      requestVersion.current += 1;
    };
  }, [loadDocuments]);

  async function handleUpload(file) {
    const uploadedDocument = await uploadDocument(file, userId);
    setDocuments((currentDocuments) => [
      uploadedDocument,
      ...currentDocuments.filter((document) => document.id !== uploadedDocument.id),
    ]);
    setError('');
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DMS</p>
          <h1>Gestão de documentos</h1>
          <p>Envie, consulte e baixe seus documentos.</p>
        </div>
        <p className="user-context" title={userId}>
          Usuário local: <strong>{userId}</strong>
        </p>
      </header>

      <div className="app-content">
        <UploadComponent onUpload={handleUpload} />
        {error && <p className="message message-error page-error" role="alert">{error}</p>}
        <DocumentList
          documents={documents}
          userId={userId}
          isLoading={isLoading}
          onRefresh={loadDocuments}
        />
      </div>
    </main>
  );
}
