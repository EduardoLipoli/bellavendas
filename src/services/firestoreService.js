import { db } from '../firebase/config';
import { auth } from '../firebase/config';
import { 
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, 
    query, where, limit, orderBy, Timestamp, startAfter, 
    serverTimestamp, getDoc, runTransaction, writeBatch, increment, setDoc
} from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';


// --- SERVIÇO DE AUTENTICAÇÃO ---
export const reauthenticate = async (password) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não encontrado.");
    const credential = EmailAuthProvider.credential(user.email, password);
    try {
        await reauthenticateWithCredential(user, credential);
        return true;
    } catch (error) {
        console.error("Erro de reautenticação:", error);
        return false;
    }
};

// --- CLIENTES ---
export const getClientes = async (options = {}) => {
    const { statusFilter, searchTerm, page = 1, perPage = 5, lastVisible } = options;
    const clientesRef = collection(db, 'clientes');
    let q = query(clientesRef, orderBy("nome"));
    if (statusFilter) {
        q = query(q, where("status", "==", statusFilter));
    }
    if (searchTerm) {
        q = query(q, where("nome", ">=", searchTerm), where("nome", "<=", searchTerm + '\uf8ff'));
    }
    if (page > 1 && lastVisible) {
        q = query(q, startAfter(lastVisible), limit(perPage));
    } else {
        q = query(q, limit(perPage));
    }
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return {
        data,
        lastVisible: snapshot.docs[snapshot.docs.length - 1]
    };
};

export const getClientesCount = async (options = {}) => {
    const { statusFilter, searchTerm } = options;
    const clientesRef = collection(db, 'clientes');
    let q = query(clientesRef);
    if (statusFilter) {
        q = query(q, where("status", "==", statusFilter));
    }
     if (searchTerm) {
        q = query(q, where("nome", ">=", searchTerm), where("nome", "<=", searchTerm + '\uf8ff'));
    }
    const snapshot = await getDocs(q);
    return snapshot.size;
}

export const addCliente = async (newCliente) => {
    const dataToSave = { ...newCliente };
    if (dataToSave.dataNascimento) {
        dataToSave.dataNascimento = Timestamp.fromDate(new Date(dataToSave.dataNascimento.replace(/-/g, '/')));
    }
    await addDoc(collection(db, 'clientes'), dataToSave);
};

export const updateCliente = async (id, updatedCliente) => {
    const clienteDoc = doc(db, 'clientes', id);
    const dataToSave = { ...updatedCliente };
    if (dataToSave.dataNascimento && typeof dataToSave.dataNascimento === 'string') {
        dataToSave.dataNascimento = Timestamp.fromDate(new Date(dataToSave.dataNascimento.replace(/-/g, '/')));
    }
    await updateDoc(clienteDoc, dataToSave);
};

export const deleteCliente = async (id) => {
    const clienteDoc = doc(db, 'clientes', id);
    await deleteDoc(clienteDoc);
};

// --- PRODUTOS ---
const produtosCollectionRef = collection(db, 'produtos');

export const getProdutos = async (options = {}) => {
    const { category, searchTerm } = options;
    // SUGESTÃO: Para buscar produtos "recentes", considere adicionar um campo `createdAt: serverTimestamp()`
    // e ordenar por ele em vez de por "nome". Ex: orderBy("createdAt", "desc")
    let q = query(produtosCollectionRef, orderBy("nome"));

    if (category) {
        q = query(q, where("categoria", "==", category));
    }
    if (searchTerm) {
        q = query(q, where("nome", ">=", searchTerm), where("nome", "<=", searchTerm + '\uf8ff'));
    }
    
    const data = await getDocs(q);
    return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
};

export const addProduto = async (newProduto) => {
    // SUGESTÃO: Adicione o campo `createdAt: serverTimestamp()` aqui para ordenar os produtos recentes.
    await addDoc(produtosCollectionRef, newProduto);
};

export const updateProduto = async (id, updatedProduto) => {
    const produtoDoc = doc(db, 'produtos', id);
    await updateDoc(produtoDoc, updatedProduto);
};

export const deleteProduto = async (id) => {
    const produtoDoc = doc(db, 'produtos', id);
    await deleteDoc(produtoDoc);
};


// --- VENDAS ---
export const addVenda = async (vendaData) => {
    // Agora recebemos todos os dados brutos do formulário
    const { cliente, itens, total, formaPagamento, parcelas, marcarComoPago, dataPagamento, dataVencimento } = vendaData;

    try {
        const novaVendaRef = await runTransaction(db, async (transaction) => {
            const productUpdates = []; // Para guardar as operações de escrita do estoque
            const itensEnriquecidos = []; // Para guardar os dados completos dos itens para a venda

            // --- FASE 1: APENAS LEITURA E VALIDAÇÃO ---
            for (const item of itens) {
                const productRef = doc(db, 'produtos', item.id);
                const productDoc = await transaction.get(productRef); // Operação de LEITURA

                if (!productDoc.exists()) throw new Error(`Produto "${item.nome || item.id}" não encontrado.`);
                
                const productData = productDoc.data();
                if (productData.estoque < item.quantidade) throw new Error(`Estoque insuficiente para "${productData.nome}".`);

                // Guarda a operação de escrita para ser executada depois
                productUpdates.push({
                    ref: productRef,
                    newStock: productData.estoque - item.quantidade
                });
                
                // Guarda os dados completos do item para salvar no documento da venda
                itensEnriquecidos.push({
                    id: item.id,
                    nome: productData.nome,
                    quantidade: item.quantidade,
                    categoria: productData.categoria || 'N/A',
                    custo: productData.custo || 0,
                    precoUnitario: productData.preco || 0,
                    imageUrl: productData.imageUrl || null
                });
            }

            // --- FASE 2: APENAS ESCRITA ---
            // Agora que todas as leituras terminaram, podemos começar a escrever.

            // 2a. Aplica todas as atualizações de estoque
            productUpdates.forEach(update => {
                transaction.update(update.ref, { estoque: update.newStock }); // Operação de ESCRITA
            });

            // 2b. Cria o objeto final da venda com sua lógica de negócio
            const novaVendaBase = {
                cliente,
                itens: itensEnriquecidos,
                total,
                formaPagamento,
                data: serverTimestamp()
            };
            
            let vendaFinal;

            if (formaPagamento === 'Cartão de Crédito') {
                const totalParcelas = parcelas > 1 ? parcelas : 1;
                const parcelasDetalhes = [];
                if (totalParcelas > 1) {
                    const valorParcela = total / totalParcelas;
                    for (let i = 1; i <= totalParcelas; i++) {
                        const vencimentoParcela = new Date();
                        vencimentoParcela.setMonth(vencimentoParcela.getMonth() + i);
                        parcelasDetalhes.push({ numeroParcela: i, valor: valorParcela, status: 'Pendente', dataVencimento: vencimentoParcela });
                    }
                }
                vendaFinal = { 
                    ...novaVendaBase, 
                    parcelas: totalParcelas, 
                    parcelasDetalhes, 
                    statusPagamento: totalParcelas > 1 ? `0/${totalParcelas} Pago` : 'Pago',
                    dataPagamento: serverTimestamp(), 
                    dataVencimento: totalParcelas > 1 ? parcelasDetalhes[parcelasDetalhes.length - 1].dataVencimento : null
                };
            } else { // Para PIX, Dinheiro, Débito, etc.
                vendaFinal = { 
                    ...novaVendaBase, 
                    parcelas: 1, 
                    parcelasDetalhes: [],
                    statusPagamento: marcarComoPago ? 'Pago' : 'Pendente', 
                    dataPagamento: marcarComoPago ? Timestamp.fromDate(new Date(dataPagamento.replace(/-/g, '/'))) : null,
                    dataVencimento: !marcarComoPago ? Timestamp.fromDate(new Date(dataVencimento.replace(/-/g, '/'))) : null
                };
            }

            // 2c. Cria o documento da venda
            const newVendaRef = doc(collection(db, 'vendas'));
            transaction.set(newVendaRef, vendaFinal);
            return newVendaRef; // Retorna a referência para ser capturada
        });return novaVendaRef; // Retorna o resultado para o ModalVenda


    } catch (e) {
        console.error("Falha na transação da venda. Nenhuma alteração foi feita no banco de dados.", e.message);
        throw e;
    }
};

export const updateParcelaStatus = async (vendaId, numeroParcela, novoStatus) => {
    const vendaRef = doc(db, 'vendas', vendaId);
    const vendaSnap = await getDoc(vendaRef);

    if (!vendaSnap.exists()) {
        throw new Error("Venda não encontrada!");
    }

    const vendaAtual = vendaSnap.data();
    
    const novasParcelasDetalhes = vendaAtual.parcelasDetalhes.map(p => {
        if (p.numeroParcela === numeroParcela) {
            const parcelaAtualizada = { ...p, status: novoStatus };
            if (novoStatus === 'Pago') {
                parcelaAtualizada.dataPagamento = new Date(); // Salva a data atual
            } else {
                delete parcelaAtualizada.dataPagamento; // Remove a data se voltar a ser pendente
            }
            return parcelaAtualizada;
        }
        return p;
    });

    const parcelasPagas = novasParcelasDetalhes.filter(p => p.status === 'Pago').length;
    const statusGeral = `${parcelasPagas}/${vendaAtual.parcelas} Pago`;

    await updateDoc(vendaRef, {
        parcelasDetalhes: novasParcelasDetalhes,
        statusPagamento: statusGeral
    });
};

export const getVendas = async () => {
    const vendasRef = collection(db, 'vendas');
    const q = query(vendasRef, orderBy("data", "desc"));
    
    const snapshot = await getDocs(q);
    
    const vendas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    
    return vendas;
};

export const updateStatusPagamentoVenda = async (vendaId, novoStatus) => {
    const vendaRef = doc(db, 'vendas', vendaId);
    
    const dadosParaAtualizar = {
        statusPagamento: novoStatus
    };

    if (novoStatus === 'Pago') {
        dadosParaAtualizar.dataPagamento = serverTimestamp();
    } else {
        dadosParaAtualizar.dataPagamento = null;
    }

    await updateDoc(vendaRef, dadosParaAtualizar);
};

export const deleteVenda = async (vendaId) => {
    const vendaRef = doc(db, 'vendas', vendaId);
    await deleteDoc(vendaRef);
};

export const updateVenda = async (vendaId, dadosAtualizados) => {
    try {
        await runTransaction(db, async (transaction) => {
            const vendaRef = doc(db, 'vendas', vendaId);
            const vendaDoc = await transaction.get(vendaRef);
            if (!vendaDoc.exists()) {
                throw new Error("Venda não encontrada.");
            }

            const itensAntigos = vendaDoc.data().itens || [];
            const novosItens = dadosAtualizados.itens || [];

            // --- 1. GERENCIAMENTO DE ESTOQUE MELHORADO ---

            // Mapeia a diferença de quantidade para cada produto
            const ajustesEstoque = new Map();
            itensAntigos.forEach(item => {
                const id = item.id || item.produtoId;
                if (id) ajustesEstoque.set(id, (ajustesEstoque.get(id) || 0) + item.quantidade);
            });
            novosItens.forEach(item => {
                const id = item.id || item.produtoId;
                if (id) ajustesEstoque.set(id, (ajustesEstoque.get(id) || 0) - item.quantidade);
            });

            // Validar o estoque ANTES de aplicar qualquer alteração
            const produtosRefs = new Map(); // Para evitar buscar a mesma ref duas vezes
            for (const [produtoId, diferenca] of ajustesEstoque.entries()) {
                // Só precisamos validar se estamos tirando itens do estoque (diferença negativa)
                if (diferenca < 0) {
                    const produtoRef = doc(db, "produtos", produtoId);
                    produtosRefs.set(produtoId, produtoRef); // Armazena a referência
                    
                    const produtoDoc = await transaction.get(produtoRef);
                    if (!produtoDoc.exists()) {
                        throw new Error(`Produto com ID ${produtoId} não foi encontrado.`);
                    }
                    
                    const estoqueAtual = produtoDoc.data().estoque;
                    if (estoqueAtual + diferenca < 0) { // Lembre-se, diferença já é negativa
                        const nomeProduto = produtoDoc.data().nome || `Produto ${produtoId}`;
                        throw new Error(`Estoque insuficiente para "${nomeProduto}". Disponível: ${estoqueAtual}.`);
                    }
                }
            }

            // Aplicar os ajustes de estoque
            for (const [produtoId, diferenca] of ajustesEstoque.entries()) {
                if (diferenca !== 0) {
                    // Reutiliza a referência se já foi buscada, senão cria uma nova
                    const produtoRef = produtosRefs.get(produtoId) || doc(db, "produtos", produtoId);
                    transaction.update(produtoRef, { estoque: increment(diferenca) });
                }
            }

            // --- 2. LÓGICA DE ATUALIZAÇÃO DOS DADOS DA VENDA ---
            const dadosFinais = {
                cliente: dadosAtualizados.cliente,
                itens: novosItens,
                total: dadosAtualizados.total,
                formaPagamento: dadosAtualizados.formaPagamento,
                ultimaAtualizacao: serverTimestamp()
            };

            if (dadosAtualizados.formaPagamento === 'Cartão de Crédito') {
                const totalParcelas = dadosAtualizados.parcelas > 1 ? dadosAtualizados.parcelas : 1;
                dadosFinais.parcelas = totalParcelas;

                if (totalParcelas > 1) {
                    const valorParcela = dadosAtualizados.total / totalParcelas;
                    const parcelasDetalhes = [];
                    for (let i = 1; i <= totalParcelas; i++) {
                        const vencimento = new Date();
                        vencimento.setMonth(vencimento.getMonth() + i);
                        parcelasDetalhes.push({
                            numeroParcela: i,
                            valor: valorParcela,
                            status: 'Pendente',
                            dataVencimento: Timestamp.fromDate(vencimento)
                        });
                    }
                    dadosFinais.parcelasDetalhes = parcelasDetalhes;
                    dadosFinais.dataVencimento = parcelasDetalhes[parcelasDetalhes.length - 1].dataVencimento;
                } else {
                    dadosFinais.parcelasDetalhes = [];
                    dadosFinais.dataVencimento = null;
                }
                
                // Assumindo que a edição de uma venda para cartão já confirma o pagamento
                dadosFinais.statusPagamento = 'Pago'; 
                dadosFinais.dataPagamento = vendaDoc.data().dataPagamento || serverTimestamp(); // Mantém a data original ou atualiza se não existir

            } else { // PIX, Dinheiro, Débito, etc.
                dadosFinais.parcelas = 1;
                dadosFinais.parcelasDetalhes = [];
                dadosFinais.statusPagamento = dadosAtualizados.marcarComoPago ? 'Pago' : 'Pendente';

                if (dadosAtualizados.marcarComoPago) {
                    // Se já havia uma data de pagamento, mantém. Senão, define a data fornecida ou a data atual.
                    dadosFinais.dataPagamento = vendaDoc.data().dataPagamento || 
                        (dadosAtualizados.dataPagamento ? Timestamp.fromDate(dadosAtualizados.dataPagamento) : serverTimestamp());
                } else {
                    dadosFinais.dataPagamento = null;
                }

                if (!dadosAtualizados.marcarComoPago && dadosAtualizados.dataVencimento) {
                    dadosFinais.dataVencimento = Timestamp.fromDate(dadosAtualizados.dataVencimento);
                } else {
                    dadosFinais.dataVencimento = null;
                }
            }

            // --- 3. LIMPEZA E ATUALIZAÇÃO FINAL ---
            
            // Função para remover chaves com valor `undefined` (evita erros no Firestore)
            const cleanUndefinedDeep = (obj) => {
                if (Array.isArray(obj)) {
                    return obj.map(v => cleanUndefinedDeep(v));
                } else if (typeof obj === 'object' && obj !== null) {
                    return Object.fromEntries(
                        Object.entries(obj)
                            .map(([k, v]) => [k, cleanUndefinedDeep(v)])
                            .filter(([_, v]) => v !== undefined)
                    );
                }
                return obj;
            };

            const dadosLimpos = cleanUndefinedDeep(dadosFinais);

            transaction.update(vendaRef, dadosLimpos);
        });

        return vendaId;

    } catch (e) {
        console.error("Falha ao atualizar a venda:", e.message);
        // Lança o erro para que a camada superior (ex: a UI) possa capturá-lo e exibir para o usuário.
        throw e;
    }
};


export const cancelVenda = async (vendaId, motivo, devolverAoEstoque) => {
  try {
    await runTransaction(db, async (transaction) => {
      const vendaRef = doc(db, 'vendas', vendaId);
      const vendaDoc = await transaction.get(vendaRef);

      if (!vendaDoc.exists()) {
        throw new Error("Venda não encontrada para cancelamento.");
      }

      const vendaData = vendaDoc.data();

      // Devolver itens ao estoque, se solicitado
      if (devolverAoEstoque && vendaData.itens) {
        for (const item of vendaData.itens) {
          
          // --- AQUI ESTÁ A CORREÇÃO ---
          // Verifica se o item e o ID do item existem antes de usá-los.
          if (item && item.id) {
            const produtoRef = doc(db, 'produtos', item.id);
            transaction.update(produtoRef, { estoque: increment(item.quantidade) });
          } else {
            // Se um item não tiver ID, ele será ignorado e um aviso será exibido no console.
            console.warn("Item de venda encontrado sem ID. Pulando devolução de estoque para este item:", item);
          }
        }
      }

      // Atualizar o status da venda para 'Cancelado'
      transaction.update(vendaRef, {
        statusPagamento: 'Cancelado',
        motivoCancelamento: motivo,
        ultimaAtualizacao: serverTimestamp()
      });

      // Adicionar um log de auditoria para o cancelamento
      const auditRef = doc(collection(db, 'auditoria'));
      transaction.set(auditRef, {
          action: 'CANCEL_SALE',
          vendaId: vendaId,
          details: `Venda cancelada pelo motivo: "${motivo}". Devolução ao estoque: ${devolverAoEstoque ? 'Sim' : 'Não'}`,
          timestamp: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error("Erro ao cancelar a venda:", error);
    // Lança um erro mais amigável para a interface
    throw new Error("Falha ao processar o cancelamento da venda. Verifique os dados e tente novamente.");
  }
};

// --- ADICIONE ESTA NOVA FUNÇÃO ---
export const returnItemsToStock = async (items) => {
    if (!items || items.length === 0) return;
    const batch = writeBatch(db);

    for (const item of items) {
        // --- CORRIGIDO: Verifica 'item.id' primeiro, e depois 'item.produtoId' como fallback ---
        const productId = item.id || item.produtoId; 

        if (!productId) {
            console.warn("Item no carrinho sem ID de produto, não foi possível devolver ao estoque:", item);
            continue; // Pula para o próximo item
        }

        const productRef = doc(db, 'produtos', productId); 
        batch.update(productRef, {
            estoque: increment(item.quantidade)
        });
    }

    await batch.commit();
};

// Obter histórico de auditoria
export const getAuditLogs = async (saleId) => {
  try {
    const logsRef = collection(db, 'auditoria');
    const q = query(
      logsRef, 
      where('vendaId', '==', saleId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp.toDate() // Converter para Date
      };
    });
  } catch (error) {
    console.error("Erro ao buscar logs de auditoria:", error);
    throw error;
  }
};

// Registrar ação na auditoria
export const addAuditLog = async (logData) => {
  try {
    const logsRef = collection(db, 'auditoria');
    await addDoc(logsRef, {
      ...logData,
      timestamp: serverTimestamp(),
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email
    });
  } catch (error) {
    console.error("Erro ao registrar auditoria:", error);
  }
};

// Exportar vendas para CSV
export const exportVendasToCSV = (vendas) => {
  try {
    // Cabeçalho do CSV
    let csvContent = "ID,Cliente,Data,Forma Pagamento,Status,Total,Itens\n";
    
    // Processar cada venda
    vendas.forEach(venda => {
      const itens = venda.itens.map(item => 
        `${item.nome} (${item.quantidade}x ${item.precoUnitario})`
      ).join('; ');
      
      const linha = [
        venda.id,
        venda.cliente?.nome || '',
        venda.data?.toDate().toLocaleString('pt-BR') || '',
        venda.formaPagamento,
        venda.statusPagamento,
        venda.total.toFixed(2).replace('.', ','),
        `"${itens}"`
      ].join(',');
      
      csvContent += linha + '\n';
    });
    
    // Criar e fazer download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    throw error;
  }
};

// Reenviar comprovante por e-mail
export const sendEmailReceipt = async (saleId, clientEmail) => {
  try {
    // Obter dados da venda
    const vendaDoc = await getDoc(doc(db, 'vendas', saleId));
    if (!vendaDoc.exists()) throw new Error('Venda não encontrada');
    
    const venda = { id: vendaDoc.id, ...vendaDoc.data() };
    
    // Gerar conteúdo do e-mail
    const emailContent = `
      <h1>Comprovante de Venda #${venda.id.substring(0, 8)}</h1>
      <p>Olá ${venda.cliente.nome},</p>
      <p>Segue o comprovante da sua compra realizada em ${venda.data.toDate().toLocaleString('pt-BR')}:</p>
      
      <h2>Detalhes da Venda</h2>
      <table border="1" cellpadding="5">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Preço Unitário</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${venda.itens.map(item => `
            <tr>
              <td>${item.nome}</td>
              <td>${item.quantidade}</td>
              <td>R$ ${item.precoUnitario.toFixed(2).replace('.', ',')}</td>
              <td>R$ ${(item.quantidade * item.precoUnitario).toFixed(2).replace('.', ',')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p><strong>Total: R$ ${venda.total.toFixed(2).replace('.', ',')}</strong></p>
      <p>Forma de Pagamento: ${venda.formaPagamento}</p>
      <p>Status: ${venda.statusPagamento}</p>
      
      <p>Atenciosamente,<br>Equipe ${import.meta.env.VITE_APP_NAME || 'Sua Loja'}</p>
    `;

    // Registrar a ação de envio
    await addAuditLog({
      action: 'EMAIL_RECEIPT',
      vendaId: saleId,
      details: `Comprovante reenviado para ${clientEmail}`
    });

    // Enviar e-mail usando um Cloud Function (implementação abaixo)
    const response = await fetch(import.meta.env.VITE_EMAIL_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: clientEmail,
        subject: `Comprovante de Venda #${venda.id.substring(0, 8)}`,
        html: emailContent
      })
    });

    if (!response.ok) throw new Error('Falha no envio do e-mail');
    
    return true;
  } catch (error) {
    console.error("Erro ao enviar comprovante:", error);
    throw error;
  }
};

// --- FUNÇÕES DO DASHBOARD (ATUALIZADAS) ---

/**
 * ATUALIZADO: Busca as principais estatísticas para o dashboard, incluindo custos e contagem de vendas.
 */
export const getDashboardStats = async () => {
    const clientesRef = collection(db, 'clientes');
    const produtosRef = collection(db, 'produtos');
    const vendasRef = collection(db, 'vendas');
    const contasRef = collection(db, 'contas');

    // 1. Clientes Ativos
    const qClientes = query(clientesRef, where("status", "==", "Ativo"));
    const clientesSnapshot = await getDocs(qClientes);
    const totalClientesAtivos = clientesSnapshot.size;

    // 2. Estoque Baixo (Verifique se os produtos têm o campo 'estoque')
    const qProdutos = query(produtosRef, where("estoque", "<", 5));
    const produtosSnapshot = await getDocs(qProdutos);
    const totalEstoqueBaixo = produtosSnapshot.size;

    // 3. Vendas, Custos do Mês e Contagem de Vendas de Hoje
    const hoje = new Date();
    const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const qVendasMes = query(vendasRef, where("data", ">=", Timestamp.fromDate(inicioDoMes)));
    const vendasMesSnapshot = await getDocs(qVendasMes);
    
    let totalVendasMes = 0;
    let totalVendasHoje = 0;
    let totalCustoProdutosVendidosMes = 0;
    let vendasHojeCount = 0;

    vendasMesSnapshot.forEach(doc => {
        const venda = doc.data();
        totalVendasMes += venda.total;

        // Calcula o custo total dos itens desta venda.
        // Requer que cada item na venda tenha o campo 'custo'.
        if (venda.itens && Array.isArray(venda.itens)) {
            const custoDaVenda = venda.itens.reduce((acc, item) => {
                const custo = item.custo || 0;
                const quantidade = item.quantidade || 0;
                return acc + (custo * quantidade);
            }, 0);
            totalCustoProdutosVendidosMes += custoDaVenda;
        }

        // Soma as vendas e conta as transações de hoje
        if (venda.data.toDate() >= inicioDoDia) {
            totalVendasHoje += venda.total;
            vendasHojeCount++;
        }
    });

    // 4. Gastos do Mês (Contas a Pagar)
    const qContasMes = query(contasRef, where("status", "==", "Pago"), where("dataVencimento", ">=", Timestamp.fromDate(inicioDoMes)));
    const contasMesSnapshot = await getDocs(qContasMes);
    let totalGastosMes = 0;
    contasMesSnapshot.forEach(doc => {
        totalGastosMes += parseFloat(doc.data().valor);
    });

    return {
        totalClientesAtivos,
        totalEstoqueBaixo,
        totalVendasHoje,
        totalVendasMes,
        totalGastosMes,
        totalCustoProdutosVendidosMes,
        vendasHojeCount
    };
};

export const getRecentSales = async (limite = 5) => {
    const vendasRef = collection(db, 'vendas');
    const q = query(vendasRef, orderBy("data", "desc"), limit(limite));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getRecentProducts = async (limite = 4) => {
    const q = query(produtosCollectionRef, orderBy("nome"), limit(limite));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Calcula os produtos mais vendidos.
 * Dependência: Cada item em `venda.itens` deve ter `id`, `nome`, `categoria`.
 */
export const getTopSellingProducts = async (limite = 5) => {
    const vendas = await getVendas();
    const productSales = {};

    vendas.forEach(venda => {
        if (!venda.itens) return;
        venda.itens.forEach(item => {
            if (!productSales[item.id]) {
                productSales[item.id] = { 
                    id: item.id,
                    nome: item.nome, 
                    categoria: item.categoria || 'N/A',
                    quantidade: 0 
                };
            }
            productSales[item.id].quantidade += item.quantidade;
        });
    });

    return Object.values(productSales)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, limite);
};

/**
 * Calcula os clientes que mais compraram (em valor).
 * Dependência: `venda.cliente` deve ter `id` (ou `nome`) e `nome`.
 */
export const getTopCustomers = async (limite = 4) => {
    const vendas = await getVendas();
    const customerPurchases = {};

    vendas.forEach(venda => {
        const clienteId = venda.cliente.id || venda.cliente.nome;
        if (!customerPurchases[clienteId]) {
            customerPurchases[clienteId] = {
                id: clienteId,
                nome: venda.cliente.nome,
                imageUrl: venda.cliente.imageUrl || null, // Passa a URL da imagem
                totalCompras: 0,
                valorTotal: 0
            };
        }
        customerPurchases[clienteId].totalCompras += 1;
        customerPurchases[clienteId].valorTotal += venda.total;
    });

    return Object.values(customerPurchases)
        .sort((a, b) => b.valorTotal - a.valorTotal)
        .slice(0, limite);
};

/**
 * Calcula as categorias com maior percentual de vendas.
 * Dependência: Cada item em `venda.itens` deve ter `categoria`, `precoUnitario`, e `quantidade`.
 */
export const getTopCategories = async (limite = 5) => {
    const vendas = await getVendas();
    const categorySales = {};
    let grandTotal = 0;

    vendas.forEach(venda => {
        grandTotal += venda.total;
        if (!venda.itens) return;
        venda.itens.forEach(item => {
            const category = item.categoria || "Sem Categoria";
            if (!categorySales[category]) {
                categorySales[category] = 0;
            }
            const itemTotal = (item.precoUnitario || 0) * (item.quantidade || 0);
            categorySales[category] += itemTotal;
        });
    });

    if (grandTotal === 0) return [];

    const categoriesWithPercentage = Object.entries(categorySales).map(([nome, total], index) => ({
        id: index,
        nome,
        percentual: Math.round((total / grandTotal) * 100)
    }));

    return categoriesWithPercentage
      .sort((a, b) => b.percentual - a.percentual)
      .slice(0, limite);
};

/**
 * Placeholder. Requer que produtos tenham um campo `fornecedorId` no DB.
 */
export const getTopSuppliers = async (limite = 4) => {
    console.warn("A função getTopSuppliers não pode ser implementada sem um relacionamento entre produtos e fornecedores no banco de dados.");
    return []; 
};


// --- OUTRAS FUNÇÕES (Fornecedores, Contas, Categorias) ---
const fornecedoresCollectionRef = collection(db, 'fornecedores');

export const getFornecedores = async () => {
    const data = await getDocs(fornecedoresCollectionRef);
    return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
};

export const addFornecedor = async (novoFornecedor) => {
    await addDoc(fornecedoresCollectionRef, novoFornecedor);
};

export const updateFornecedor = async (id, updatedFornecedor) => {
    const fornecedorDoc = doc(db, 'fornecedores', id);
    await updateDoc(fornecedorDoc, updatedFornecedor);
};

export const deleteFornecedor = async (id) => {
    const fornecedorDoc = doc(db, 'fornecedores', id);
    await deleteDoc(fornecedorDoc);
};

const contasCollectionRef = collection(db, 'contas');

export const getContas = async () => {
    const q = query(contasCollectionRef, orderBy("dataVencimento", "asc"));
    const data = await getDocs(q);
    return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
};

export const addConta = async (novaConta) => {
    // PREPARA OS DADOS PARA SALVAR DE FORMA SEGURA
    const dataToSave = { ...novaConta };

    // Converte a string de data 'YYYY-MM-DD' para um Timestamp do Firestore.
    // Se a data for inválida ou vazia, não adiciona o campo.
    if (dataToSave.dataVencimento && typeof dataToSave.dataVencimento === 'string') {
        const dataVencimento = new Date(dataToSave.dataVencimento.replace(/-/g, '/'));
        if (!isNaN(dataVencimento.getTime())) {
            dataToSave.dataVencimento = Timestamp.fromDate(dataVencimento);
        } else {
            delete dataToSave.dataVencimento; // Evita salvar data inválida
        }
    }
    
    // Adiciona a data de criação
    dataToSave.dataCadastro = serverTimestamp();

    await addDoc(collection(db, 'contas'), dataToSave);
};

export const updateConta = async (id, contaData) => {
    const contaDoc = doc(db, 'contas', id);
    const dataToSave = { ...contaData };

    // Garante que a data de vencimento seja convertida corretamente se for uma string
    if (dataToSave.dataVencimento && typeof dataToSave.dataVencimento === 'string') {
        const dataVencimento = new Date(dataToSave.dataVencimento.replace(/-/g, '/'));
         if (!isNaN(dataVencimento.getTime())) {
            dataToSave.dataVencimento = Timestamp.fromDate(dataVencimento);
        } else {
            delete dataToSave.dataVencimento;
        }
    }

    await updateDoc(contaDoc, dataToSave);
};

export const updateContaStatus = async (id, novoStatus, dataPagamento = null) => {
    const contaDoc = doc(db, 'contas', id);
    const dadosParaAtualizar = { status: novoStatus };

    if (novoStatus === 'Paga' && dataPagamento) {
        dadosParaAtualizar.dataPagamento = Timestamp.fromDate(new Date(dataPagamento));
    } else {
        // Se voltar a ser pendente, remove a data de pagamento
        dadosParaAtualizar.dataPagamento = null;
    }

    await updateDoc(contaDoc, dadosParaAtualizar);
};

export const deleteConta = async (id) => {
    const contaDoc = doc(db, 'contas', id);
    await deleteDoc(contaDoc);
};

export const getCategorias = async () => {
    const categoriasCol = collection(db, 'categorias');
    const q = query(categoriasCol, orderBy('nome'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addCategoria = async (categoriaData) => {
    const categoriasCol = collection(db, 'categorias');
    return await addDoc(categoriasCol, categoriaData);
};

export const updateCategoria = async (id, categoriaData) => {
    const categoriaDoc = doc(db, 'categorias', id);
    return await updateDoc(categoriaDoc, categoriaData);
};

export const deleteCategoria = async (id) => {
    const categoriaDoc = doc(db, 'categorias', id);
    return await deleteDoc(categoriaDoc);
};

export const isSkuUnique = async (sku, excludeId = null) => {
    const productsRef = collection(db, 'produtos');
    const q = query(productsRef, where('codigo', '==', sku));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return true;
    // Se estamos editando, podemos excluir o próprio produto
    if (excludeId) {
        const found = querySnapshot.docs.find(doc => doc.id !== excludeId);
        return !found; // se não encontrou outro, é único
    }
    return false;
};

export const isBarcodeUnique = async (barcode, excludeId = null) => {
    if (!barcode) return true; // vazio é considerado único
    const productsRef = collection(db, 'produtos');
    const q = query(productsRef, where('codigoDeBarras', '==', barcode));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return true;
    if (excludeId) {
        const found = querySnapshot.docs.find(doc => doc.id !== excludeId);
        return !found;
    }
    return false;
};

// Salva todas as configurações de uma vez (Empresa, Estoque, Geral, Segurança, Usuários)
export const saveSettings = async (settingsData) => {
    try {
        // Usamos 'setDoc' com { merge: true } para não apagar campos que não foram enviados
        // O ID do documento será sempre 'global' para facilitar
        const settingsRef = doc(db, 'configuracoes', 'global');
        await setDoc(settingsRef, settingsData, { merge: true });
    } catch (error) {
        console.error("Erro ao salvar configurações:", error);
        throw error;
    }
};

// Busca as configurações. Se não existir, retorna null (o front-end usará os defaults)
export const getSettings = async () => {
    try {
        const settingsRef = doc(db, 'configuracoes', 'global');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null; // Nenhuma configuração salva ainda
        }
    } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        throw error;
    }
};