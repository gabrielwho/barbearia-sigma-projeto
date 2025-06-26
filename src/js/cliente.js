// Este script é para a página cliente.html

const { createApp } = Vue;

createApp({
  data() {
    return {
      currentUser: null, // Objeto para armazenar os dados do usuário logado
      carregando: true,
      nomeUsuario: ''
    };
  },
  methods: {
    async carregarDadosUsuario() {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          this.currentUser = user;
          try {
            const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              // Verifica se o tipo de usuário é 'cliente'. Se não for, redireciona para a página inicial.
              if ((userData.tipo || '').trim() !== 'cliente') {
                console.warn('Usuário não autorizado na página de cliente. Redirecionando.');
                await firebase.auth().signOut(); // Desloga o usuário
                window.location.href = 'index.html';
                return;
              }
              this.nomeUsuario = userData.nome || user.email; // Exibe o nome ou email
            } else {
              console.warn('Documento de usuário não encontrado no Firestore para UID:', user.uid);
              // Caso o documento não exista, mas o usuário esteja autenticado, desloga para evitar acesso indevido.
              await firebase.auth().signOut();
              window.location.href = 'index.html';
              return;
            }
          } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            // Em caso de erro, desloga e redireciona
            await firebase.auth().signOut();
            window.location.href = 'index.html';
            return;
          }
        } else {
          // Se não houver usuário logado, redireciona para a página de login
          window.location.href = 'index.html';
          return;
        }
        this.carregando = false; // Finaliza o carregamento, seja com sucesso ou redirecionamento
      });
    },
    redirecionarParaAgendamento() {
      window.location.href = 'agendar_servico.html';
    },
    redirecionarParaMeusAgendamentos() { // NOVO MÉTODO ADICIONADO AQUI
      window.location.href = 'meus_agendamentos.html';
    },
    sair() {
      firebase.auth().signOut().then(() => {
        alert('Você foi desconectado.');
        window.location.href = 'index.html';
      }).catch((error) => {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout. Tente novamente.');
      });
    }
  },
  mounted() {
    this.carregarDadosUsuario();
  }
}).mount('#app-cliente');