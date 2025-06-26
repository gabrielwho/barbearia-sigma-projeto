// Este script é para a página "Meus Agendamentos" (meus_agendamentos.html)

const { createApp } = Vue;

createApp({
  data() {
    return {
      agendamentos: [],
      carregando: true,
      currentUser: null, // Para armazenar o UID do cliente logado
    };
  },
  methods: {
    async carregarMeusAgendamentos() {
      if (!this.currentUser || !this.currentUser.uid) {
        console.warn('Usuário não logado ou UID indisponível. Não é possível carregar agendamentos.');
        this.carregando = false;
        return;
      }

      try {
        const agendamentosSnapshot = await firebase.firestore().collection('agendamentos')
          .where('clienteUid', '==', this.currentUser.uid)
          .orderBy('criadoEm', 'desc') // Ordena pelos mais recentes primeiro
          .get();

        this.agendamentos = agendamentosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Agendamentos carregados:', this.agendamentos);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        alert('Ocorreu um erro ao carregar seus agendamentos. Por favor, tente novamente.');
      } finally {
        this.carregando = false;
      }
    },
    formatarData(dataString) {
      // dataString está no formato "YYYY-MM-DD"
      const [ano, mes, dia] = dataString.split('-');
      const data = new Date(ano, mes - 1, dia); // Mês é 0-indexed no JS
      return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    },
    async exportarAgendamento(agendamentoId) {
      const element = document.getElementById('agendamento-card-' + agendamentoId);
      
      if (!element) {
        alert('Erro: Não foi possível encontrar os detalhes do agendamento para exportar.');
        return;
      }

      // Adiciona um estilo temporário para impressão/PDF, se necessário
      const originalDisplay = element.style.display;
      element.style.display = 'block'; // Garante que o elemento está visível e ocupa espaço

      const options = {
        margin: [5, 10, 5, 10], // Margens de 5mm para todos os lados
        filename: `agendamento_${agendamentoId.substring(0, 6)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, logging: true, dpi: 192, letterRendering: true }, // Manter escala razoável
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } // Tentar A4 retrato com margens menores
      };

      try {
        await html2pdf().set(options).from(element).save();
        alert('Agendamento exportado com sucesso!');
      } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        alert('Ocorreu um erro ao exportar o agendamento para PDF. Por favor, tente novamente.');
      } finally {
        element.style.display = originalDisplay; // Restaura o estilo original
      }
    },
    voltarParaCliente() {
      window.location.href = 'cliente.html';
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
          console.warn('Usuário não autorizado na página de meus agendamentos. Redirecionando.');
          await firebase.auth().signOut();
          window.location.href = 'index.html';
          return;
        }
        this.currentUser = user; // Define o usuário atual
        this.carregarMeusAgendamentos(); // Carrega os agendamentos após autenticação
      } catch (error) {
        console.error('Erro na verificação de autenticação/tipo:', error);
        await firebase.auth().signOut();
        window.location.href = 'index.html';
      }
    });
  }
}).mount('#app-meus-agendamentos');