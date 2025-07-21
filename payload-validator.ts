import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Tipos para o payload
interface Filter {
    name: string;
    value: string;
}

interface SpotData {
    title: string;
    y_label?: string;
    y_type?: string;
    show_legend?: boolean;
    show_timeline?: boolean;
    x?: any;
    y?: any;
    color_ids?: number[];
}

interface PayloadItem {
    spot_name: string;
    spot_type: string;
    primary_filters: Filter[];
    secondary_filters: Filter[];
    specific_filters: Filter[];
    spot_data: SpotData;
}

// Configurações de validação baseadas nos dados fornecidos
const VALID_SPOT_TYPES = [
    "line",
    "table", 
    "column",
    "area",
    "brazil-power-generation",
    "iframe",
    "map",
    "elninolanina",
    "madden-julian",
    "columnarea",
    "card"
];

// Filtros secundários defaults
const REQUIRED_SECONDARY_FILTERS = [
    { "name": "Sub-mercados", "value": "SE/CO" },
    { "name": "Sub-mercados", "value": "N" },
    { "name": "Sub-mercados", "value": "S" },
    { "name": "Sub-mercados", "value": "NE" },
    { "name": "Modelos", "value": "Conjunto ONS" }
];

// Schemas de validação para spot_data baseados no spot_type
const SPOT_DATA_SCHEMAS = {
    "line": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "y_label": {"type": "string"},
            "y_type": {"enum": ["integer", "%"]},
            "y_extra_label": {"type": "string"},
            "y_extra_type": {"enum": ["integer", "%"]},
            "show_legend": {"type": "boolean"},
            "show_timeline": {"type": "boolean"},
            "x": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "string", "format": "date"}
                }
            },
            "y": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "number"}
                }
            },
            "color_ids": {
                "type": "array",
                "items": {"type": "number"}
            }
        },
        "required": ["title", "y_label", "y_type", "show_legend", "show_timeline", "x", "y", "color_ids"]
    },
    "table": {
        "type": "object",
        "properties": {
            "header": {"type": "string"},
            "rows": {
                "type": "array",
                "items": {"type": "string"}
            },
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "date": {"type": "string"},
                        "subTitle": {"type": "string"},
                        "key": {
                            "type": "object",
                            "properties": {
                                "values": {
                                    "type": "array",
                                    "items": {"type": "number"}
                                },
                                "skill_level": {"type": "number", "nullable": true}
                            }
                        }
                    }
                }
            }
        },
        "required": ["header", "rows", "items"]
    },
    "column": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "y_label": {"type": "string"},
            "y_type": {"enum": ["integer", "%"]},
            "show_legend": {"type": "boolean"},
            "x": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "string", "format": "date"}
                }
            },
            "y": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "number"}
                }
            },
            "color_ids": {
                "type": "array",
                "items": {"type": "number"}
            }
        },
        "required": ["title", "y_label", "y_type", "show_legend", "x", "y", "color_ids"]
    },
    "area": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "y_label": {"type": "string"},
            "y_extra_label": {"type": "string"},
            "y_type": {"enum": ["integer", "%"]},
            "y_extra_type": {"enum": ["integer", "%"]},
            "show_legend": {"type": "boolean"},
            "x": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "string", "format": "date"}
                }
            },
            "y": {
                "type": "object",
                "properties": {
                    "area": {
                        "type": "object",
                        "additionalProperties": {
                            "type": "array",
                            "items": {"type": "number"}
                        }
                    },
                    "inverted_column": {
                        "type": "object",
                        "additionalProperties": {
                            "type": "array",
                            "items": {"type": "number"}
                        }
                    }
                },
                "required": ["area"]
            },
            "color_ids": {
                "type": "array",
                "items": {"type": "number"}
            }
        },
        "required": ["title", "y_label", "y_type", "show_legend", "x", "y", "color_ids"]
    },
    "brazil-power-generation": {
        "type": "object",
        "properties": {
            "powerDirection": {
                "type": "object",
                "properties": {
                    "Norte": {"type": "string"},
                    "Nordeste": {"type": "string"},
                    "Sudeste/Centro-oeste": {"type": "string"},
                    "Sul": {"type": "string"}
                },
                "required": ["Norte", "Nordeste", "Sudeste/Centro-oeste", "Sul"]
            },
            "cardData": {
                "type": "object",
                "properties": {
                    "Norte": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "Nordeste": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "Sudeste/Centro-oeste": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "Sul": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["Norte", "Nordeste", "Sudeste/Centro-oeste", "Sul"]
            }
        },
        "required": ["powerDirection", "cardData"]
    },
    "iframe": {
        "type": "object",
        "properties": {
            "src": {"type": "string"}
        },
        "required": ["src"]
    },
    "map": {},
    "elninolanina": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "y_label": {"type": "string"},
            "y_type": {"enum": ["integer", "%"]},
            "x": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "y": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "number"}
                }
            },
            "color_ids": {
                "type": "array",
                "items": {"type": "number"}
            }
        },
        "required": ["title", "y_label", "y_type", "x", "y", "color_ids"]
    },
    "madden-julian": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "y_label": {"type": "string"},
            "y_type": {"enum": ["integer", "%"]},
            "x": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "y": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "number"}
                }
            },
            "color_ids": {
                "type": "array",
                "items": {"type": "number"}
            }
        },
        "required": ["title", "y_label", "y_type", "x", "y", "color_ids"]
    },
    "columnarea": {
        "type": "object",
        "properties": {
            "show_legend": {"type": "boolean"},
            "title": {"type": "string"},
            "y_label": {"type": "string"},
            "y_type": {"type": "string", "enum": ["integer", "%"]},
            "x": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "y": {
                "type": "object",
                "properties": {
                    "column": {
                        "type": "object",
                        "additionalProperties": {
                            "type": "array",
                            "items": {"type": "number"}
                        }
                    },
                    "area": {
                        "type": "object",
                        "additionalProperties": {
                            "type": "array",
                            "items": {"type": "number"}
                        }
                    }
                },
                "required": ["column", "area"]
            },
            "color_ids": {
                "type": "array",
                "items": {"type": "number"}
            }
        },
        "required": ["show_legend", "title", "y_label", "y_type", "x", "y", "color_ids"]
    },
    "card": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "processing_day": {
                "type": "object",
                "properties": {
                    "date": {"type": "string"},
                    "skill_level": {"type": "number"},
                    "analytics": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "total": {"type": "number"},
                                "values": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "key": {"type": "string"},
                                            "value": {"type": "number"}
                                        },
                                        "required": ["key", "value"]
                                    }
                                }
                            },
                            "required": ["name", "total", "values"]
                        }
                    }
                },
                "required": ["date"]
            },
            "expected_day": {
                "type": "object",
                "properties": {
                    "date": {"type": "string"},
                    "skill_level": {"type": "number"},
                    "analytics": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "total": {"type": "number"},
                                "values": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "key": {"type": "string"},
                                            "value": {"type": "number"}
                                        },
                                        "required": ["key", "value"]
                                    }
                                }
                            },
                            "required": ["name", "total", "values"]
                        }
                    }
                },
                "required": ["date"]
            },
            "extra_analytics": {
                "type": "object",
                "properties": {
                    "label_1": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string"},
                            "value": {"type": "string"}
                        },
                        "required": ["text", "value"]
                    },
                    "label_2": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string"},
                            "value": {"type": "string"}
                        },
                        "required": ["text", "value"]
                    },
                    "label_3": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string"},
                            "value": {"type": "string"}
                        },
                        "required": ["text", "value"]
                    }
                }
            },
            "main_svg": {"type": "string"},
            "contour": {"type": "string"},
            "view_box": {"type": "string"},
            "ref_bar": {
                "type": "object",
                "properties": {
                    "colors": {
                        "type": "array",
                        "items": {"type": "number"}
                    },
                    "numbers": {
                        "type": "array",
                        "items": {"type": "number"}
                    }
                }
            }
        },
        "required": ["title", "processing_day", "expected_day", "main_svg", "contour", "view_box", "ref_bar"]
    }
};

const VALID_SPOT_DATA_CONFIG = {
    "Gráfico comparativo de precipitação acumulada em 24 horas": [
        "line-precip-acumulada-A",
        "line-precip-acumulada-B",
        "line-precip-acumulada-C",
        "line-precip-acumulada-D",
        "line-precip-acumulada-E"
    ],
    "Mapa comparativo de precipitação acumulada em 24 horas": [
        "card-precip-acumulada-A",
        "card-precip-acumulada-B",
        "card-precip-acumulada-C",
        "card-precip-acumulada-D"
    ],
    "Mapa comparativo da evolução da precipitação acumulada em 24 horas": [
        "card-precip-acumulada-A2",
        "card-precip-acumulada-B2",
        "card-precip-acumulada-C2",
        "card-precip-acumulada-D2"
    ],
    "Gráfico comparativo das anomalias de precipitação acumulada em 24 horas": [
        "line-anomalias-climaticas-A",
        "line-anomalias-climaticas-B",
        "line-anomalias-climaticas-C",
        "line-anomalias-climaticas-D"
    ],
    "Mapa comparativo das anomalias de precipitação acumulada em 24 horas": [
        "card-anomalias-climaticas-A",
        "card-anomalias-climaticas-B",
        "card-anomalias-climaticas-C",
        "card-anomalias-climaticas-D"
    ],
    "Mapa comparativo da evolução das anomalias de precipitação acumulada em 24 horas": [
        "card-anomalias-A",
        "card-anomalias-B",
        "card-anomalias-C",
        "card-anomalias-D"
    ],
    "Gráfico do El Niño-Oscilação do Sul (ENSO)": [
        "elninolanina-oscilacao-sul"
    ],
    "Gráfico da Oscilação de Madden-Julian (MJO)": [
        "madden-julian-oscilacao"
    ],
    "Gráfico de acompanhamento da ENA": [
        "column-ena-1",
        "column-ena-2",
        "column-ena-3",
        "column-ena-4"
    ],
    "Tabela de acompanhamento da Energia Natural Afluente": [
        "table-ena"
    ],
    "Gráfico de acompanhamento da EAR": [
        "column-ener-armazenada-1",
        "column-ener-armazenada-2",
        "column-ener-armazenada-3",
        "column-ener-armazenada-4"
    ],
    "Tabela de acompanhamento da Energia Armazenada": [
        "table-ener-armazenada"
    ],
    "Gráfico de acompanhamento da Carga": [
        "column-carga-1",
        "column-carga-2",
        "column-carga-3",
        "column-carga-4"
    ],
    "Tabela de acompanhamento da Carga": [
        "table-carga"
    ],
    "Gráfico da ENA: IPDO vs VO vs RDH": [
        "line-ipdo-ro-1",
        "line-ipdo-ro-2",
        "line-ipdo-ro-3",
        "line-ipdo-ro-4"
    ],
    "Tabela da ENA: IPDO vs VO vs RDH": [
        "table-ipdo-ro"
    ],
    "Gráfico da ENA vs Carga do IPDO": [
        "column-ena-carga-1",
        "column-ena-carga-2",
        "column-ena-carga-3",
        "column-ena-carga-4"
    ],
    "Tabela da ENA vs Carga do IPDO": [
        "table-ena-carga"
    ],
    "Infográfico da Geração-Carga do IPDO": [
        "powermap-geracao-carga"
    ],
    "Relatórios do ONS": [
        "iframe-relatorios-ons"
    ],
    "Gráficos de previsão de ENA pelo SMAP do ONS": [
        "area-ena-prev-smap-1",
        "area-ena-prev-smap-2",
        "area-ena-prev-smap-3",
        "area-ena-prev-smap-4"
    ],
    "Tabela de previsão de ENA pelo SMAP do ONS": [
        "table-ena-prev-smap"
    ],
    "Gráficos de previsão de ENA por AI": [
        "area-ena-prev-ia"
    ],
    "Tabela de previsão de ENA por AI": [
        "table-ena-prev-ia"
    ],
    "Gráficos de Previsão da Energia Armazenada ONS": [
        "column-ena-arm-ONS-1",
        "column-ena-arm-ONS-2",
        "column-ena-arm-ONS-3",
        "column-ena-arm-ONS-4"
    ],
    "Tabela de Previsão da Energia Armazenada ONS": [
        "table-ena-arm-ONS"
    ],
    "Gráficos de Previsão da Energia Armazenada por AI": [
        "column-ena-arm-IA-1",
        "column-ena-arm-IA-2",
        "column-ena-arm-IA-3",
        "column-ena-arm-IA-4"
    ],
    "Tabela de Previsão da Energia Armazenada por AI": [
        "table-ena-arm-IA"
    ],
    "Gráficos de previsão da Carga do ONS": [
        "line-carga-prev-ONS-1",
        "line-carga-prev-ONS-2",
        "line-carga-prev-ONS-3",
        "line-carga-prev-ONS-4"
    ],
    "Tabela de previsão de Carga do ONS": [
        "table-carga-prev-ONS"
    ],
    "Gráficos de previsão de Carga AI": [
        "line-carga-prev-IA-1",
        "line-carga-prev-IA-2",
        "line-carga-prev-IA-3",
        "line-carga-prev-IA-4"
    ],
    "Tabela de previsão de Carga por AI": [
        "table-carga-prev-IA"
    ],
    "Gráficos de previsão do PIB": [
        "area-prev-PIB-IA"
    ],
    "Tabela de previsão do PIB": [
        "table-prev-PIB-IA"
    ],
    "Relatório Focus": [
        "iframe-FOCUS-report"
    ],
    "Índices de Mercado": [
        "area-mercado-indices"
    ]
};

interface ValidationError {
    fileName: string;
    itemIndex: number;
    spot_name: string;
    errorType: string;
    message: string;
    timestamp: Date;
}

class PayloadValidator {
    private errors: ValidationError[] = [];
    private ajv: Ajv;
    private itemsWithRequiredFilters: Array<{fileName: string, itemIndex: number, spot_name: string}> = [];
    
    constructor() {
        this.ajv = new Ajv();
        addFormats(this.ajv);
    }

    private addError(fileName: string, itemIndex: number, spot_name: string, errorType: string, message: string) {
        this.errors.push({
            fileName,
            itemIndex,
            spot_name,
            errorType,
            message,
            timestamp: new Date()
        });
    }

    private validateSpotDataTitle(title: string): boolean {
        return Object.keys(VALID_SPOT_DATA_CONFIG).includes(title);
    }

    private validateSpotName(title: string, spot_name: string): boolean {
        const validSpotNames = VALID_SPOT_DATA_CONFIG[title as keyof typeof VALID_SPOT_DATA_CONFIG];
        return validSpotNames ? validSpotNames.includes(spot_name) : false;
    }

    private validateSpotType(spot_type: string): boolean {
        return VALID_SPOT_TYPES.includes(spot_type);
    }

    private validateSpotDataFormat(spot_type: string, spot_data: SpotData): boolean {
        const schema = SPOT_DATA_SCHEMAS[spot_type as keyof typeof SPOT_DATA_SCHEMAS];
        if (!schema) {
            return false;
        }
        
        // Para o tipo "map" que tem schema vazio, sempre retorna true
        if (Object.keys(schema).length === 0) {
            return true;
        }
        
        const validate = this.ajv.compile(schema);
        return validate(spot_data);
    }

    private validateRequiredSecondaryFilters(secondary_filters: Filter[]): boolean {
        // Verificar se tem exatamente 5 filtros
        if (secondary_filters.length !== 5) {
            return false;
        }

        // Converter os filtros obrigatórios em strings para comparação
        const requiredFiltersSet = new Set(
            REQUIRED_SECONDARY_FILTERS.map(filter => `${filter.name}:${filter.value}`)
        );

        // Converter os filtros do item em strings
        const itemFiltersSet = new Set(
            secondary_filters.map(filter => `${filter.name}:${filter.value}`)
        );

        // Verificar se os conjuntos são idênticos
        if (requiredFiltersSet.size !== itemFiltersSet.size) {
            return false;
        }

        for (const filter of requiredFiltersSet) {
            if (!itemFiltersSet.has(filter)) {
                return false;
            }
        }

        return true;
    }

    private hasRequiredSecondaryFilters(secondary_filters: Filter[]): boolean {
        return this.validateRequiredSecondaryFilters(secondary_filters);
    }

    private getSecondaryFiltersErrorMessage(secondary_filters: Filter[]): string {
        const requiredFiltersSet = new Set(
            REQUIRED_SECONDARY_FILTERS.map(filter => `${filter.name}:${filter.value}`)
        );

        const itemFiltersSet = new Set(
            secondary_filters.map(filter => `${filter.name}:${filter.value}`)
        );

        const missing = [...requiredFiltersSet].filter(filter => !itemFiltersSet.has(filter));
        const extra = [...itemFiltersSet].filter(filter => !requiredFiltersSet.has(filter));

        let message = `Filtros secundários obrigatórios não conferem. `;
        
        if (secondary_filters.length !== 5) {
            message += `Esperado 5 filtros, encontrado ${secondary_filters.length}. `;
        }

        if (missing.length > 0) {
            message += `Faltando: [${missing.map(f => f.replace(':', ': ')).join(', ')}]. `;
        }

        if (extra.length > 0) {
            message += `Extras: [${extra.map(f => f.replace(':', ': ')).join(', ')}]. `;
        }

        message += `Obrigatórios: ${REQUIRED_SECONDARY_FILTERS.map(f => `${f.name}: ${f.value}`).join(', ')}`;

        return message;
    }

    private getSchemaValidationErrors(spot_type: string, spot_data: SpotData): string {
        const schema = SPOT_DATA_SCHEMAS[spot_type as keyof typeof SPOT_DATA_SCHEMAS];
        if (!schema || Object.keys(schema).length === 0) {
            return '';
        }
        
        const validate = this.ajv.compile(schema);
        validate(spot_data);
        return validate.errors ? JSON.stringify(validate.errors, null, 2) : '';
    }

    private validatePayloadItem(fileName: string, item: PayloadItem, index: number): boolean {
        let isValid = true;

        // Validar se o objeto tem as propriedades obrigatórias
        if (!item.spot_name) {
            this.addError(fileName, index, item.spot_name || 'N/A', 'MISSING_FIELD', 'Campo spot_name ausente');
            isValid = false;
        }

        if (!item.spot_type) {
            this.addError(fileName, index, item.spot_name || 'N/A', 'MISSING_FIELD', 'Campo spot_type ausente');
            isValid = false;
        }

        if (!item.spot_data) {
            this.addError(fileName, index, item.spot_name || 'N/A', 'MISSING_FIELD', 'Campo spot_data ausente');
            isValid = false;
            return isValid;
        }

        if (!item.spot_data.title) {
            this.addError(fileName, index, item.spot_name || 'N/A', 'MISSING_FIELD', 'Campo spot_data.title ausente');
            isValid = false;
            return isValid;
        }

        // Validar se o spot_data.title é válido
        if (!this.validateSpotDataTitle(item.spot_data.title)) {
            this.addError(fileName, index, item.spot_name, 'INVALID_TITLE', 
                `spot_data.title inválido: "${item.spot_data.title}"`);
            isValid = false;
        } else {
            // Validar se o spot_name é válido para o title
            if (!this.validateSpotName(item.spot_data.title, item.spot_name)) {
                this.addError(fileName, index, item.spot_name, 'INVALID_SPOT_NAME', 
                    `spot_name "${item.spot_name}" não é válido para o title "${item.spot_data.title}"`);
                isValid = false;
            }
        }

        // Validar se o spot_type é válido
        if (!this.validateSpotType(item.spot_type)) {
            this.addError(fileName, index, item.spot_name, 'INVALID_SPOT_TYPE', 
                `spot_type inválido: "${item.spot_type}"`);
            isValid = false;
        } else {
            // Validar o formato do spot_data baseado no spot_type
            if (!this.validateSpotDataFormat(item.spot_type, item.spot_data)) {
                const errorDetails = this.getSchemaValidationErrors(item.spot_type, item.spot_data);
                this.addError(fileName, index, item.spot_name, 'INVALID_SPOT_DATA_FORMAT', 
                    `Formato do spot_data inválido para spot_type "${item.spot_type}". Erros: ${errorDetails}`);
                isValid = false;
            }
        }

        // Validar se o array de filters (mesmo que vazio por enquanto)
        if (!Array.isArray(item.primary_filters)) {
            this.addError(fileName, index, item.spot_name, 'INVALID_FIELD', 'primary_filters deve ser um array');
            isValid = false;
        }

        if (!Array.isArray(item.secondary_filters)) {
            this.addError(fileName, index, item.spot_name, 'INVALID_FIELD', 'secondary_filters deve ser um array');
            isValid = false;
        }

        if (!Array.isArray(item.specific_filters)) {
            this.addError(fileName, index, item.spot_name, 'INVALID_FIELD', 'specific_filters deve ser um array');
            isValid = false;
        }

        // Validar se os filtros secundários obrigatórios estão presentes
        if (!this.hasRequiredSecondaryFilters(item.secondary_filters)) {
            this.addError(fileName, index, item.spot_name, 'MISSING_REQUIRED_SECONDARY_FILTERS', 
                this.getSecondaryFiltersErrorMessage(item.secondary_filters));
            isValid = false;
        } else {
            this.itemsWithRequiredFilters.push({ fileName, itemIndex: index, spot_name: item.spot_name });
        }

        return isValid;
    }

    public validateFile(filePath: string): boolean {
        console.log(`\n🔍 Validando arquivo: ${filePath}`);
        
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);

            if (!Array.isArray(data)) {
                this.addError(filePath, -1, 'N/A', 'INVALID_FORMAT', 'O arquivo deve conter um array de objetos');
                return false;
            }

            let validItems = 0;
            data.forEach((item: PayloadItem, index: number) => {
                if (this.validatePayloadItem(filePath, item, index)) {
                    validItems++;
                }
            });

            const totalItems = data.length;
            const invalidItems = totalItems - validItems;

            console.log(`✅ Itens válidos: ${validItems}`);
            console.log(`❌ Itens inválidos: ${invalidItems}`);
            console.log(`📊 Total de itens: ${totalItems}`);

            return invalidItems === 0;

        } catch (error) {
            this.addError(filePath, -1, 'N/A', 'FILE_ERROR', `Erro ao processar arquivo: ${error}`);
            console.log(`❌ Erro ao processar arquivo: ${error}`);
            return false;
        }
    }

    public validateAllFiles(): void {
        console.log('🚀 Iniciando validação de integridade dos payloads...\n');
        
        const currentDir = process.cwd();
        // Filtrar apenas arquivos JSON de payload (ignorar arquivos de configuração)
        const configFiles = ['package.json', 'package-lock.json', 'tsconfig.json', 'node_modules'];
        const files = fs.readdirSync(currentDir)
            .filter(file => file.endsWith('.json'))
            .filter(file => !configFiles.includes(file));

        if (files.length === 0) {
            console.log('⚠️  Nenhum arquivo JSON de payload encontrado na pasta atual.');
            return;
        }

        console.log(`📁 Arquivos de payload encontrados: ${files.length}`);
        files.forEach(file => console.log(`   - ${file}`));

        let validFiles = 0;
        files.forEach(file => {
            const filePath = path.join(currentDir, file);
            if (this.validateFile(filePath)) {
                validFiles++;
            }
        });

        // Exibir resumo
        console.log('\n' + '═'.repeat(80));
        console.log('📋 RESUMO DA VALIDAÇÃO');
        console.log('═'.repeat(80));
        console.log(`✅ Arquivos válidos: ${validFiles}`);
        console.log(`❌ Arquivos com erros: ${files.length - validFiles}`);
        console.log(`📊 Total de arquivos: ${files.length}`);
        console.log(`🚨 Total de erros encontrados: ${this.errors.length}`);
        
        // Exibir estatísticas dos filtros secundários obrigatórios
        if (this.itemsWithRequiredFilters.length > 0) {
            console.log(`\n🎯 ITENS COM FILTROS SECUNDÁRIOS OBRIGATÓRIOS`);
            console.log(`📍 Total de itens encontrados: ${this.itemsWithRequiredFilters.length}`);
            this.displayItemsWithRequiredFilters();
        } else {
            console.log(`\n⚠️  Nenhum item encontrado com os filtros secundários obrigatórios especificados.`);
        }

        if (this.errors.length > 0) {
            this.displayErrors();
            this.generateLogFile();
        } else {
            console.log('\n🎉 Todos os arquivos estão válidos!');
        }
    }

    private displayItemsWithRequiredFilters(): void {
        // Agrupar por arquivo
        const itemsByFile = this.itemsWithRequiredFilters.reduce((acc, item) => {
            const fileName = path.basename(item.fileName);
            if (!acc[fileName]) {
                acc[fileName] = [];
            }
            acc[fileName].push(item);
            return acc;
        }, {} as Record<string, Array<{fileName: string, itemIndex: number, spot_name: string}>>);

        Object.entries(itemsByFile).forEach(([fileName, items]) => {
            console.log(`\n📄 ${fileName} (${items.length} itens):`);
            items.forEach(item => {
                console.log(`   ✅ Item ${item.itemIndex}: ${item.spot_name}`);
            });
        });

        console.log(`\n📝 Filtros obrigatórios:`);
        REQUIRED_SECONDARY_FILTERS.forEach((filter, index) => {
            console.log(`   ${index + 1}. ${filter.name}: ${filter.value}`);
        });
    }

    private displayErrors(): void {
        console.log('\n' + '═'.repeat(80));
        console.log('🚨 ERROS ENCONTRADOS');
        console.log('═'.repeat(80));

        const errorsByFile = this.errors.reduce((acc, error) => {
            if (!acc[error.fileName]) {
                acc[error.fileName] = [];
            }
            acc[error.fileName].push(error);
            return acc;
        }, {} as Record<string, ValidationError[]>);

        // Separar erros de MISSING_REQUIRED_SECONDARY_FILTERS para tratamento especial
        const missingFiltersErrors = this.errors.filter(error => error.errorType === 'MISSING_REQUIRED_SECONDARY_FILTERS');
        const otherErrors = this.errors.filter(error => error.errorType !== 'MISSING_REQUIRED_SECONDARY_FILTERS');

        // Mostrar estatísticas de MISSING_REQUIRED_SECONDARY_FILTERS por spot_name
        if (missingFiltersErrors.length > 0) {
            console.log('\n🎯 MISSING_REQUIRED_SECONDARY_FILTERS - Classificação por spot_name:');
            console.log('─'.repeat(60));
            
            const errorsBySpotName = missingFiltersErrors.reduce((acc, error) => {
                if (!acc[error.spot_name]) {
                    acc[error.spot_name] = [];
                }
                acc[error.spot_name].push(error);
                return acc;
            }, {} as Record<string, ValidationError[]>);

            // Verificar quais spot_names têm itens com filtros corretos
            const spotsWithCorrectFilters = new Set(
                this.itemsWithRequiredFilters.map(item => item.spot_name)
            );

            Object.entries(errorsBySpotName).forEach(([spotName, errors]) => {
                if (spotsWithCorrectFilters.has(spotName)) {
                    console.log(`📊 spot_name: "${spotName}" - Filtro default configurado`);
                    console.log(`   💬 Spot possui pelo menos um item com filtros defaults corretos`);
                } else {
                    console.log(`📊 spot_name: "${spotName}" - Total: ${errors.length} itens`);
                    console.log(`   💬 Não foi encontrado nenhum spot com o filtro default definido`);
                    errors.forEach((error, index) => {
                        console.log(`   📍 Item ${error.itemIndex} (${path.basename(error.fileName)})`);
                    });
                }
                console.log('');
            });
        }

        // Mostrar outros tipos de erros
        if (otherErrors.length > 0) {
            console.log('\n📋 OUTROS ERROS:');
            console.log('─'.repeat(60));

            const otherErrorsByFile = otherErrors.reduce((acc, error) => {
                if (!acc[error.fileName]) {
                    acc[error.fileName] = [];
                }
                acc[error.fileName].push(error);
                return acc;
            }, {} as Record<string, ValidationError[]>);

            Object.entries(otherErrorsByFile).forEach(([fileName, fileErrors]) => {
                console.log(`\n📄 Arquivo: ${path.basename(fileName)} (${fileErrors.length} erros)`);
                console.log('─'.repeat(60));
                
                fileErrors.forEach((error, index) => {
                    console.log(`\n   🔴 ERRO #${index + 1}`);
                    console.log(`   📍 Item: ${error.itemIndex >= 0 ? error.itemIndex : 'N/A'}`);
                    console.log(`   🏷️  Spot: ${error.spot_name}`);
                    console.log(`   ⚠️  Tipo: ${error.errorType}`);
                    console.log(`   💬 Mensagem:`);
                    console.log(`      ${error.message}`);
                });
            });
        }
    }

    private generateLogFile(): void {
        const logFileName = 'log.log';
        
        // Agrupar erros por arquivo para estatísticas
        const errorsByFile = this.errors.reduce((acc, error) => {
            const fileName = path.basename(error.fileName);
            if (!acc[fileName]) {
                acc[fileName] = [];
            }
            acc[fileName].push(error);
            return acc;
        }, {} as Record<string, ValidationError[]>);

        // Separar erros de MISSING_REQUIRED_SECONDARY_FILTERS
        const missingFiltersErrors = this.errors.filter(error => error.errorType === 'MISSING_REQUIRED_SECONDARY_FILTERS');
        const otherErrors = this.errors.filter(error => error.errorType !== 'MISSING_REQUIRED_SECONDARY_FILTERS');

        let logContent = '';

        // Cabeçalho do log
        logContent += '╔══════════════════════════════════════════════════════════════════════════════════════════════╗\n';
        logContent += '║                                    LOG DE VALIDAÇÃO DE PAYLOADS                             ║\n';
        logContent += '╚══════════════════════════════════════════════════════════════════════════════════════════════╝\n\n';
        logContent += `📅 Data/Hora: ${new Date().toISOString()}\n`;
        logContent += `🔍 Total de erros: ${this.errors.length}\n`;
        logContent += `📁 Arquivos com erros: ${Object.keys(errorsByFile).length}\n\n`;

        // Log dos arquivos com erros
        Object.entries(errorsByFile).forEach(([fileName, fileErrors]) => {
            logContent += '═'.repeat(100) + '\n';
            logContent += `📄 ARQUIVO: ${fileName}\n`;
            logContent += '═'.repeat(100) + '\n';
            logContent += `📊 Total de erros neste arquivo: ${fileErrors.length}\n\n`;

            // Agrupar erros de MISSING_REQUIRED_SECONDARY_FILTERS por spot_name para este arquivo
            const missingFiltersInFile = fileErrors.filter(error => error.errorType === 'MISSING_REQUIRED_SECONDARY_FILTERS');
            const otherErrorsInFile = fileErrors.filter(error => error.errorType !== 'MISSING_REQUIRED_SECONDARY_FILTERS');

            if (missingFiltersInFile.length > 0) {
                logContent += '🎯 MISSING_REQUIRED_SECONDARY_FILTERS - Classificação por spot_name:\n';
                logContent += '─'.repeat(80) + '\n';
                
                const errorsBySpotName = missingFiltersInFile.reduce((acc, error) => {
                    if (!acc[error.spot_name]) {
                        acc[error.spot_name] = [];
                    }
                    acc[error.spot_name].push(error);
                    return acc;
                }, {} as Record<string, ValidationError[]>);

                // Verificar quais spot_names têm itens com filtros corretos
                const spotsWithCorrectFilters = new Set(
                    this.itemsWithRequiredFilters.map(item => item.spot_name)
                );

                Object.entries(errorsBySpotName).forEach(([spotName, errors]) => {
                    if (spotsWithCorrectFilters.has(spotName)) {
                        logContent += `📊 spot_name: "${spotName}" - Filtro default configurado\n`;
                        logContent += `   💬 Spot possui pelo menos um item com filtros defaults corretos\n`;
                    } else {
                        logContent += `📊 spot_name: "${spotName}" - Total: ${errors.length} itens\n`;
                        logContent += `   💬 Não foi encontrado nenhum spot com o filtro default definido\n`;
                        errors.forEach(error => {
                            logContent += `   📍 Item ${error.itemIndex} - ${error.timestamp.toISOString()}\n`;
                            logContent += `   📝 Detalhes: ${error.message}\n`;
                        });
                    }
                    logContent += '\n';
                });
            }

            // Log dos outros erros
            if (otherErrorsInFile.length > 0) {
                if (missingFiltersInFile.length > 0) {
                    logContent += '\n📋 OUTROS ERROS:\n';
                    logContent += '─'.repeat(80) + '\n';
                }

                otherErrorsInFile.forEach((error, index) => {
                    logContent += '─'.repeat(100) + '\n';
                    logContent += `🔴 ERRO #${index + 1}\n`;
                    logContent += '─'.repeat(100) + '\n';
                    logContent += `📁 Arquivo............: ${fileName}\n`;
                    logContent += `📍 Item...............: ${error.itemIndex >= 0 ? error.itemIndex : 'N/A'}\n`;
                    logContent += `🏷️  Spot Name.........: ${error.spot_name}\n`;
                    logContent += `⚠️  Tipo de Erro......: ${error.errorType}\n`;
                    logContent += `⏰ Timestamp..........: ${error.timestamp.toISOString()}\n\n`;
                    logContent += `💬 Mensagem:\n`;
                    logContent += `   ${error.message}\n\n`;
                });
            }
        });

        // Resumo final para o log
        logContent += '\n' + '═'.repeat(100) + '\n';
        logContent += '📊 RESUMO FINAL DA VALIDAÇÃO\n';
        logContent += '═'.repeat(100) + '\n';
        logContent += `📅 Data/Hora: ${new Date().toISOString()}\n`;
        logContent += `🔍 Total de erros encontrados: ${this.errors.length}\n`;
        logContent += `📁 Arquivos com erros: ${Object.keys(errorsByFile).length}\n\n`;
        
        logContent += '📋 Detalhes por arquivo:\n';
        Object.entries(errorsByFile).forEach(([fileName, fileErrors]) => {
            logContent += `   - ${fileName}: ${fileErrors.length} erros\n`;
        });
        
        logContent += '\n📋 Tipos de erros:\n';
        this.getErrorSummary().forEach(([type, count]) => {
            logContent += `   - ${type}: ${count} ocorrências\n`;
        });

        // Estatísticas de MISSING_REQUIRED_SECONDARY_FILTERS por spot_name
        if (missingFiltersErrors.length > 0) {
            logContent += '\n🎯 MISSING_REQUIRED_SECONDARY_FILTERS por spot_name:\n';
            const errorsBySpotName = missingFiltersErrors.reduce((acc, error) => {
                if (!acc[error.spot_name]) {
                    acc[error.spot_name] = [];
                }
                acc[error.spot_name].push(error);
                return acc;
            }, {} as Record<string, ValidationError[]>);

            // Verificar quais spot_names têm itens com filtros corretos
            const spotsWithCorrectFilters = new Set(
                this.itemsWithRequiredFilters.map(item => item.spot_name)
            );

            Object.entries(errorsBySpotName).forEach(([spotName, errors]) => {
                if (spotsWithCorrectFilters.has(spotName)) {
                    logContent += `   - "${spotName}": Filtro default configurado\n`;
                } else {
                    logContent += `   - "${spotName}": ${errors.length} itens sem filtros defaults\n`;
                }
            });
        }

        logContent += '═'.repeat(100) + '\n';

        fs.writeFileSync(logFileName, logContent);
        console.log(`\n📄 Log de erros salvo em: ${logFileName}`);
    }

    private getErrorSummary(): [string, number][] {
        const errorCounts = this.errors.reduce((acc, error) => {
            acc[error.errorType] = (acc[error.errorType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(errorCounts).sort((a, b) => b[1] - a[1]);
    }

    public getValidTitles(): string[] {
        return Object.keys(VALID_SPOT_DATA_CONFIG);
    }

    public getValidSpotNamesForTitle(title: string): string[] {
        return VALID_SPOT_DATA_CONFIG[title as keyof typeof VALID_SPOT_DATA_CONFIG] || [];
    }

    public getValidSpotTypes(): string[] {
        return VALID_SPOT_TYPES;
    }

    public displayConfiguration(): void {
        console.log('\n' + '='.repeat(50));
        console.log('⚙️  CONFIGURAÇÃO DE VALIDAÇÃO');
        console.log('='.repeat(50));
        
        console.log('\n📋 SPOT_TYPES VÁLIDOS:');
        VALID_SPOT_TYPES.forEach(type => console.log(`   - ${type}`));
        
        console.log('\n📋 SPOT_DATA_TITLES E SPOT_NAMES VÁLIDOS:');
        Object.entries(VALID_SPOT_DATA_CONFIG).forEach(([title, spotNames]) => {
            console.log(`\n📋 ${title}`);
            console.log('   spot_names válidos:');
            spotNames.forEach(name => console.log(`      - ${name}`));
        });

        console.log('\n🎯 FILTROS SECUNDÁRIOS OBRIGATÓRIOS:');
        REQUIRED_SECONDARY_FILTERS.forEach((filter, index) => {
            console.log(`   ${index + 1}. ${filter.name}: ${filter.value}`);
        });
    }

    public searchItemsWithRequiredFilters(): void {
        console.log('🔍 Procurando itens com filtros secundários obrigatórios...\n');
        
        const currentDir = process.cwd();
        const configFiles = ['package.json', 'package-lock.json', 'tsconfig.json', 'node_modules'];
        const files = fs.readdirSync(currentDir)
            .filter(file => file.endsWith('.json'))
            .filter(file => !configFiles.includes(file));

        if (files.length === 0) {
            console.log('⚠️  Nenhum arquivo JSON de payload encontrado na pasta atual.');
            return;
        }

        console.log(`📁 Arquivos encontrados: ${files.length}`);
        files.forEach(file => console.log(`   - ${file}`));

        // Buscar apenas por itens com filtros obrigatórios
        files.forEach(file => {
            const filePath = path.join(currentDir, file);
            this.searchRequiredFiltersInFile(filePath);
        });

        console.log('\n' + '═'.repeat(80));
        console.log('🎯 RESULTADOS DA BUSCA');
        console.log('═'.repeat(80));
        
        if (this.itemsWithRequiredFilters.length > 0) {
            console.log(`📍 Total de itens encontrados: ${this.itemsWithRequiredFilters.length}`);
            this.displayItemsWithRequiredFilters();
        } else {
            console.log(`⚠️  Nenhum item encontrado com os filtros secundários obrigatórios especificados.`);
        }
    }

    private searchRequiredFiltersInFile(filePath: string): void {
        console.log(`\n🔍 Buscando em: ${filePath}`);
        
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);

            if (!Array.isArray(data)) {
                console.log(`❌ Arquivo não contém um array de objetos`);
                return;
            }

            let foundItems = 0;
            data.forEach((item: PayloadItem, index: number) => {
                if (item.secondary_filters && this.hasRequiredSecondaryFilters(item.secondary_filters)) {
                    this.itemsWithRequiredFilters.push({ 
                        fileName: filePath, 
                        itemIndex: index, 
                        spot_name: item.spot_name || 'N/A' 
                    });
                    foundItems++;
                }
            });

            console.log(`✅ Itens encontrados: ${foundItems}`);
            console.log(`📊 Total de itens no arquivo: ${data.length}`);

        } catch (error) {
            console.log(`❌ Erro ao processar arquivo: ${error}`);
        }
    }
}

// Função principal
function main() {
    const validator = new PayloadValidator();
    
    // Verificar argumentos da linha de comando
    const args = process.argv.slice(2);
    
    // Exibir configuração se solicitado
    if (args.includes('--config')) {
        validator.displayConfiguration();
        return;
    }

    // Buscar apenas por itens com filtros obrigatórios
    if (args.includes('--search-filters')) {
        validator.searchItemsWithRequiredFilters();
        return;
    }

    // Executar validação completa (padrão)
    validator.validateAllFiles();
}

// Executar o script
if (require.main === module) {
    main();
}

export { PayloadValidator }; 