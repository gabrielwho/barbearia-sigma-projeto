// Este script é para a página do ADMINISTRADOR (admin.html)

const { createApp } = Vue;

// Função auxiliar para formatar datas (consistente com meus_agendamentos.js)
function formatarDataParaExibicao(timestamp) {
  if (!timestamp) return 'N/A';
  let date;
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate(); // Firestore Timestamp
  } else if (typeof timestamp === 'string') {
    // Se for uma string de data, tenta parsear (ex: 'AAAA-MM-DD')
    const [ano, mes, dia] = timestamp.split('-');
    date = new Date(ano, mes - 1, dia); // Mês é 0-indexed no JS
  } else {
    date = new Date(timestamp); // Tenta como Date object ou número (ms)
  }

  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

createApp({
  data() {
    return {
      currentUser: null,
      carregando: true, // Controla o carregamento inicial da página inteira
      erroPermissao: false, // Indica se o usuário não tem permissão
      
      // Dados para o gerenciamento de usuários
      carregandoUsuarios: true,
      usuarios: [],
      filtroEmail: '',
      filtroTipo: '',
      modalEdicaoAberta: false,
      usuarioEditando: null,

      // Dados para o relatório de agendamentos
      carregandoAgendamentos: true,
      agendamentos: [],
      totalAgendamentos: 0,
      valorTotalReceber: 0,
    };
  },
  computed: {
    // Filtra os usuários com base nos filtros de email e tipo
    usuariosFiltrados() {
      let usuariosFiltrados = this.usuarios;

      // Filtro por E-mail
      if (this.filtroEmail) {
        const termo = this.filtroEmail.toLowerCase();
        usuariosFiltrados = usuariosFiltrados.filter(usuario => 
          (usuario.email || '').toLowerCase().includes(termo)
        );
      }

      // Filtro por Tipo de Usuário
      if (this.filtroTipo) {
        usuariosFiltrados = usuariosFiltrados.filter(usuario => 
          (usuario.tipo || '').trim() === this.filtroTipo
        );
      }
      return usuariosFiltrados;
    }
  },
  methods: {
    async verificarPermissoesAdmin() {
      this.carregando = true; // Inicia carregamento da página
      this.erroPermissao = false;

      firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
          // Se não houver usuário logado, redireciona para a página inicial (login)
          window.location.href = 'index.html';
          return;
        }

        try {
          const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();

          if (!userDoc.exists) {
            alert('❌ Seu perfil de usuário não está completo no sistema! Por favor, faça login novamente ou entre em contato com o suporte.');
            await firebase.auth().signOut();
            window.location.href = 'index.html';
            return;
          }

          const userType = (userDoc.data().tipo || '').trim();

          if (userType !== 'admin') {
            this.erroPermissao = true; // Define erro de permissão
            console.warn('Tentativa de acesso não autorizado ao painel administrativo. Tipo de usuário:', userType);
            // Opcional: Redirecionar para cliente.html em vez de exibir mensagem de erro no admin.html
            // window.location.href = 'cliente.html';
            // alert('⚠️ Acesso permitido apenas para administradores. Redirecionando para a área de cliente.');
            // return; // Importante para parar a execução
          } else {
            // Usuário é admin, carrega todos os dados
            this.currentUser = user;
            await this.carregarTodosDadosAdmin(); // Chama a função para carregar usuários e agendamentos
          }
        } catch (error) {
          console.error('Erro na verificação de autenticação/tipo de usuário:', error);
          this.erroPermissao = true;
          alert('Erro ao verificar permissões. Tente novamente. Detalhes: ' + error.message);
          // Opcional: Deslogar em caso de erro grave na verificação
          // await firebase.auth().signOut();
          // window.location.href = 'index.html';
        } finally {
          this.carregando = false; // Finaliza carregamento da página, exiba conteúdo ou erro
        }
      });
    },

    async carregarTodosDadosAdmin() {
      // Carregar Usuários
      this.carregandoUsuarios = true;
      try {
        const usuariosSnapshot = await firebase.firestore().collection('usuarios').get();
        this.usuarios = usuariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Admin.js: Usuários carregados:', this.usuarios.length);
      } catch (error) {
        console.error('Admin.js: Erro ao carregar usuários:', error);
        alert('Erro ao carregar lista de usuários.');
      } finally {
        this.carregandoUsuarios = false;
      }

      // Carregar Todos os Agendamentos
      this.carregandoAgendamentos = true;
      try {
        const agendamentosSnapshot = await firebase.firestore().collection('agendamentos')
          .orderBy('criadoEm', 'desc') // Ordena pelos mais recentes
          .get();

        this.agendamentos = []; // Limpa a lista antes de preencher
        this.totalAgendamentos = 0;
        this.valorTotalReceber = 0;

        // Itera sobre os agendamentos para buscar detalhes do cliente e calcular sumários
        for (const doc of agendamentosSnapshot.docs) {
          const agendamentoData = { id: doc.id, ...doc.data() };

          // Busca o e-mail do cliente associado ao agendamento
          if (agendamentoData.clienteUid) {
            const clienteDoc = await firebase.firestore().collection('usuarios').doc(agendamentoData.clienteUid).get();
            if (clienteDoc.exists) {
              agendamentoData.clienteEmail = clienteDoc.data().email || 'E-mail não encontrado';
            } else {
              agendamentoData.clienteEmail = 'Cliente Removido';
            }
          } else {
            agendamentoData.clienteEmail = 'UID do Cliente Ausente';
          }

          this.agendamentos.push(agendamentoData);
          this.totalAgendamentos++;

          // Soma o valor total a receber (apenas para agendamentos pendentes ou confirmados)
          if (agendamentoData.servico && typeof agendamentoData.servico.valor === 'number' &&
              (agendamentoData.status === 'pendente' || agendamentoData.status === 'confirmado')) {
            this.valorTotalReceber += agendamentoData.servico.valor;
          }
        }

        console.log('Admin.js: Agendamentos carregados (todos):', this.agendamentos.length);
        console.log('Admin.js: Total de Agendamentos:', this.totalAgendamentos);
        console.log('Admin.js: Valor Total a Receber:', this.valorTotalReceber);

      } catch (error) {
        console.error('Admin.js: Erro ao carregar agendamentos do admin:', error);
        alert('Erro ao carregar a lista de agendamentos.');
      } finally {
        this.carregandoAgendamentos = false;
      }
    },

    // Métodos existentes de usuários
    async atualizarTipo(usuario) {
      if (!confirm(`Tem certeza que deseja mudar o tipo de ${usuario.nome} para "${usuario.tipo}"?`)) {
        this.carregarTodosDadosAdmin(); // Recarrega para reverter a alteração visual
        return;
      }

      try {
        await firebase.firestore().collection('usuarios').doc(usuario.id).update({
          tipo: usuario.tipo
        });
        alert('Tipo de usuário atualizado com sucesso!');
      } catch (error) {
        console.error('Admin.js: Erro ao atualizar tipo do usuário:', error);
        alert('Erro ao atualizar tipo do usuário. Detalhes: ' + error.message);
      }
    },
    async excluirUsuario(usuario) {
      if (!confirm(`Tem certeza que deseja EXCLUIR o usuário ${usuario.nome} (${usuario.email})? Esta ação é irreversível!`)) {
        return;
      }

      try {
        // Excluir do Firestore
        await firebase.firestore().collection('usuarios').doc(usuario.id).delete();
        
        // Excluir do Firebase Authentication (requer Cloud Function para segurança e permissões)
        // Para excluir um usuário do Authentication PELO UID do Admin, você PRECISA de uma Cloud Function.
        // Ex: firebase.functions().httpsCallable('deleteUserCallable')({ uid: usuario.id });
        // Por ora, a exclusão é apenas do Firestore. O usuário ainda poderá logar, mas não terá perfil.

        this.usuarios = this.usuarios.filter(u => u.id !== usuario.id); // Remove da lista local
        alert('Usuário excluído com sucesso do Firestore! (Exclusão do Firebase Auth deve ser manual ou via Cloud Function)');
        console.log('Usuário excluído do Firestore:', usuario.email);

      } catch (error) {
        console.error('Admin.js: Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário. Detalhes: ' + error.message);
      }
    },
    abrirModalEdicao(usuario) {
      this.usuarioEditando = { ...usuario };
      this.modalEdicaoAberta = true;
    },
    fecharModalEdicao() {
      this.modalEdicaoAberta = false;
      this.usuarioEditando = null;
    },
    async salvarEdicao() {
      if (!this.usuarioEditando) return;

      try {
        await firebase.firestore().collection('usuarios').doc(this.usuarioEditando.id).update({
          nome: this.usuarioEditando.nome,
          email: this.usuarioEditando.email
        });

        // Atualiza a lista local de usuários
        const index = this.usuarios.findIndex(u => u.id === this.usuarioEditando.id);
        if (index !== -1) {
          this.usuarios.splice(index, 1, { ...this.usuarioEditando });
        }

        alert('Dados do usuário atualizados com sucesso!');
        this.fecharModalEdicao();

        // Lembrete: Alterar e-mail no Firebase Auth requer Cloud Function.
      } catch (error) {
        console.error('Admin.js: Erro ao salvar edição do usuário:', error);
        alert('Erro ao salvar dados do usuário. Detalhes: ' + error.message);
      }
    },
    // Fim dos métodos de usuários

    formatarData(timestamp) {
      // Reusa a função auxiliar definida no escopo global
      return formatarDataParaExibicao(timestamp);
    },

    async sair() {
      try {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Admin.js: Erro ao sair:', error);
        alert('Erro ao sair. Por favor, tente novamente.');
      }
    }
  },
  mounted() {
    this.verificarPermissoesAdmin();
  }
}).mount('#app-admin');