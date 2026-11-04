import { useId, useState } from 'react';

export default function UploadComponent({ onUpload }) {
  const inputId = useId();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSuccess('');

    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      form.reset();
      setFile(null);
      setSuccess('Documento enviado com sucesso.');
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Não foi possível enviar o documento.'
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Enviar documento</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label htmlFor={inputId}>Arquivo</label>
        <input
          id={inputId}
          name="file"
          type="file"
          required
          disabled={isUploading}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError('');
            setSuccess('');
          }}
        />
        <button type="submit" disabled={isUploading || !file}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {error && <p className="message message-error" role="alert">{error}</p>}
      {success && <p className="message message-success" role="status">{success}</p>}
    </section>
  );
}
