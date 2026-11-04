# Especificação - Document Management System

> Especificação funcional e técnica do DMS, baseada em
> [`spec-template.md`](./spec-template.md). Este documento descreve o produto e
> as etapas futuras de implementação; não implementa os arquivos da aplicação.

## 1. Objetivo

Oferecer uma aplicação web simples para enviar, listar e baixar documentos
armazenados localmente, associando cada documento ao usuário identificado na
requisição.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição.
- Listagem dos metadados dos documentos do usuário identificado.
- Download de um documento do próprio usuário por identificador.
- Identificação de contexto por `X-User-Id`; cadastro, login e autenticação não
  fazem parte desta versão.
- Gravação dos arquivos no filesystem local com Multer `diskStorage`.
- Armazenamento dos metadados em memória.
- Interface React para upload, listagem e download, integrada à API via `fetch`
  e pelo prefixo `/api` do proxy do Vite.

### Fora do escopo

- Provedores de armazenamento externos, nuvem ou serviços de upload de terceiros.
- Persistência de metadados em banco de dados ou recuperação automática após
  reiniciar o processo.
- Cadastro de usuários, login, autenticação e autorização baseada em credenciais.
- Versionamento, edição, exclusão, compartilhamento, busca, visualização ou
  conversão de documentos.
- Upload de múltiplos arquivos em uma única requisição.

### Premissas e decisões

- O cabeçalho `X-User-Id` é obrigatório nas rotas de documentos. Seu valor é um
  identificador de contexto, não uma prova de identidade: não deve ser tratado
  como autenticação adequada para exposição em produção.
- O usuário só pode listar e baixar os documentos cujo `owner` corresponda ao
  valor de `X-User-Id`.
- São aceitos arquivos de qualquer tipo, com limite configurável de 10 MiB
  (10.485.760 bytes) por arquivo por padrão.
- Metadados em memória são perdidos ao reiniciar o backend. Os arquivos no disco
  permanecem, mas não estarão disponíveis pela API após a reinicialização nesta
  versão.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceitação |
| --- | --- | --- |
| RF-01 | A API deve exigir `X-User-Id` nas rotas de upload, listagem e download. | Cabeçalho ausente ou vazio resulta em `400` e não permite acessar dados. |
| RF-02 | O usuário pode enviar um documento usando `multipart/form-data` e o campo `file`. | Uma requisição válida armazena um arquivo e cria metadados associados ao usuário. |
| RF-03 | O backend deve limitar o tamanho do arquivo conforme a configuração, com padrão de 10 MiB. | Arquivo acima do limite resulta em `413`; nenhum documento é registrado como criado. |
| RF-04 | Cada upload deve receber identificador único e nome de armazenamento gerado pelo servidor. | O nome original não é usado para compor o caminho no filesystem. |
| RF-05 | O sistema deve registrar nome original, tamanho em bytes, data/hora do upload e dono. | A resposta do upload contém esses metadados, sem expor caminho ou nome interno do arquivo. |
| RF-06 | O usuário pode listar seus documentos. | A resposta inclui somente documentos cujo dono corresponde ao `X-User-Id`; lista vazia resulta em `200` com array vazio. |
| RF-07 | A listagem deve apresentar os documentos do mais recente para o mais antigo. | A ordenação usa `uploadedAt` decrescente. |
| RF-08 | O usuário pode baixar um documento pelo identificador. | Documento existente e pertencente ao usuário resulta em conteúdo binário como anexo. |
| RF-09 | O sistema deve impedir o download de documentos de outro usuário. | Documento inexistente ou pertencente a outro usuário resulta na mesma resposta `404`. |
| RF-10 | A interface deve permitir upload, listar documentos e iniciar downloads. | A interface consome a API pelo serviço frontend com `fetch` e apresenta estados de carregamento e erro. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend usa Node.js e Express, em JavaScript CommonJS; o frontend usa React e Vite, em JavaScript ESM. |
| RNF-02 | Os arquivos são gravados exclusivamente no filesystem local em `backend/storage` por padrão, com Multer configurado com `diskStorage`. |
| RNF-03 | Os metadados permanecem em memória nesta fase; sua perda após reinício é comportamento conhecido e documentado. |
| RNF-04 | Configurações operacionais são lidas de variáveis de ambiente, sem credenciais ou configuração específica de ambiente no código. |
| RNF-05 | O backend deve manter a separação `routes -> controllers -> services -> repositories`; camadas internas não dependem de Express ou de detalhes do frontend. |
| RNF-06 | O frontend acessa a API por caminhos `/api/...`; o proxy de desenvolvimento do Vite remove `/api` e encaminha para o backend local. |
| RNF-07 | Caminhos de armazenamento são construídos a partir de identificadores internos gerados pelo servidor. O nome original nunca pode permitir traversal ou escrita fora da pasta de armazenamento. |
| RNF-08 | Downloads devem ser enviados como anexo (`Content-Disposition: attachment`) e erros não devem revelar caminhos locais ou detalhes internos do filesystem. |
| RNF-09 | Falhas de escrita não podem gerar resposta de sucesso. Se um arquivo já tiver sido gravado e a criação dos metadados falhar, o arquivo parcial/órfão deve ser removido quando possível. |
| RNF-10 | O limite de tamanho deve ser aplicado no middleware de upload antes de aceitar o arquivo completo; configuração inválida deve ser reportada explicitamente na inicialização. |

## 5. Modelo de dados (metadados do documento)

Um documento é mantido em memória enquanto o processo do backend estiver ativo.
O repositório de arquivos guarda o conteúdo no disco e associa o identificador
do documento ao arquivo gerado; caminhos internos nunca são retornados pela API.

| Campo | Tipo | Exposição | Descrição |
| --- | --- | --- | --- |
| `id` | string | Público | Identificador único, gerado pelo servidor (UUID recomendado). |
| `originalName` | string | Público | Nome fornecido pelo cliente, preservado apenas como metadado para exibição/download. |
| `size` | number | Público | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Público | Data/hora do upload em ISO 8601, em UTC. |
| `owner` | string | Público | Identificador obtido de `X-User-Id`. |
| `mimeType` | string | Público | Tipo informado pelo middleware de upload, apenas indicativo; pode ser `application/octet-stream`. |
| arquivo armazenado | arquivo no filesystem | Interno | Conteúdo salvo com nome gerado pelo servidor dentro de `STORAGE_DIR`; nunca usar `originalName` como caminho. |

Não há entidade de usuário nesta versão. O `owner` é uma string não vazia
fornecida no cabeçalho, após validação e normalização de espaços externos.

## 6. Contratos de API

### Convenções

- Os caminhos abaixo são os caminhos do backend. No frontend, usar o prefixo
  `/api`; por exemplo, `POST /api/upload` é encaminhado pelo Vite para
  `POST /upload`.
- Todas as rotas de documentos exigem `X-User-Id` com valor não vazio.
- Respostas de erro usam o formato JSON:

  ```json
  {
    "error": {
      "code": "DOCUMENT_NOT_FOUND",
      "message": "Documento não encontrado."
    }
  }
  ```

- Mensagens de erro são destinadas ao cliente; detalhes técnicos devem ficar
  somente nos registros do backend, sem expor caminhos locais.

### POST `/upload`

- **Objetivo:** armazenar um documento e seus metadados.
- **Cabeçalhos:** `X-User-Id: <identificador>` e
  `Content-Type: multipart/form-data`.
- **Entrada:** um arquivo no campo `file`. Tipos de arquivo não são filtrados;
  o limite padrão é 10 MiB e pode ser alterado por configuração.
- **Sucesso:** `201 Created`, `Content-Type: application/json`.

  ```json
  {
    "id": "2e9b44ef-8560-4dc7-a524-e4a1f57a46c2",
    "originalName": "relatorio.pdf",
    "size": 153600,
    "uploadedAt": "2026-11-04T18:44:35.107Z",
    "owner": "usuario-123",
    "mimeType": "application/pdf"
  }
  ```

- **Erros:** `400` para cabeçalho ausente/vazio ou requisição multipart inválida;
  `413` para arquivo acima do limite; `500` para falha de armazenamento.

### GET `/documents`

- **Objetivo:** listar os documentos do usuário identificado.
- **Cabeçalhos:** `X-User-Id: <identificador>`.
- **Sucesso:** `200 OK`, ordenado por `uploadedAt` decrescente.

  ```json
  {
    "documents": [
      {
        "id": "2e9b44ef-8560-4dc7-a524-e4a1f57a46c2",
        "originalName": "relatorio.pdf",
        "size": 153600,
        "uploadedAt": "2026-11-04T18:44:35.107Z",
        "owner": "usuario-123",
        "mimeType": "application/pdf"
      }
    ]
  }
  ```

- **Lista vazia:** `200 OK` com `{ "documents": [] }`.
- **Erros:** `400` para cabeçalho ausente/vazio; `500` para erro interno ao
  consultar metadados.

### GET `/documents/:id/download`

- **Objetivo:** baixar o arquivo associado a `id`, somente se pertencer ao
  usuário identificado.
- **Cabeçalhos:** `X-User-Id: <identificador>`.
- **Sucesso:** `200 OK`, corpo binário, `Content-Disposition: attachment` com o
  nome original em formato seguro. Usar `application/octet-stream` como tipo de
  conteúdo padrão para o download.
- **Erros:** `400` para cabeçalho ausente/vazio ou identificador inválido;
  `404` para documento inexistente ou que não pertence ao usuário; `500` para
  falha de leitura do armazenamento.

### Endpoint operacional existente

`GET /health` retorna `200 OK` com `{ "status": "ok" }` para indicar que o
processo backend está ativo. Não substitui verificações de disponibilidade do
armazenamento.

## 7. Decisões arquiteturais

### Backend

Fluxo de dependência:

```text
routes -> controllers -> services -> repositories
```

- **`routes/`:** registra os caminhos HTTP e encadeia o middleware Multer e os
  controllers. O middleware de upload usa `diskStorage` com destino em
  `STORAGE_DIR` e nome de arquivo gerado pelo servidor.
- **`controllers/`:** lê cabeçalhos, parâmetros e arquivo recebido; valida a
  entrada HTTP, chama o serviço e traduz resultado/erros para status e respostas
  HTTP. Não implementa persistência nem regras de negócio.
- **`services/`:** aplica regras de negócio, como associar o dono, criar
  metadados e garantir que um documento só seja baixado por seu dono.
- **`repositories/`:** mantém metadados em memória e encapsula a leitura e
  gravação de arquivos no filesystem local. Nenhum provedor externo é permitido.

Multer faz a gravação inicial do arquivo local. O identificador interno deve ser
gerado de modo seguro e não depender do nome enviado pelo usuário. A operação
de upload só retorna sucesso depois que arquivo e metadados estiverem
disponíveis; em erro ao registrar os metadados, remover o arquivo gravado quando
possível.

### Frontend

- Componentes funcionais React com Hooks, organizados em `components/`,
  `pages/` e `services/`.
- O serviço de API usa `fetch` com caminhos `/api`; não deve conhecer caminhos
  locais do backend.
- A tela deve oferecer seleção e envio de arquivo, exibição da lista e ação de
  download por documento, além de estados visíveis de carregamento e erro.
- O proxy do Vite encaminha `/api` ao backend local e remove o prefixo antes de
  encaminhar a requisição.

### Configuração

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local de arquivos; caminho relativo deve ser resolvido a partir da raiz do backend, não do diretório de execução do processo. |
| `MAX_UPLOAD_SIZE_BYTES` | `10485760` | Limite máximo de bytes por arquivo. |

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro. Nesta tarefa, deve ser criado somente
este documento de especificação; não implementar arquivos de backend ou
frontend.

1. **Preparar a configuração e a estrutura do backend:** validar `PORT`,
   `STORAGE_DIR` e `MAX_UPLOAD_SIZE_BYTES`; preparar diretório local e tratamento
   comum de erros sem alterar a separação das camadas.
2. **Implementar o armazenamento:** configurar Multer `diskStorage`, nomes
   internos seguros e repositórios para arquivos locais e metadados em memória;
   cobrir gravação, leitura e limpeza após falhas.
3. **Implementar regras e endpoints:** criar services, controllers e routes para
   upload, listagem e download; aplicar `X-User-Id`, isolamento por dono, limite
   de tamanho e contratos de erro.
4. **Testar o backend:** adicionar testes com `node:test` para validação,
   isolamento entre usuários, limites, respostas da API e comportamento diante
   de falhas de filesystem.
5. **Construir a interface:** adicionar serviço `fetch`, componentes de upload,
   lista e download e estados de carregamento/erro, consumindo a API pelo
   prefixo `/api`.
6. **Integrar e validar ponta a ponta:** verificar proxy Vite, upload local,
   listagem, download e erros; documentar como executar backend e frontend e as
   limitações da persistência em memória.
