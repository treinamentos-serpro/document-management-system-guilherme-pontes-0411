import { useState } from 'react';
import { downloadDocument } from '../services/api.js';

export default function DownloadButton({ document: documentRecord, userId }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');

    let downloadUrl;
    try {
      const file = await downloadDocument(documentRecord.id, userId);
      downloadUrl = window.URL.createObjectURL(file);

      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = documentRecord.originalName;
      link.hidden = true;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Não foi possível baixar o documento.'
      );
    } finally {
      if (downloadUrl) {
        window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);
      }
      setIsDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button type="button" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span className="message-error" role="alert">{error}</span>}
    </div>
  );
}
