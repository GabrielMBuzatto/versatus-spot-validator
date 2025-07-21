# 🔍 Validador de Integridade de Payloads

Um validador TypeScript completo para validação de integridade de payloads JSON extensos com schemas específicos por tipo de visualização.

## ✨ Funcionalidades

- 🔍 **Validação completa de tipos**: Valida `spot_type` baseado em tipos cadastrados no banco
- 📊 **Validação de formato por schema**: Cada `spot_type` tem seu próprio JSON Schema para validação de `spot_data`
- 🏷️ **Validação de nomes e títulos**: Verifica correspondência entre `spot_name` e `spot_data.title`
- 📋 **Validação de campos obrigatórios**: Confirma presença de todos os campos necessários
- 🎯 **Validação de filtros secundários obrigatórios**: Busca itens que contenham exatamente os 5 filtros específicos
- 🆕 **Classificação inteligente por spot_name**: Identifica quais spots possuem filtros defaults configurados vs. não configurados
- 📝 **Log estruturado e legível**: Relatórios detalhados com numeração sequencial e formatação organizada
- 📊 **Estatísticas detalhadas**: Resumos por arquivo e tipo de erro com classificação por spot_name
- ⚙️ **Configuração visual**: Comando para exibir todas as regras de validação
- 🔍 **Busca específica**: Comando dedicado para encontrar itens com filtros corretos

## 🚀 Instalação

```bash
npm install
```

## 📖 Como usar

### 🔍 Validar payloads (completo)
```bash
npm run dev
```

### 🎯 Buscar itens com filtros obrigatórios
```bash
npm run search-filters
```

### ⚙️ Ver configuração de validação
```bash
npm run config
```

### 🧰 Comandos alternativos
```bash
npm run validate       # Executa validação completa
npm run validate:config # Mostra configuração
npm run build         # Compila para JavaScript
npm run start         # Executa versão compilada
```

## 🏗️ Estrutura dos dados validados

O validador processa arquivos JSON com a seguinte estrutura:

```json
[
  {
    "spot_name": "line-precip-acumulada-A",
    "spot_type": "line",
    "primary_filters": [],
    "secondary_filters": [],
    "specific_filters": [],
    "spot_data": {
      "title": "Gráfico comparativo de precipitação acumulada em 24 horas",
      "y_label": "Precipitação (mm)",
      "y_type": "integer",
      "show_legend": true,
      "show_timeline": true,
      "x": {
        "serie1": ["2024-01-01", "2024-01-02"]
      },
      "y": {
        "serie1": [10.5, 15.2]
      },
      "color_ids": [1, 2]
    }
  }
]
```

## 🔍 Validações implementadas

### 1. **Validação de spot_type**
Verifica se o `spot_type` está na lista de tipos válidos:
- `line`, `table`, `column`, `area`, `brazil-power-generation`
- `iframe`, `map`, `elninolanina`, `madden-julian`, `columnarea`, `card`

### 2. **Validação de spot_data_format**
Cada `spot_type` possui um JSON Schema específico que valida:
- **Campos obrigatórios** para cada tipo
- **Tipos de dados** corretos (string, number, boolean, array, object)
- **Valores permitidos** em enums (ex: `y_type` deve ser "integer" ou "%")
- **Formato de dados** (ex: datas no formato correto)
- **Estrutura de objetos** aninhados

### 3. **Validação de spot_name e title**
- Confirma se `spot_data.title` está na lista de títulos válidos
- Verifica se o `spot_name` é válido para o `title` específico
- Garante correspondência correta entre nome e título

### 4. **Validação de campos obrigatórios**
- Presença de `spot_name`, `spot_type`, `spot_data`, `spot_data.title`
- Formato correto dos arrays de filtros

### 5. **🎯 Validação de filtros secundários obrigatórios**
Busca itens que possuam **exatamente** os 5 filtros específicos em `secondary_filters`:
- ✅ **Sub-mercados: SE/CO**
- ✅ **Sub-mercados: N** 
- ✅ **Sub-mercados: S**
- ✅ **Sub-mercados: NE**
- ✅ **Modelos: Conjunto ONS**

**Características da validação:**
- 🔢 **Quantidade exata**: Deve ter exatamente 5 filtros
- 🔄 **Ordem não importa**: Os filtros podem estar em qualquer ordem
- ⚠️ **Nenhum filtro extra**: Não pode ter filtros além dos 5 obrigatórios
- ❌ **Nenhum filtro faltando**: Todos os 5 devem estar presentes

#### 🆕 **Classificação por spot_name:**
A validação agora classifica os resultados por `spot_name` com lógica inteligente:

**✅ Se o spot_name possui pelo menos 1 item com filtros corretos:**
```
📊 spot_name: "line-precip-acumulada-A" - Filtro default configurado
   💬 Spot possui pelo menos um item com filtros defaults corretos
```

**❌ Se o spot_name não possui nenhum item com filtros corretos:**
```
📊 spot_name: "line-precip-acumulada-B" - Total: 352 itens
   💬 Não foi encontrado nenhum spot com o filtro default definido
```

**💡 Benefícios:**
- **Visão clara** de quais spots estão configurados corretamente
- **Priorização** de quais spots precisam de atenção
- **Relatórios mais informativos** para tomada de decisão

## 📊 Tipos de visualização suportados

### 📈 **line** - Gráficos de linha
```json
{
  "title": "string",
  "y_label": "string", 
  "y_type": "integer|%",
  "show_legend": true,
  "show_timeline": true,
  "x": { "serie": ["2024-01-01"] },
  "y": { "serie": [10.5] },
  "color_ids": [1]
}
```

### 📊 **table** - Tabelas
```json
{
  "header": "string",
  "rows": ["string"],
  "items": [
    {
      "date": "string",
      "subTitle": "string", 
      "key": {
        "values": [1.5],
        "skill_level": 0.8
      }
    }
  ]
}
```

### 📊 **column** - Gráficos de coluna
```json
{
  "title": "string",
  "y_label": "string",
  "y_type": "integer|%",
  "show_legend": true,
  "x": { "serie": ["2024-01-01"] },
  "y": { "serie": [10.5] },
  "color_ids": [1]
}
```

### 🌐 **area** - Gráficos de área
```json
{
  "title": "string",
  "y_label": "string",
  "y_type": "integer|%", 
  "show_legend": true,
  "x": { "serie": ["2024-01-01"] },
  "y": {
    "area": { "serie": [10.5] },
    "inverted_column": { "serie": [5.2] }
  },
  "color_ids": [1]
}
```

### ⚡ **brazil-power-generation** - Mapas de geração
```json
{
  "powerDirection": {
    "Norte": "string",
    "Nordeste": "string", 
    "Sudeste/Centro-oeste": "string",
    "Sul": "string"
  },
  "cardData": {
    "Norte": ["string"],
    "Nordeste": ["string"],
    "Sudeste/Centro-oeste": ["string"], 
    "Sul": ["string"]
  }
}
```

E mais tipos: `iframe`, `map`, `elninolanina`, `madden-julian`, `columnarea`, `card`

## 📄 Saída do validador

### 🖥️ **Console - Validação Completa**
```
════════════════════════════════════════════════════════════════════════════════
📋 RESUMO DA VALIDAÇÃO
════════════════════════════════════════════════════════════════════════════════
✅ Arquivos válidos: 1
❌ Arquivos com erros: 1  
📊 Total de arquivos: 2
🚨 Total de erros encontrados: 3

🎯 ITENS COM FILTROS SECUNDÁRIOS OBRIGATÓRIOS
📍 Total de itens encontrados: 2

📄 line-precip-acumulada.json (2 itens):
   ✅ Item 45: line-precip-acumulada-A
   ✅ Item 67: line-precip-acumulada-B

📝 Filtros obrigatórios:
   1. Sub-mercados: SE/CO
   2. Sub-mercados: N
   3. Sub-mercados: S
   4. Sub-mercados: NE
   5. Modelos: Conjunto ONS
```

### 🖥️ **Console - Busca Específica de Filtros**
```bash
npm run search-filters
```
```
🔍 Procurando itens com filtros secundários obrigatórios...

📁 Arquivos encontrados: 2
   - elninolanina-oscilacao-sul.json
   - line-precip-acumulada.json

🔍 Buscando em: line-precip-acumulada.json
✅ Itens encontrados: 3
📊 Total de itens no arquivo: 1024

════════════════════════════════════════════════════════════════════════════════
🎯 RESULTADOS DA BUSCA
════════════════════════════════════════════════════════════════════════════════
📍 Total de itens encontrados: 3

📄 line-precip-acumulada.json (3 itens):
   ✅ Item 45: line-precip-acumulada-A
   ✅ Item 67: line-precip-acumulada-B  
   ✅ Item 89: line-precip-acumulada-C

📝 Filtros obrigatórios:
   1. Sub-mercados: SE/CO
   2. Sub-mercados: N
   3. Sub-mercados: S
   4. Sub-mercados: NE
   5. Modelos: Conjunto ONS
```

### 🖥️ **Console - Erros Detalhados**
```
🎯 MISSING_REQUIRED_SECONDARY_FILTERS - Classificação por spot_name:
────────────────────────────────────────────────────────────────────────────────

📊 spot_name: "line-precip-acumulada-A" - Filtro default configurado
   💬 Spot possui pelo menos um item com filtros defaults corretos

📊 spot_name: "line-precip-acumulada-B" - Total: 352 itens
   💬 Não foi encontrado nenhum spot com o filtro default definido

📊 spot_name: "elninolanina-oscilacao-sul" - Total: 63 itens
   💬 Não foi encontrado nenhum spot com o filtro default definido

📋 OUTROS ERROS:

────────────────────────────────────────────────────────────────────────────────

   🔴 ERRO #1
   📍 Item: 0
   🏷️  Spot: line-precip-acumulada-A
   ⚠️  Tipo: MISSING_REQUIRED_SECONDARY_FILTERS
   💬 Mensagem:
      Filtros secundários obrigatórios não conferem. Esperado 5 filtros, encontrado 7. 
      Faltando: [Sub-mercados: SE/CO]. 
      Extras: [Região Espacial: Sub-mercados, Modelos: Conjunto Kosen 1]. 
      Obrigatórios: Sub-mercados: SE/CO, Sub-mercados: N, Sub-mercados: S, Sub-mercados: NE, Modelos: Conjunto ONS

   🔴 ERRO #2
   📍 Item: 1
   🏷️  Spot: line-precip-acumulada-A
   ⚠️  Tipo: INVALID_SPOT_DATA_FORMAT
   💬 Mensagem:
      Formato do spot_data inválido para spot_type "line":
      ❌ Campo obrigatório ausente: "color_ids"
```

### 📄 **Arquivo de log (log.log)**
```
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                    LOG DE VALIDAÇÃO DE PAYLOADS                             ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

📅 Data/Hora: 2024-01-15T10:30:00.000Z
🔍 Total de erros: 3
📁 Arquivos com erros: 1

════════════════════════════════════════════════════════════════════════════════════════════════
📄 ARQUIVO: test.json
════════════════════════════════════════════════════════════════════════════════════════════════
📊 Total de erros neste arquivo: 3

🎯 MISSING_REQUIRED_SECONDARY_FILTERS - Classificação por spot_name:
────────────────────────────────────────────────────────────────────────────────
📊 spot_name: "line-precip-acumulada-A" - Filtro default configurado
   💬 Spot possui pelo menos um item com filtros defaults corretos

📊 spot_name: "line-precip-acumulada-B" - Total: 2 itens
   💬 Não foi encontrado nenhum spot com o filtro default definido
   📍 Item 1 - 2024-01-15T10:30:00.000Z
   📝 Detalhes: Filtros secundários obrigatórios não conferem. Esperado 5 filtros, encontrado 2...
   📍 Item 2 - 2024-01-15T10:30:00.000Z
   📝 Detalhes: Filtros secundários obrigatórios não conferem. Esperado 5 filtros, encontrado 1...

📋 OUTROS ERROS:
────────────────────────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────────────────────────────────────────
🔴 ERRO #1
────────────────────────────────────────────────────────────────────────────────────────────────
📁 Arquivo............: test.json
📍 Item...............: 0
🏷️  Spot Name.........: line-precip-acumulada-A
⚠️  Tipo de Erro......: INVALID_SPOT_DATA_FORMAT
⏰ Timestamp..........: 2024-01-15T10:30:00.000Z

💬 Mensagem:
   Formato do spot_data inválido para spot_type "line":
   ❌ Campo obrigatório ausente: "color_ids"

════════════════════════════════════════════════════════════════════════════════════════════════
📊 RESUMO FINAL DA VALIDAÇÃO
════════════════════════════════════════════════════════════════════════════════════════════════
📅 Data/Hora: 2024-01-15T10:30:00.000Z
🔍 Total de erros encontrados: 3
📁 Arquivos com erros: 1

📋 Detalhes por arquivo:
   - test.json: 3 erros

📋 Tipos de erros:
   - MISSING_REQUIRED_SECONDARY_FILTERS: 2 ocorrências
   - INVALID_SPOT_DATA_FORMAT: 1 ocorrências

🎯 MISSING_REQUIRED_SECONDARY_FILTERS por spot_name:
   - "line-precip-acumulada-A": Filtro default configurado
   - "line-precip-acumulada-B": 2 itens sem filtros defaults
   - "elninolanina-oscilacao-sul": 63 itens sem filtros defaults
════════════════════════════════════════════════════════════════════════════════════════════════
```

## ⚙️ Configuração

Execute `npm run config` para ver toda a configuração:

```
📋 SPOT_TYPES VÁLIDOS:
   - line
   - table
   - column
   - area
   - brazil-power-generation
   - iframe
   - map
   - elninolanina
   - madden-julian
   - columnarea
   - card

📋 SPOT_DATA_TITLES E SPOT_NAMES VÁLIDOS:

📋 Gráfico comparativo de precipitação acumulada em 24 horas
   spot_names válidos:
      - line-precip-acumulada-A
      - line-precip-acumulada-B
      - line-precip-acumulada-C
      - line-precip-acumulada-D
      - line-precip-acumulada-E

🎯 FILTROS SECUNDÁRIOS OBRIGATÓRIOS:
   1. Sub-mercados: SE/CO
   2. Sub-mercados: N
   3. Sub-mercados: S
   4. Sub-mercados: NE
   5. Modelos: Conjunto ONS
```

## 🔧 Tecnologias utilizadas

- **TypeScript**: Linguagem principal
- **Node.js**: Runtime
- **Ajv**: Validação de JSON Schema
- **ajv-formats**: Formatos adicionais (datas, etc.)

## 🏃‍♂️ Exemplo de uso completo

1. **Coloque seus arquivos JSON** na pasta do projeto
2. **Execute a validação completa**:
   ```bash
   npm run dev
   ```
3. **Busque especificamente por itens com filtros obrigatórios**:
   ```bash
   npm run search-filters
   ```
4. **Visualize os resultados** no console e no arquivo `log.log`
5. **Consulte a configuração** se necessário:
   ```bash
   npm run config
   ```

## 🆘 Tipos de erros

| Tipo de Erro | Descrição |
|--------------|-----------|
| `MISSING_FIELD` | Campo obrigatório ausente |
| `INVALID_TITLE` | Title não está na lista válida |
| `INVALID_SPOT_NAME` | Spot name não corresponde ao title |
| `INVALID_SPOT_TYPE` | Spot type não está na lista válida |
| `INVALID_SPOT_DATA_FORMAT` | Estrutura do spot_data inválida conforme schema |
| `MISSING_REQUIRED_SECONDARY_FILTERS` | 🆕 Filtros secundários obrigatórios ausentes/incorretos - **Classificados por spot_name** |
| `INVALID_FIELD` | Campo com formato incorreto |
| `FILE_ERROR` | Erro ao processar arquivo JSON |

### 🎯 **Detalhamento: MISSING_REQUIRED_SECONDARY_FILTERS**

Este tipo de erro agora possui **classificação inteligente por spot_name**:

**📊 Spot Configurado:**
- **Status:** `Filtro default configurado`  
- **Significado:** O spot_name possui pelo menos um item com os 5 filtros obrigatórios corretos
- **Ação:** ✅ Spot está OK, pode ter alguns itens com erro mas a configuração base existe

**📊 Spot Não Configurado:**  
- **Status:** `X itens sem filtros defaults`
- **Significado:** Nenhum item do spot_name possui os filtros obrigatórios corretos
- **Ação:** ❌ Requer atenção imediata - configurar filtros defaults

**🔍 Filtros Obrigatórios:**
1. Sub-mercados: SE/CO
2. Sub-mercados: N  
3. Sub-mercados: S
4. Sub-mercados: NE
5. Modelos: Conjunto ONS

## 🎯 Casos de uso dos comandos

### 📊 **Validação Completa** (`npm run dev`)
**Quando usar:**
- Validar todos os aspectos dos payloads
- Verificar integridade geral dos dados
- Gerar relatórios completos de erros
- Auditoria completa de qualidade

### 🔍 **Busca de Filtros** (`npm run search-filters`)
**Quando usar:**
- Encontrar itens específicos com filtros corretos
- Verificar quantos itens atendem aos critérios de filtros
- Análise rápida sem validação completa
- Identificar itens para processamento especial

### ⚙️ **Visualizar Configuração** (`npm run config`)
**Quando usar:**
- Consultar regras de validação
- Ver lista de spot_types válidos
- Verificar filtros obrigatórios
- Documentação das regras ativas

---

## 🚀 Comandos principais

| Comando | Finalidade | Saída |
|---------|------------|-------|
| `npm run dev` | Validação completa | Console + log.log |
| `npm run search-filters` | 🆕 Buscar cargas com filtros defaults | Console apenas |
| `npm run config` | Ver configuração | Console apenas |

🎉 **Validador completo pronto para uso!**

- 🔍 **Para validação geral**: `npm run dev`
- 🎯 **Para busca específica de filtros default**: `npm run search-filters`  
- ⚙️ **Para ver regras**: `npm run config` 

### 🆕 **Melhorias Recentes**

✅ **Classificação Inteligente por spot_name**
- Identifica automaticamente quais spots estão configurados vs. não configurados
- Exibe "Filtro default configurado" para spots com pelo menos 1 item correto
- Mostra contagem detalhada para spots sem configuração

✅ **Logs Aprimorados**  
- Formatação profissional seguindo padrões visuais
- Separação clara entre tipos de erros
- Relatórios mais informativos para tomada de decisão

✅ **Estatísticas Detalhadas**
- Resumo final consolidado por spot_name
- Visão clara de prioridades de correção
- Informações estruturadas para análise 