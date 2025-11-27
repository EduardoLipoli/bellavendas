import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faCalculator,
  faTimes,
  faSync,
  faBarcode,
  faKey,
  faBoxOpen,
  faPercentage,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import Select from "react-select";
import { isSkuUnique, isBarcodeUnique } from "../services/firestoreService";
import CurrencyInput from "react-currency-input-field";

const customStyles = {
  content: {
    top: "0",
    right: "0",
    bottom: "0",
    left: "auto",
    width: "700px",
    padding: "0",
    overflow: "hidden",
    border: "none",
    borderRadius: "0",
    boxShadow: "-4px 0 15px rgba(0, 0, 0, 0.1)",
    transform: "none",
    margin: "0",
    maxHeight: "100vh",
    transition: "transform 0.3s ease-out",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(2px)",
    zIndex: 1000,
  },
};

Modal.setAppElement("#root");

const UNIDADES_MEDIDA = [
  { value: "un", label: "Unidade (un)" },
  { value: "kg", label: "Quilograma (kg)" },
  { value: "g", label: "Grama (g)" },
  { value: "l", label: "Litro (l)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "m", label: "Metro (m)" },
  { value: "cm", label: "Centímetro (cm)" },
  { value: "m2", label: "Metro quadrado (m²)" },
];

const ProductFormModal = ({
  isOpen,
  onRequestClose,
  onSave,
  produto,
  isSubmitting,
  categorias = [],
  fornecedores = [],
}) => {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "",
    fornecedorId: "",
    codigo: "",
    codigoDeBarras: "",
    preco: "",
    estoque: 0,
    estoqueMinimo: 0,
    custo: "",
    gastosAdicionais: "", // Despesas (Frete, impostos fixos, embalagem)
    margemLucro: "", // Lucro desejado (%)
    taxaMaquininha: "", // NOVA: Porcentagem da maquininha/marketplace (%)
    unidadeMedida: "un",
    status: "ativo",
    url: "",
  });

  const parseCurrency = (value) => {
    if (!value) return 0;
    // Converte para string, troca vírgula por ponto e remove caracteres não numéricos (exceto ponto)
    const cleanValue = String(value).replace(",", ".");
    return parseFloat(cleanValue) || 0;
  };

  const [lastEditedField, setLastEditedField] = useState(null);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showCalculadora, setShowCalculadora] = useState(true); // Deixei true por padrão para facilitar

  // --- LÓGICA DE PRECIFICAÇÃO INTELIGENTE ---

  // 1. Calcular PREÇO FINAL (Custo -> Preço)
  // 1. Calcular PREÇO FINAL (Custo -> Preço)
  useEffect(() => {
    if (
      ["custo", "margemLucro", "gastosAdicionais", "taxaMaquininha"].includes(
        lastEditedField
      )
    ) {
      // AQUI ESTÁ A MUDANÇA: Usamos parseCurrency ao invés de parseFloat direto
      const custo = parseCurrency(formData.custo);
      const gastos = parseCurrency(formData.gastosAdicionais);
      const margemPercent = parseCurrency(formData.margemLucro);
      const taxaPercent = parseCurrency(formData.taxaMaquininha);

      if (custo > 0) {
        const baseCalculo = (custo + gastos) * (1 + margemPercent / 100);
        const divisor = 1 - taxaPercent / 100;

        if (divisor > 0) {
          const precoSugerido = baseCalculo / divisor;
          // Mantemos o toFixed(2) e transformamos em string para o input
          setFormData((prev) => ({
            ...prev,
            preco: String(precoSugerido.toFixed(2)).replace(".", ","),
          }));
        }
      }
    }
  }, [
    formData.custo,
    formData.gastosAdicionais,
    formData.margemLucro,
    formData.taxaMaquininha,
    lastEditedField,
  ]);

  // 2. Calcular CUSTO (Preço -> Custo)
  useEffect(() => {
    if (lastEditedField === "preco") {
      // AQUI TAMBÉM: Usamos parseCurrency
      const preco = parseCurrency(formData.preco);
      const gastos = parseCurrency(formData.gastosAdicionais);
      const margemPercent = parseCurrency(formData.margemLucro);
      const taxaPercent = parseCurrency(formData.taxaMaquininha);

      if (preco > 0) {
        const valorLiquidoAposTaxas = preco * (1 - taxaPercent / 100);
        const custoBaseSugerido =
          valorLiquidoAposTaxas / (1 + margemPercent / 100);
        const custoSugerido = custoBaseSugerido - gastos;

        setFormData((prev) => ({
          ...prev,
          custo: String(Math.max(0, custoSugerido).toFixed(2)).replace(
            ".",
            ","
          ),
        }));
      }
    }
  }, [
    formData.preco,
    formData.gastosAdicionais,
    formData.margemLucro,
    formData.taxaMaquininha,
    lastEditedField,
  ]);

  // 2. Calcular CUSTO (Preço -> Custo) - Lógica Inversa
  useEffect(() => {
    if (lastEditedField === "preco") {
      const preco = parseFloat(formData.preco) || 0;
      const gastos = parseFloat(formData.gastosAdicionais) || 0;
      const margemPercent = parseFloat(formData.margemLucro) || 0;
      const taxaPercent = parseFloat(formData.taxaMaquininha) || 0;

      if (preco > 0) {
        // Inverso: Custo = ( (Preço * (1 - Taxa%)) / (1 + Lucro%) ) - Despesas
        const valorLiquidoAposTaxas = preco * (1 - taxaPercent / 100);
        const custoBaseSugerido =
          valorLiquidoAposTaxas / (1 + margemPercent / 100);
        const custoSugerido = custoBaseSugerido - gastos;

        // Evita custo negativo na UI, embora matematicamente possível se as despesas forem altas
        setFormData((prev) => ({
          ...prev,
          custo: String(Math.max(0, custoSugerido).toFixed(2)),
        }));
      }
    }
  }, [
    formData.preco,
    formData.gastosAdicionais,
    formData.margemLucro,
    formData.taxaMaquininha,
    lastEditedField,
  ]);

  // Popular formulário ao abrir
  useEffect(() => {
    if (isOpen) {
      const errors = {};
      if (produto) {
        setFormData({
          nome: produto.nome || "",
          descricao: produto.descricao || "",
          categoria: produto.categoria || "",
          fornecedorId: produto.fornecedorId || "",
          codigo: produto.codigo || "",
          codigoDeBarras: produto.codigoDeBarras || "",
          preco: produto.preco?.toFixed(2) || "",
          estoque: produto.estoque || 0,
          estoqueMinimo: produto.estoqueMinimo || 0,
          custo: produto.custo?.toFixed(2) || "",
          gastosAdicionais: produto.gastosAdicionais?.toFixed(2) || "",
          margemLucro: produto.margemLucro?.toFixed(2) || "",
          taxaMaquininha: produto.taxaMaquininha?.toFixed(2) || "", // Carrega o novo campo
          unidadeMedida: produto.unidadeMedida || "un",
          status: produto.status || "ativo",
          url: produto.url || "",
        });
        setImagePreview(produto.imageUrl || "");

        if (produto.estoqueMinimo && produto.estoque <= produto.estoqueMinimo) {
          errors.estoque = "Estoque abaixo do mínimo";
        }
      } else {
        // Reset
        setFormData({
          nome: "",
          descricao: "",
          categoria: "",
          fornecedorId: "",
          codigo: "",
          codigoDeBarras: "",
          preco: "",
          estoque: 0,
          estoqueMinimo: 0,
          custo: "",
          gastosAdicionais: "",
          margemLucro: "",
          taxaMaquininha: "",
          unidadeMedida: "un",
          status: "ativo",
          url: "",
        });
        setImagePreview("");
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
      case "nome":
        if (!value.trim()) errors.nome = "Nome é obrigatório";
        else if (value.length < 3) errors.nome = "Nome muito curto";
        else delete errors.nome;
        break;
      case "codigo":
        if (!value.trim()) errors.codigo = "SKU é obrigatório";
        else delete errors.codigo;
        break;
      case "preco":
        if (!value || parseFloat(value) <= 0) errors.preco = "Preço inválido";
        else delete errors.preco;
        break;
      case "taxaMaquininha":
        if (parseFloat(value) >= 100)
          errors.taxaMaquininha = "A taxa não pode ser 100% ou mais";
        else delete errors.taxaMaquininha;
        break;
      case "estoque":
        if (isNaN(value) || value < 0) errors.estoque = "Estoque inválido";
        else if (formData.estoqueMinimo && value < formData.estoqueMinimo) {
          errors.estoque = "Estoque abaixo do mínimo";
        } else delete errors.estoque;
        break;
      default:
        delete errors[name];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleValueChange = (value, name) => {
    setLastEditedField(name);
    setFormData((prev) => ({ ...prev, [name]: value || "" }));
    validateField(name, value || "");
  };

  const handleSelectChange = (option, action) => {
    const name = action.name;
    const value = option ? option.value : "";
    setLastEditedField(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleGenerateSku = async () => {
    if (!formData.nome) {
      toast.error("Preencha o nome do produto para gerar um SKU.");
      return;
    }
    setIsGeneratingSku(true);
    let newSku = "";
    let skuIsUnique = false;
    let attempts = 0;

    while (!skuIsUnique && attempts < 10) {
      const nomeParte = formData.nome
        .substring(0, 3)
        .toUpperCase()
        .replace(/\s/g, "");
      const timeParte = Date.now().toString(36).slice(-5).toUpperCase();
      newSku = `${nomeParte}-${timeParte}`;
      skuIsUnique = await isSkuUnique(newSku, produto?.id);
      attempts++;
    }

    if (skuIsUnique) {
      setFormData((prev) => ({ ...prev, codigo: newSku }));
      toast.success("SKU único gerado!");
    } else {
      toast.error("Não foi possível gerar um SKU único.");
    }
    setIsGeneratingSku(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image/jpeg|image/png")) {
        toast.error("Formato inválido! Use JPG ou PNG.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Máximo 5MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fieldsToValidate = ["nome", "codigo", "preco", "taxaMaquininha"];
    let isValid = true;
    fieldsToValidate.forEach((field) => {
      if (!validateField(field, formData[field])) isValid = false;
    });

    if (!isValid) {
      toast.error("Corrija os campos destacados.");
      return;
    }

    // Verificar código de barras
    if (formData.codigoDeBarras) {
      const isUnique = await isBarcodeUnique(
        formData.codigoDeBarras,
        produto?.id
      );
      if (!isUnique) {
        toast.error("Código de barras já está em uso!");
        return;
      }
    }

    const fornecedorSelecionado = fornecedores.find(
      (f) => f.id === formData.fornecedorId
    );

    const dataToSave = {
      ...formData,
      preco: parseCurrency(formData.preco),
      estoque: parseInt(formData.estoque, 10) || 0,
      estoqueMinimo: parseInt(formData.estoqueMinimo, 10) || 0,
      custo: parseCurrency(formData.custo),
      gastosAdicionais: parseCurrency(formData.gastosAdicionais),
      margemLucro: parseCurrency(formData.margemLucro),
      taxaMaquininha: parseCurrency(formData.taxaMaquininha),
      fornecedorNome: fornecedorSelecionado
        ? fornecedorSelecionado.nome
        : "N/A",
      ultimaAtualizacao: new Date().toISOString(),
    };

    onSave(dataToSave, imageFile);
  };

  // Cálculo visual de lucro líquido (O que sobra no bolso)
  const custoTotal =
    parseCurrency(formData.custo) + parseCurrency(formData.gastosAdicionais);
  const precoVenda = parseCurrency(formData.preco);
  const taxaPercent = parseCurrency(formData.taxaMaquininha);

  const descontoTaxa = precoVenda * (taxaPercent / 100);
  const lucroLiquidoEstimado = precoVenda - descontoTaxa - custoTotal;

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
            <h2 className="text-2xl font-bold text-white">
              {produto ? "Editar Produto" : "Novo Produto"}
            </h2>
            <button
              onClick={onRequestClose}
              className="text-white hover:text-rose-200"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        <div className="p-6 bg-white overflow-y-auto flex-grow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção Imagem */}
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
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <span>Escolher Imagem</span>
                    <input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/png, image/jpeg"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-3">
                    JPG, PNG (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Campos Básicos */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Nome do Produto *
              </label>
              <input
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg ${
                  validationErrors.nome ? "border-red-500" : "border-gray-300"
                }`}
              />
              {validationErrors.nome && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.nome}
                </p>
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Detalhes sobre o produto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Categoria
                </label>
                <Select
                  options={categorias.map((c) => ({
                    value: c.nome,
                    label: c.nome,
                  }))}
                  value={categorias
                    .map((c) => ({ value: c.nome, label: c.nome }))
                    .find((c) => c.value === formData.categoria)}
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
                  options={fornecedores.map((f) => ({
                    value: f.id,
                    label: f.nome,
                  }))}
                  value={fornecedores
                    .map((f) => ({ value: f.id, label: f.nome }))
                    .find((f) => f.value === formData.fornecedorId)}
                  onChange={handleSelectChange}
                  name="fornecedorId"
                  placeholder="Buscar..."
                  isClearable
                />
              </div>
            </div>

            {/* CALCULADORA DE PREÇO ATUALIZADA */}
            <div className="space-y-4 p-5 border border-blue-200 rounded-xl bg-blue-50/50 shadow-sm">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-800">
                    Precificação
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalculadora(!showCalculadora)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showCalculadora ? "Ocultar Detalhes" : "Mostrar Detalhes"}
                </button>
              </div>

              {showCalculadora && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Custo Bruto */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
                        1. Valor Bruto (Custo)
                      </label>
                      <CurrencyInput
                        name="custo"
                        value={formData.custo}
                        onValueChange={(v, n) => handleValueChange(v, n)}
                        prefix="R$ "
                        decimalSeparator=","
                        groupSeparator="."
                        className={`w-full p-2 border rounded-lg font-medium text-gray-700 focus:ring-2 focus:ring-blue-400 outline-none ${
                          validationErrors.custo
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                    </div>

                    {/* Despesas Extras */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
                        2. Despesas Extras (R$)
                      </label>
                      <CurrencyInput
                        name="gastosAdicionais"
                        value={formData.gastosAdicionais}
                        onValueChange={(v, n) => handleValueChange(v, n)}
                        prefix="R$ "
                        decimalSeparator=","
                        groupSeparator="."
                        className="w-full p-2 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Frete, embalagem, impostos fixos
                      </p>
                    </div>

                    {/* Lucro % */}
                    <div>
                      <label className="block text-xs font-bold text-green-700 mb-1 uppercase tracking-wide">
                        3. Seu Lucro (%)
                      </label>
                      <div className="relative">
                        <CurrencyInput
                          name="margemLucro"
                          value={formData.margemLucro}
                          onValueChange={(v, n) => handleValueChange(v, n)}
                          suffix="%"
                          decimalSeparator=","
                          groupSeparator="."
                          className="w-full p-2 border border-green-300 bg-green-50 rounded-lg focus:ring-2 focus:ring-green-400 outline-none font-medium text-green-800"
                        />
                      </div>
                    </div>

                    {/* Taxa Maquininha % */}
                    <div>
                      <label className="block text-xs font-bold text-orange-700 mb-1 uppercase tracking-wide">
                        4. Taxa Maquininha (%)
                      </label>
                      <div className="relative">
                        <CurrencyInput
                          name="taxaMaquininha"
                          value={formData.taxaMaquininha}
                          onValueChange={(v, n) => handleValueChange(v, n)}
                          suffix="%"
                          decimalSeparator=","
                          groupSeparator="."
                          className={`w-full p-2 border border-orange-300 bg-orange-50 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none font-medium text-orange-800 ${
                            validationErrors.taxaMaquininha
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Descontado do valor final da venda
                      </p>
                    </div>
                  </div>

                  {/* Resumo visual do cálculo */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 text-sm space-y-1">
                    <div className="flex justify-between text-gray-500">
                      <span>Custo Total (Prod + Desp):</span>
                      <span>
                        {custoTotal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Taxas (Maquininha):</span>
                      <span>
                        -{" "}
                        {descontoTaxa.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-green-700 border-t pt-1 mt-1">
                      <span>Lucro Líquido Real:</span>
                      <span>
                        {lucroLiquidoEstimado.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Preço Final em Destaque */}
            <div className="p-4 border-2 border-green-500 rounded-xl bg-green-50 shadow-md">
              <label className="block text-sm font-bold text-green-900 mb-1 uppercase tracking-wider">
                Preço Final de Venda
              </label>
              <CurrencyInput
                name="preco"
                value={formData.preco}
                onValueChange={(v, n) => handleValueChange(v, n)}
                prefix="R$ "
                decimalSeparator=","
                groupSeparator="."
                className={`w-full p-3 bg-white border-2 border-green-400 rounded-lg text-3xl font-bold text-green-800 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all ${
                  validationErrors.preco ? "border-red-500" : ""
                }`}
              />
              {validationErrors.preco && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.preco}
                </p>
              )}
            </div>

            {/* Outros Campos (Estoque, SKU, etc) - Mantidos iguais, apenas resumidos no container */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBoxOpen} /> Estoque
                </h4>
                <div className="space-y-3">
                  <input
                    type="number"
                    name="estoque"
                    placeholder="Atual"
                    value={formData.estoque}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-sm"
                  />
                  <input
                    type="number"
                    name="estoqueMinimo"
                    placeholder="Mínimo"
                    value={formData.estoqueMinimo}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faKey} /> Códigos
                </h4>
                <div className="space-y-3">
                  <div className="flex gap-1">
                    <input
                      name="codigo"
                      value={formData.codigo}
                      readOnly
                      className="w-full p-2 border rounded bg-gray-100 text-sm"
                      placeholder="SKU"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="px-2 bg-gray-200 rounded text-gray-600"
                    >
                      <FontAwesomeIcon icon={faSync} />
                    </button>
                  </div>
                  <input
                    name="codigoDeBarras"
                    value={formData.codigoDeBarras}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="EAN / Código de Barras"
                  />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
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
                ) : produto ? (
                  "Salvar"
                ) : (
                  "Adicionar"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default ProductFormModal;
