import React, { useState, useEffect, useCallback } from 'react';
import { getClientes, getProdutos, addVenda, updateVenda } from '../services/firestoreService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faTimes, faMinus, faPlus, faSearch, faMoneyBillWave, faCreditCard, faGift } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

// Função auxiliar para lidar com decimais
const parseCurrency = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const cleanValue = String(value).replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

// Formata data para YYYY-MM-DD (String)
const toInputDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const ModalVenda = ({ isOpen, onClose, onVendaFinalizada, vendaParaEditar }) => {
  // --- ESTADOS ---
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  
  // Estados de Pagamento
  const [pagamentos, setPagamentos] = useState([]); 
  const [pagamentoAtual, setPagamentoAtual] = useState({
      metodo: 'Cartão de Crédito',
      valor: '',
      parcelas: 1,
      dataVencimento: toInputDate(new Date(new Date().setDate(new Date().getDate() + 30)))
  });

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termoBuscaProduto, setTermoBuscaProduto] = useState('');
  const [descontoPercentual, setDescontoPercentual] = useState(''); 
  const [mostrarConfirmacaoFechar, setMostrarConfirmacaoFechar] = useState(false);

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
        
        // Mapear carrinho existente garantindo propriedades de brinde
        const itensFormatados = (vendaParaEditar.itens || []).map(item => ({
            ...item,
            isBrinde: item.precoUnitario === 0,
            precoOriginal: item.precoOriginal || item.precoUnitario
        }));
        setCarrinho(itensFormatados);
        
        if (vendaParaEditar.pagamentos && Array.isArray(vendaParaEditar.pagamentos)) {
            setPagamentos(vendaParaEditar.pagamentos);
        } else {
            setPagamentos([{
                metodo: vendaParaEditar.formaPagamento || 'Dinheiro',
                valor: vendaParaEditar.total || 0,
                parcelas: vendaParaEditar.parcelas || 1,
                dataVencimento: vendaParaEditar.dataVencimento ? toInputDate(vendaParaEditar.dataVencimento.seconds * 1000) : null,
                status: vendaParaEditar.statusPagamento || 'Pendente'
            }]);
        }
        setDescontoPercentual(vendaParaEditar.descontoPercentual || 0); 
      } else {
        resetState();
      }
    }
  }, [isOpen, vendaParaEditar]);

  const resetState = () => {
    setClienteSelecionado('');
    setCarrinho([]);
    setPagamentos([]);
    setPagamentoAtual({
        metodo: 'Cartão de Crédito',
        valor: '',
        parcelas: 1,
        dataVencimento: toInputDate(new Date(new Date().setDate(new Date().getDate() + 30)))
    });
    setIsSubmitting(false);
    setDescontoPercentual(''); 
    setTermoBuscaProduto('');
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

  const calcularInvestimentoBrindes = useCallback(() => {
    return carrinho.reduce((acc, item) => {
        if (item.isBrinde || item.precoUnitario === 0) {
            return acc + (item.custo * item.quantidade);
        }
        return acc;
    }, 0);
  }, [carrinho]);

  const calcularValorDoDesconto = useCallback(() => {
    const subtotal = calcularSubtotal();
    const desc = parseFloat(String(descontoPercentual).replace(',', '.')) || 0;
    if (desc > 0) {
      return subtotal * (desc / 100);
    }
    return 0;
  }, [calcularSubtotal, descontoPercentual]);

  const calcularTotal = useCallback(() => {
    return Math.max(0, calcularSubtotal() - calcularValorDoDesconto());
  }, [calcularSubtotal, calcularValorDoDesconto]);

  const calcularTotalPago = useCallback(() => {
      return pagamentos.reduce((acc, p) => acc + parseFloat(p.valor), 0);
  }, [pagamentos]);

  const calcularRestante = useCallback(() => {
      const total = calcularTotal();
      const pago = calcularTotalPago();
      return Math.max(0, total - pago);
  }, [calcularTotal, calcularTotalPago]);

  // Atualiza input de pagamento quando total muda
  useEffect(() => {
      const restante = calcularRestante();
      if (restante > 0 && !vendaParaEditar) {
          setPagamentoAtual(prev => ({
              ...prev,
              valor: restante.toFixed(2).replace('.', ',')
          }));
      }
  }, [carrinho, descontoPercentual, pagamentos, calcularRestante, vendaParaEditar]);

  const handleAdicionarPagamento = () => {
      const valorNumerico = parseCurrency(pagamentoAtual.valor);
      const restante = calcularRestante();

      if (valorNumerico <= 0) {
          toast.error("Valor deve ser maior que zero.");
          return;
      }

      if (valorNumerico > (restante + 0.05)) {
          toast.error(`Valor excede o restante (R$ ${restante.toFixed(2)})`);
          return;
      }

      const novoPagamento = {
          id: Date.now(),
          metodo: pagamentoAtual.metodo,
          valor: valorNumerico,
          parcelas: pagamentoAtual.metodo === 'Cartão de Crédito' ? parseInt(pagamentoAtual.parcelas) : 1,
          dataVencimento: ['Boleto', 'Crediário'].includes(pagamentoAtual.metodo) ? pagamentoAtual.dataVencimento : null,
          status: ['Dinheiro', 'Cartão de Débito', 'Pix', 'Cartão de Crédito'].includes(pagamentoAtual.metodo) ? 'Pago' : 'Pendente'
      };

      setPagamentos([...pagamentos, novoPagamento]);
      setPagamentoAtual(prev => ({ ...prev, valor: '', parcelas: 1 }));
  };

  const handleRemoverPagamento = (id) => {
      setPagamentos(pagamentos.filter(p => p.id !== id));
  };

  // --- CARRINHO & BRINDES ---
  const handleAddProdutoAoCarrinho = (produto) => {
    const produtoExistente = carrinho.find(item => item.id === produto.id);

    if (produtoExistente) {
        if (produtoExistente.quantidade >= produto.estoque) {
            toast.error(`Estoque máximo de "${produto.nome}" atingido.`);
            return;
        }
        setCarrinho(carrinho.map(item => 
            item.id === produto.id 
                ? { ...item, quantidade: item.quantidade + 1 } 
                : item
        ));
    } else {
        if (produto.estoque <= 0) {
            toast.error("Produto fora de estoque.");
            return;
        }
        
        setCarrinho([...carrinho, {
            id: produto.id,
            nome: produto.nome,
            quantidade: 1,
            precoUnitario: produto.preco,
            precoOriginal: produto.preco, 
            custo: produto.custo || 0,
            imageUrl: produto.imageUrl || '',
            estoque: produto.estoque,
            isBrinde: false
        }]);
    }
  };

  const handleToggleBrinde = (produtoId) => {
    setCarrinho(carrinho.map(item => {
        if (item.id === produtoId) {
            const novoStatusBrinde = !item.isBrinde;
            return {
                ...item,
                isBrinde: novoStatusBrinde,
                precoUnitario: novoStatusBrinde ? 0 : item.precoOriginal
            };
        }
        return item;
    }));
  };

  const handleAlterarQuantidade = (produtoId, delta) => {
    const item = carrinho.find(item => item.id === produtoId);
    if (!item) return;

    const produto = produtos.find(p => p.id === produtoId);
    const novaQuantidade = item.quantidade + delta;

    if (delta > 0 && novaQuantidade > (produto?.estoque || 0)) {
        toast.error(`Estoque máximo atingido!`);
        return;
    }

    if (novaQuantidade < 1) {
        handleRemoverDoCarrinho(produtoId);
    } else {
        setCarrinho(carrinho.map(item => 
            item.id === produtoId
                ? { ...item, quantidade: novaQuantidade }
                : item
        ));
    }
  };

  const handleRemoverDoCarrinho = (produtoId) => {
    setCarrinho(carrinho.filter(item => item.id !== produtoId));
  };

  // --- FINALIZAR ---
  const handleFinalizarVenda = async () => {
    if (!clienteSelecionado || carrinho.length === 0) {
      toast.error("Preencha os dados da venda.");
      return;
    }

    const total = calcularTotal();
    const totalPago = calcularTotalPago();
    
    if (Math.abs(total - totalPago) > 0.05) {
        toast.error(`Valor pago (R$ ${totalPago.toFixed(2)}) difere do total (R$ ${total.toFixed(2)})`);
        return;
    }

    setIsSubmitting(true);
    const clienteObj = clientes.find(c => c.id === clienteSelecionado);
    const isTotalmentePago = pagamentos.every(p => p.status === 'Pago');
    const statusGeral = isTotalmentePago ? 'Pago' : 'Pendente';
    
    const formaPagamentoResumo = pagamentos.length === 1 
        ? pagamentos[0].metodo 
        : `Múltiplos (${pagamentos.map(p => p.metodo).join(', ')})`;

    // CORREÇÃO DATA: Garante que seja STRING (YYYY-MM-DD)
    let dataVencimentoFinal;
    if (!isTotalmentePago) {
        const parcelaPendente = pagamentos.find(p => p.status === 'Pendente');
        // Se houver parcela pendente, usa a data dela. Se não, hoje.
        dataVencimentoFinal = parcelaPendente ? parcelaPendente.dataVencimento : toInputDate(new Date());
    } else {
        // Se for pago, usa hoje
        dataVencimentoFinal = toInputDate(new Date());
    }

    // Proteção extra: Se por algum motivo for nulo, define hoje
    if (!dataVencimentoFinal) dataVencimentoFinal = toInputDate(new Date());

    const vendaData = {
      cliente: { 
        id: clienteObj.id, 
        nome: clienteObj.nome, 
        imageUrl: clienteObj.imageUrl || null 
      },
      itens: carrinho.map(item => ({
            id: item.id,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            precoOriginal: item.precoOriginal,
            isBrinde: item.isBrinde,
            imageUrl: item.imageUrl,
            custo: item.custo,
      })),
      subtotal: calcularSubtotal(),
      custoBrindes: calcularInvestimentoBrindes(),
      descontoPercentual: parseFloat(String(descontoPercentual).replace(',', '.')) || 0,
      descontoValor: calcularValorDoDesconto(),
      total: total,
      pagamentos: pagamentos,
      formaPagamento: formaPagamentoResumo,
      statusPagamento: statusGeral,
      dataVencimento: dataVencimentoFinal // Agora é uma String YYYY-MM-DD
    };

    try {
      if (vendaParaEditar) {
        await updateVenda(vendaParaEditar.id, vendaData);
        toast.success("Venda atualizada!");
      } else {
        await addVenda(vendaData);
        toast.success("Venda registrada!");
      }
      onVendaFinalizada(vendaData);
      resetState();
      onClose();
    } catch (err) {
      console.error(err); // Log do erro completo no console
      toast.error("Erro ao salvar venda. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const produtosFiltrados = produtos.filter(produto => {
    const buscaMatch = produto.nome.toLowerCase().includes(termoBuscaProduto.toLowerCase());
    const estoqueDisponivel = produto.estoque > 0;
    return buscaMatch && estoqueDisponivel;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-end" onClick={handleClose}>
      {mostrarConfirmacaoFechar && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-70" onClick={e => e.stopPropagation()}>
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Descartar venda?</h3>
            <div className="flex gap-3">
              <button onClick={cancelarFechar} className="flex-1 py-3 border rounded-lg">Cancelar</button>
              <button onClick={confirmarFechar} className="flex-1 py-3 bg-red-500 text-white rounded-lg">Descartar</button>
            </div>
          </div>
        </div>
      )}

      <div className="h-full w-full max-w-5xl bg-gray-50 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b bg-primary-dark sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">{vendaParaEditar ? `Editando Venda` : 'Registrar Nova Venda'}</h2>
          <button onClick={handleClose} className="text-white hover:text-gray-200 p-2 rounded-full"><FontAwesomeIcon icon={faTimes} size="lg" /></button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-rose-500 border-t-2"></div></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* ESQUERDA: PRODUTOS */}
              <div className="lg:col-span-2 flex flex-col gap-4 h-full">
                <div className="bg-white p-4 rounded-xl border flex-grow overflow-hidden flex flex-col max-h-[85vh]">
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Catálogo</h3>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={termoBuscaProduto}
                      onChange={(e) => setTermoBuscaProduto(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>

                  <div className="space-y-3 overflow-y-auto pr-2 flex-grow">
                      {produtosFiltrados.map(produto => (
                        <div
                            key={produto.id}
                            className={`bg-white border p-3 rounded-lg flex items-center gap-3 shadow-sm transition-all ${produto.estoque > 0 ? 'hover:border-blue-500 cursor-pointer' : 'opacity-50'}`}
                            onClick={() => produto.estoque > 0 && handleAddProdutoAoCarrinho(produto)}
                        >
                            {produto.imageUrl && <img src={produto.imageUrl} alt="" className="w-12 h-12 object-cover rounded-md border" />}
                            <div className="flex-grow">
                                <p className="font-bold text-gray-800 text-sm truncate">{produto.nome}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${produto.estoque > 0 ? 'bg-gray-100' : 'bg-red-100 text-red-600'}`}>{produto.estoque} un.</span>
                                    <span className="text-green-600 font-bold text-sm">R$ {parseFloat(produto.preco).toFixed(2).replace('.',',')}</span>
                                </div>
                            </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* DIREITA: CARRINHO */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="bg-white p-5 rounded-xl border">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">Cliente</label>
                    <select value={clienteSelecionado} onChange={e => setClienteSelecionado(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50">
                      <option value="" disabled>Selecione...</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>

                <div className="bg-white p-5 rounded-xl border flex-grow flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Carrinho</h3>
                      {carrinho.length > 0 && <button onClick={() => setCarrinho([])} className="text-xs text-red-500 flex items-center gap-1"><FontAwesomeIcon icon={faTrash} /> Limpar</button>}
                    </div>
                    
                    <div className="space-y-2 flex-grow overflow-y-auto max-h-[250px] mb-4 pr-1">
                        {carrinho.map(item => (
                          <div key={item.id} className={`flex justify-between items-center p-2 rounded-lg border ${item.isBrinde ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-medium w-32 truncate">
                                    {item.nome}
                                    {item.isBrinde && <span className="ml-1 text-[10px] bg-purple-200 text-purple-800 px-1 rounded">BRINDE</span>}
                                </div>
                                <div className="flex items-center bg-white rounded border">
                                    <button onClick={() => handleAlterarQuantidade(item.id, -1)} className="px-2 text-gray-600">-</button>
                                    <span className="px-2 text-sm font-bold">{item.quantidade}</span>
                                    <button onClick={() => handleAlterarQuantidade(item.id, 1)} disabled={item.quantidade >= (produtos.find(p=>p.id===item.id)?.estoque||0)} className="px-2 text-gray-600 disabled:opacity-50">+</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${item.isBrinde ? 'text-purple-600 line-through decoration-gray-400' : ''}`}>
                                    {item.isBrinde ? 'Grátis' : `R$ ${(item.quantidade * item.precoUnitario).toFixed(2).replace('.',',')}`}
                                </span>
                                
                                <button 
                                    onClick={() => handleToggleBrinde(item.id)}
                                    title={item.isBrinde ? "Cobrar valor normal" : "Marcar como Brinde (Grátis)"}
                                    className={`p-1.5 rounded transition-colors ${item.isBrinde ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'}`}
                                >
                                    <FontAwesomeIcon icon={faGift} />
                                </button>
                                
                                <button onClick={() => handleRemoverDoCarrinho(item.id)} className="text-red-400 hover:text-red-600 p-1.5"><FontAwesomeIcon icon={faTimes} /></button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* TOTAIS */}
                    <div className="border-t pt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">R$ {calcularSubtotal().toFixed(2).replace('.',',')}</span>
                        </div>
                        
                        {calcularInvestimentoBrindes() > 0 && (
                            <div className="flex justify-between text-purple-700 bg-purple-50 p-1 rounded px-2">
                                <span className="flex items-center gap-1"><FontAwesomeIcon icon={faGift} className="text-xs"/> Investimento em Mimos</span>
                                <span className="font-bold">R$ {calcularInvestimentoBrindes().toFixed(2).replace('.',',')}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Desconto (%)</span>
                                <input type="text" value={descontoPercentual} onChange={(e) => setDescontoPercentual(e.target.value.replace(/[^0-9,]/g, ''))} placeholder="0,00" className="w-16 p-1 border rounded text-right text-sm" />
                            </div>
                            <span className="text-red-500">- R$ {calcularValorDoDesconto().toFixed(2).replace('.',',')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t mt-2">
                            <span className="font-bold text-lg text-gray-800">TOTAL</span>
                            <span className="font-bold text-2xl text-purple-600">R$ {calcularTotal().toFixed(2).replace('.',',')}</span>
                        </div>
                    </div>
                </div>

                {/* PAGAMENTOS */}
                <div className="bg-white p-5 rounded-xl border">
                    <h3 className="text-md font-semibold mb-3 flex items-center gap-2"><FontAwesomeIcon icon={faCreditCard} className="text-blue-500"/> Pagamento</h3>
                    
                    {/* CORREÇÃO DO GRID AQUI: col-span somando 12 (4+3+3+2) */}
                    <div className="grid grid-cols-12 gap-2 mb-3 items-end">
                        <div className="col-span-4">
                            <label className="text-xs text-gray-500 block mb-1">Método</label>
                            <select className="w-full p-2 border rounded text-sm" value={pagamentoAtual.metodo} onChange={e => setPagamentoAtual({...pagamentoAtual, metodo: e.target.value, parcelas: 1})}>
                                <option>Dinheiro</option><option>Pix</option><option>Cartão de Crédito</option><option>Cartão de Débito</option><option>Boleto</option><option>Crediário</option>
                            </select>
                        </div>
                        <div className="col-span-3">
                            <label className="text-xs text-gray-500 block mb-1">Valor</label>
                            <input type="text" className="w-full p-2 border rounded text-sm font-semibold text-green-700" value={pagamentoAtual.valor} onChange={e => setPagamentoAtual({...pagamentoAtual, valor: e.target.value.replace(/[^0-9,.]/g, '')})} />
                        </div>

                        {/* Coluna Condicional Ajustada para 3 Cols */}
                        {pagamentoAtual.metodo === 'Cartão de Crédito' ? (
                             <div className="col-span-3">
                                <label className="text-xs text-gray-500 block mb-1">Parcelas</label>
                                <select className="w-full p-2 border rounded text-sm" value={pagamentoAtual.parcelas} onChange={e => setPagamentoAtual({...pagamentoAtual, parcelas: e.target.value})}>
                                    {[1,2,3,4,5,6,7,8,9,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
                                </select>
                             </div>
                        ) : ['Boleto', 'Crediário'].includes(pagamentoAtual.metodo) ? (
                            <div className="col-span-3">
                                <label className="text-xs text-gray-500 block mb-1">Vencimento</label>
                                <input type="date" className="w-full p-2 border rounded text-sm" value={pagamentoAtual.dataVencimento} onChange={e => setPagamentoAtual({...pagamentoAtual, dataVencimento: e.target.value})} />
                            </div>
                        ) : (
                            <div className="col-span-3"></div>
                        )}

                        <div className="col-span-2">
                            <button onClick={handleAdicionarPagamento} disabled={calcularRestante() <= 0.05} className="w-full bg-blue-500 text-white p-2 rounded text-sm font-bold disabled:opacity-50"><FontAwesomeIcon icon={faPlus} /></button>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded border p-2 mb-3 min-h-[60px]">
                        {pagamentos.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b last:border-0 border-gray-200 py-1">
                                <span>{p.metodo} {p.parcelas > 1 && `(${p.parcelas}x)`}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">R$ {p.valor.toFixed(2).replace('.',',')}</span>
                                    <button onClick={() => handleRemoverPagamento(p.id)} className="text-red-400"><FontAwesomeIcon icon={faTimes} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-600">Restante:</span>
                        <span className={`text-lg font-bold ${calcularRestante() > 0 ? 'text-red-500' : 'text-green-500'}`}>R$ {calcularRestante().toFixed(2).replace('.',',')}</span>
                    </div>
                </div>

                <button onClick={handleFinalizarVenda} disabled={isSubmitting || carrinho.length === 0 || !clienteSelecionado || calcularRestante() > 0.05} className="w-full py-4 rounded-xl font-bold text-lg shadow-md mt-auto bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Processando...' : vendaParaEditar ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR VENDA'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalVenda;