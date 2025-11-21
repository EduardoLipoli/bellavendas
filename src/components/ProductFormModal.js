import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCamera, faCalculator, faTimes, faSync, 
  faBarcode, faKey, faBoxOpen
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { isSkuUnique, isBarcodeUnique } from '../services/firestoreService';
import CurrencyInput from 'react-currency-input-field';

const customStyles = {
  content: {
    top: '0',
    right: '0',
    bottom: '0',
    left: 'auto',
    width: '700px', // <-- Aumentado de 500px para 700px
    padding: '0',
    overflow: 'hidden',
    border: 'none',
    borderRadius: '0',
    boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
    transform: 'none',
    margin: '0',
    maxHeight: '100vh',
    transition: 'transform 0.3s ease-out',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(2px)',
    zIndex: 1000,
  }
};

Modal.setAppElement('#root');

const UNIDADES_MEDIDA = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'cm', label: 'Centímetro (cm)' },
  { value: 'm2', label: 'Metro quadrado (m²)' },
];

const ProductFormModal = ({ 
  isOpen, 
  onRequestClose, 
  onSave, 
  produto, 
  isSubmitting, 
  categorias = [], 
  fornecedores = [] 
}) => {
  const [formData, setFormData] = useState({
    nome: '', 
    descricao: '',
    categoria: '', 
    fornecedorId: '', 
    codigo: '', 
    codigoDeBarras: '',
    preco: '', 
    estoque: 0, 
    estoqueMinimo: 0,
    custo: '', 
    gastosAdicionais: '', 
    margemLucro: '',
    unidadeMedida: 'un',
    status: 'ativo',
    url: ''
  });
  
  const [lastEditedField, setLastEditedField] = useState(null);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showCalculadora, setShowCalculadora] = useState(false);

    // Efeito para calcular o PREÇO a partir do CUSTO
    useEffect(() => {
        if (['custo', 'margemLucro', 'gastosAdicionais'].includes(lastEditedField)) {
            const custo = parseFloat(formData.custo) || 0;
            const gastos = parseFloat(formData.gastosAdicionais) || 0;
            const markupPercent = parseFloat(formData.margemLucro) || 0;
            if (custo > 0 && markupPercent > 0) {
                const precoSugerido = (custo + gastos) * (1 + (markupPercent / 100));
                setFormData(prev => ({ ...prev, preco: String(precoSugerido.toFixed(2)) }));
            }
        }
    }, [formData.custo, formData.gastosAdicionais, formData.margemLucro, lastEditedField]);

    // Efeito para calcular o CUSTO a partir do PREÇO
    useEffect(() => {
        if (lastEditedField === 'preco') {
            const preco = parseFloat(formData.preco) || 0;
            const gastos = parseFloat(formData.gastosAdicionais) || 0;
            const markupPercent = parseFloat(formData.margemLucro) || 0;
            if (preco > 0 && markupPercent > 0) {
                const custoTotalSugerido = preco / (1 + (markupPercent / 100));
                const custoProdutoSugerido = custoTotalSugerido - gastos;
                setFormData(prev => ({ ...prev, custo: String(custoProdutoSugerido.toFixed(2)) }));
            }
        }
    }, [formData.preco, formData.gastosAdicionais, formData.margemLucro, lastEditedField]);


  // Popular formulário ao abrir
  useEffect(() => {
    if (isOpen) {
      const errors = {};
      if (produto) {
        setFormData({
          nome: produto.nome || '',
          descricao: produto.descricao || '',
          categoria: produto.categoria || '',
          fornecedorId: produto.fornecedorId || '',
          codigo: produto.codigo || '',
          codigoDeBarras: produto.codigoDeBarras || '',
          preco: produto.preco?.toFixed(2) || '',
          estoque: produto.estoque || 0,
          estoqueMinimo: produto.estoqueMinimo || 0,
          custo: produto.custo?.toFixed(2) || '',
          gastosAdicionais: produto.gastosAdicionais?.toFixed(2) || '',
          margemLucro: produto.margemLucro?.toFixed(2) || '',
          unidadeMedida: produto.unidadeMedida || 'un',
          status: produto.status || 'ativo',
          url: produto.url || ''
        });
        setImagePreview(produto.imageUrl || '');
        
        // Verificar estoque mínimo
        if (produto.estoqueMinimo && produto.estoque <= produto.estoqueMinimo) {
          errors.estoque = 'Estoque abaixo do mínimo';
        }
      } else {
        setFormData({ 
          nome: '', 
          descricao: '',
          categoria: '', 
          fornecedorId: '', 
          codigo: '', 
          codigoDeBarras: '',
          preco: '', 
          estoque: 0, 
          estoqueMinimo: 0,
          custo: '', 
          gastosAdicionais: '', 
          margemLucro: '',
          unidadeMedida: 'un',
          status: 'ativo',
          url: ''
        });
        setImagePreview('');
      }
      setValidationErrors(errors);
      setLastEditedField(null);
      setImageFile(null);
    }
  }, [produto, isOpen]);

  // Validar campos
  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'nome':
        if (!value.trim()) errors.nome = 'Nome é obrigatório';
        else if (value.length < 3) errors.nome = 'Nome muito curto';
        else delete errors.nome;
        break;
        
      case 'codigo':
        if (!value.trim()) errors.codigo = 'SKU é obrigatório';
        else delete errors.codigo;
        break;
        
      case 'preco':
        if (!value || parseFloat(value) <= 0) errors.preco = 'Preço inválido';
        else delete errors.preco;
        break;
        
      case 'custo':
        if (!value || parseFloat(value) <= 0) errors.custo = 'Custo inválido';
        else delete errors.custo;
        break;
        
      case 'estoque':
        if (isNaN(value) || value < 0) errors.estoque = 'Estoque inválido';
        else if (formData.estoqueMinimo && value < formData.estoqueMinimo) {
          errors.estoque = 'Estoque abaixo do mínimo';
        } else delete errors.estoque;
        break;
        
      case 'estoqueMinimo':
        if (isNaN(value) || value < 0) errors.estoqueMinimo = 'Valor inválido';
        else if (formData.estoque && value > formData.estoque) {
          errors.estoqueMinimo = 'Não pode ser maior que estoque';
        } else delete errors.estoqueMinimo;
        break;
        
      default:
        delete errors[name];
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

        // Handler para todos os inputs de valor (usando a biblioteca CurrencyInput)
    const handleValueChange = (value, name) => {
        setLastEditedField(name);
        // O 'value' da biblioteca já é uma string com ponto (ex: "123.45"), pronto para o estado
        setFormData(prev => ({ ...prev, [name]: value || '' }));
        validateField(name, value || '');
    };

  const handleSelectChange = (option, action) => {
    const name = action.name;
    const value = option ? option.value : '';
    setLastEditedField(name);
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleGenerateSku = async () => {
    if (!formData.nome) {
      toast.error("Preencha o nome do produto para gerar um SKU.");
      return;
    }
    
    setIsGeneratingSku(true);
    let newSku = '';
    let skuIsUnique = false;
    let attempts = 0;

    while (!skuIsUnique && attempts < 10) {
      const nomeParte = formData.nome.substring(0, 3).toUpperCase().replace(/\s/g, '');
      const timeParte = Date.now().toString(36).slice(-5).toUpperCase();
      newSku = `${nomeParte}-${timeParte}`;
      skuIsUnique = await isSkuUnique(newSku, produto?.id);
      attempts++;
    }

    if (skuIsUnique) {
      setFormData(prev => ({ ...prev, codigo: newSku }));
      toast.success("SKU único gerado!");
    } else {
      toast.error("Não foi possível gerar um SKU único. Tente novamente.");
    }
    setIsGeneratingSku(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo e tamanho da imagem
      if (!file.type.match('image/jpeg|image/png')) {
        toast.error("Formato inválido! Use JPG ou PNG.");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem é muito grande! O máximo é 5MB.");
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos os campos
    const fieldsToValidate = [
      'nome', 'codigo', 'preco', 'custo', 
      'estoque', 'estoqueMinimo'
    ];
    
    let isValid = true;
    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      toast.error("Corrija os campos destacados antes de salvar");
      return;
    }
    
    // Verificar unicidade do código de barras
    if (formData.codigoDeBarras) {
      const isUnique = await isBarcodeUnique(
        formData.codigoDeBarras, 
        produto?.id
      );
      
      if (!isUnique) {
        toast.error("Código de barras já está em uso!");
        setValidationErrors(prev => ({
          ...prev,
          codigoDeBarras: 'Código já cadastrado'
        }));
        return;
      }
    }
    
    // Verificar relação custo/preço
    const custoTotal = (parseFloat(formData.custo) || 0) + 
                      (parseFloat(formData.gastosAdicionais) || 0);
    
    if ((parseFloat(formData.preco) || 0) < custoTotal) {
      toast.error("O preço de venda não pode ser menor que o custo total.");
      return;
    }

    // Preparar dados para salvar
    const fornecedorSelecionado = fornecedores.find(f => f.id === formData.fornecedorId);
    const dataToSave = {
      ...formData,
      preco: parseFloat(formData.preco) || 0,
      estoque: parseInt(formData.estoque, 10) || 0,
      estoqueMinimo: parseInt(formData.estoqueMinimo, 10) || 0,
      custo: parseFloat(formData.custo) || 0,
      gastosAdicionais: parseFloat(formData.gastosAdicionais) || 0,
      margemLucro: parseFloat(formData.margemLucro) || 0,
      fornecedorNome: fornecedorSelecionado ? fornecedorSelecionado.nome : 'N/A',
      ultimaAtualizacao: new Date().toISOString()
    };
    
    onSave(dataToSave, imageFile);
  };

  const lucroBruto = (parseFloat(formData.preco) || 0) - 
                     ((parseFloat(formData.custo) || 0) + 
                     (parseFloat(formData.gastosAdicionais) || 0));

  return (
    <Modal 
      isOpen={isOpen} 
      onRequestClose={onRequestClose} 
      style={customStyles} 
      closeTimeoutMS={300}
    >
      <div className="flex flex-col h-full">
        <div className="bg-gradient-to-r from-primary-dark to-primary text-white p-6 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{produto ? 'Editar Produto' : 'Novo Produto'}</h2>
            <button onClick={onRequestClose} className="text-white hover:text-rose-200">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-white overflow-y-auto flex-grow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Foto do Produto
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-gray-50 overflow-hidden">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Pré-visualização" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FontAwesomeIcon 
                      icon={faCamera} 
                      className="text-gray-400" 
                      size="2x"
                    />
                  )}
                </div>
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <span>Escolher Imagem</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      accept="image/png, image/jpeg" 
                      onChange={handleImageChange} 
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-3">
                    Formatos: JPG, PNG (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Nome do Produto *
              </label>
              <input 
                name="nome" 
                value={formData.nome} 
                onChange={handleChange} 
                className={`w-full p-2 border rounded-lg ${
                  validationErrors.nome ? 'border-red-500' : 'border-gray-300'
                }`} 
              />
              {validationErrors.nome && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Descrição
              </label>
              <textarea 
                name="descricao" 
                value={formData.descricao} 
                onChange={handleChange} 
                rows="3" 
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Detalhes, características, especificações..."
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Categoria
                </label>
                <Select 
                  options={categorias.map(c => ({ value: c.nome, label: c.nome }))} 
                  value={categorias.map(c => ({ value: c.nome, label: c.nome }))
                    .find(c => c.value === formData.categoria)} 
                  onChange={handleSelectChange} 
                  name="categoria" 
                  placeholder="Buscar..." 
                  isClearable 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Fornecedor
                </label>
                <Select 
                  options={fornecedores.map(f => ({ value: f.id, label: f.nome }))} 
                  value={fornecedores.map(f => ({ value: f.id, label: f.nome }))
                    .find(f => f.value === formData.fornecedorId)} 
                  onChange={handleSelectChange} 
                  name="fornecedorId" 
                  placeholder="Buscar..." 
                  isClearable 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Unidade de Medida
                </label>
                <Select 
                  options={UNIDADES_MEDIDA} 
                  value={UNIDADES_MEDIDA.find(um => um.value === formData.unidadeMedida)} 
                  onChange={handleSelectChange} 
                  name="unidadeMedida"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Status
                </label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="esgotado">Esgotado</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faBoxOpen} />
                Controle de Estoque
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Estoque Atual *
                  </label>
                  <input 
                    type="number" 
                    name="estoque" 
                    min="0"
                    value={formData.estoque} 
                    onChange={handleChange} 
                    placeholder="0" 
                    className={`w-full p-2 border rounded-lg ${
                      validationErrors.estoque ? 'border-red-500' : 'border-gray-300'
                    }`} 
                  />
                  {validationErrors.estoque && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.estoque}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Estoque Mínimo
                  </label>
                  <input 
                    type="number" 
                    name="estoqueMinimo" 
                    min="0"
                    value={formData.estoqueMinimo} 
                    onChange={handleChange} 
                    placeholder="0" 
                    className={`w-full p-2 border rounded-lg ${
                      validationErrors.estoqueMinimo ? 'border-red-500' : 'border-gray-300'
                    }`} 
                  />
                  {validationErrors.estoqueMinimo && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.estoqueMinimo}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faKey} />
                Identificação
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Código Interno (SKU) *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <FontAwesomeIcon 
                        icon={faKey} 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input 
                        type="text" 
                        name="codigo" 
                        value={formData.codigo} 
                        className={`w-full p-2 pl-9 border rounded-lg ${
                          validationErrors.codigo ? 'border-red-500' : 'bg-gray-200 cursor-not-allowed'
                        }`} 
                        readOnly 
                        disabled 
                        placeholder="Clique em Gerar" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleGenerateSku} 
                      disabled={isGeneratingSku || !formData.nome} 
                      className="px-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shrink-0" 
                      title={!formData.nome ? "Preencha o nome do produto primeiro" : "Gerar SKU único"}
                    >
                      {isGeneratingSku ? (
                        <FontAwesomeIcon icon={faSync} className="animate-spin" />
                      ) : "Gerar"}
                    </button>
                  </div>
                  {validationErrors.codigo && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.codigo}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Código de Barras (EAN, UPC)
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faBarcode} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input 
                      type="text" 
                      name="codigoDeBarras" 
                      value={formData.codigoDeBarras} 
                      onChange={handleChange} 
                      className={`w-full p-2 pl-9 border rounded-lg ${
                        validationErrors.codigoDeBarras ? 'border-red-500' : 'border-gray-300'
                      }`} 
                      placeholder="Opcional" 
                      maxLength={13}
                    />
                    {validationErrors.codigoDeBarras && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.codigoDeBarras}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    URL do Produto
                  </label>
                  <input 
                    type="url" 
                    name="url" 
                    value={formData.url} 
                    onChange={handleChange} 
                    className="w-full p-2 border border-gray-300 rounded-lg" 
                    placeholder="https://exemplo.com/produto" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalculator} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Calculadora de Preço
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalculadora(!showCalculadora)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showCalculadora ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              
              {showCalculadora && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Custo de Compra (R$)
                      </label>
                    <CurrencyInput name="custo" value={formData.custo} onValueChange={(v, n) => handleValueChange(v, n)} prefix="R$ " decimalSeparator="," groupSeparator="." className={`w-full p-2 border rounded-lg ${validationErrors.custo ? 'border-red-500' : 'border-gray-300'}`} />
                      {validationErrors.custo && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.custo}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Markup (%)
                      </label>
                    <CurrencyInput name="margemLucro" value={formData.margemLucro} onValueChange={(v, n) => handleValueChange(v, n)} suffix="%" decimalSeparator="," groupSeparator="." className="w-full p-2 border rounded-lg" />

                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Gastos Adicionais (R$)
                    </label>
                    <CurrencyInput name="gastosAdicionais" value={formData.gastosAdicionais} onValueChange={(v, n) => handleValueChange(v, n)} prefix="R$ " decimalSeparator="," groupSeparator="." className="w-full p-2 border rounded-lg" />
                    <p className="text-xs text-gray-500 mt-1">
                      Soma de frete, impostos, embalagem, etc.
                    </p>
                  </div>
                  
                  {lucroBruto > 0 && (
                    <div className="mt-2 p-3 bg-blue-100 border border-blue-200 rounded-lg text-center">
                      <span className="text-sm text-blue-800 font-medium">
                        Lucro Bruto Estimado: 
                        <strong className="ml-2">
                          {lucroBruto.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </strong>
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-2 border-green-300 rounded-lg bg-green-50">
              <label className="block text-sm font-medium text-gray-700">
                Preço Final de Revenda (R$) *
              </label>
                <CurrencyInput name="preco" value={formData.preco} onValueChange={(v, n) => handleValueChange(v, n)} prefix="R$ " decimalSeparator="," groupSeparator="." className={`w-full p-2 border-green-400 rounded-lg text-2xl font-bold text-green-800 ${validationErrors.preco ? 'border-red-500' : ''}`} />
              {validationErrors.preco && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.preco}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-4 pt-6 border-t mt-6">
              <button 
                type="button" 
                onClick={onRequestClose} 
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium" 
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-medium hover:opacity-90 w-36 flex justify-center" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <FontAwesomeIcon icon={faSync} className="animate-spin" />
                ) : produto ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default ProductFormModal;