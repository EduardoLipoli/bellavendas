import React, { useState, useEffect, useCallback } from 'react';
import { getClientes, getProdutos, addVenda, updateVenda } from '../services/firestoreService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faTimes, faMinus, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { Switch } from '@headlessui/react';

// Função para formatar a data para o input tipo 'date' (YYYY-MM-DD)
const toInputDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const ModalVenda = ({ isOpen, onClose, onVendaFinalizada, vendaParaEditar }) => {
  // --- ESTADOS ---
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState('Cartão de Crédito');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parcelas, setParcelas] = useState(1);
  const [termoBuscaProduto, setTermoBuscaProduto] = useState('');
  const [descontoPercentual, setDescontoPercentual] = useState(0); 
  const [mostrarConfirmacaoFechar, setMostrarConfirmacaoFechar] = useState(false);

  // Estados para pagamento
  const [dataVencimento, setDataVencimento] = useState(() => {
    const data = new Date();
    data.setDate(data.getDate() + 7);
    return toInputDate(data);
  });
  
  const [dataPagamento, setDataPagamento] = useState(toInputDate(new Date()));
  const [marcarComoPago, setMarcarComoPago] = useState(false);

  // --- LÓGICA DE DADOS ---
  useEffect(() => {
    if (isOpen) {
      const carregarDadosIniciais = async () => {
        setLoading(true);
        try {
          const [clientesResponse, produtosData] = await Promise.all([
            getClientes(), 
            getProdutos()
          ]);
          setClientes(clientesResponse.data || []);
          setProdutos(produtosData);
        } catch (err) {
          toast.error("Falha ao carregar dados de suporte.");
        } finally {
          setLoading(false);
        }
      };
      carregarDadosIniciais();

      if (vendaParaEditar) {
        setClienteSelecionado(vendaParaEditar.cliente.id);
        setCarrinho(vendaParaEditar.itens || []);
        setFormaPagamento(vendaParaEditar.formaPagamento || 'Cartão de Crédito');
        setParcelas(vendaParaEditar.parcelas || 1);
        setDescontoPercentual(vendaParaEditar.descontoPercentual || 0); 
        
        if (vendaParaEditar.dataVencimento) {
          setDataVencimento(toInputDate(vendaParaEditar.dataVencimento.seconds * 1000));
        }
      } else {
        resetState();
      }
    }
  }, [isOpen, vendaParaEditar]);

  const resetState = () => {
    setClienteSelecionado('');
    setCarrinho([]);
    setFormaPagamento('Cartão de Crédito');
    setParcelas(1);
    setIsSubmitting(false);
    setDescontoPercentual(0); 
    setTermoBuscaProduto('');
    setDataPagamento(toInputDate(new Date()));
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 7);
    setDataVencimento(toInputDate(dataFutura));
    setMarcarComoPago(false);
  };

  const handleClose = () => {
    if (carrinho.length > 0) {
      setMostrarConfirmacaoFechar(true);
    } else {
      resetState();
      onClose();
    }
  };

  const confirmarFechar = () => {
    resetState();
    onClose();
    setMostrarConfirmacaoFechar(false);
  };

  const cancelarFechar = () => {
    setMostrarConfirmacaoFechar(false);
  };

  // --- CÁLCULOS ---
const calcularSubtotal = useCallback(() => {
  return carrinho.reduce((acc, item) => acc + (item.precoUnitario * item.quantidade), 0);
}, [carrinho]);

const calcularValorDoDesconto = useCallback(() => {
  const subtotal = calcularSubtotal();
  if (descontoPercentual > 0) {
    return subtotal * (descontoPercentual / 100);
  }
  return 0;
}, [calcularSubtotal, descontoPercentual]);

const calcularTotal = useCallback(() => {
  return Math.max(0, calcularSubtotal() - calcularValorDoDesconto());
}, [calcularSubtotal, calcularValorDoDesconto]);

  // --- FUNÇÕES DO CARRINHO ---
const handleAddProdutoAoCarrinho = (produto) => {
    const produtoExistente = carrinho.find(item => item.id === produto.id);

    if (produtoExistente) {
        // Verifica se a quantidade no carrinho já atingiu o estoque total do produto
        if (produtoExistente.quantidade >= produto.estoque) {
            toast.error(`Você já adicionou todo o estoque de "${produto.nome}" ao carrinho.`);
            return;
        }
        
        setCarrinho(carrinho.map(item => 
            item.id === produto.id 
                ? { ...item, quantidade: item.quantidade + 1 } 
                : item
        ));
    } else {
        // Se o produto não está no carrinho, verifica se ele tem estoque antes de adicionar
        if (produto.estoque <= 0) {
            toast.error(`O produto "${produto.nome}" está fora de estoque.`);
            return;
        }
        
        setCarrinho([...carrinho, {
            id: produto.id,
            nome: produto.nome,
            quantidade: 1,
            precoUnitario: produto.preco,
            imageUrl: produto.imageUrl || '',
            estoque: produto.estoque // Importante manter o estoque no item do carrinho
        }]);
    }
};

const handleAlterarQuantidade = (produtoId, delta) => {
    // AQUI: Alterado de item.produtoId para item.id
    const item = carrinho.find(item => item.id === produtoId);
    if (!item) return;

    const produto = produtos.find(p => p.id === produtoId);
    const novaQuantidade = item.quantidade + delta;

    if (delta > 0 && novaQuantidade > (produto?.estoque || 0)) {
        toast.error(`Estoque máximo de "${item.nome}" atingido!`);
        return;
    }

    if (novaQuantidade < 1) {
        handleRemoverDoCarrinho(produtoId);
    } else {
        setCarrinho(carrinho.map(item => 
            // AQUI: Alterado de item.produtoId para item.id
            item.id === produtoId
                ? { ...item, quantidade: novaQuantidade }
                : item
        ));
    }
};

  const handleRemoverDoCarrinho = (produtoId) => {
    setCarrinho(carrinho.filter(item => item.id !== produtoId));
  };

  // --- FUNÇÃO DE SALVAR ---
  const handleFinalizarVenda = async () => {
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente!");
      return;
    }
    
    if (carrinho.length === 0) {
      toast.error("Adicione produtos ao carrinho!");
      return;
    }

    setIsSubmitting(true);
    const clienteObj = clientes.find(c => c.id === clienteSelecionado);
    
    const vendaData = {
      cliente: { 
        id: clienteObj.id, 
        nome: clienteObj.nome, 
        imageUrl: clienteObj.imageUrl || null 
      },
        itens: carrinho.map(item => ({
            // AQUI: Alterado de item.produtoId para item.id
            id: item.id,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            imageUrl: item.imageUrl,
            // AQUI: Alterado de item.produtoId para item.id
            custo: produtos.find(p => p.id === item.id)?.custo || 0,
      })),
      subtotal: calcularSubtotal(),
      descontoPercentual: descontoPercentual,
      descontoValor: calcularValorDoDesconto(),
      total: calcularTotal(),
      formaPagamento,
      parcelas,
      marcarComoPago,
      dataPagamento: marcarComoPago ? new Date(dataPagamento) : null,
      dataVencimento: new Date(dataVencimento),
    };

    try {
      let vendaResultante;
      if (vendaParaEditar) {
        await updateVenda(vendaParaEditar.id, vendaData);
        toast.success("Venda atualizada com sucesso!");
        vendaResultante = { ...vendaData, id: vendaParaEditar.id };
      } else {
        const novaVendaRef = await addVenda(vendaData);
        toast.success("Venda registrada com sucesso!");
        vendaResultante = { ...vendaData, id: novaVendaRef.id };
      }

      onVendaFinalizada(vendaResultante);
      resetState();
      onClose();
    } catch (err) {
      toast.error(err.message || "Falha ao salvar a venda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FILTROS ---
  const produtosFiltrados = produtos.filter(produto => {
    const buscaMatch = produto.nome.toLowerCase().includes(termoBuscaProduto.toLowerCase());
    const estoqueDisponivel = produto.estoque > 0;
    return buscaMatch && estoqueDisponivel;
  });

  if (!isOpen) return null;

  // --- RENDERIZAÇÃO ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-end" onClick={handleClose}>
      {/* Confirmação ao fechar */}
      {mostrarConfirmacaoFechar && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-70"
            onClick={e => e.stopPropagation()}>
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Descartar venda?</h3>
            <p className="mb-6">Você tem itens no carrinho. Tem certeza que deseja descartar esta venda?</p>
            <div className="flex gap-3">
              <button 
                onClick={cancelarFechar}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarFechar}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-full w-full max-w-4xl bg-gray-50 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-6 border-b bg-primary-dark sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">
            {vendaParaEditar 
              ? `Editando Venda #${vendaParaEditar.id.substring(0, 8)}` 
              : 'Registrar Nova Venda'}
          </h2>
          <button onClick={handleClose} className="text-white hover:text-gray-200 p-2 rounded-full">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Coluna de Produtos */}
              <div className="lg:col-span-2">
                <div className="bg-white p-4 rounded-xl border h-full">
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Produtos Disponíveis</h3>
                  
                  {/* Barra de Pesquisa */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={termoBuscaProduto}
                      onChange={(e) => setTermoBuscaProduto(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <FontAwesomeIcon 
                      icon={faSearch} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    />
                  </div>

                  {/* Lista de Produtos */}
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                    {produtosFiltrados.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum produto encontrado
                      </div>
                    ) : (
                      produtosFiltrados.map(produto => (
                        <div
                            key={produto.id}
                            // Lógica de Estilo: Adiciona classes se o estoque for 0
                            className={`
                            bg-white border p-3 rounded-lg flex items-center gap-3 shadow-sm transition-all
                            ${produto.estoque > 0 
                                ? 'hover:border-blue-500 cursor-pointer' 
                                : 'opacity-50 cursor-not-allowed'
                            }
                            `}
                            // Lógica de Clique: Só executa a função se houver estoque
                            onClick={() => {
                            if (produto.estoque > 0) {
                                handleAddProdutoAoCarrinho(produto);
                            }
                            }}
                            // Adiciona um tooltip para produtos sem estoque
                            title={
                            produto.estoque <= 0 
                                ? 'Produto indisponível no momento'
                                : produto.nome
                            }
                        >
                            {/* O resto do seu JSX para o item do produto continua aqui... */}
                            {produto.imageUrl && (
                            <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border">
                                <img src={produto.imageUrl} alt={produto.nome} className="w-full h-full object-cover" />
                            </div>
                            )}
                            <div className="flex-grow">
                            <p className="font-bold text-gray-800 truncate">{produto.nome}</p>
                            <div className="flex justify-between items-center mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded ${produto.estoque > 0 ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600 font-semibold'}`}>
                                Estoque: {produto.estoque}
                                </span>
                                <span className="text-green-600 font-semibold text-sm">
                                R$ {parseFloat(produto.preco || 0).toFixed(2)}
                                </span>
                            </div>
                            </div>
                        </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna do Carrinho e Pagamento */}
              <div className="lg:col-span-3">
                <div className="bg-white p-5 rounded-xl border h-full flex flex-col">
                  {/* Seção de Cliente */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Cliente</h3>
                    <select
                      value={clienteSelecionado}
                      onChange={e => setClienteSelecionado(e.target.value)}
                      className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="" disabled>Selecione um cliente</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Carrinho */}
                  <div className="mb-4 flex-grow">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Carrinho</h3>
                      {carrinho.length > 0 && (
                        <button 
                          onClick={() => setCarrinho([])}
                          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faTrash} size="xs" />
                          Limpar carrinho
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2 p-3 border-2 border-dashed rounded-xl min-h-[150px] max-h-[35vh] overflow-y-auto">
                      {carrinho.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">
                          Adicione produtos ao carrinho
                        </p>
                      ) : (
                        carrinho.map(item => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {item.imageUrl && (
                                <div className="w-10 h-10 rounded-md overflow-hidden border">
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.nome} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-sm">{item.nome}</p>
                                <div className="flex items-center mt-1">
                                  <button
                                    onClick={() => handleAlterarQuantidade(item.id, -1)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                                    disabled={item.quantidade <= 1}
                                  >
                                    <FontAwesomeIcon icon={faMinus} size="xs" />
                                  </button>
                                  <span className="mx-3 font-medium text-sm min-w-[20px] text-center">
                                    {item.quantidade}
                                  </span>
                                    <button
                                    onClick={() => handleAlterarQuantidade(item.id, 1)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    // A linha abaixo verifica se a quantidade no carrinho é igual ou maior que o estoque do produto
                                    disabled={item.quantidade >= (produtos.find(p => p.id === item.id)?.estoque || 0)}
                                    // Adiciona um tooltip explicativo quando o botão está desabilitado
                                    title={
                                        item.quantidade >= (produtos.find(p => p.id === item.id)?.estoque || 0)
                                        ? 'Você já adicionou todo o estoque disponível deste produto.'
                                        : 'Aumentar quantidade'
                                    }
                                    >
                                    <FontAwesomeIcon icon={faPlus} size="xs" />
                                    </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-sm">
                                R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                              </p>
                              <button
                                onClick={() => handleRemoverDoCarrinho(item.id)}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Resumo e Pagamento */}
                  <div className="border-t pt-4 mt-auto">
                    {/* Resumo Financeiro */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">R$ {calcularSubtotal().toFixed(2)}</span>
                      </div>
                      
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"> {/* Envolvemos em uma div para alinhar o '%' */}
                        <span className="text-gray-600">Desconto:</span>
                        <input
                        type="number"
                        min="0"
                        max="100" // ALTERAÇÃO 6: Limite máximo agora é 100%
                        value={descontoPercentual}
                        onChange={(e) => {
                            let value = parseFloat(e.target.value) || 0;
                            // Garante que o valor fique entre 0 e 100
                            value = Math.max(0, Math.min(100, value));
                            setDescontoPercentual(value);
                        }}
                        className="w-20 p-1 border rounded text-right"
                        />
                        <span className="font-semibold">%</span> {/* Adiciona o símbolo de porcentagem */}
                    </div>
                    <span className="text-red-500 font-medium">
                        {/* ALTERAÇÃO 7: Exibe o valor calculado do desconto */}
                        - R$ {calcularValorDoDesconto().toFixed(2)}
                    </span>
                    </div>

                      
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-bold text-lg">Total:</span>
                        <span className="font-bold text-xl text-purple-600">
                          R$ {calcularTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h6 className="text-md font-semibold mb-2">Forma de Pagamento</h6>
                        <select
                          value={formaPagamento}
                          onChange={e => setFormaPagamento(e.target.value)}
                          className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Cartão de Crédito</option>
                          <option>Cartão de Débito</option>
                          <option>PIX</option>
                          <option>Dinheiro</option>
                          <option>Boleto</option>
                        </select>
                      </div>

                      {formaPagamento === 'Cartão de Crédito' ? (
                        <div>
                          <h6 className="text-md font-semibold mb-2">Parcelas</h6>
                          <select
                            value={parcelas}
                            onChange={e => setParcelas(Number(e.target.value))}
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                          >
                            {[...Array(12).keys()].map(i => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}x de R$ {(calcularTotal() / (i + 1)).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <h6 className="text-md font-semibold mb-2">
                            {marcarComoPago ? 'Data de Pagamento' : 'Data de Vencimento'}
                          </h6>
                          <input
                            type="date"
                            value={marcarComoPago ? dataPagamento : dataVencimento}
                            onChange={(e) => {
                              if (marcarComoPago) {
                                setDataPagamento(e.target.value);
                              } else {
                                setDataVencimento(e.target.value);
                              }
                            }}
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Pagamento à Vista */}
                    {formaPagamento !== 'Cartão de Crédito' && !vendaParaEditar && (
                      <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-6">
                        <span className="font-medium text-sm text-gray-700">
                          Registrar pagamento agora?
                        </span>
                        <Switch
                          checked={marcarComoPago}
                          onChange={setMarcarComoPago}
                          className={`${marcarComoPago ? 'bg-green-600' : 'bg-gray-300'
                            } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                        >
                          <span
                            className={`${marcarComoPago ? 'translate-x-6' : 'translate-x-1'
                              } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                          />
                        </Switch>
                      </div>
                    )}

                    {/* Botão Finalizar */}
                    <button
                      onClick={handleFinalizarVenda}
                      disabled={isSubmitting || carrinho.length === 0 || !clienteSelecionado}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md
                        ${isSubmitting || carrinho.length === 0 || !clienteSelecionado
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          Processando...
                        </span>
                      ) : (
                        vendaParaEditar ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR VENDA'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalVenda;