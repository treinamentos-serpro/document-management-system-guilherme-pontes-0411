import DownloadButton from './DownloadButton.jsx';

function formatSize(size) {
  return `${new Intl.NumberFormat('pt-BR').format(size)} bytes`;
}

function formatDate(uploadedAt) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(uploadedAt));
}

export default function DocumentList({
  documents,
  userId,
  isLoading,
  onRefresh,
}) {
  return (
    <section className="panel" aria-labelledby="documents-heading">
      <div className="section-heading">
        <h2 id="documents-heading">Seus documentos</h2>
        <button type="button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? 'Atualizando...' : 'Atualizar lista'}
        </button>
      </div>

      {isLoading && documents.length === 0 ? (
        <p role="status">Carregando documentos...</p>
      ) : documents.length === 0 ? (
        <p className="empty-state">Nenhum documento enviado ainda.</p>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-item" key={document.id}>
              <div className="document-details">
                <h3>{document.originalName}</h3>
                <p>
                  {formatSize(document.size)} · Enviado em {formatDate(document.uploadedAt)}
                </p>
              </div>
              <DownloadButton document={document} userId={userId} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
