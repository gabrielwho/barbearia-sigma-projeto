// Este script é para a página de confirmação de agendamento (agendamento_confirmacao.html)

const { createApp } = Vue;

createApp({
  data() {
    return {
      agendamento: null, // Objeto para armazenar os detalhes do agendamento
      agendamentoCarregado: false,
      erroCarregamento: false,
    };
  },
  methods: {
    async carregarDetalhesAgendamento() {
      const urlParams = new URLSearchParams(window.location.search);
      const agendamentoId = urlParams.get('agendamentoId');

      if (!agendamentoId) {
        console.error('ID do agendamento não encontrado na URL.');
        this.erroCarregamento = true;
        this.agendamentoCarregado = true;
        return;
      }

      try {
        const agendamentoDoc = await firebase.firestore().collection('agendamentos').doc(agendamentoId).get();

        if (agendamentoDoc.exists) {
          this.agendamento = agendamentoDoc.data();
          this.agendamentoCarregado = true;
          console.log('Detalhes do agendamento carregados:', this.agendamento);
        } else {
          console.error('Agendamento não encontrado com o ID:', agendamentoId);
          this.erroCarregamento = true;
          this.agendamentoCarregado = true;
        }
      } catch (error) {
        console.error('Erro ao carregar agendamento:', error);
        this.erroCarregamento = true;
        this.agendamentoCarregado = true;
      }
    },
    formatarData(dataString) {
      // dataString está no formato "YYYY-MM-DD"
      const [ano, mes, dia] = dataString.split('-');
      const data = new Date(ano, mes - 1, dia); // Mês é 0-indexed no JS
      return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    },
    voltarParaCliente() {
      window.location.href = 'cliente.html';
    },
    verMeusAgendamentos() {
        // Futura funcionalidade: Redirecionar para uma página que lista os agendamentos do cliente
        alert('Funcionalidade "Meus Agendamentos" em desenvolvimento!');
        // window.location.href = 'meus_agendamentos.html'; 
    }
  },
  mounted() {
    // Verifica autenticação para esta página
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      try {
        const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists || (userDoc.data().tipo || '').trim() !== 'cliente') {
          console.warn('Usuário não autorizado na página de confirmação. Redirecionando.');
          await firebase.auth().signOut();
          window.location.href = 'index.html';
          return;
        }
        // Se o usuário está autenticado e é cliente, carrega os detalhes do agendamento
        this.carregarDetalhesAgendamento();
      } catch (error) {
        console.error('Erro na verificação de autenticação/tipo:', error);
        await firebase.auth().signOut();
        window.location.href = 'index.html';
      }
    });
  }
}).mount('#app-confirmacao-agendamento');